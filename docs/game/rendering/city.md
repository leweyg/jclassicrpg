# city_rendering

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Semantic-to-mesh compilation, asset calibration, material mappings, and rendering budgets. The legacy renderer used two-unit cubes; current `world/format.js` uses one unit per saved cell and calibrates those assets to half size. The original transform example below is a legacy calibration reference, not a command to double world coordinates. Legacy face normals are separate from the player map compass (north +Z, east −X). Whole hut/igloo meshes, dynamic lighting, interior culling, and LOD are design options, not claims about the currently simplified geometry.

## Rendering and collision architecture

Recommended flow:

```text
persistent district state
  -> deterministic StructureSpec[]
  -> semantic volumes / maze byte grids
  -> collision and navigation graph
  -> visible chunk extraction
  -> instanced meshes / merged geometry
```

Rendering options:

- Instance repeated wall, window, door, column, stair, and roof assets.

- Merge floors/ceilings per chunk or use greedy meshing for simple surfaces.

- Keep doors separate if they may animate.

- Generate collision from semantic faces, not triangle meshes.

- Cull internal coplanar faces shared by adjacent cells.

- Load/generate structures by district or chunk, with stable cache keys.

For interior/exterior transitions, track semantic environment flags (`interior`, light profile, ambient sound, music) separately from geometry.

## Complete city-to-mesh visual pipeline

The earlier sections define what exists and where it is placed. This section carries that output all the way to visible Three.js meshes, materials, props, interiors, lighting, and draw-call management.

### Visual generation stages

Treat visual generation as a compiler with stable intermediate representations:

```text
DistrictState
  -> StructureSpec[]                         city plan
  -> SemanticVolume[] + GroundPatch[]       gameplay truth
  -> SurfaceInstance[] + PropInstance[]     visual primitives
  -> asset/material lookup                  source meshes
  -> transformed instance matrices          placed geometry
  -> per-chunk InstancedMesh / merged mesh  GPU output
```

Do not make the city generator emit Three.js objects directly. Each stage should be independently testable and disposable after producing the next cached stage.

```ts
type Face = "north" | "east" | "south" | "west" | "top" | "bottom";

interface SurfaceInstance {
  assetId: string;
  materialId: string;
  cell: Vec3i;
  face?: Face;
  yawQuarterTurns?: 0 | 1 | 2 | 3;
  localOffset?: [number, number, number];
  scale?: [number, number, number];
  variant?: number;
  castsShadow: boolean;
  receivesShadow: boolean;
}

interface PropInstance extends SurfaceInstance {
  interactionId?: string;
  animationState?: "closed" | "opening" | "open";
}

interface GroundPatch {
  origin: Vec3i;
  cornerHeights: [number, number, number, number];
  materialId: string;
  semantic: "street" | "yard" | "floor" | "terrain";
}
```

The semantic volume remains authoritative for collision. `SurfaceInstance` records exist only to select and place visual assets.

### World coordinates and mesh transforms

The original visual cube edge was `2.0` engine units. The following example reconstructs that legacy transform for asset calibration. The browser uses `CELL_SIZE = 1` and half-scale source models; do not apply this legacy factor to saved positions:

```ts
const CELL_SIZE = 2;

function cellCenter(p: Vec3i): THREE.Vector3 {
  return new THREE.Vector3(p.x * CELL_SIZE, p.y * CELL_SIZE, p.z * CELL_SIZE);
}
```

The original direction order is north, east, south, west, top, bottom. North is negative Z; east is positive X. The original model rotations are:

| Face | World normal | Y rotation for a side-authored mesh |
|---|---|---:|
| north | `(0, 0, -1)` | π |
| east | `(1, 0, 0)` | π/2 |
| south | `(0, 0, 1)` | 0 |
| west | `(-1, 0, 0)` | 3π/2 |
| top | `(0, 1, 0)` | rotate π/2 around X when using side-oriented geometry |
| bottom | `(0, -1, 0)` | rotate 3π/2 around X |

OBJ meshes may contain their own baked origin and orientation. Build an asset calibration scene showing the untransformed mesh beside a two-unit reference cube. Record corrections in the asset manifest instead of scattering one-off rotations through generation code.

```ts
interface AssetDefinition {
  id: string;
  obj: string;
  baseScale: number;
  baseRotation: [number, number, number];
  baseOffset: [number, number, number];
  anchor: "cell-center" | "face-center" | "cell-floor";
  material: string;
  instancing: "static" | "interactive" | "merged-ground";
  doubleSided?: boolean;
}
```

