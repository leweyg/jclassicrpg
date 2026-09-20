# jClassicRPG procedural settlements, buildings, mazes, and caves

Implementation notes for re-creating the Java systems in a web runtime while retaining deterministic compatibility with the bundled seed-0 save.

## 1. Executive model

The original engine has four relevant layers:

1. **World geography** defines terrain, surface height, water, and natural caves.
2. **Population districts** are persistent settlement records associated with an entity and a soil geography.
3. **Infrastructure generators** turn each district and its population size into building/street specifications.
4. **Residences** turn one specification into queryable cube geometry. A procedural dungeon is implemented as a special residence.

Therefore, cities and constructed mazes are related through their placement and lifecycle, but not through their internal layout algorithms. Natural caves are a separate geography system.

```text
World
  Geography: Plain / Forest / Mountain / Cave / Water
  EconomyContainer
    Town (logical grouping only)
      Population district
        Infrastructure generator
          InfrastructureElementParameters
            House / WoodenHouse / BrickHouse / Hut / Igloo
            SimpleDungeonPart (procedural maze)
            Street or other EconomicGround
```

Important consequences:

- `SimpleDistrict` selects `GrownInfrastructure`.
- `DungeonDistrict` selects `BigBlockInfrastructure`.
- Both pass through `AbstractInfrastructure.build()`.
- Ordinary districts select a residence type from the owning entity's `EconomyTemplate`.
- Greek-maze districts select `SimpleDungeonPart` as their residence type.
- `Town` does not generate streets or buildings. It groups neighboring districts, supplies a shared name, and computes their average center.
- `CaveChecker` and `WaterChecker` prevent settlement infrastructure from occupying unsuitable blocks. They do not generate either the settlement or the maze.

## 2. Persistence and deterministic reconstruction

The save stores persistent district/economy state but deliberately excludes generated building lists:

```java
public transient ArrayList<Residence> residenceList;
public transient ArrayList<EconomicGround> groundList;
```

On load, `Population.onLoad()` recreates those lists and calls the infrastructure generator in loading mode. Loading mode uses `savedInhabitantNumber`, ensuring that a district is reconstructed at the same growth level it had when saved.

The bundled save contains 183 material `SimpleDistrict` records and 25 material `DungeonDistrict` records, but no material house or `SimpleDungeonPart` instances. This means a compatible port must either:

- reproduce the deterministic reconstruction algorithms; or
- precompute their outputs and include them in a web-native world snapshot.

For a fixed-world first release, precomputed output is acceptable. For new worlds, simulation-driven town growth, or exact save compatibility, port the generators.

## 3. Recommended web data structures

Do not reproduce the XStream object graph. Preserve its concepts with small, explicit records.

```ts
type Vec3i = { x: number; y: number; z: number };
type Size3i = { x: number; y: number; z: number };

type DistrictKind = "simple" | "dungeon";

interface DistrictState {
  id: string;
  kind: DistrictKind;
  name: string;
  soilGeographyId: string;
  ownerEntityId: string;
  blockStart: { x: number; z: number };
  center: { x: number; z: number };
  savedInhabitantNumber: number;
  townId?: string;
}

type StructureKind =
  | "house" | "wooden-house" | "brick-house"
  | "hut" | "igloo" | "simple-dungeon"
  | "street" | "storage-ground";

interface StructureSpec {
  id: string;
  kind: StructureKind;
  origin: Vec3i;
  size: Size3i;
  groundLevel: number;
  ownerMemberId?: string;
  districtId: string;
  generationVersion: number;
}
```

Represent spatial output in two forms:

- **Semantic grid** for generation, movement, pathfinding, saves, and tests.
- **Derived render batches** for Three.js meshes and instances.

Avoid making a Three.js mesh the authoritative representation. Generation and collision need stable, render-independent facts.

```ts
const enum CellFlag {
  Floor       = 1 << 0,
  Ceiling     = 1 << 1,
  WallNorth   = 1 << 2,
  WallEast    = 1 << 3,
  WallSouth   = 1 << 4,
  WallWest    = 1 << 5,
  DoorNorth   = 1 << 6,
  DoorEast    = 1 << 7,
  DoorSouth   = 1 << 8,
  DoorWest    = 1 << 9,
  Stairs      = 1 << 10,
  Interior    = 1 << 11,
  Blocking    = 1 << 12,
}

interface SemanticVolume {
  origin: Vec3i;
  size: Size3i;
  cells: Uint16Array; // index = x + size.x * (z + size.z * y)
}
```

The original `Cube` stores six arrays of `Side` objects. For a web port, normalized flags plus material/asset IDs are easier to query and serialize. Keep an adapter capable of reproducing original side semantics while validating parity.

## 4. Determinism contract

Exact parity depends on Java integer behavior, not JavaScript floating-point arithmetic alone.

Requirements:

- Reproduce signed 32-bit overflow with `| 0` or `Math.imul` where appropriate.
- Reproduce Java unsigned right shift with `>>>`.
- Preserve Java remainder behavior. Java `%` can return a negative result; do not automatically normalize it unless the original caller does.
- Use the ported `HashUtil.mix`, `mixPercentage`, and `mixPer1000` everywhere the original does.
- Do not substitute `Math.random()` or a typical seeded PRNG.
- Preserve iteration order where it affects output.
- Include a `generationVersion` in exported structures and saves, so a later improved generator does not silently mutate existing worlds.

The current `javaMix()` in `frozen_world.js` is the natural shared primitive. Add golden tests against values produced by Java before implementing higher layers.

## 5. Settlement generation pipeline

### 5.1 Input resolution

For each district:

1. Resolve its soil geography.
2. Resolve the owner's `EconomyTemplate`.
3. Select permitted residence and ground types for that geography.
4. Filter types by `isValidForDistrict()`.
5. Create unavailable-block masks using water/cave checks and type-specific checkers.
6. Resolve fixed infrastructure owned by persistent NPC members.
7. Generate `StructureSpec` records for the saved population-size tier.
8. Compute terrain-supported Y placement.
9. Instantiate semantic building/ground volumes.
10. Union their bounds to obtain the district footprint and spatial index entries.

### 5.2 Growth quantization

The infrastructure tier is:

```ts
nearestSize = Math.trunc(inhabitants / inhabitantsPerUpdate)
            * inhabitantsPerUpdate;
```

Defaults in `AbstractInfrastructure` are:

- building block: 4 × 4 world cells;
- six inhabitants per block/update;
- maximum building levels: three, although individual generators may not fully use this field.

During save loading, use `savedInhabitantNumber`, not the current owner population. During a live economy update, derive the tier from current inhabitants and replace the generated infrastructure if the tier changes.

### 5.3 GrownInfrastructure: ordinary districts

This is a deterministic growth walk over a block grid.

State begins at the center block. Each iteration alternates economic-ground and residence placement. A hash percentage chooses one neighboring direction:

- `< 33`: x + 1
- `< 66`: z + 1
- `< 99`: x - 1
- otherwise: z - 1

Coordinates use `abs(value) % gridSize`, which is not conventional toroidal wrapping and should be preserved for exact parity.

For each candidate:

1. Select a likely structure type for that block and geography.
2. Reject it if occupied or marked unavailable by any checker required by that type.
3. Retry with a new hash delta, up to the original retry limit.
4. If hashing fails, scan by incrementing both coordinates.
5. Emit a 4 × N × 4 structure specification.
6. Alternate ground/residence; every fifth used block can raise the computed building height from one to two levels.
7. Apply predefined NPC-owned infrastructure parameters to residences first.

Compatibility warning: reproduce the original oddities before “fixing” them. The fallback increments both X and Z, and the direction thresholds leave only one percentage value for z - 1. Correcting these changes the historical world.

### 5.4 DefaultInfrastructure

This alternate generator first emits a full-width central street. It then creates a deterministic shuffled sequence of block indices using `HashUtil.mixPer1000`, sticky runs, and occasional row leaps. Residences are placed into the first acceptable unoccupied blocks in that sequence.

Although seed-0 `SimpleDistrict` uses `GrownInfrastructure`, this implementation may still be needed for scenarios or future content. Port it after seed-0 parity unless repository-wide completeness is the goal.

### 5.5 BigBlockInfrastructure: dungeon districts

This generator emits exactly one large residence:

```ts
spec.kind = "simple-dungeon";
spec.size = { x: districtBlockSize - 3, y: 3, z: districtBlockSize - 3 };
spec.relativeOrigin = { x: 3, y: 3, z: 3 };
```

The infrastructure system then chooses terrain-supported `origin.y`. The relative Y field is effectively not used by `AbstractInfrastructure.build()` for residences; preserve observed behavior rather than assuming it offsets the final origin.

