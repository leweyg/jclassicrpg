# world_caves

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Natural-cave occupancy, entrance constraints, and connected-component validation. The baked browser adapter preserves coordinate occupancy without carving new connectivity. Its cave bands and portal presentation are adapted; complete Java cave-cube parity remains unverified.

## Natural cave generation

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