For a face asset, calculate:

```ts
matrix = translation(cellCenter)
       * faceRotation(face)
       * translation(asset.baseOffset * CELL_SIZE)
       * euler(asset.baseRotation)
       * scale(asset.baseScale);
```

Whether an OBJ is centered or already displaced toward its face must be determined from its bounds and recorded in `anchor`. Never apply both a face-center translation and a baked face offset.

### Existing web asset loading

The repository already contains `jCRPG-engine/js/obj_mtl_loader.js`, a small OBJ/MTL parser used by `world_view.js`. Extend that loader instead of introducing a second asset path initially.

Required extensions:

- cache one immutable source `THREE.Group` per OBJ URL;

- expose flattened geometry/material parts for instancing;

- preserve OBJ groups and `usemtl` boundaries;

- compute normals when absent;

- retain UVs and indexed geometry where possible;

- optionally generate tangents when normal maps are enabled;

- resolve MTL diffuse maps through `media/textures/models/low_png` and `common`;

- map `.DDS` references to the equivalent `.png` basename for browser use;

- explicitly mark color textures as sRGB and normal/roughness/height maps as linear;

- provide a placeholder material when the historical texture is missing;

- return bounds and source orientation for calibration tests.

The current loader already probes PNG texture tiers. Keep PNG as the baseline mobile-compatible path; adding compressed KTX2 textures can be a later optimization.

### Original subtype-to-mesh mapping

The Java renderer maps semantic side subtypes to rendered-side IDs in `SideTypeModels.java`. The corresponding web manifest should be data rather than hardcoded branching.

#### Basic and wooden houses

| Semantic element | Existing model | Notes |
|---|---|---|
| wall | `media/models/external/House_01_wall.obj` | face-oriented, shadow caster, originally double-sided |
| window wall | `media/models/external/House_01_window.obj` | complete wall section with window |
| door wall | `media/models/external/House_01_door.obj` | complete wall section containing doorway/door visual |
| exterior ground/foundation | `media/models/external/House_01_externalgr.obj` | original offset Y by −1 engine unit |
| roof corner | `media/models/external/House_01_roof_corner.obj` | rotate and locate per roof-edge orientation |
| roof straight | `media/models/external/House_01_roof_straight.obj` | face-oriented roof edge |
| internal stairs | `media/models/inside/steps/steps.obj` | wood PBR texture set available |
| exterior steps | `media/models/external/House_01_steps_wooden.obj` | used by economic-ground stairs |
| bookcase | `media/models/inside/furniture/bookcase.obj` | interactive/unique mesh rather than large static batch |
| interior floor | procedural quad or `media/models/ground/house_wood.3ds` replacement | use a two-unit quad in the web port if 3DS loading is omitted |
| internal ceiling | procedural quad or legacy `sides/ceiling_pattern1.3ds` replacement | downward-facing material |

House textures have browser-friendly files under `media/textures/models/low_png`, including `Wall_Tex_Bake_01.png`, `Window_Tex_Bake_03.png`, `Door_Tex_Bake_01.png`, `Roof_Tex_Bake_01.png`, `RoofCorner_Tex_Bake_01.png`, and `Wood_Tex_General.png`.

#### Dungeon/maze

| Semantic element | Existing model/material |
|---|---|
| wall face | `media/sides/maze_wall_thick.obj` |
| floor | `media/sides/maze_ground.obj` or a procedural quad |
| door | `media/models/external/maze/maze-door1rot.obj` |
| four-column entrance | `media/models/external/maze/4_pillars.obj` |
| two-column transition | `media/models/external/maze/2_pillars.obj` |
| fallback pillar | `media/models/external/maze/NormalTest_Pillar_01.obj` |

The complete `maze_stone_1` material set exists only as DDS and needs conversion or browser DDS support. A browser-ready `maze_stone_2.png`, `_n.png`, and `_s.png` set already exists under `media/textures/models/low_png`; use that set for the initial port. Three.js `MeshStandardMaterial` does not accept a legacy specular map directly; initially derive a roughness map offline or use a fixed stone roughness around `0.8`.

#### Huts, igloos, caves, roads, and props