## 6. Terrain placement and block validation

`AbstractInfrastructure.getMinMaxHeight()` samples all surface points across a structure footprint. Residences use the midpoint between minimum and maximum surface height as their origin Y. Economic grounds may stretch vertically to cover the sampled range.

The original minimum-height calculation initializes and updates values in a slightly unconventional way. Write parity tests against real districts before simplifying it.

Water and cave validators produce one unavailable bit per 4 × 4 infrastructure block. A web implementation should expose this as a composable interface:

```ts
interface PlacementChecker {
  markUnavailable(ctx: DistrictGenerationContext, mask: Uint8Array): void;
}
```

Natural caves and constructed dungeons are distinct here: `CaveChecker` keeps ordinary structures and dungeon districts from being placed over shallow cave space; it does not convert a dungeon into a cave.

## 7. Building geometry

### 7.1 Common pattern

A residence is a fixed function of type, dimensions, ground level, and origin. The original classes construct a local cube dictionary and translate queries into local coordinates. This makes structure templates cacheable by a key such as:

```text
type + sizeX + sizeY + sizeZ + groundLevel
```

In the web port, cache immutable local `SemanticVolume` templates. Create lightweight placed instances containing an origin and ownership metadata.

### 7.2 House

The basic house generator creates:

- perimeter walls on every level;
- windows periodically where the wall coordinate satisfies `% 3 == 2`;
- an exterior door at a fixed perimeter position;
- internal floors and ceilings;
- alternating stair positions between levels;
- special corner cells;
- a bookcase semantic side on one wall type.

The traversal model is face-based. A wall blocks crossing a cell face; the floor and ceiling affect vertical movement; stairs permit a vertical transition. Doors use a non-`NotPassable` subtype, so they are traversable even if rendered as geometry.

### 7.3 WoodenHouse and variants

`WoodenHouse` follows the basic house pattern but reserves its top level for roof geometry and supplies roof-corner and roof-straight side types. Other residence classes should be ported as independent template builders sharing utility functions rather than through a deep TypeScript inheritance tree.

Suggested functions:

```ts
buildPerimeter(volume, options);
placePeriodicWindows(volume, period, phase);
placeDoor(volume, face, offset);
buildAlternatingStairs(volume, options);
buildPitchedRoof(volume, options);
```

The initial goal is semantic equivalence. Map semantic faces to existing OBJ/material assets afterward.

## 8. Constructed maze algorithm

### 8.1 Placement and dimensions

`SimpleDungeonPart` inherits from `WoodenHouse` for residence integration but overrides cube generation. It reserves a four-cell border on every side:

```ts
internalSizeX = sizeX - 8;
internalSizeZ = sizeZ - 8;
mazeSeed = origin.x + origin.y + origin.z;
```

The outer zone creates a monumental shell, transition passages, columns, and entrances. The internal rectangle contains the generated labyrinth.

### 8.2 Maze byte format

The Java generator stores one unsigned byte per internal X/Z cell:

| Bit | Value | Meaning |
|---|---:|---|
| 0 | 1 | horizontal wall |
| 1 | 2 | vertical wall |
| 2 | 4 | open-roof/open-area region |
| 3 | 8 | opening represented as a horizontal door |
| 4 | 16 | opening represented as a vertical door |
| 5 | 32 | ground type 1 |
| 6 | 64 | ground type 2 |
| 7 | 128 | ground type 3 |

Use `Uint8Array`; Java's negative printed byte values are only signed-byte representation. Bit operations should treat each value as unsigned.

### 8.3 Recursive division

The algorithm is recursive division with a cross-shaped split:

1. Stop when either region dimension is below three.
2. Hash the seed, region origin sum, and region size sum.
3. Optionally flag the entire region as `OPEN_PART` when `hash1 % 3 == 1` and `allClosed` is false.
4. Assign a ground-type bit based on region size.
5. Choose division offsets, clamped to `[2, size - 2]`.
6. Draw one vertical and one horizontal wall across the region.
7. Treat the four wall arms as north, south, east, and west.
8. Select exactly one arm to remain unbroken; cut a door through each of the other three arms.
9. Recurse into the four quadrants while below `maxLevel`.

The “three openings, one solid arm” rule is the classic connectivity invariant: all four child regions stay mutually connected without creating a loop at every division. Doors are encoded separately from walls after the wall bit is cleared.

The recursion depth is unusual:

```ts
maxLevel = Math.trunc(sizeX / Math.exp(sizeX / 50));
```

Keep this expression for compatibility, even if a simpler depth or minimum-room-size rule would be preferable in a new generator.

### 8.4 Pseudocode

```ts
function divide(seed, level, maxLevel, grid, x0, z0, x1, z1, allClosed) {
  const sx = x1 - x0, sz = z1 - z0;
  if (sx < 3 || sz < 3) return;

  const h1 = mix(seed, x0 + z0, sx + sz);
  const h2 = mix(seed + 1, x0 + z0, sx + sz);
  paintRegionMetadata(grid, x0, z0, x1, z1, h1, allClosed);

  const dx = clamp(javaRem(h1, sx), 2, sx - 2);
  const dz = clamp(javaRem(h2, sz), 2, sz - 2);
  drawVerticalWall(grid, x0 + dx, z0, sz);
  drawHorizontalWall(grid, x0, z0 + dz, sx);

  const closedArm = javaRem(h1, 4);
  if (closedArm !== NORTH) cutVerticalDoor(/* north arm */);
  if (closedArm !== SOUTH) cutVerticalDoor(/* south arm */);
  if (closedArm !== WEST)  cutHorizontalDoor(/* west arm */);
  if (closedArm !== EAST)  cutHorizontalDoor(/* east arm */);

  if (level < maxLevel) recurseIntoFourQuadrants();
}
```

Use the source directly for the exact arm coordinate formulas. Unit tests should compare every generated byte, not just a screenshot.

### 8.5 From maze bytes to navigable cells

The maze grid encodes faces, not solid wall cells. Build graph edges between orthogonal neighbors:

```ts
canMoveEast(x, z)  = !eastFaceBlocked(x, z);
canMoveWest(x, z)  = !eastFaceBlocked(x - 1, z);
canMoveNorth(x, z) = !northFaceBlocked(x, z);
canMoveSouth(x, z) = !northFaceBlocked(x, z - 1);
```

The precise mapping of `WALL_HORI`/`WALL_VERT` to north/east faces should be established with golden samples from `SimpleDungeonPart.getCubeObject()`, because the original naming reflects rendered wall orientation and coordinate conventions rather than an abstract graph API.

Normalize each boundary once and assert symmetry: if A can move east to B, B must be able to move west to A. Door bits should create passable edges with optional interaction/render metadata.

### 8.6 Solving and validation

Use BFS for unweighted reachability and shortest path. Use A* only when the navigation graph becomes large or movement costs differ.

Validation suite for every generated maze:

- all intended entrance cells are inside bounds;
- every passable edge is symmetric;
- every door replaces, rather than overlaps, its corresponding wall bit;
- the selected start reaches every required objective/storage cell;
- all walkable interior regions expected to connect are reachable;
- no wall face allows collision traversal;
- a fixed seed/dimension pair produces a fixed byte-array digest;
- generation completes without recursion or bounds errors for minimum and maximum supported dimensions.

The original algorithm should usually be connected by construction, but validate instead of assuming. Outer-shell transition passages and entrance alignment can still disconnect an otherwise valid inner maze.

## 9. Maze shell and vertical structure

`SimpleDungeonPart.getCubeObject()` expands the 2D maze into three Y levels:

- base level: floor, walls, doors, columns, and transition passages;
- middle level: wall/door continuation without ground where needed;
- top level: ceilings or exposed/open areas.

The four-cell border is not random. It handles exterior edges, columns, the transition from shell to generated maze, and fixed entrances around coordinate offset 10. Do not render the byte grid alone and expect original traversal; port the shell rules or export their evaluated semantic volume.

Storage/chest positions are selected deterministically from labyrinth coordinates using `HashUtil`, then checked against maze data. Treat object placement as a post-process over the semantic maze rather than part of recursive division.

## 10. Natural cave generation

Natural caves are not `SimpleDungeonPart` mazes.

The save supplies the cave geography footprint and parameters. `Cave.getCube()` evaluates each queried world coordinate. At the cave level, it hashes `(worldX, level, worldZ)` and compares the result with `density`:

- hash percentage below density produces blocked rock;
- otherwise the position is cave space, floor, or ceiling depending on relative Y and `levelSize`.

