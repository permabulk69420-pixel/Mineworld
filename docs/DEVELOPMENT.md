# Development journal

## v0.2 — The First Passage — 2026-09-02

The owner's first headset test clarified the product direction: Mineworld should be developed as a game first, not primarily as a creative sandbox. The normal entry is now **Journey mode**. Creative remains an explicit development/free-building option via `?creative=1`, with flight and unlimited placement kept out of normal progression.

### Shipped game loop

Journey mode now has finite resources and an actual early progression chain rather than a creative palette with an objective label attached.

1. New worlds begin at First Light with eight cedar planks and the basic field tool.
2. Gather cedar and limestone. Materials use different hold-to-gather times; the target outline visibly grows/brightens during the action.
3. Lumen crystal is blocked until the quarry pick is earned. Deepstone remains deliberately too hard even for that pick, reserving an obvious future tool tier.
4. Collect **4 cedar + 6 limestone**, return to the visible field bench beside the First Light lookout, and press **Y** to craft. Merely walking home does not auto-craft the tool.
5. The hand tool visibly changes into the quarry pick, and crystal harvesting unlocks.
6. Gather **6 lumen crystals** and carry them to the Old Arch. The arch consumes them, visibly wakes, and becomes an actual portal.
7. Step through the Old Arch to travel across the cloud sea to Lumen Hollow. Discovering the island wakes a paired return waystone, leaving a persistent two-way route instead of a one-shot teleport.

The left wrist now shows the selected material, finite stack count, current tool, current objective, and the Journey craft/use hint. Material cycling skips empty stacks, a new save initially selects the planks it actually owns instead of an empty Meadow slot, and exhausting a stack advances to another usable material. Flight controls and the on-screen Fly button no longer leak into Journey mode.

The First Light field bench is a small original cedar/stone scene prop with a half-built tool on top. Its indicator brightens when the quarry recipe is ready. The Old Arch and Lumen Hollow waystone are lightweight progression props layered over the existing editable voxel world; generator version 1 remains unchanged so old terrain and builds survive the update.

Journey inventory, tool state, arch state, and discovery state persist inside the existing version-1 save. Earlier valid saves remain readable. Saves from the short-lived first Journey iteration that had already awakened the arch are treated as having earned the quarry pick, preventing progression from moving backwards.

### Validation status

