# world_navigation

[docs](https://github.com/leweyg/jclassicrpg/blob/main/docs/README.md)

Layered movement graphs and portals. Measure mission travel through actual walkable cells and portal transitions; straight-line distance is a planning estimate.

## Pathfinding hierarchy

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