| Element | Existing model |
|---|---|
| whole hut | `media/models/external/hut/hut_big.obj` |
| whole igloo | `media/models/external/igloo/igloo.obj` |
| sand igloo | `media/models/external/sandigloo/sandigloo1.obj` |
| stone base | `media/models/external/stonebase/stonebase1.obj` |
| cave wall | `media/models/ground/wall_cave.obj` |
| reversed cave wall | `media/models/ground/wall_cave_rev.obj` |
| cave floor variants | `media/models/ground/ground_1.obj`, `_2.obj`, `_3.obj` with cave material |
| cave rock | `media/models/ground/cave_rock.obj` |
| cave entrance variants | `media/models/ground/cave_entrance.obj`, `cave_entrance_tex.obj` |
| street/road | `media/models/ground/ground_1.obj` with `stone` or climate-specific `pathway` textures |
| barrel | `media/models/item/storage/barrel.obj`, scale about 0.2 |
| crate | `media/models/item/storage/crate.obj`, scale about 0.2 |
| basket | `media/models/item/storage/basket.obj`, scale about 0.33 |
| market pavilion | `media/models/item/storage/pav.obj` |
| chest | static `chest.obj` for first implementation; MD5 mesh/animations can follow |

Whole-building assets such as the hut are attached to a single semantic trigger cell in the original renderer while the other wall subtypes render nothing. Mark them `wholeStructure: true`; emit only one mesh per residence, while retaining all semantic cells for collision.

### Asset manifest example

```ts
export const CITY_ASSETS: Record<string, AssetDefinition> = {
  "wood-house.wall": {
    id: "wood-house.wall",
    obj: "media/models/external/House_01_wall.obj",
    baseScale: 1,
    baseRotation: [0, 0, 0],
    baseOffset: [0, 0, 0],
    anchor: "cell-center",
    material: "wood-house.wall",
    instancing: "static",
    doubleSided: true,
  },
  "wood-house.door": {
    id: "wood-house.door",
    obj: "media/models/external/House_01_door.obj",
    baseScale: 1,
    baseRotation: [0, 0, 0],
    baseOffset: [0, 0, 0],
    anchor: "cell-center",
    material: "wood-house.door",
    instancing: "interactive",
  },
  "maze.wall": {
    id: "maze.wall",
    obj: "media/sides/maze_wall_thick.obj",
    baseScale: 1,
    baseRotation: [0, 0, 0],
    baseOffset: [0, 0, 0],
    anchor: "cell-center",
    material: "maze.stone",
    instancing: "static",
  },
};
```

Java asset paths are relative to the old media resource root. Normalize them through the manifest rather than copying Java strings directly into browser URLs; notably, maze wall/floor meshes live under `media/sides`, while most building meshes live under `media/models`.

### Emitting individual house meshes

For every occupied semantic cell:

1. Emit one floor surface when the cell has a floor.

2. Emit one ceiling surface when it has a ceiling and the ceiling is visible from below.

3. For each horizontal face, choose exactly one wall-section asset:
   - door beats window;
   - window beats plain wall;
   - no wall emits nothing.

4. Emit stairs as a separate mesh with orientation taken from the stair face.

5. Emit bookcases and other furniture as props, not as part of wall batching.

6. Emit roof parts from top-level roof semantics.

7. Remove duplicate coplanar faces between neighboring structures only when they share compatible ownership/material and neither side needs to remain visible.

```ts
function emitCell(cell: SemanticCell, world: Vec3i, out: SurfaceInstance[]) {
  if (cell.floor) out.push(surface("floor", world, "bottom"));
  if (cell.ceiling) out.push(surface("ceiling", world, "top"));

  for (const face of HORIZONTAL_FACES) {
    const type = cell.door(face) ? "door"
      : cell.window(face) ? "window"
      : cell.wall(face) ? "wall"
      : null;
    if (type) out.push(surface(type, world, face));
  }

  if (cell.stairs) out.push(orientedProp("stairs", world, cell.stairDirection));
}
```

Keep doors initially passable if preserving original gameplay. If adding animated closable doors, split `doorway collision` from `door leaf state`; otherwise the new visual feature will accidentally change navigation.

### Roof selection

There are two roof systems in the Java renderer:

- `House` uses continuous-side neighbor inspection to select roof side, corner, opposite-corner, or isolated pieces.

- `WoodenHouse` explicitly emits roof-corner and roof-straight semantics from its top-level generator.