- **16 unit tests passed** in Actions, covering world/chunk/raycast behavior, physics, Quest stick mapping, save compatibility, finite inventory, explicit field-bench crafting, harvest gating, and the persistent two-way passage.
- Production Vite build passed.
- Browser regression passed the built game under `/Mineworld/`: public entry remains VR-only; Journey exposes the field-tool objective and refuses creative flight; explicit Creative mode still passes pointer lock, flight, mining, placement, material selection, save reload, and export.
- Browser report contained **no runtime or shader errors**.
- Inspected the generated title, First Light, and building screenshots. The Journey title composition remains intact; First Light renders without obvious mesh/camera/UI corruption; the new field bench is visibly grounded beside the lookout; crystal placement and targeting still render correctly.
- [Actions run 33614693235](https://github.com/permabulk69420-pixel/Mineworld/actions/runs/33614693235) completed build and GitHub Pages deployment successfully. The preview-branch step initially hit a transient GitHub API 500 while creating a JPEG blob; retrying only that job succeeded without a code change.
- The deployed game remains at `https://permabulk69420-pixel.github.io/Mineworld/`.
- Software-rendered browser FPS is intentionally **not** treated as a Quest performance measurement.
- Actual Quest 3 validation is still needed for mining hold timing, Y-at-bench ergonomics, wrist readability, the changing hand-tool model, portal comfort, and sustained headset frame rate.

### Known boundaries

- This is a first progression slice, not yet a survival game: there is no health/hunger pressure, combat, creatures, or death loop.
- Crafting currently has one deliberate recipe at one field bench rather than a full recipe/inventory interface.
- Lumen Hollow is now reachable and has a return route, but it does not yet have its own substantial gameplay loop. That is the clearest next content target.
- Deepstone is intentionally harvest-locked to create room for a second tool/material tier.
- Water is decorative rather than simulated fluid.
- The starting region remains finite. Creative flight is clamped to its build limits.
- Saves remain local to the current browser/origin; export/import is the supported backup/device-transfer path.
- Hand tracking and an in-VR settings menu are not implemented.

### Next direction

Build **Lumen Hollow as the second gameplay beat**, not merely a destination. Give it something the home island cannot provide: a new resource or restoration task that leads toward a deepstone-capable tool and makes returning through the waystone useful. Prefer a compact complete loop over adding generic survival meters. After that, a small original creature/ecology layer would give exploration more life without immediately turning Mineworld into a combat game.

Before tuning any VR-specific timings aggressively, use the next Quest playtest to check whether holding the trigger for limestone/crystal feels tactile or tedious, whether Y is a natural field-bench interaction, whether the wrist objective is readable at a glance, and whether walking through the arch is comfortable.

---

## v0.1 — Skyreach foundation — 2026-09-02

Implemented the first playable archipelago: seven islands, a spring and cliff spill, caves, cedar trees, an ancient stone arch, lumen deposits, and a safe cedar lookout. The landscape consists of real editable blocks. Instanced grass and atmospheric elements are decorative.

Added walking, jumping, single-block stepping, flight, block removal and placement, nine creative materials, Quest tracked controllers, teleporting, smooth/snap turning, and a wrist palette. Added local autosave, export/import, protected invalid saves, and a versioned generation contract.

The public entry offers VR. Keyboard/mouse controls are available only with `?test=1` for development checks without a headset. Phone gameplay is outside the product scope. The owner explicitly wants development effort focused on VR.

The repository now carries a production build and a GitHub Actions pipeline. Thirteen unit tests cover chunk boundaries, ray normals and reach, hidden-face removal, mesh winding, deterministic generation, safe spawn, collision, stepping, placement overlap, gamepad axes, and save validation/round trips. Browser regression checks run the built game under the repository subpath and produce screenshot artifacts.

### Validation status

- Local world/physics/save tests: 13 passed.
- Local production build: passed; approximately 145 kB of compressed JavaScript, CSS, and HTML combined.
- Actions browser check: passed WebGL rendering, stable initial view, flight, mining, placement, material selection, save reload, and export. The public entry hides desktop test controls. No browser runtime or shader errors were reported.
- Inspected actual screenshots of the VR entry, the initial player view, and a mined plank replaced with a lumen crystal. The title screenshot is saved as `docs/skyreach.jpg`.
- [Actions run 33610878143](https://github.com/permabulk69420-pixel/Mineworld/actions/runs/33610878143): build, visual previews, and GitHub Pages deployment all succeeded for `312932d`. The deployment reports `https://permabulk69420-pixel.github.io/Mineworld/` as its environment URL.
- Graphics validation ran in Actions because the Work browser has WebGL disabled. Software rendering is useful for correctness checks; its frame rate does not measure headset performance. The public URL could not be independently opened by the Work web viewer.
- Actual Quest 3 immersion, frame rate, and controller comfort remain untested.

The desktop regression harness uses relative movement and pointer events through the game's normal input handlers. CDP's absolute mouse clicks under pointer lock can introduce camera movement. World generation, raycasting, edits, remeshing, rendering, and storage all run normally during these checks.

### Known boundaries

- Creative sandbox only: no crafting, survival, enemies, multiplayer, or infinite streaming.
- The starting region is finite; flight is clamped to its build limits.
- Water is decorative and does not simulate fluid flow.
- Grass, clouds, the planet, and motes are decorative. Trees, terrain, ruins, crystals, and the lookout are editable blocks.
- Saves are local to the current browser and origin. Export/import is the supported way to back up a world or move it between headsets.
- Hand tracking and in-VR settings menus are not implemented. Set turn mode before entering VR.

### Next session

Prioritize the owner's first headset report: scale, motion, pointing direction, block placement, teleport landings, and performance around the home island. Fix those first. Then add the first exploration loop around the arch and distant waystones, retaining generator version 1 and all existing builds.
