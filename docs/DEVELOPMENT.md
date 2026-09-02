# Development journal

## v0.2 — The First Passage — 2026-09-02

The owner's headset test clarified the product direction twice in useful ways. First, Mineworld should be developed as a game first rather than primarily as a creative sandbox. Second, the first Journey implementation still communicated "sandbox" immediately because it visibly exposed the full material palette, gifted blocks at spawn, and placed the first workbench for the player. That opening has now been corrected rather than asking the owner to keep testing through it.

The normal entry remains **Journey mode**. Creative remains an explicit development/free-building option via `?creative=1`, with flight and unlimited placement kept out of normal progression.

### Corrected opening

A fresh Journey now starts with an **empty pack**. No build materials are selectable until they are actually gathered. The desktop hotbar hides unowned materials; the VR wrist literally reads **PACK EMPTY** and draws no material slots. Controller/keyboard selection cannot select a material with zero inventory.

There is no longer a prebuilt First Light field bench. The first dependency chain is now:

1. Start with the basic field tool and no carried building blocks.
2. Gather **3 cedar + 2 limestone**.
3. Choose a spot on First Light and press **Y** to establish the field bench in front of you. The resources are consumed and the chosen x/z position persists in the Journey save.
4. Gather **2 additional cedar + 4 additional limestone**.
5. Return to **your own** bench and press **Y** to make the quarry pick.
6. Continue into the existing lumen/arch progression.

The short-lived prototype save that contains exactly the untouched eight-plank starter gift is migrated to the empty-pack start. Only that precise unprogressed state loses the obsolete gift; saves with actual gathered resources, edits, tool progression, or later discoveries are retained.

### Connected progression

After the corrected opening, the current progression spine is:

1. The quarry pick unlocks lumen harvesting; deepstone still rejects it.
2. Gather **6 lumen crystals** and carry them to the Old Arch. The arch consumes them, wakes, and becomes a portal.
3. Travel to **Lumen Hollow**. Discovery wakes the paired return waystone.
4. Find the **three Hollow resonators**. Feed each one real lumen crystal with **Y**. Each activation persists and visibly changes the resonator.
5. Return to the Hollow forge and temper the quarry pick into the luminous **resonant pick**.
6. Dig beneath the Hollow and recover deepstone. Deepstone is carried as a progression resource rather than a tenth build slot.
7. The first deepstone wakes the Hollow forge into a second passage to **The Old Quarry**.
8. Discovering The Old Quarry permanently enables its heavier return waystone to Lumen Hollow.

The three hand-tool states remain visually distinct. The quarry version gains its pick head; the resonant version gains the bright cyan treatment and luminous ring. Generator version 1 remains unchanged, so existing terrain and player block edits survive the progression expansion.

### Validation status

- The revised unit suite passed in Actions, including empty-pack start, no placeable starter material, explicit field-bench construction, resource consumption, quarry crafting at the player-established bench, the untouched eight-plank migration, Hollow resonators, resonant-tool gating, deepstone, both portal pairs, and Quarry discovery.
- Production Vite build passed.
- Browser regression now **fails if fresh Journey exposes any unowned material slot**. It also asserts `Hands · empty pack`, the field-bench objective, and disabled Journey flight.
- `journey-start.jpg` is generated from the actual fresh Journey runtime. It was inspected: no field bench is present, no material palette is visible, the selected state reads `Hands · empty pack`, and the objective reports cedar 0/3 and limestone 0/2.
- Creative mode still passes its separate unrestricted regression path: pointer lock, flight, mining, placement, selection, save reload, and export.
- The staged Hollow and real Hollow → Quarry runtime traversal checks still pass, with no browser/runtime/shader errors.
- [Actions run 33622487218](https://github.com/permabulk69420-pixel/Mineworld/actions/runs/33622487218) completed build, browser validation, preview publishing, and GitHub Pages deployment successfully for the corrected opening.
- The deployed game remains at `https://permabulk69420-pixel.github.io/Mineworld/`.
- Software-rendered browser FPS is intentionally **not** treated as a Quest performance measurement.

### Known boundaries

- This is an exploration/crafting progression slice, not yet a survival game: there is no health/hunger pressure, combat, creatures, or death loop.
- The newly player-established field bench is a persisted scene prop, not a voxel structure with physical collision/destruction yet.
- Crafting still uses contextual world interactions rather than a general recipe/inventory interface.
- Lumen Hollow has a complete gameplay beat; The Old Quarry is reachable but does **not yet have its own substantial gameplay loop**.
- Deepstone is tracked as a progression resource but does not yet have a downstream Quarry use beyond waking the passage.
- Water remains decorative rather than simulated fluid.
- The starting region remains finite. Creative flight is clamped to its build limits.
- Saves remain local to the current browser/origin; export/import is the supported backup/device-transfer path.
- Hand tracking and an in-VR settings menu are not implemented.

### Next direction

Do not add more content merely because the progression code exists. The next headset check should first answer whether the corrected opening now reads like a game: empty inventory, natural gathering, understandable bench construction, sensible Y interaction, and a clear reason to continue.

If that survives, build **The Old Quarry as the third gameplay beat**. Deepstone should gain a meaningful downstream use there—restoring machinery, opening a buried structure, or powering a traversal mechanic—so the new capability materially changes the world. A small original creature/ecology layer remains a strong follow-up once the three-location progression spine feels coherent.

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