Entrances are detected where periodic candidate lines intersect suitable surface slopes. Near those lines, the hash is biased toward open cave space. Surface height and neighboring height samples add boundary walls and prevent cave output from appearing above the mountain.

This resembles coordinate-stable 3D occupancy noise more than a guaranteed maze. It does not provide the recursive division connectivity invariant. If natural caves must always be solvable, add a separate connectivity audit/carving pass—but doing so is a new rule and will change the original world.

For the first port:

1. Implement/query cave occupancy on demand.
2. Cache bounded chunks, not the whole 1,600 × 1,600 × Y volume.
3. Detect entrances and flood-fill only the local connected component when needed.
4. Preserve the original occupancy function for seed compatibility.

## 11. Rendering and collision architecture

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

## 12. Pathfinding hierarchy

Use layered graphs rather than one world-scale voxel graph:

1. **World graph:** terrain chunks, roads, settlement/dungeon entrances.
2. **District graph:** streets and building entrances.
3. **Interior graph:** cell faces, doors, stairs, and maze passages.

An entrance is a portal connecting graphs. This matches the original “place needs to be entered” concept and avoids running A* over millions of mostly irrelevant cells.

For a maze, BFS is sufficient for solving and validation. For agents:

- A* node: `(structureId, x, y, z)`;
- edges: open horizontal face, stair/climb transition, portal transition;
- costs: normal step 1, stairs slightly higher if desired, doors optionally conditional;
- heuristic: Manhattan distance within one structure; zero or portal-aware heuristic across structures.

## 13. Suggested module boundaries

```text
world/hash.ts                    Java-compatible HashUtil
world/surface-query.ts           height, water, cave/surface facts
economy/district-state.ts        persistent district records
economy/economy-template.ts      entity/geography -> allowed types
economy/placement-checkers.ts    water/cave/type masks
economy/grown-infrastructure.ts  ordinary settlement specs
economy/default-infrastructure.ts
economy/big-block-infrastructure.ts
structures/semantic-volume.ts
structures/house-generators.ts
structures/simple-dungeon.ts     maze shell + 3D semantic output
structures/maze-tool.ts          pure recursive-division byte grid
navigation/cell-graph.ts
navigation/portals.ts
render/structure-batches.ts
```

Keep `maze-tool.ts` pure: no Three.js, DOM, world state, or mutable global seed. This makes exhaustive testing straightforward.

## 14. Implementation sequence

### Phase 1: compatibility foundation

- Finish Java-compatible hash/remainder helpers.
- Create golden vectors from Java.
- Export complete persistent district inputs, including `savedInhabitantNumber`, owner/template type, block origin, soil geography, and fixed NPC infrastructure.
- Define `StructureSpec` and semantic-cell formats.

### Phase 2: constructed dungeons

- Port `MazeTool` byte-for-byte.
- Add digest and connectivity tests.
- Port the `SimpleDungeonPart` outer shell and three-level cube mapping.
- Render floors/walls/doors with placeholder primitives.
- Add collision, entrance portals, BFS solver, and debug overlays.

This is the most isolated end-to-end feature and a good first procedural target.

### Phase 3: ordinary buildings

- Implement basic `House` semantics.
- Add `WoodenHouse`, roofs, and remaining residence variants.
- Map semantic elements to repository assets.
- Validate doors, stairs, windows, floor levels, and terrain-supported Y.

### Phase 4: city infrastructure

- Port placement checkers and economy-template selection.
- Port `GrownInfrastructure` for seed-0 settlements.
- Add fixed NPC-owned structure overrides.
- Group districts into towns for labels/map navigation.
- Port streets and other economic grounds.

### Phase 5: natural caves

- Port cave occupancy and vertical floor/ceiling rules.
- Port entrance detection and terrain interaction.
- Add local connectivity diagnostics and cave chunk rendering.
- Add cave-specific flora, sound, and lighting after traversal works.

### Phase 6: dynamic persistence

- Save persistent inputs plus generator version, not full generated geometry.
- Optionally cache generated structure chunks as disposable acceleration data.
- On load, regenerate and compare a stored structure digest; fail clearly or migrate if the generator version differs.

## 15. Testing strategy

### Golden parity tests

Run small Java export utilities against representative seed-0 districts and store:

- hash vectors;
- infrastructure `StructureSpec` lists;
- maze byte grids;
- semantic cube/face outputs for selected coordinates;
- house template digests;
- natural cave occupancy around known entrances.

Compare JS output byte-for-byte.

### Property tests

- identical input always yields identical output;
- generated structures remain inside their district allocation;
- occupied blocks never overlap unless explicitly allowed;
- water/cave-rejected blocks receive no structure;
- all structure dimensions meet type minimums;
- maze faces are symmetric and required objectives are reachable;
- stairs link valid adjacent levels;
- semantic volumes contain no out-of-bounds writes.

### Visual/debug tools

Add toggles for:

- district bounds and block grid;
- unavailable water/cave masks;
- structure origins, types, and generation order;
- wall/door face arrows;
- maze region depth and `OPEN_PART` coloring;
- entrance portals and solver path;
- natural cave solid/open occupancy slices.

These overlays will reveal coordinate-orientation and off-by-one errors faster than inspecting final meshes.

## 16. Compatibility versus redesign decisions

Make the choice explicit for each subsystem:

| Area | Compatibility mode | Modernized mode |
|---|---|---|
| Hashing | Java 32-bit `HashUtil` | named seeded PRNG/hash |
| Town layout | preserve thresholds, retries, and wrapping oddities | clearer growth grammar/road planner |
| Maze depth | original exponential formula | minimum-room-size termination |
| Maze graph | reproduce face conventions | normalize edges during generation |
| Natural caves | coordinate hash occupancy | connected noise + guaranteed paths |
| Saves | inputs + generator version | explicit generated structure snapshot |

The safest pattern is to implement a `legacy-v1` generator first, then add a new generator under another version. Never alter legacy output in place, because save reconstruction depends on it.

## 17. Complete city-to-mesh visual pipeline

The earlier sections define what exists and where it is placed. This section carries that output all the way to visible Three.js meshes, materials, props, interiors, lighting, and draw-call management.

### 17.1 Visual generation stages

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

### 17.2 World coordinates and mesh transforms

The original visual cube edge is `2.0` engine units. Retaining that scale minimizes asset adjustment:

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

### 17.3 Existing web asset loading

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

### 17.4 Original subtype-to-mesh mapping

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

### 17.5 Asset manifest example

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

### 17.6 Emitting individual house meshes

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

### 17.7 Roof selection

There are two roof systems in the Java renderer:

- `House` uses continuous-side neighbor inspection to select roof side, corner, opposite-corner, or isolated pieces.
- `WoodenHouse` explicitly emits roof-corner and roof-straight semantics from its top-level generator.

For the web port, normalize both to a top-level roof mask. For each roof cell, inspect four horizontal neighbors with the same structure/roof region:

```ts
mask = (north ? 1 : 0) | (east ? 2 : 0) | (south ? 4 : 0) | (west ? 8 : 0);
```

Map masks to straight, inner/outer corner, end-cap, or center coverage. For exact legacy visuals, reproduce `RenderedContinuousSide` selection using the original standing-engine neighbor logic. For an initial faithful-enough implementation, explicit `WoodenHouse` roof pieces plus a flat hidden cap are sufficient, provided interiors cannot see the sky through gaps.

### 17.8 Streets, yards, plazas, and terrain seams

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

### 17.9 Prop distribution and visual variety

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

### 17.10 Materials

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

### 17.11 Batching into GPU meshes

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

### 17.12 Interior visibility

A city full of complete interiors can overdraw heavily. Track which structure contains the camera.

- Outside: render exterior faces and roofs; omit most interior furniture/ceilings.
- Inside one structure: render its interior floors, walls, stairs, and props; hide or fade roof cells above the camera region.
- Maze/cave: render the local connected/visible chunk plus a small margin; use distance fog and portal/room culling where practical.

Start with layer visibility rather than complex occlusion portals. Each emitted instance should carry `visualLayer: exterior | interior | both`.

### 17.13 Lighting, environment, and audio cues

Use one global directional light and hemisphere/ambient contribution outdoors. Indoors:

- reduce sky/hemisphere intensity;
- allow local point lights only at authored or hashed fixtures;
- switch ambient/music profiles from semantic environment state, not mesh proximity;
- keep maze and cave fog/color profiles separate;
- prevent every window/torch from creating a real shadowed light.

The original semantic cubes carry `internalCube` and `internalLight`. Preserve equivalent flags in the semantic volume and let the render environment respond to them.

### 17.14 Level of detail

