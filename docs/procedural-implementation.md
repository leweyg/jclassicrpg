# Procedural world implementation

The requested reference is `jclassicrpg-procedural-settlements-and-mazes.md`.
Work proceeds locally; no push or deployment is performed.

Stages:
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

Stage outputs and checks are recorded in [validation results](procedural-validation.md).
The review entry point is [the local review guide](procedural-review.md).
