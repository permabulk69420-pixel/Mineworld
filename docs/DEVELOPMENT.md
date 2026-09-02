# Development journal

## v0.2 — The First Passage — 2026-09-02

The owner's first headset test clarified the product direction: Mineworld should be developed as a game first, not primarily as a creative sandbox. The normal entry is now **Journey mode**. Creative remains an explicit development/free-building option via `?creative=1`, with flight and unlimited placement kept out of normal progression.

### Shipped game loop

Journey mode now has finite resources and a connected three-location progression chain rather than a creative palette with an objective label attached.

1. New worlds begin at First Light with eight cedar planks and the basic field tool.
2. Gather cedar and limestone. Materials use different hold-to-gather times; the target outline visibly grows/brightens during the action.
3. Collect **4 cedar + 6 limestone**, return to the visible field bench beside the First Light lookout, and press **Y** to deliberately craft the quarry pick. Merely walking home does not auto-craft the tool.
4. The hand tool visibly changes into the quarry pick. Lumen crystal can now be harvested; deepstone still rejects this tool.
5. Gather **6 lumen crystals** and carry them to the Old Arch. The arch consumes them, visibly wakes, and becomes an actual portal.
6. Step through the Old Arch to travel across the cloud sea to **Lumen Hollow**. Discovering the island wakes a paired return waystone, leaving a persistent route home.
7. Lumen Hollow contains **three separate resonators** around the island. Stand near each and press **Y** to feed it one real lumen crystal. Each activation persists and visibly changes the resonator.
8. When all three resonators are awake, return to the Hollow forge and press **Y** to temper the quarry pick into a visibly luminous **resonant pick**.
9. Deepstone exists naturally below the island terrain. The resonant pick can finally break it; stone and lumen also become faster to gather with the upgraded tool.
10. Deepstone is a carried progression resource rather than a tenth build-palette block. Its count appears on the wrist once the resonant pick is active.
11. Recovering the first deepstone wakes the Hollow forge again, this time into a second portal. Enter it to reach **The Old Quarry**.
12. Discovering The Old Quarry permanently wakes its heavier return waystone, reconnecting it to Lumen Hollow.

The left wrist now shows the selected material, finite stack count, current tool, current objective, and contextual Journey hint. Material cycling skips empty stacks, a new save initially selects the planks it actually owns instead of an empty Meadow slot, and exhausting a stack advances to another usable material. The resonant state adds the carried deepstone count without expanding the nine-slot building palette. Flight controls and the on-screen Fly button do not leak into Journey mode.

The three hand-tool states are deliberately visible rather than hidden capability flags. The quarry version gains its pick head; the resonant version gains a bright cyan treatment and luminous ring. First Light's field bench, the Old Arch, both waystones, the Hollow resonators, and the forge are lightweight scene props layered over the existing editable voxel world. **Generator version 1 remains unchanged**, so old terrain and player builds survive this progression expansion.

Journey inventory, tool state, resonator state, arch state, deepstone state, and passage discoveries persist inside the existing version-1 save. Earlier valid saves remain readable. Saves from the short-lived first Journey iterations that had already awakened the arch or advanced beyond a later tool gate are upgraded forward rather than losing progress.

### Validation status

- **19 unit tests passed** in Actions. Coverage now includes world/chunk/raycast behavior, physics, Quest stick mapping, finite inventory, explicit field-bench crafting, harvest gating, three distinct resonator activations and crystal consumption, resonant-tool gating, non-placeable carried deepstone, both portal pairs, Quarry discovery, and full Journey save round trips.
- Production Vite build passed.
- Browser regression passed the built game under `/Mineworld/`: public entry remains VR-only; Journey exposes the field-tool objective and refuses creative flight; explicit Creative mode still passes pointer lock, flight, mining, placement, material selection, save reload, and export.
- The browser suite now also loads a deterministic mid-Hollow Journey state and captures `lumen-hollow.jpg`, then stages the player on the deepstone-awakened forge and requires the **actual runtime portal code** to reach The Old Quarry, mark it discovered, persist that state, and render `old-quarry.jpg`.
- Browser report contained **no runtime or shader errors**. It explicitly recorded successful Hollow → Quarry traversal and persisted Quarry discovery.
- The first Quarry browser attempt exposed a test-harness lifecycle bug rather than a game bug: the already-running Hollow page's `pagehide` autosave overwrote the synthetic Quarry save during navigation. The harness now leaves the running page first, writes the staged save from an unstarted page, and the same runtime traversal passes.
- Inspected the generated title, First Light, building, Lumen Hollow, and Old Quarry screenshots. Moving the Hollow forge southwest fixed the earlier arrival composition where it was effectively in the staged camera's face. The Quarry return waystone is intentionally monumental; the synthetic camera points directly back at it, so actual headset scale/arrival comfort remains a Quest-specific check rather than something to overfit from a flat screenshot.
- [Actions run 33618889381](https://github.com/permabulk69420-pixel/Mineworld/actions/runs/33618889381) completed build, browser validation, visual-preview publishing, and GitHub Pages deployment successfully for the final code candidate.
- The deployed game remains at `https://permabulk69420-pixel.github.io/Mineworld/`.
- Software-rendered browser FPS is intentionally **not** treated as a Quest performance measurement.
- Actual Quest 3 validation is still needed for mining hold timing, Y-at-bench ergonomics, resonator discoverability, wrist readability, the three changing hand-tool states, both portal transitions, waystone scale, and sustained headset frame rate.

### Known boundaries

- This is an exploration/crafting progression slice, not yet a survival game: there is no health/hunger pressure, combat, creatures, or death loop.
- Crafting currently uses contextual world interactions rather than a full recipe/inventory interface: First Light has the quarry recipe; Hollow has resonator feeding and tool tempering.
- Lumen Hollow now has its own complete gameplay loop instead of being merely a destination.
- The Old Quarry is now reachable and has a persistent return route, but it does **not yet have its own substantial gameplay loop**. It is the clearest next content target.
- Deepstone is tracked as a progression resource but does not yet have a downstream recipe/use beyond waking the Quarry passage.
- Water is decorative rather than simulated fluid.
- The starting region remains finite. Creative flight is clamped to its build limits.
- Saves remain local to the current browser/origin; export/import is the supported backup/device-transfer path.
- Hand tracking and an in-VR settings menu are not implemented.

### Next direction

Use the next Quest playtest as the primary gate before aggressively tuning timings or landmark scale. In particular: check whether limestone/crystal/deepstone hold durations feel tactile rather than tedious, whether **Y** works naturally for bench/resonator/forge interactions, whether the resonators are visually obvious enough to discover without UI babysitting, whether the resonant pick reads clearly in-hand, and whether both portal arrivals feel comfortable at headset scale.

If those fundamentals survive the headset test, build **The Old Quarry as the third gameplay beat** rather than immediately adding generic meters. Deepstone should gain a meaningful downstream use there—restoring machinery, opening a buried structure, or powering another original traversal mechanic—so the player's new capability changes what the world lets them do. A small original creature/ecology layer remains a good follow-up once the three-location progression spine feels solid.

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
