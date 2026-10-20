# world_generation

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Deterministic reconstruction, Java behavior, semantic representations, and compatibility decisions. The browser uses `web-baked-v2`: one render unit per legacy cell, calibrated source models, and offline generation. Java hash and maze-byte parity is verified; complete infrastructure, house, and cave-cube parity is not certified. TypeScript interfaces below are design models, not claims that those filenames or field names are the shipped schema.

Implementation notes for re-creating the Java systems in a web runtime while retaining deterministic compatibility with the bundled seed-0 save.

## Executive model

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

## Persistence and deterministic reconstruction

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

## Recommended web data structures

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

## Determinism contract

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

## Settlement generation pipeline

### Input resolution

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

### Growth quantization

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

### GrownInfrastructure: ordinary districts

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

### DefaultInfrastructure

This alternate generator first emits a full-width central street. It then creates a deterministic shuffled sequence of block indices using `HashUtil.mixPer1000`, sticky runs, and occasional row leaps. Residences are placed into the first acceptable unoccupied blocks in that sequence.

Although seed-0 `SimpleDistrict` uses `GrownInfrastructure`, this implementation may still be needed for scenarios or future content. Port it after seed-0 parity unless repository-wide completeness is the goal.

### BigBlockInfrastructure: dungeon districts

This generator emits exactly one large residence:

```ts
spec.kind = "simple-dungeon";
spec.size = { x: districtBlockSize - 3, y: 3, z: districtBlockSize - 3 };
spec.relativeOrigin = { x: 3, y: 3, z: 3 };
```

The infrastructure system then chooses terrain-supported `origin.y`. The relative Y field is effectively not used by `AbstractInfrastructure.build()` for residences; preserve observed behavior rather than assuming it offsets the final origin.

## Terrain placement and block validation

`AbstractInfrastructure.getMinMaxHeight()` samples all surface points across a structure footprint. Residences use the midpoint between minimum and maximum surface height as their origin Y. Economic grounds may stretch vertically to cover the sampled range.

The original minimum-height calculation initializes and updates values in a slightly unconventional way. Write parity tests against real districts before simplifying it.

Water and cave validators produce one unavailable bit per 4 × 4 infrastructure block. A web implementation should expose this as a composable interface:

```ts
interface PlacementChecker {
  markUnavailable(ctx: DistrictGenerationContext, mask: Uint8Array): void;
}
```

Natural caves and constructed dungeons are distinct here: `CaveChecker` keeps ordinary structures and dungeon districts from being placed over shallow cave space; it does not convert a dungeon into a cave.

## Building geometry

### Common pattern

A residence is a fixed function of type, dimensions, ground level, and origin. The original classes construct a local cube dictionary and translate queries into local coordinates. This makes structure templates cacheable by a key such as:

```text
type + sizeX + sizeY + sizeZ + groundLevel
```

In the web port, cache immutable local `SemanticVolume` templates. Create lightweight placed instances containing an origin and ownership metadata.

### House

The basic house generator creates:

- perimeter walls on every level;

- windows periodically where the wall coordinate satisfies `% 3 == 2`;

- an exterior door at a fixed perimeter position;

- internal floors and ceilings;

- alternating stair positions between levels;

- special corner cells;

- a bookcase semantic side on one wall type.

The traversal model is face-based. A wall blocks crossing a cell face; the floor and ceiling affect vertical movement; stairs permit a vertical transition. Doors use a non-`NotPassable` subtype, so they are traversable even if rendered as geometry.

### WoodenHouse and variants

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

## Compatibility versus redesign decisions

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

## Browser adaptation

The implementation proceeded through these stages:

1. Extract all 208 districts, exact long IDs, templates, NPC overrides, towns and cave parameters; freeze JSON/semantic contract.
2. Implement pure deterministic infrastructure, building, dungeon and cave modules.
3. Compile independently fetchable static scenes, shared meshes and validation reports.
4. Integrate bounded asynchronous streaming, collision, portals and local save deltas.
5. Run regression, reproducibility, streaming, traversal and asset checks; document limits.

Compatibility policy: `web-baked-v1` is deliberately distinct from `legacy-v1`.
The existing web surface adapter approximates Java terrain and rivers. Until full
Java cube goldens pass, the resulting world must not claim exact Java save parity.
Legacy world coordinates remain one browser unit per cell; source two-unit models
are calibrated to that cell, and eye height scales accordingly. No world map or
saved coordinates are doubled.

A temporary JDK was downloaded into `/tmp` and used to run the original Java
hash and maze classes. All 24 hash vectors and 80 complete maze byte grids match.
Full Java infrastructure, house and cave cube parity is not yet certified.
