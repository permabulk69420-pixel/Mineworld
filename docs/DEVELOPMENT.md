# Development journal

## v0.2 — Journey mode begins — 2026-09-02

The owner's first headset test clarified the product direction: Mineworld should be developed as a game first, not primarily as a creative sandbox. The normal entry is now Journey mode. Creative remains an explicit development/free-building option via `?creative=1`.

Journey mode introduces a finite block inventory. Mining editable palette blocks adds them to the player's pack; placing a block consumes one. New Journey worlds start with eight cedar planks so the player can make an immediate small construction without unlimited resources. Flight is disabled in Journey mode.

The left-wrist display now shows the selected material, stack count, and current objective. The first progression thread is intentionally small: gather six lumen crystals, carry them to the Old Arch, awaken it, then follow the objective toward Lumen Hollow. Inventory and progression state are persisted inside the existing version-1 save format, so earlier valid saves remain readable and generator version 1 is unchanged.

Added pure game-state tests for finite inventory spending and the Old Arch progression transition. The first CI attempt exposed a backwards-compatibility bug in `createSave` callers that did not yet supply Journey state; the build correctly stopped before deployment. `snapshotJourney` was made backwards-compatible and a replacement CI run was queued.

### Validation status

- Existing world, physics, input, and save tests remain in the workflow.
- New Journey inventory/progression tests are included.
- First Journey CI attempt failed before build/deploy due to the legacy `createSave` test path; that defect was fixed in the following commit.
- Final build/browser/deployment status for this iteration is pending the latest Actions run.
- Actual Quest 3 validation of Journey-mode wrist readability, resource feel, and objective pacing is still required.

### Next direction

Assuming the build and headset controls remain stable, continue turning the interaction model into a game: give materials different gathering requirements, introduce the first tactile tool/crafting decision, and make the awakened arch materially change the world rather than existing only as an objective flag. Preserve a strong reason to explore and a strong reason to return home.

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