For the web port, normalize both to a top-level roof mask. For each roof cell, inspect four horizontal neighbors with the same structure/roof region:

```ts
mask = (north ? 1 : 0) | (east ? 2 : 0) | (south ? 4 : 0) | (west ? 8 : 0);
```

Map masks to straight, inner/outer corner, end-cap, or center coverage. For exact legacy visuals, reproduce `RenderedContinuousSide` selection using the original standing-engine neighbor logic. For an initial faithful-enough implementation, explicit `WoodenHouse` roof pieces plus a flat hidden cap are sufficient, provided interiors cannot see the sky through gaps.

### Streets, yards, plazas, and terrain seams

City visuals will look unfinished if only buildings are added. Emit ground in this order:

1. base terrain;

2. district economic ground and streets with a small positive Y bias or polygon offset;

3. foundations/exterior ground under residences;

4. steps used to bridge local height changes;

5. props, flora, and buildings.

Use terrain corner heights for street patches where possible. For original parity, `EconomicGround` provides cell cubes and steep/stair semantics. Avoid placing a perfectly horizontal quad through sloped terrain.

Recommended ground visuals:

- economic street: `ground_1.obj` with `stone` texture;

- road network: `ground_1.obj` with climate-dependent `pathway`, `pathway_desert`, `pathway_snow`, or `pathway_jungle` texture;

- residence yard/foundation: `House_01_externalgr.obj`;

- storage plaza: paved floor plus deterministic pavilion, crate, barrel, and basket props;

- dungeon elevated ground: cave-ground geometry raised approximately `0.04` engine unit as in the original renderer.

Use decals or slightly offset ground meshes rather than rebuilding the whole terrain chunk for every street. At distance, replace detailed street meshes with a colored terrain overlay.

### Prop distribution and visual variety

All decorative variation must use coordinate hashing so a chunk reload does not move objects.

```ts
const h = javaMix(worldX, worldY, worldZ, visualSeed);
const yaw = (h & 3) * Math.PI / 2;
const variant = (h >>> 2) % variantCount;
const offsetX = (((h >>> 8) & 255) / 255 - 0.5) * maxOffset;
const offsetZ = (((h >>> 16) & 255) / 255 - 0.5) * maxOffset;
```

Apply random rotation/dislocation only to assets historically configured for it, such as barrels, crates, baskets, cave rocks, and vegetation. Architectural faces must remain aligned.

Useful city-detail passes:

- storage props on `PavedStorageAreaGround` semantic positions;

- deterministic chests at maze-selected storage coordinates;

- entity-owned furniture from fixed infrastructure records;

- climate-valid flora only on cells whose structure permits flora;

- town signs or labels as a new, versioned visual-only system.

Do not scatter decorative props into doors, navigation corridors, stair landings, or required maze paths. Query the navigation graph before accepting a prop position.

### Materials

Create shared `MeshStandardMaterial` instances keyed by a material manifest:

```ts
interface MaterialDefinition {
  colorMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  roughness: number;
  metalness: number;
  alphaTest?: number;
  side?: "front" | "double";
}
```

Baseline values:

- wood walls/roof: metalness 0, roughness 0.65–0.85;

- stone/maze: metalness 0, roughness 0.8–0.95;

- windows baked into opaque wall assets: use the historical texture first; add transparent glass only after geometry inspection;

- floors: roughness around 0.75;

- metal chest fittings: separate material only if the OBJ groups support it.

Normal maps need `THREE.SRGBColorSpace` disabled. Color maps need sRGB. Set anisotropy conservatively on mobile. Material instances must be shared across chunks; never create one material per wall.

### Batching into GPU meshes

After emitting visual instances, group by:

```text
chunkId + assetId + materialId + shadowMode
```

For each group:

- use `THREE.InstancedMesh` for repeated walls, windows, doors that do not animate, roof pieces, columns, rocks, and props;

- use merged indexed geometry for large contiguous floors/ceilings when rebuilding a chunk is cheap;

- use ordinary `THREE.Mesh` for interactive doors, animated chests, and rare whole buildings;

- keep the semantic-to-instance index so a changed door or chest can be updated without rebuilding the city.

```ts
interface RenderBatch {
  key: string;
  mesh: THREE.InstancedMesh;
  count: number;
  owners: string[]; // structure/interaction IDs by instance index
}
```

