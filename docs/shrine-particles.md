# Shrine particles

`js/world/shrine_particles.js` supplies one shared, bounded alpha-textured quad batch for catalogued surface shrines, including unloaded ones. It uses no lights, bloom, timers, or independent animation loop. Depth testing, depth writing, fog and tone mapping are disabled. Quads are sorted globally back to front using camera-space depth, so turning the camera preserves transparency ordering.

The nearby effect is a slender gold/blue double helix with 3.5 turns. Dormant coils fade into view on approach; activated coils glow. Beyond 30 world units, sparse fixed coils replace the detail. Markers fade out by 380 units, with at most 24 nearest shrines included. Standing near an activated shrine strengthens distant markers; route frontiers receive additional emphasis. Underground views hide the batch. Catalog coordinates wrap with the 1600-unit world.

`SHRINE_PARTICLE_DEFAULTS` defines proportions, range, density and appearance. Pass overrides to `new ShrineParticles(scene, options)` or edit `bakedView.shrineParticles.options` and request a render. `direction` is a world-space three-component streak vector; its projected magnitude controls stretching. `[0, 0, 0]` produces round points. `width` and `streakLength` control particle dimensions.

Animation phase uses `gameState.time.turn`, never wall-clock time. Turn events request one render. Camera movement updates billboards, sorting and distance fades; an unchanged render leaves buffers untouched. The existing game clock is still a placeholder: walking does not itself advance game turns.

Validation: `node --test jCRPG-engine/js/tests/shrine_particles.test.mjs` covers turn-only phase, fixed far particles, buffer reuse, rotation sorting, activation, trail enhancement, cave visibility, world wrapping, capacity and zero-direction points. A local Chrome check verified dormant/active rendering at the opening shrine, no JavaScript exceptions, and a null pending animation frame at idle.
