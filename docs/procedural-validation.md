# Validation results

All five implementation stages have local, reviewable outputs. This is the
`web-baked-v1` playable slice; the compatibility boundaries in the
[review guide](procedural-review.md) remain explicit.

| Check | Result |
| --- | --- |
| Saved inputs | 183 ordinary districts, 25 dungeon districts, exact geography longs, 208 NPC overrides |
| Compiled content | 1,166 structures/grounds/shrines; 190,935 cave floor cells; 489 cave links |
| Automated tests | 31 passed; no failures or skipped tests |
| Independent Java fixtures | 24 hash vectors and every byte of 80 maze grids match original Java |
| Dungeon traversal | All four entrances and every chest reachable through every 37×37 shell |
| Stream lifecycle | 1,000 transitions; exactly 25 slots; cache capped at 50 chunks; retained terrain buffers |
| Network safety | Five new chunks per ordinary crossing; cache hits on return; stale responses rejected; failures block movement; retry recovers |
| Persistence/traversal | Cave portals, multi-floor stairs, symmetric blocking faces, overlapping teleports, portable/versioned save deltas |
| Static artifacts | 2,602 scenes; 780,186 source references resolve; 5,000 terrain seams agree |
| Repeat build | All 5,184 artifacts byte-identical in an independent output directory |
| Browser | Town, building interior, dungeon and cave loaded with 25 ready slots, no JavaScript exceptions or failed mesh loads |
| Editor | Unmodified fixture, calibration, town chunk and 25-chunk region imported/rendered successfully |
| Mobile layout | 390×844 viewport checked; physical mobile GPU performance not measured |

The baked world data is approximately **209.4 MB raw / 18.6 MB gzip / 15.8 MB
Brotli**. Those are whole-world artifact sizes, not startup downloads. Representative
25-chunk sets measure **86–133 KB gzip**, excluding shared assets and bootstrap
indices. A plain Python server serves uncompressed bytes; the compression figures
are build measurements, not claims that the local server applied compression.

Headless Chrome rendered the representative views with 165 draw calls in the town,
151 inside a house, 242 in the dungeon and 12 in the cave. The visited working set
reported about 0.67 MB of geometry buffers, 2.13 MB of instance buffers, and a
9.52 MB texture estimate. These are software-renderer diagnostics. CPU render
submission in the sampled cave was 0.1–0.3 ms; GPU frame time and physical iPhone
performance remain unmeasured. No near-field detail was removed to satisfy an
unmeasured GPU limit.

Evidence:

- [Build and 31 tests](procedural-evidence/build-and-tests.txt)
- [Byte reproducibility and seams](procedural-evidence/reproducibility.json)
- [Browser metrics](procedural-evidence/report.json)
- [Editor import results](procedural-evidence/editor-report.json)
- [Town](procedural-evidence/town.png), [house interior](procedural-evidence/house-interior.png), [dungeon](procedural-evidence/dungeon.png)
- [Cave](procedural-evidence/cave.png), [mobile viewport](procedural-evidence/mobile-cave.png)
- [Editor calibration](procedural-evidence/editor-calibration.scene.json.png), [editor region](procedural-evidence/editor-regions_r000_008.scene.json.png)

No commit, GitHub push, or deployment was performed. The supplied implementation
plan was left unchanged. The rejected broad parent-directory preview was replaced
by an isolated `/tmp` copy containing only public editor assets and generated scenes.
