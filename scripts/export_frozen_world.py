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
                      'depth', 'noWaterPercentage', 'density', 'width', 'curvedness', 'curveLength']:
            if e.find(field) is not None:
                layer[field] = number(e, field)
        layer['cells'] = boundary(e, layer['worldGroundLevel'])
        if kind == 'River':
            layer['flowDirections'] = ''.join(e.findtext('flowDirections/bytes').split())
        layers.append(layer)

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
    }
    OUTPUT.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(f'Exported {len(layers)} layers, {len(climates)} climate belts, {len(landmarks)} landmarks; {OUTPUT.stat().st_size:,} bytes')


if __name__ == '__main__':
    export()