Use three visual tiers:

| Range | Buildings | Ground/props |
|---|---|---|
| near | individual wall/window/door/roof meshes, interiors | detailed streets, furniture, storage props |
| medium | exterior instanced pieces, no interiors | simplified ground, major props only |
| far/map | one box, roof silhouette, or baked district cluster | terrain tint and town marker |

The procedural generator should run once; LOD changes only the visual lowering of the same `StructureSpec`. A far building must not change its collision or footprint.

For far city clusters, generate a small number of box/roof meshes from structure bounds rather than loading every OBJ. When a chunk approaches, atomically replace the cluster with detailed batches.

### 17.15 Visual implementation modules

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

### 17.16 Visual delivery order

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

### 17.17 Visual acceptance tests

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

## 18. Dynamic streaming from a static host

Yes, this can be streamed progressively without an application server. For the seed-0 release, the recommended design is now **offline generation**: a build-time compiler evaluates terrain, settlements, buildings, mazes, caves, collision, navigation, and visual-instance records. The static host serves immutable regional JSON scene descriptions and shared assets. The browser only selects, fetches, parses, displays, and evicts the active working set, then stores player changes locally. Procedural browser workers are not required for the first implementation.

The existing port already provides a strong base:

- `WorldStream` uses 32 × 32 world-unit chunks.
- `CHUNK_RADIUS = 2` maintains a 5 × 5 grid, so only 25 surface slots are resident.
- Slots are recycled through a toroidal index rather than accumulated.
- `WorldView` creates a fixed pool of terrain and vegetation objects, then rewrites their buffers as slots move.
- Walking within one chunk creates no scene objects and triggers no chunk regeneration.

The city/cave implementation should extend this bounded system, not introduce an independent unbounded cache.

### 18.1 Static-host architecture

```text
Static host/CDN
  bootstrap manifest + frozen world index
  shared meshes/material textures
  immutable regional/chunk scene JSON
             |
             v
Browser main thread
  stream coordinator -> active 5 × 5 slots -> Three.js scene
             |
             v
Browser persistence
  HTTP cache / optional service worker
  optional IndexedDB regional cache
  IndexedDB or localStorage save-state deltas
```

No request needs dynamic server computation. A plain GitHub Pages-style host is sufficient if it provides correct MIME types and caching headers.

### 18.2 What is downloaded versus generated

Use a hybrid division:

| Content | Delivery strategy | Reason |
|---|---|---|
| world dimensions, seed, generator version | bootstrap manifest | required before play |
| coarse geography masks and settlement index | one compact startup file | small and queried constantly |
| terrain heights | baked regional data | removes runtime procedural work |
| district persistent inputs | bootstrap spatial index | stable IDs, map/search, and debugging |
| building/maze semantic geometry | baked regional data | no runtime generator required |
| natural cave occupancy | baked horizontal/vertical regional bands | compact flags remain practical at this world size |
| OBJ/glTF meshes and textures | immutable shared assets | reused across every chunk |
| scene description | authoritative baked regional JSON | inspectable, tool-friendly compiler output |
| player changes | local save deltas | a static host cannot accept writes |

For the bundled 1,600 × 1,600 seed-0 world, district inputs are small enough to ship in one indexed file. This avoids hundreds of tiny HTTP requests. If later worlds become much larger, split only the district index into coarse regions, such as 10 × 10 render chunks per file.

#### 18.2.1 Per-location client budget

The total offline-generated build size is not the amount that should be loaded for one location. This world has 50 × 50 = 2,500 surface chunks. The active 5 × 5 grid contains 25 chunks, exactly 1% of the world. Even a 7 × 7 predictive set is only 49 chunks, or about 2%.

If the compiled JSON world cache is 15–30 MB after Brotli/gzip transfer compression and content were evenly distributed:

| Working set | Fraction of world | Average compressed world data |
|---|---:|---:|
| one 32 × 32 chunk | 0.04% | 6–12 KB |
| active 5 × 5 set | 1% | 150–300 KB |
| predictive 7 × 7 set | 1.96% | 294–588 KB |
| five new chunks after crossing one boundary | 0.2% | 30–60 KB |

Content is not evenly distributed. Empty terrain is much smaller than a town, dungeon, or cave region. Use these practical budgets:

| Situation | New world-data transfer target | Notes |
|---|---:|---|
| wilderness location | 100–400 KB | terrain, flora, collision, nearby low LOD |
| ordinary town | 300 KB–1.5 MB | structures, streets, collision, instance records |
| dungeon or cave entrance | 500 KB–2 MB | exterior plus entrance/interior band |
| dense dungeon/cave interior | 1–3 MB | local vertical bands and detailed semantics |
| ordinary one-chunk movement | 30–150 KB average | only the entering five-chunk column changes |
| dense one-chunk movement | 200 KB–1 MB | worst local content spike, prefetched before crossing |

These targets apply to compressed network transfer, not pretty-printed or parsed JSON size. Repeated node keys and `source` paths should compress strongly, but the compiler's size report must show raw JSON, Brotli, and gzip totals; if the compressed JSON build exceeds the estimate, adjust chunk granularity or remove redundant fields before considering a binary format.

These numbers exclude shared visual assets. Shared meshes and textures are downloaded once, cached by the browser, and reused across all locations:

- bootstrap terrain/fallback assets: roughly 0.5–1.5 MB target;
- common town/building asset pack: roughly 1–4 MB target;
- maze asset pack on first dungeon visit: roughly 0.5–2 MB target;
- cave asset pack on first cave visit: roughly 0.5–2 MB target.

The current repository's relevant building OBJ/MTL source is about 1.2 MB and the entire browser-ready `low_png` texture directory is about 4.4 MB, so these asset-pack targets are realistic. Assets already in HTTP cache add no transfer on later visits.

Consequently, a first wilderness load should aim for approximately 1–3 MB after the application shell. A first town/dungeon visit may add 2–6 MB of shared assets plus less than roughly 1–3 MB of location data. Continued exploration should normally transfer tens to hundreds of kilobytes per chunk crossing, not the full 15–30 MB world cache.

Memory is different from compressed transfer size. A reasonable active-content budget, excluding the renderer/application itself, is:

| Resident category | Target |
|---|---:|
| normalized terrain/semantic/collision data | 2–10 MB |
| active instance and merged-mesh buffers | 5–20 MB |
| shared geometry/material/texture resources | 10–40 MB, depending on texture resolution |
| normalized but inactive regional payloads | 0–10 MB under an LRU cap |

Do not keep both raw parsed JSON trees and normalized runtime structures indefinitely. After validation and normalization, retain only what the editor/debug mode or active runtime needs; the HTTP cache retains the source document. Active objects, typed arrays, and GPU buffers should remain bounded by the current and predictive sets.

To achieve these numbers, do not ship the 15–30 MB output as one mandatory startup file. Emit independently fetchable chunk scenes and lightweight 5 × 5-region composition scenes (160 × 160 world units) that reference those chunks. The game fetches only desired chunks; the region scene is a convenient editor/inspection entry point and prefetch list. A 5 × 5 chunk set averages 150–300 KB for a 15–30 MB world. The active grid overlaps one such set when centered and at most four when straddling both regional axes, so the average active transfer remains about 150 KB–1.2 MB before density skew.

Keep only two to six normalized regions in an in-memory LRU. Browser HTTP caching may accumulate all visited immutable regions on disk without increasing active RAM. Prefetch the next region based on heading before the player reaches its boundary.

### 18.3 Proposed static file layout

```text
worlds/
  seed0/
    v1/
      manifest.json
      geography.json
      district-index.json
      towns.json
      chunks/
        x000_z000.scene.json
        x001_z000.scene.json
        meshes/
          x000_z000-terrain.glb
      regions/
        r000_000.scene.json
        r001_000.scene.json
assets/
  city-v1/
    catalog.json
    prefabs/
      wooden-house.json
      dungeon-kit.json
      cave-kit.json
    meshes/
      wall.glb
      roof.glb
    textures/
    materials/
      timber.json
```

`manifest.json` should contain:

```ts
interface WorldManifest {
  formatVersion: number;
  worldId: string;
  seed: number;
  generatorVersion: string;       // e.g. "legacy-v1"
  assetPackVersion: string;       // e.g. content hash
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  chunkSize: 32;
  wrapX: boolean;
  wrapZ: boolean;
  files: {
    geography: FileDescriptor;
    districts: FileDescriptor;
    towns?: FileDescriptor;
  };
  chunkPattern: string;
  regionPattern: string;
}

interface FileDescriptor {
  url: string;
  byteLength: number;
  sha256?: string;
  compression?: "none" | "gzip" | "br";
}
```

