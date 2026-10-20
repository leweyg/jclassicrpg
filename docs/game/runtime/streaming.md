# game_streaming

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Static-host delivery, bounded scene loading, cache ownership, and performance budgets. The live browser uses offline-baked v2 scenes and 25 slots. Worker jobs, service workers, IndexedDB caches, vertical slabs, LOD tiers, and safety-region packages are optional design extensions where discussed. Budget figures are targets or estimates, not measured current download guarantees; recorded measurements are in [test_results](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/testing/results.md).

## Streaming and performance

Interaction streaming remains cheap:

- global item/mission/actor indexes are small JSON catalogs;

- chunk scenes carry only local anchors and visual nodes;

- active chunk anchors are normalized with the existing 25 slots;

- actor/puzzle meshes use the global asset cache;

- mission state and inventory are independent of chunk lifetime;

- inactive dialogue bodies may be lazy-loaded if measurement justifies it;

- no worker is required for correctness.

Target budgets:

| Resource | Target |
|---|---:|
| all compressed interaction catalogs | under 1–3 MB initially |
| added compressed data per ordinary chunk | under 2–10 KB average |
| nearby-query work | local active anchors only |
| interaction evaluation | under 2 ms for ordinary actions |
| puzzle transition | under 2 ms; offline solver bears complex work |
| active mission count | explicitly capped by content/UI policy, not runtime memory |

Do not reduce existing scene fidelity preemptively. NPC static meshes, interaction props, and shrine effects should first use asset reuse, instancing, and bounded visual cues.

## Dynamic streaming from a static host

Yes, this can be streamed progressively without an application server. For the seed-0 release, the recommended design is now **offline generation**: a build-time compiler evaluates terrain, settlements, buildings, mazes, caves, collision, navigation, and visual-instance records. The static host serves immutable regional JSON scene descriptions and shared assets. The browser only selects, fetches, parses, displays, and evicts the active working set, then stores player changes locally. Procedural browser workers are not required for the first implementation.

The existing port already provides a strong base:

- `WorldStream` uses 32 × 32 world-unit chunks.

- `CHUNK_RADIUS = 2` maintains a 5 × 5 grid, so only 25 surface slots are resident.

- Slots are recycled through a toroidal index rather than accumulated.

- `WorldView` creates a fixed pool of terrain and vegetation objects, then rewrites their buffers as slots move.

- Walking within one chunk creates no scene objects and triggers no chunk regeneration.

The city/cave implementation should extend this bounded system, not introduce an independent unbounded cache.

### Static-host architecture

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

### What is downloaded versus generated

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

#### Per-location client budget

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

### Proposed static file layout

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

#### Lewcid/Three.js editor scene contract

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

### Spatial ownership for structures crossing chunks

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

### Chunk coordinate normalization and world wrapping

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

### Chunk state machine

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

### Priority and predictive loading

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

### Two-stage readiness

A chunk should become safe before it becomes beautiful:

1. **Gameplay-ready:** terrain height, collision, water restrictions, structure bounds, doors/portals, and navigation edges exist.

2. **Visual-ready:** detailed ground, buildings, props, interiors, textures, and LOD batches exist.

Allow movement into a new chunk only after gameplay-ready. Render temporary low-detail geometry until visual-ready. This prevents falling through terrain or entering an ungenerated building while avoiding visible pauses for textures and furniture.

At a critical boundary, choose one of these fallbacks:

- slow/stop movement for a fraction of a second at the safe edge;

- retain a low-detail collision proxy and terrain mesh;

- never allow the player to cross into truly absent collision data.

Do not use an indefinite loading screen for ordinary walking.

### Scene JSON parse and normalization protocol

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

### Shared asset dependency loading

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

### Slot pools and atomic activation

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

### Vertical streaming for caves and buildings

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

### Memory ownership and eviction

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

### Browser caches and offline behavior

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

### Save state on a static host

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

### Static payload formats

All manifests, indexes, chunk/region scenes, prefabs, collision, navigation, portals, and save deltas are ordinary JSON. The visual documents use the editor-compatible `lewcid_object` structure from [scene_contract](https://github.com/leweyg/jclassicrpg/blob/main/docs/game/runtime/streaming.md#lewcidthreejs-editor-scene-contract). Gameplay sidecars use small versioned JSON Schemas and are linked from `userData.jcrpg`.

Meshes and textures retain their appropriate asset formats: prefer glTF/GLB for new mesh assets, preserve OBJ/MTL while reusing the repository's existing content, and use PNG/JPEG/WebP/KTX2 as supported by the target renderer. “Pure JSON scene description” means that scene composition and game semantics are JSON; it does not require base64-embedding mesh or image bytes into JSON.

Use readable property names and deterministic key/order emission. Repeated keys and source paths compress well under Brotli/gzip, so measure compressed transfer before considering compact aliases. Do not replace the canonical JSON with a binary scene format for the first implementation. If a future measured bottleneck warrants a packed cache, it must be a derived, disposable optimization with a versioned JSON equivalent and must not become the only previewable artifact.

Each manifest descriptor records uncompressed byte length, content hash, and optional expected content encoding. Validate documents with JSON Schema during compilation and in development builds. Production runtime validation may use a faster hand-written validator for the same contract.

### Failure and fallback policy

- Missing detailed mesh: use the bootstrap wall/box placeholder with correct collision.

- Missing texture: use a material color derived from semantic type.

- Baked region missing: use a separately packaged low-detail safety region if available; otherwise keep the previous fringe/placeholder and block unsafe traversal.

- Offline compiler error: fail the build with the region, source record, generator stage, and deterministic input digest. Never publish a partially generated world manifest.

- Fetch timeout: retry with capped exponential backoff only while the chunk remains relevant.

- Rapid direction reversal: reprioritize existing jobs rather than restarting matching canonical keys.

- Teleport: cancel old speculative jobs, retain globally shared asset promises, and build the destination critical chunk first.

Errors should name the world version, canonical chunk, stage, and missing asset/file. A static-host 404 is often a manifest/path/version error and should not be retried forever.

### Performance budgets and adaptation

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

### Streaming coordinator sketch

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

### Streaming implementation sequence

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

### Streaming acceptance tests

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
