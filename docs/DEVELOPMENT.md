# Development journal

## v0.3 — Quality reset / large-world foundation — 2026-09-02

The second headset test invalidated the v0.2 development approach despite the code being technically functional.

### Owner feedback that triggered the reset

- The playable spaces felt **far too small**. Progression immediately pushed the player from one little island to another instead of creating a world worth inhabiting.
- The player-built field bench looked like a crude placeholder and lowered the visual standard rather than adding value.
- Portal visuals/animation also read as placeholder effects.
- The crafted quarry pick was especially bad: it appeared on **both hands**, was oriented sideways, was hard to identify, and did not actually participate in mining. Mining still happened through controller buttons/raycast, so the prop was decorative rather than an interaction.
- Too many systems had been added in one pass. Because each one received little attention, technical breadth was being mistaken for game quality.

The owner suggested the correct development cadence directly: **add one thing at a time** and maintain standards about what is allowed into the build.

### What was removed from playable Journey

The v0.2 bench → quarry pick → Old Arch → Lumen Hollow → resonators → resonant pick → deepstone → Old Quarry chain is now dormant. The underlying prototype code may remain temporarily while the runtime is cleaned up, but current Journey state forces those systems inactive and none of their props should appear.

The fake VR hand-tool meshes were removed entirely. `XRControls.updateTool()` is intentionally a no-op until a visible tool is also a real one-handed physical interaction.

Current Journey has no advertised Y craft/use action. The wrist labels the player state as **HANDS** and only shows carried building materials.

### Generator v2

The seven-small-island generator was replaced by one large connected **First Light** landmass.

Current terrain goals/features:

- more than 175 voxels of east-west terrain span and more than 150 voxels north-south (well over 130 metres in each major dimension at 0.75 m/block);
- a broad southern meadow and long northward sightline from spawn;
- cedar country with a few very large trees for scale;
- a lake and stream;
- broad walkable caves rather than tiny tubes;
- a high northern ridge;
- western cliffs/escarpment;
- several named regions on physically connected terrain rather than teleport-separated level pads;
- no prefab field bench, portal, lookout quest structure, or progression prop at spawn.

The first v2 screenshot pass still felt too enclosed because the player spawned inside dense cedar canopy. That technically solved map size but did not communicate it. Spawn was therefore moved to the open meadow and a broad tree-free sightline was cut toward the distant ridge. The resulting deployed `foundation-start` screenshot was inspected and reads materially more open, with foreground meadow, distant terrain/tree line, and the ringed planet providing large-scale visual reference.

### Save separation

Generator v2 uses `mineworld.skyreach.save.v2`.

The earlier prototype remains untouched under `mineworld.skyreach.save.v1`. This is deliberate: v2 is a different world design, so forcing old block edits/player position into it would be worse than preserving the prototype separately.

### Validation

Stable runtime/copy run: **GitHub Actions 33624617072**.

- 18 unit tests passed.
- Production Vite build passed.
- Generator-v2 test checks determinism, connected key regions, large terrain extents, and safe spawn.
- Rendered browser regression passed the built `/Mineworld/` game.
- Fresh Journey asserts empty inventory, zero visible unowned material slots, `Hands · empty pack`, and no v0.2 Quarry/Hollow/bench progression language in diagnostics.
- Creative regression still verifies full palette, flight, v2 local save, and JSON export.
- Browser/runtime/shader error check passed.
- GitHub Pages deployment succeeded.
- The `previews` branch publishing job hit GitHub API HTTP 500 while creating a blob; retry hit the same GitHub-side failure. This does not affect the validated artifact or Pages deployment.
- Software SwiftShader rendering was roughly ~450 chunks and ~200k+ triangles at very low software FPS. That number is not a Quest benchmark; the previous smaller build ran comfortably on Quest, but v2 still needs device observation.

### Current playable scope

Journey currently exists to answer one question first:

> **Does First Light finally feel like a world-sized place in the headset, rather than a toy map?**

Basic locomotion, teleport, finite gathering, voxel removal/placement, wrist inventory, saves, and export remain. Lumen and deepstone are deliberately harvest-locked until a real tool interaction is designed.

Do not ask the owner to test a progression loop in this build. Walk/explore is the test.

### Next feature — only after scale passes

Build **one physical mining tool interaction** and spend an entire iteration on it if necessary.

Requirements before it stays in Journey:

- right-hand only unless the design has a real reason for two-handed use;
- instantly readable silhouette and believable headset scale;
- correct grip orientation and controller-relative pose;
- visible motion corresponds to the actual mining action;
- the tool must participate in hit detection/feedback rather than decorate a trigger press;
- good impact sound/particles/haptics/target response;
- no workbench, portal, crafting tree, second tool tier, or new region added in the same pass.

Only once that interaction is worth keeping should the project consider rebuilding a workbench/station or progression around it.

---

## v0.2 — Discarded progression prototype — 2026-09-02

v0.2 established finite Journey inventory and proved that progression/save/portal state could technically work. It eventually contained a player-established bench, quarry pick, Old Arch portal, Lumen Hollow resonators, a resonant tool tier, deepstone, and a route to The Old Quarry.

The implementation passed extensive unit/browser checks, but the headset test showed the more important failure: the spaces and props were not good enough. The prototype is retained as engineering history, not as the current design direction.

The main lesson from v0.2 is that CI can prove correctness but cannot establish **VR scale, visual quality, or tactile credibility**. Those require headset judgment and a narrower iteration cadence.

---

## v0.1 — Skyreach foundation — 2026-09-02

Implemented the original seven-island voxel prototype, locomotion, jumping, teleport, block editing, Creative mode, Quest controllers, wrist UI, local save/export, deterministic terrain, chunk meshing, and GitHub Pages validation/deployment.

The first headset report showed the underlying WebXR movement/performance foundation was viable, but subsequent progression work exposed the need for a much higher content/interactions quality bar.