Cull face instances before batching. If two adjacent cells both have identical opaque walls on their shared face, emit only the face that semantic rules actually require—or neither if it is wholly internal and collision is handled separately.

Practical budgets for mobile Safari:

- target tens, not thousands, of draw calls in the active world window;

- one instanced draw per common asset/material/chunk combination;

- only nearby interiors need full furniture and ceilings;

- limit dynamic shadow casters to nearby major architecture;

- make small props receive but not cast shadows at medium distance;

- unload render batches with the existing bounded world-stream chunks.

### Interior visibility

A city full of complete interiors can overdraw heavily. Track which structure contains the camera.

- Outside: render exterior faces and roofs; omit most interior furniture/ceilings.

- Inside one structure: render its interior floors, walls, stairs, and props; hide or fade roof cells above the camera region.

- Maze/cave: render the local connected/visible chunk plus a small margin; use distance fog and portal/room culling where practical.

Start with layer visibility rather than complex occlusion portals. Each emitted instance should carry `visualLayer: exterior | interior | both`.

### Lighting, environment, and audio cues

Use one global directional light and hemisphere/ambient contribution outdoors. Indoors:

- reduce sky/hemisphere intensity;

- allow local point lights only at authored or hashed fixtures;

- switch ambient/music profiles from semantic environment state, not mesh proximity;

- keep maze and cave fog/color profiles separate;

- prevent every window/torch from creating a real shadowed light.

The original semantic cubes carry `internalCube` and `internalLight`. Preserve equivalent flags in the semantic volume and let the render environment respond to them.

### Level of detail

Use three visual tiers:

| Range | Buildings | Ground/props |
|---|---|---|
| near | individual wall/window/door/roof meshes, interiors | detailed streets, furniture, storage props |
| medium | exterior instanced pieces, no interiors | simplified ground, major props only |
| far/map | one box, roof silhouette, or baked district cluster | terrain tint and town marker |

The procedural generator should run once; LOD changes only the visual lowering of the same `StructureSpec`. A far building must not change its collision or footprint.

For far city clusters, generate a small number of box/roof meshes from structure bounds rather than loading every OBJ. When a chunk approaches, atomically replace the cluster with detailed batches.

### Visual implementation modules

Add these modules to the earlier proposed layout:

```text
render/city-asset-manifest.ts      semantic asset/material definitions
render/city-asset-loader.ts        cached OBJ/MTL loading and flattening
render/semantic-mesh-emitter.ts    cells -> SurfaceInstance records
render/roof-resolver.ts            neighbor masks -> roof pieces
render/ground-patch-emitter.ts     streets/yards/floors and slope fitting
render/instance-batcher.ts         records -> InstancedMesh groups
render/interior-visibility.ts      exterior/interior layer selection
render/city-lod.ts                 near/medium/far lowering
render/material-library.ts         shared PBR materials/textures
render/city-debug-view.ts          bounds, anchors, normals, batch colors
```

### Visual delivery order

1. Build the calibration scene and asset manifest.

2. Render a single 4 × 4 × 1 wooden house with plain walls/floor.

3. Add face rotations, door, windows, foundation, collision overlay, and entrance.

4. Add roof pieces and interior stairs.

5. Emit and batch every house in one real seed-0 district.

6. Add streets, terrain fitting, yards, and exterior steps.

7. Add hut/igloo whole-structure renderers and climate-specific variants.

8. Add storage grounds and props.

9. Render one dungeon from maze bytes through walls, doors, columns, floors, ceiling, and chest.

10. Add interior visibility, chunk lifetime, LOD, shadows, and performance budgets.

11. Finally add natural-cave meshes and entrances, since they use a separate spatial generator.

### Visual acceptance tests

- every semantic blocking face has a matching visible surface or an intentional invisible-collision designation;

- every visible door aligns with a passable doorway edge;

- mesh bounds stay within the intended cell/face allowance;

- north/east/south/west snapshots confirm correct orientation;

- roofs contain no daylight gaps over closed interiors;

- stairs visually and navigationally connect the same two levels;

- no Z-fighting between terrain, street, foundation, and floor;

- textures load through browser-compatible PNG paths;

- repeated assets share geometry and material objects;

- unloading a chunk disposes only chunk-owned meshes, not shared source geometry/materials;

- regeneration produces identical instance transforms and prop variants;

- a real district remains within draw-call, triangle, texture-memory, and frame-time budgets on iPhone-class hardware.