Use content-hashed asset filenames or versioned directories. The host can cache them indefinitely with `Cache-Control: public, max-age=31536000, immutable`. Keep only a tiny top-level pointer/manifest on short caching so a deployment can select a new version atomically.

Avoid depending on HTTP range requests for core gameplay. Static hosts and intermediaries vary in range support. Prefer independently fetchable region JSON files. Serve JSON with Brotli or gzip `Content-Encoding`; compression is a transport detail and the fetched representation remains ordinary JSON.

#### 18.3.1 Lewcid/Three.js editor scene contract

The canonical streamed visual scene is the existing `lewcid_object` JSON format used by [`three_js_editor_small`](https://github.com/leweyg/three_js_editor_small). Its loader in [`editor/js/FolderUtils.js`](https://github.com/leweyg/three_js_editor_small/blob/main/editor/js/FolderUtils.js) recursively builds `THREE.Group` objects, applies array transforms, preserves `userData`, and resolves each relative `source` by extension. Use that format directly rather than introducing a parallel scene dialect.

A compiled chunk should look like this:

```json
{
  "name": "seed0_x012_z019",
  "userData": {
    "jcrpg": {
      "schemaVersion": 1,
      "worldId": "seed0-v1",
      "chunk": [12, 19],
      "bounds": [384, 0, 608, 416, 32, 640],
      "stableId": "chunk:12:19",
      "collision": "./x012_z019.collision.json",
      "navigation": "./x012_z019.navigation.json",
      "portals": [],
      "requiredSources": [
        "../../../assets/city-v1/prefabs/wooden-house.json"
      ]
    }
  },
  "children": [
    {
      "name": "terrain",
      "source": "./meshes/x012_z019-terrain.glb",
      "userData": { "jcrpg": { "kind": "terrain" } }
    },
    {
      "name": "house_town03_district02_007",
      "position": [11, 0, 18],
      "rotation_degrees": [0, 90, 0],
      "source": "../../../assets/city-v1/prefabs/wooden-house.json",
      "userData": {
        "jcrpg": {
          "kind": "building",
          "stableId": "town03:district02:building007",
          "portal": "portal:town03:district02:building007:front"
        }
      }
    }
  ],
  "metadata": {
    "version": 0.2,
    "type": "lewcid_object",
    "camera": {
      "position": [16, 24, 40],
      "rotation": [-0.5, 0, 0]
    }
  }
}
```

Compatibility rules:

- preserve `metadata.version: 0.2` and `metadata.type: "lewcid_object"` exactly for the current editor;
- use only the loader's established visual keys at scene-node level: `name`, `position`, `rotation`, `rotation_degrees`, `scale`, `source`, `children`, and `userData`;
- place all game-specific data below `userData.jcrpg`; arbitrary `userData` survives the editor's import/export path, while changing top-level semantics risks incompatibility;
- resolve every `source` relative to the JSON file containing it, matching `FolderUtils.js`;
- allow `source` to point recursively to another `lewcid_object` JSON prefab or to an editor-supported mesh/image resource; prefer `.glb`/`.gltf` for new assets and retain `.obj`/`.mtl` for existing assets until converted;
- keep texture/material references inside glTF/GLB or OBJ/MTL assets. Standalone material JSON may be catalog data, but should not be required for basic editor preview unless the editor loader gains explicit support;
- use the same relative URL for repeated assets. The game runtime canonicalizes resolved URLs and caches the loaded source even though the editor's current JSON path avoids its general asset cache;
- emit one standalone chunk scene for direct preview. Emit a region scene as a lightweight `lewcid_object` whose children use `source` to reference the 25 chunk scenes; do not duplicate their geometry or node arrays;
- give each compiled scene a useful default `metadata.camera`, so opening `editor/?file_path=.../x012_z019.scene.json` immediately frames the chunk.

The JSON scene is both the runtime transport and the editor artifact. Do not generate a separate opaque runtime representation as the authoritative file. The runtime may normalize parsed JSON into typed arrays, instancing tables, collision structures, and GPU buffers in memory, then discard the raw object tree.

### 18.4 Spatial ownership for structures crossing chunks

Buildings and dungeon shells can cross 32-unit render boundaries. Define ownership separately from visibility:

- A structure is owned by the chunk containing its origin/anchor.
- The owning chunk generates one canonical `StructureSpec` and semantic volume.
- A spatial index records every render chunk overlapped by its bounds.
- Each visible chunk emits only the visual/collision fragments intersecting that chunk plus a one-cell seam halo.
- Interaction and save IDs always reference the canonical structure ID, not the fragment.

```ts
interface ChunkStructureRef {
  structureId: string;
  ownerChunkKey: string;
  clippedBounds: Bounds3i;
}
```

This prevents duplicate houses when neighboring chunks independently inspect the same district. It also lets a structure remain logically loaded while one or more visual fragments are evicted.

Use half-open bounds `[min, max)` everywhere so a wall exactly on a boundary has one unambiguous owner.

### 18.5 Chunk coordinate normalization and world wrapping

The world wraps at its boundaries, but stream identities must be canonical. Distinguish:

- **logical chunk coordinate:** may be negative or beyond the world while describing the 5 × 5 neighborhood;
- **canonical content coordinate:** wrapped into `[0, chunksAcross)` for data lookup and generation;
- **render origin:** based on the logical coordinate so geometry appears continuously near the camera.

```ts
interface ChunkAddress {
  logicalX: number;
  logicalZ: number;
  canonicalX: number;
  canonicalZ: number;
  key: string; // world/version/canonicalX/canonicalZ/verticalBand
}
```

Never key network or generated-data caches by the logical coordinate. Otherwise walking across a wrapped edge creates duplicate cache entries for the same world content.

### 18.6 Chunk state machine

Replace the current synchronous fill step with an explicit asynchronous lifecycle:

```text
absent
  -> queued
  -> loading-inputs
  -> decoding
  -> cpu-ready
  -> gpu-building
  -> active
  -> retiring
  -> absent
```

Failures transition to `failed-retryable` or `failed-terminal`. Each request carries both a canonical key and a monotonically increasing slot revision.

```ts
interface ChunkJob {
  key: string;
  slotId: number;
  revision: number;
  priority: number;
  abort: AbortController;
  state: ChunkState;
}
```

When a slot is reassigned:

1. Abort its pending fetch if no other consumer needs it.
2. Cancel or disregard worker output for the old revision.
3. Keep the old visible group until the replacement reaches `gpu-ready`, if it is still useful as a temporary fringe.
4. Commit new buffers and visibility in one frame.

The revision check is mandatory. `AbortController` stops network work, but it cannot guarantee that already-started parse, normalization, or asset promises will not resolve after a slot has been reassigned.

### 18.7 Priority and predictive loading

Classify the 5 × 5 neighborhood into rings:

| Priority | Area | Required content |
|---|---|---|
| 0 critical | current chunk and imminent crossing edge | terrain, collision, structures, entrance portals |
| 1 visible | adjacent 3 × 3 | full exterior visuals and collision |
| 2 prefetch | outer 5 × 5 ring | CPU semantic data and low/medium LOD |
| 3 speculative | one chunk beyond movement direction | inputs/assets only when bandwidth is idle |

Within a ring, rank by:

```ts
priority = distanceCost
         + headingPenalty
         + missingCollisionPenalty
         + portalPenalty
         + staleWorkPenalty;
```

Favor the chunks ahead of the player's velocity or facing direction. If the player stops, gradually fill the lateral/backward fringe. Teleporting cancels speculative work and immediately schedules a new critical set.

Limit concurrent network requests and worker jobs separately. A useful mobile starting point is 4 fetches and 1–2 generation workers, adjusted from `navigator.hardwareConcurrency` and observed frame time.

### 18.8 Two-stage readiness

A chunk should become safe before it becomes beautiful:

1. **Gameplay-ready:** terrain height, collision, water restrictions, structure bounds, doors/portals, and navigation edges exist.
2. **Visual-ready:** detailed ground, buildings, props, interiors, textures, and LOD batches exist.

Allow movement into a new chunk only after gameplay-ready. Render temporary low-detail geometry until visual-ready. This prevents falling through terrain or entering an ungenerated building while avoiding visible pauses for textures and furniture.

At a critical boundary, choose one of these fallbacks:

- slow/stop movement for a fraction of a second at the safe edge;
- retain a low-detail collision proxy and terrain mesh;
- never allow the player to cross into truly absent collision data.

Do not use an indefinite loading screen for ordinary walking.

### 18.9 Scene JSON parse and normalization protocol

The offline compiler performs all CPU-heavy generation. Runtime loading is bounded work:

1. fetch and parse a chunk or region `lewcid_object` JSON document;
2. validate its schema version, world/chunk identity, bounds, transforms, stable IDs, relative source paths, and content hash from the manifest;
3. walk `children` and recursively resolve JSON prefab sources;
4. canonicalize source URLs and deduplicate mesh, material, texture, and prefab promises globally;
5. extract `userData.jcrpg` gameplay metadata and load referenced collision/navigation JSON;
6. normalize repeated visual nodes into per-asset instance tables and slot-local buffers;
7. activate collision first, then atomically attach the prepared visual group.

```ts
interface NormalizedChunk {
  key: string;
  schemaVersion: number;
  sceneRoot: LewcidObjectNode;
  instancesBySource: Map<string, Float32Array>;
  collision: CollisionData;
  navigation: NavigationData;
  portals: PortalData[];
  requiredSources: string[];
}
```

The loader should accept only JSON data and asset URLs—never executable callbacks, code strings, constructor names, or arbitrary module imports from world files. Treat `source` as data, restrict it to the deployed world/asset roots, reject path escape, and enforce recursion-depth/node-count limits.

Start with main-thread `response.json()`/`JSON.parse()` because the working-set files are intentionally small and no procedural loops remain. Measure parse, prefab resolution, normalization, and slot-build duration separately. Add a parsing/normalization Web Worker only if measurements repeatedly exceed the frame budget; the JSON scene contract does not change.

### 18.10 Shared asset dependency loading

Do not load every building asset before play. Divide the asset pack:

- bootstrap: terrain ground, fallback wall/roof/door, placeholder material;
- common city: wooden-house parts, street/foundation, steps;
- biome/residence: hut, igloo, sand igloo, storage props;
- dungeon: maze wall, floor, columns, door, chest;
- cave: cave wall, rock, entrance, mushroom;
- interior: furniture and interactive variants.

Each normalized scene lists its resolved `requiredSources`. The asset manager deduplicates promises by canonical URL:

```ts
getAsset(id): Promise<LoadedAsset> {
  return cache.get(id) ?? cache.set(id, beginLoad(id));
}
```

Asset loading is global, while instances and chunk render batches are local. Evict chunk batches freely; keep commonly reused source geometries/materials resident. Rare asset packs can be reference-counted and retired only under memory pressure.

Never dispose a shared geometry or texture when unloading one chunk.

### 18.11 Slot pools and atomic activation

Retain the current fixed 25 terrain slots. Add parallel bounded pools:

```ts
interface RenderSlot {
  terrain: TerrainSlot;
  exteriorGroup: THREE.Group;
  interiorGroup: THREE.Group;
  collisionHandle: number | null;
  navigationHandle: number | null;
  chunkKey: string | null;
  revision: number;
}
```

For static repeated pieces, there are two reasonable batching models:

1. One set of `InstancedMesh` objects per slot. Refill instance matrices when the slot is recycled. This matches the existing terrain/vegetation design and makes eviction trivial.
2. One set per asset across all active chunks. This lowers draw calls further but makes chunk removal and matrix compaction more complicated.

Use per-slot batches first. The active set is only 25 chunks, and operational simplicity is more valuable than eliminating the last few draw calls.

Build replacement CPU arrays and instance matrices off-scene. Update the slot, bounding volumes, collision handle, and `chunkKey` together, then set it visible. A player should never see a half-old/half-new slot.

### 18.12 Vertical streaming for caves and buildings

Surface chunks are two-dimensional, but caves, dungeons, and multi-level buildings need vertical bands. Do not turn the entire surface grid into a dense 3D allocation.

Use:

```ts
type VerticalBand = "surface" | `interior:${string}` | `cave:${number}`;
```

- Surface exterior content remains in the ordinary 5 × 5 stream.
- Entering a building activates its small structure-local semantic volume and interior visuals.
- Entering a constructed dungeon activates the dungeon structure volume, still anchored to its owning surface chunks.
- Natural cave content is generated in vertical slabs such as 8 cells high and only near the active cave level/component.

Entering an interior is a portal transition. Pin the entrance's surface chunk plus nearby exterior chunks while the player is close enough to exit; reduce distant surface LOD rather than retaining every detailed exterior batch.

### 18.13 Memory ownership and eviction

Track resources by ownership class:

| Resource | Owner | Eviction behavior |
|---|---|---|
| source OBJ geometry/material/texture | global asset manager | retain or ref-count |
| normalized semantic/collision data | canonical chunk cache | LRU or slot lifetime |
| render batches/instance buffers | render slot | overwrite/dispose on reassignment |
| active interaction state | save-state store | never discarded with render chunk |
| parsed/normalized scene cache | IndexedDB, optional | size-bounded persistent LRU |

On chunk retirement:

1. detach/hide the chunk group;
2. unregister collision and navigation handles;
3. persist dirty gameplay deltas;
4. return or overwrite slot-owned buffers;
5. release chunk-local merged geometry;
6. decrement rare-asset references;
7. retain global source assets.

Prefer overwriting fixed buffers to allocating replacements. If a structure exceeds a slot's capacity, grow that buffer geometrically and retain the larger capacity for later reuse.

### 18.14 Browser caches and offline behavior

Use three cache layers:

1. Normal HTTP cache for immutable static files.
2. Optional service worker for a controlled offline shell and recently used world files.
3. IndexedDB for optional parsed/normalized chunk caches and player save deltas. The immutable source of truth remains the JSON fetched through the HTTP cache.

IndexedDB generated-cache keys must include:

```text
worldId + worldFormatVersion + generatorVersion + assetPackVersion
+ canonicalChunkX + canonicalChunkZ + verticalBand + detailTier
```

A generator update must not reuse legacy cached output accidentally. Validate a small checksum/header before decoding a cached record.

Service-worker deployment rule: version the worker and cache names, populate a new cache, then switch versions atomically. Do not delete the old cache until no controlled page depends on it.

Offline support should degrade predictably:

- already cached regions remain playable;
- uncached boundaries present a clear offline boundary, not missing collision;
- local saves continue working;
- reconnection resumes queued static fetches.

### 18.15 Save state on a static host

The host cannot store mutable saves, so persist only deltas locally:

```ts
interface SaveGame {
  saveVersion: number;
  worldId: string;
  generatorVersion: string;
  player: PlayerState;
  time: SimTimeState;
  changedDoors: Record<string, DoorState>;
  openedContainers: Record<string, ContainerState>;
  removedOrMovedObjects: Record<string, ObjectDelta>;
  districtSimulationDeltas: Record<string, DistrictDelta>;
}
```

Do not save resident chunk meshes or generated terrain. On load, reconstruct base content from static inputs and overlay deltas by stable structure/object ID. Evicting a chunk therefore cannot lose gameplay changes.

Export/import of the save as JSON can provide portability without a backend. Cloud sync can be added later as an optional service without changing the streaming model.

### 18.16 Static payload formats

All manifests, indexes, chunk/region scenes, prefabs, collision, navigation, portals, and save deltas are ordinary JSON. The visual documents use the editor-compatible `lewcid_object` structure from Section 18.3.1. Gameplay sidecars use small versioned JSON Schemas and are linked from `userData.jcrpg`.

Meshes and textures retain their appropriate asset formats: prefer glTF/GLB for new mesh assets, preserve OBJ/MTL while reusing the repository's existing content, and use PNG/JPEG/WebP/KTX2 as supported by the target renderer. “Pure JSON scene description” means that scene composition and game semantics are JSON; it does not require base64-embedding mesh or image bytes into JSON.

Use readable property names and deterministic key/order emission. Repeated keys and source paths compress well under Brotli/gzip, so measure compressed transfer before considering compact aliases. Do not replace the canonical JSON with a binary scene format for the first implementation. If a future measured bottleneck warrants a packed cache, it must be a derived, disposable optimization with a versioned JSON equivalent and must not become the only previewable artifact.

Each manifest descriptor records uncompressed byte length, content hash, and optional expected content encoding. Validate documents with JSON Schema during compilation and in development builds. Production runtime validation may use a faster hand-written validator for the same contract.

### 18.17 Failure and fallback policy

- Missing detailed mesh: use the bootstrap wall/box placeholder with correct collision.
- Missing texture: use a material color derived from semantic type.
- Baked region missing: use a separately packaged low-detail safety region if available; otherwise keep the previous fringe/placeholder and block unsafe traversal.
- Offline compiler error: fail the build with the region, source record, generator stage, and deterministic input digest. Never publish a partially generated world manifest.
- Fetch timeout: retry with capped exponential backoff only while the chunk remains relevant.
- Rapid direction reversal: reprioritize existing jobs rather than restarting matching canonical keys.
- Teleport: cancel old speculative jobs, retain globally shared asset promises, and build the destination critical chunk first.

Errors should name the world version, canonical chunk, stage, and missing asset/file. A static-host 404 is often a manifest/path/version error and should not be retried forever.

### 18.18 Performance budgets and adaptation

Initial mobile targets:

- critical gameplay chunk ready within one short movement interval after inputs are available;
- no synchronous parse, normalization, or slot-build task over roughly 2–4 ms on the main thread;
- 25 surface slots maximum, with interiors/caves separately bounded;
- bounded fetch/parse/normalization queues;
- no new OBJ fetch during ordinary movement after its asset pack has loaded;
- no scene-object creation while staying inside a chunk;
- no increasing visited-world memory curve;
- no disposal/recreation of global materials and textures during movement.

Monitor:

- moving average frame time;
- fetch/parse/normalization queue latency;
- network throughput;
- active triangle/instance counts;
- GPU texture estimates;
- chunk-cache hit rate.

Full near-field visual fidelity is the baseline. GPU budgets are diagnostic guardrails, not permission to remove buildings, maze pieces, props, or interiors preemptively. First optimize asset reuse, instancing, material sharing, face culling, buffer updates, and shadow configuration. Only introduce visible reductions after profiling a representative dense town, dungeon, and cave on target iPhone hardware demonstrates a real limit. If reduction is required, lower outer-ring LOD, distant props, and distant shadow casting before changing near-field geometry. Gameplay safety and collision fidelity are never adaptive.

### 18.19 Streaming coordinator sketch

```ts
class StreamCoordinator {
  updatePlayer(position: Vec3, velocity: Vec3) {
    const desired = this.computeDesiredSet(position, velocity);
    this.cancelIrrelevantJobs(desired);
    this.pinCriticalCollision(desired);
    this.enqueueMissing(desired);
    this.assignReadyChunksToSlots(desired);
    this.retireUndesiredSlots(desired);
  }

  async runJob(job: ChunkJob) {
    const inputs = await this.inputStore.get(job.key, job.abort.signal);
    if (!this.isCurrent(job)) return;

    const chunk = await this.sceneLoader.normalizeChunk(inputs, job.key);
    if (!this.isCurrent(job)) return;

    await this.assets.require(chunk.requiredSources, job.abort.signal);
    if (!this.isCurrent(job)) return;

    const prepared = this.renderer.prepareSlotUpdate(chunk);
    if (!this.isCurrent(job)) return;

    this.commitAtomically(job, prepared);
  }
}
```

`updatePlayer()` should run when the player changes chunk, teleports, enters/exits a portal, or materially changes heading near a boundary—not every rendered frame.

### 18.20 Streaming implementation sequence

1. Build the offline world compiler and its deterministic golden tests.
2. Emit versioned `lewcid_object` chunk scenes, lightweight region composition scenes, gameplay JSON sidecars, and manifests.
3. Refactor current synchronous `WorldStream._fill()` behind an async coordinator while retaining the same 25 slots.
4. Add canonical/logical chunk addresses and revision-protected slot commits.
5. Add scene JSON validation/parsing, recursive `source` resolution, normalization, and a two-to-six-region memory LRU.
6. Add two-stage gameplay/visual readiness and a boundary safety rule.
7. Load the compact district spatial index at startup.
8. Add asset dependency manifests and lazy pack loading.
9. Add per-slot building/ground/prop batches from baked instance records.
10. Add structure-fragment ownership across chunk seams.
11. Add portal-pinned building/dungeon interiors.
12. Add vertically banded baked natural-cave streaming.
13. Add optional IndexedDB regional caching and a service worker only after the basic bounded lifecycle is proven.

### 18.21 Streaming acceptance tests

- walking indefinitely keeps exactly 25 surface slots and bounded memory;
- crossing a chunk seam never reveals missing terrain or collision;
- structures crossing seams appear once, align perfectly, and share one interaction ID;
- rapidly crossing back and forth cannot commit stale fetch/parse/normalization output into a reassigned slot;
- teleporting discards irrelevant work and makes the destination safe first;
- world wrapping reuses canonical cache entries while rendering at continuous logical positions;
- entering/exiting buildings, dungeons, and caves pins/unpins the correct exterior/interior sets;
- dirty doors/chests remain changed after their render chunk is evicted and reloaded;
- shared meshes/textures survive chunk eviction without leaks or accidental disposal;
- a missing detailed asset falls back visibly but preserves collision;
- a network failure never permits movement into absent collision;
- repeat visits use HTTP/IndexedDB caches and do not refetch/reparse unnecessarily;
- deployment of a new compiler/asset version cannot mix incompatible cached chunks;
- the game remains playable from a plain static server with no API endpoints.

## 19. Implementation handoff for parallel agents

This section freezes the cross-cutting decisions that must be shared before parallel work begins. Agents may refine internals behind these boundaries, but should not independently invent alternate coordinates, IDs, JSON scene semantics, or lifecycle rules.

### 19.1 Locked baseline decisions

1. **Compile the procedural world offline.** Seed 0 version 1 ships baked region data. The browser does not need Java, a procedural-generation worker, or a server API.
2. **Bake simple, editor-compatible JSON scenes, not duplicated presentation assets.** Chunk files use `lewcid_object` JSON and link reusable JSON prefabs, meshes, textures, and materials through relative `source` paths. Gameplay metadata lives under `userData.jcrpg`; shared assets remain separate.
3. **Keep the existing spatial cadence.** Surface chunks are 32 world units; the active neighborhood is 5 × 5 chunks. Package 5 × 5 chunks into a region unless measurements justify a different packaging boundary.
4. **Target a static host.** All world and asset URLs are immutable and versioned. Fetch, HTTP caching, optional service-worker caching, and optional IndexedDB are sufficient.
5. **Separate immutable world facts from mutable saves.** The build provides stable IDs and default state. The save stores only local deltas such as opened doors, looted containers, defeated encounters, and discovered locations.
6. **Preserve full near-field visual fidelity as the baseline.** GPU budgets are diagnostic guardrails. First optimize mesh reuse, instancing, material count, hidden-face removal, buffer reuse, and shadows. Reduce visible detail only if profiling a dense town, dungeon, and cave on representative mobile hardware shows a real limit.
7. **Never make collision adaptive.** Geometry LOD, distant props, lighting, and shadows may scale; collision, portals, entity IDs, and gameplay semantics must not.

### 19.2 Recommended build/runtime split

Use a two-stage offline toolchain:

- extend `scripts/export_frozen_world.py` to read and normalize XStream save data, resolve object references, and export the authoritative high-level world/district inputs;
- add a Node ESM compiler such as `scripts/compile_world.mjs` to run rendering-independent ports of the legacy generators and emit manifests, indexes, `lewcid_object` chunk/region scenes, JSON gameplay sidecars, asset dependencies, and a validation report;
- place pure generator logic in a rendering-independent module boundary such as `jCRPG-engine/js/procedural/` so it can be unit-tested against Java even though the browser does not call it in the first release;
- share JSON Schemas and generated TypeScript/JSDoc declarations between the compiler, editor-preview tests, and runtime loader, but do not make the runtime import compiler-only code.

The compiler must fail the build on unresolved required references, duplicate stable IDs, invalid portals, collision/nav disagreement, out-of-range coordinates, or nondeterministic output. A packaged low-detail safety region is acceptable as a network-error fallback; silently substituting newly generated content is not.

### 19.3 Freeze these interfaces first

Before broad implementation, merge one small “format and fixture” change containing:

- `WorldManifest` fields, format version, generator version, seed, world bounds, wrap rules, and content hashes;
- canonical chunk, region, structure, level, and portal addressing;
- the exact `lewcid_object` node subset, `userData.jcrpg` schemas, relative-`source` rules, content hashes, and HTTP compression policy;
- stable ID derivation for towns, districts, buildings, levels, doors, containers, encounters, and portals;
- semantic cell and face flags, collision categories, navigation flags, mesh/material/asset IDs, and transform encoding;
- the save-delta schema and compatibility policy;
- one deliberately tiny fixture chunk and composition region with canonical JSON snapshots, byte length, content hashes, seam neighbors, a building entrance, and a vertical portal; both must open through `three_js_editor_small/editor/?file_path=...`.

No downstream agent should copy these definitions by hand. Generate or import them from a single source of truth. Format changes after this gate require an explicit version bump and fixture update.

### 19.4 Parallel work packages

| Package | Primary ownership | Required output | Must not independently change |
|---|---|---|---|
| A. Legacy extraction and golden fixtures | Java behavior, saves, deterministic snapshots | normalized source fixtures; Java outputs for districts, houses, dungeon grids, cave slices | JSON scene schema; renderer contracts |
| B. Format and compiler shell | schemas, IDs, scene writer, manifest, validation | deterministic compiler CLI; canonical JSON writer/reader; content hashes; reports | procedural behavior without a golden fixture |
| C. Procedural parity | grown/default/big-block infrastructure, buildings, maze, cave | pure generator modules; parity tests; compiler adapters | runtime streaming or rendering |
| D. Asset calibration | OBJ/MTL/texture inventory, subtype mapping, transforms | asset manifest; calibration scene; bounds/pivot/orientation tests; pack dependencies | world coordinates or semantic flags |
| E. Runtime streaming | fetch, parse, normalize, priorities, slot revisions, caches | manifest loader; `lewcid_object`/source resolver; 5 × 5 coordinator; LRU; abort/stale guards | procedural rules; save meaning |
| F. Gameplay and visuals | instancing, seams, collision, nav, portals, saves | city/building/dungeon/cave rendering; interaction binding; delta overlay | JSON scene contract or stable ID derivation |
| G. Integration and performance | static-host deployment, fixtures, profiling | end-to-end tests; visual snapshots; network/memory/GPU measurements; release report | silent fidelity reductions |

Assign files so that only one package owns a shared file at a time. In particular, the manifest/JSON Schema module, canonical scene writer/loader contract, asset catalog, and streaming coordinator should each have a clear owner. Other packages should contribute fixtures or adapters rather than editing those files concurrently.

### 19.5 Dependency and merge gates

1. **Gate 0 — format fixture:** the tiny fixture serializes canonically, parses, hashes, renders as debug geometry, and opens unmodified in `three_js_editor_small`. Stable ID and coordinate tests pass in Java-derived and JavaScript fixtures.
2. **Gate 1 — deterministic compiler:** the same inputs produce byte-identical regions on repeated builds. At least one district, house, dungeon, and cave slice matches golden semantics.
3. **Gate 2 — bounded streamer:** a plain static server streams the fixture through the 25 reusable slots, including cancellation, stale-result rejection, wrapping, and eviction.
4. **Gate 3 — calibrated visuals:** shared assets align with debug collision and neighboring cells; buildings cross chunk seams without duplicate geometry or interactions.
5. **Gate 4 — explorable spaces:** town exteriors, building interiors, dungeon levels, and natural caves support portals, collision, navigation, interaction IDs, and save deltas.
6. **Gate 5 — release profiling:** dense representative scenes meet network, memory, frame-time, and cache targets. Any fidelity reduction is based on captures from this gate and starts with distant/optional effects.

Each work package should land as small commits with its tests and fixtures. Do not combine format invention, parity changes, renderer changes, and optimization in one integration change; that makes visual or semantic regressions difficult to locate.

### 19.6 First spikes to remove uncertainty

Complete these before scaling the implementation across the whole world:

1. reconstruct one real saved population/district through the Python normalizer and compare it with the Java load-time reconstruction;
2. emit one exact dungeon byte grid from Java and reproduce it byte-for-byte in the pure JavaScript generator;
3. export a cave entrance plus adjacent vertical slices and verify entrance coordinates, solid/empty polarity, collision, and the exterior portal;
4. build one asset-calibration scene containing a house, roof edges, wall variants, door, stairs, street, and collision/debug overlays;
5. compile and stream one 5 × 5 region from a plain static host, open a constituent chunk and the region composition in `three_js_editor_small`, then record compressed transfer size, parsed/normalized size, parse/normalization time, upload time, draw calls, and peak GPU memory.

These spikes directly address the highest-risk areas: XStream reference reconstruction, Java integer/random/remainder parity, cave coordinate conventions, model pivots/orientations, and realistic browser costs.

### 19.7 Definition of done for the first complete vertical slice

- one command produces versioned, byte-reproducible build artifacts and a validation report;
- `python3 -m http.server` (or an equivalent static server) is sufficient to run the slice;
- the browser performs no procedural world generation and requires no worker for correctness;
- the player can approach a town, see streets and individually assembled buildings, enter a building, enter a procedural dungeon, and enter a natural cave;
- collision, navigation, portals, roofs/interiors, and interaction state remain correct across chunk and level boundaries;
- exactly 25 surface slots remain active, while normalized region and asset caches remain within configured bounds;
- stale fetch/parse/normalization results cannot update a reassigned slot;
- shared meshes/textures are reused and region eviction does not dispose assets still referenced elsewhere;
- save deltas survive eviction and reload without copying unchanged baked state;
- the expected initial-location and movement transfer budgets in Section 18.2.1 are measured in automated or repeatable tests;
- representative desktop and mobile traces report CPU frame time, GPU frame time where available, draw calls, triangles, texture memory, buffer memory, and worst navigation/collision update time;
- full near-field detail remains enabled unless those traces demonstrate a limit, in which case the first fallback affects outer-ring detail, distant props, or shadows—not gameplay geometry.

### 19.8 Kickoff checklist

- merge the JSON scene/schema fixture contract before assigning dependent packages;
- give every agent the relevant legacy source files, this document, its owned file set, expected fixtures, and its gate acceptance tests;
- require agents to document every intentional deviation from Java behavior;
- require deterministic tests to specify seed, coordinates, input fixture version, and expected hash;
- keep generated build output out of hand-edited source directories;
- record compiler time and final compressed sizes, but optimize only after the vertical slice proves correctness;
- designate one integration owner to resolve cross-package changes and run the end-to-end gate after each merge.

At this point the plan is implementation-ready. The only decision that should precede agent kickoff is the exact JSON scene/schema owner; the implementation itself can establish the measured GPU ceiling during Gate 5.

## 20. Source map

- `world/place/economic/Population.java`: transient generated lists and load-time reconstruction.
- `world/place/economic/AbstractInfrastructure.java`: shared generation lifecycle, sizing, terrain placement, and instantiation.
- `world/place/economic/infrastructure/GrownInfrastructure.java`: ordinary district growth walk.
- `world/place/economic/infrastructure/DefaultInfrastructure.java`: central-street and shuffled-block layout.
- `world/place/economic/infrastructure/BigBlockInfrastructure.java`: one large dungeon residence.
- `world/place/economic/population/SimpleDistrict.java`: ordinary district selection and placement checkers.
- `world/place/economic/population/DungeonDistrict.java`: dungeon district selection and placement checkers.
- `world/place/economic/residence/House.java`: basic procedural building template.
- `world/place/economic/residence/WoodenHouse.java`: roofed building template.
- `world/place/economic/residence/dungeon/MazeTool.java`: recursive-division byte grid.
- `world/place/economic/residence/dungeon/SimpleDungeonPart.java`: maze shell, cube mapping, and storage positions.
- `world/place/geography/sub/Cave.java`: natural cave occupancy and entrance logic.
- `world/place/economic/checker/CaveChecker.java`: shallow-cave infrastructure exclusion.
- `world/place/economic/checker/WaterChecker.java`: water infrastructure exclusion.
- `world/place/economic/Town.java`: district grouping and town center.
- `threed/scene/config/SideTypeModels.java`: authoritative semantic-subtype to model/material mapping.
- `threed/scene/side/RenderedContinuousSide.java`: neighbor-dependent wall/roof piece selection.
- `threed/scene/side/RenderedTopSide.java`: top/roof edge selection.
- `threed/standing/J3DStandingEngine.java`: original neighbor inspection and rendered-side emission.
- `threed/J3DCore.java`: cube scale, face order, directions, and rotations.
- `js/obj_mtl_loader.js`: existing browser OBJ/MTL and PNG texture loading path.
- `js/world_stream.js`: current fixed 5 × 5, 32-unit chunk cache and deterministic surface/flora generation.
- `js/world_view.js`: current reusable terrain/vegetation slot buffers and revision-based scene synchronization.
- `js/game_state.js`: exploration lifecycle and player-driven stream updates.
- [`three_js_editor_small/examples/models/json/space_scene.json`](https://github.com/leweyg/three_js_editor_small/blob/main/examples/models/json/space_scene.json): minimal `lewcid_object` scene example.
- [`three_js_editor_small/editor/js/FolderUtils.js`](https://github.com/leweyg/three_js_editor_small/blob/main/editor/js/FolderUtils.js): authoritative recursive JSON/source loader, transforms, `userData`, and exporter behavior.

Repository: <https://github.com/leweyg/jclassicrpg>
