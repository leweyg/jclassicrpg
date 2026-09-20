#!/usr/bin/env python3
"""Export compact surface inputs from the bundled XStream save; never regenerate its map.

Boundary decoding follows WorldSizeBitBoundaries.java and Boundaries.getKey().
The browser does not need to download/parse the 26 MB XML object graph.
"""
import base64
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'jCRPG-engine/save/game1_20100426-004720.124/savegame.zip'
OUTPUT = ROOT / 'jCRPG-engine/json/frozen_world.json'


def export():
    with zipfile.ZipFile(SOURCE) as archive:
        xml = archive.read('gamestate.xml')
    root = ET.fromstring(xml)
    parents = {child: parent for parent in root.iter() for child in parent}

    def resolve(element):
        while element is not None and element.get('reference'):
            path = element.get('reference')
            target = element
            for part in path.split('/'):
                target = parents[target] if part == '..' else target.find(part)
                if target is None:
                    raise ValueError(f'Unresolved XStream reference: {path}')
            element = target
        return element

    def number(element, name, default=0):
        values = element.findall(name)  # XStream may repeat inherited fields.
        return float(values[-1].text) if values else default

    def records(kind):
        return [e for e in root.iter()
                if e.get('class', e.tag).endswith('.' + kind) and not e.get('reference')]

    def boundary(element, y):
        b = resolve(element.find('boundaries'))
        mag = int(number(b, 'magnification'))
        packed = b.findtext('bytes')
        cells = []
        if packed:
            bits = base64.b64decode(packed)
            nx, ny = int(number(b, 'gWX')), int(number(b, 'gWY'))
            for z in range(40):
                for x in range(40):
                    bit = x + int(y // mag) * nx + z * ny * nx
                    cells.append(int(bool(bits[bit // 8] & (1 << (bit % 8)))))
        else:
            area = {int(e.text) for e in b.findall('area/long')}
            for z in range(40):
                for x in range(40):
                    key = (x * 40 << 32) + (z * 40 << 16) + int(y // mag) * mag
                    cells.append(int(key in area))
        return cells

    world = root.find('world')
    layers = []
    for kind in ['Plain', 'Forest', 'Mountain', 'Cave', 'Ocean', 'River']:
        e = records(kind)[0]
        layer = {'kind': kind, 'id': e.findtext('id')}
        for field in ['worldGroundLevel', 'worldRelHeight', 'blockSize', 'magnification',
                      'depth', 'noWaterPercentage', 'density', 'width', 'curvedness', 'curveLength',
                      'worldHeight', 'levelSize', 'maxLevels', 'entranceSide', 'sizeY',
                      'ENTRANCE__DISTANCE', 'ENTRANCE__LEVEL']:
            if e.find(field) is not None:
                layer[field] = number(e, field)
        layer['cells'] = boundary(e, layer['worldGroundLevel'])
        if kind == 'River':
            layer['flowDirections'] = ''.join(e.findtext('flowDirections/bytes').split())
        layers.append(layer)

    # Keep longs as strings: geography IDs cannot round-trip through a JS Number.
    districts, towns = [], {}
    for kind in ['SimpleDistrict', 'DungeonDistrict']:
        for e in records(kind):
            if number(e, 'sizeX') <= 0:
                continue
            soil = resolve(e.find('soilGeo'))
            owner = resolve(e.find('owner'))
            description = resolve(owner.find('description'))
            template = resolve(description.find('economyTemplate'))
            infra = resolve(e.find('infrastructure'))
            soil_kind = soil.get('class', soil.tag).rsplit('.', 1)[-1]
            def types(field):
                for entry in resolve(template.find(field)):
                    if entry[0].text.rsplit('.', 1)[-1] == soil_kind:
                        return [c.text.rsplit('.', 1)[-1] for c in resolve(entry[1])]
                raise ValueError(f'Missing {field} for {e.findtext("id")} / {soil_kind}')
            fixed = []
            members = resolve(owner.find('fixMembers'))
            for entry in members if members is not None else []:
                member = resolve(entry[-1])
                properties = resolve(member.find('ownedInfrastructures'))
                for prop in properties if properties is not None else []:
                    prop = resolve(prop)
                    item = {f: int(number(prop, f, -1)) for f in
                            ['relOrigoX', 'relOrigoY', 'relOrigoZ', 'sizeX', 'sizeY', 'sizeZ']}
                    item['type'] = (prop.findtext('type') or '').rsplit('.', 1)[-1]
                    item['ownerMemberId'] = member.findtext('id') or member.findtext('numericId')
                    fixed.append(item)
            town = resolve(e.find('town'))
            town_name = town.findtext('foundationName') if town is not None else e.findtext('foundationName')
            district = {
                'id': e.findtext('id'), 'kind': kind, 'name': e.findtext('foundationName'),
                'blockStart': [int(number(e, 'blockStartX')), int(number(e, 'blockStartZ'))],
                'center': [int(number(e, 'centerX')), int(number(e, 'centerZ'))],
                'savedBounds': [int(number(e, f)) for f in ['origoX', 'origoY', 'origoZ', 'sizeX', 'sizeY', 'sizeZ']],
                'soilGeographyId': soil.findtext('id'), 'soilKind': soil_kind,
                'soilNumericId': soil.findtext('numericId'), 'blockSize': int(number(soil, 'blockSize')),
                'ownerEntityId': owner.findtext('id'), 'ownerType': description.get('class', description.tag).rsplit('.', 1)[-1],
                'savedInhabitantNumber': int(number(infra, 'savedInhabitantNumber')),
                'residenceTypes': types('residenceTypes'), 'groundTypes': types('groundTypes'),
                'fixedInfrastructure': fixed, 'townName': town_name,
            }
            districts.append(district)
            # The same town object may be reached through many XStream references.
            town_key = id(town) if town is not None else id(e)
            towns.setdefault(town_key, {'name': town_name, 'districtIds': []})['districtIds'].append(district['id'])
    districts.sort(key=lambda d: d['id'])
    town_list = sorted(towns.values(), key=lambda t: min(t['districtIds']))
    for town in town_list:
        town['districtIds'].sort()
        town['id'] = 'town:' + town['districtIds'][0]
        ds = [d for d in districts if d['id'] in town['districtIds']]
        town['center'] = [sum(d['center'][i] for d in ds) / len(ds) for i in range(2)]
        for d in ds:
            d['townId'] = town['id']

    landmarks = []
    for kind in ['SimpleDistrict', 'RoadShrine']:
        seen = set()
        for e in records(kind):
            record = {'kind': kind, 'id': e.findtext('id'), 'name': e.findtext('foundationName') or e.findtext('id')}
            for axis in 'XYZ':
                record[axis.lower()] = number(e, 'origo' + axis)
                record['size' + axis] = number(e, 'size' + axis)
            key = (record['id'], record['x'], record['z'])
            if record['sizeX'] > 0 and record['sizeZ'] > 0 and key not in seen:
                seen.add(key)
                landmarks.append(record)
    # Map-only records: keep these visible without pretending their gameplay is ported.
    additional_markers = []
    for kind, marker_kind in [('DungeonDistrict', 'dungeon'), ('PavedStorageAreaGround', 'storage')]:
        seen = set()
        for e in records(kind):
            x, z = number(e, 'origoX'), number(e, 'origoZ')
            sx, sz = number(e, 'sizeX'), number(e, 'sizeZ')
            key = (e.findtext('id'), x, z)
            if sx <= 0 or sz <= 0 or key in seen:
                continue
            seen.add(key)
            additional_markers.append({
                'id': f'{kind}:{key[0]}:{x}:{z}', 'kind': marker_kind,
                'name': e.findtext('foundationName') or ('Storage area' if marker_kind == 'storage' else key[0]),
                'x': x + sx / 2, 'y': number(e, 'origoY'), 'z': z + sz / 2,
                'sizeX': sx, 'sizeZ': sz, 'implemented': False,
            })
    climates = []
    for entry in world.findall('climate/belts/entry'):
        e = resolve(entry[1])
        climates.append({'kind': e.tag.rsplit('.', 1)[-1], 'cells': boundary(e, 40)})
    pos = root.find('normalPosition')
    data = {
        'version': 1, 'source': str(SOURCE.relative_to(ROOT)),
        'xmlSha256': hashlib.sha256(xml).hexdigest(), 'seed': 0,
        'geographySeed': number(world, 'GEOGRAPHY__RANDOM__SEED'),
        'sizeX': number(world, 'realSizeX'), 'sizeZ': number(world, 'realSizeZ'),
        'groundLevel': number(world, 'worldGroundLevel'), 'cellSize': 40,
        'spawn': {axis.lower(): number(pos, 'viewPosition' + axis) for axis in 'XYZ'},
        'layers': layers, 'climates': climates, 'landmarks': landmarks,
        'additionalMapMarkers': additional_markers,
        'districts': districts, 'towns': town_list,
    }
    OUTPUT.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(f'Exported {len(layers)} layers, {len(climates)} climate belts, {len(landmarks)} landmarks; {OUTPUT.stat().st_size:,} bytes')


if __name__ == '__main__':
    export()
