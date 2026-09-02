# Development journal

## v0.1 — Skyreach foundation — 2026-09-02

Implemented the first playable archipelago: seven islands, a spring and cliff spill, caves, cedar trees, an ancient stone arch, lumen deposits, and a safe cedar lookout. The landscape consists of real editable blocks. Instanced grass and atmospheric elements are decorative.

Added walking, jumping, single-block stepping, flight, block removal and placement, nine creative materials, Quest tracked controllers, teleporting, smooth/snap turning, and a wrist palette. Added local autosave, export/import, protected invalid saves, and a versioned generation contract.

The public entry offers VR. Keyboard/mouse controls are available only with `?test=1` for development checks without a headset. Phone gameplay is outside the product scope. The owner explicitly wants development effort focused on VR.

The repository now carries a production build and a GitHub Actions pipeline. Thirteen unit tests cover chunk boundaries, ray normals and reach, hidden-face removal, mesh winding, deterministic generation, safe spawn, collision, stepping, placement overlap, gamepad axes, and save validation/round trips. Browser regression checks run the built game under the repository subpath and produce screenshot artifacts.

### Validation status

- Local world/physics/save tests: 13 passed.
- Local production build: passed; approximately 145 kB of compressed JavaScript, CSS, and HTML combined.
- The Work browser has WebGL disabled, so graphical checks are delegated to the repository's GitHub Actions browser test.
- Initial Actions screenshots verified the rendered islands and exposed a desktop test-camera jump on mouse capture. Entry now ignores the synthetic cursor-recentring movement. The corrected browser and deployment checks are pending.
- Actual Quest 3 immersion, frame rate, and controller comfort remain untested.

### Known boundaries

- Creative sandbox only: no crafting, survival, enemies, multiplayer, or infinite streaming.
- The starting region is finite; flight is clamped to its build limits.
- Water is decorative and does not simulate fluid flow.
- Grass, clouds, the planet, and motes are decorative. Trees, terrain, ruins, crystals, and the lookout are editable blocks.
- Saves are local to the current browser and origin. Export/import is the supported way to back up a world or move it between headsets.
- Hand tracking and in-VR settings menus are not implemented. Set turn mode before entering VR.

### Next session

Prioritize the owner's first headset report: scale, motion, pointing direction, block placement, teleport landings, and performance around the home island. Fix those first. Then add the first exploration loop around the arch and distant waystones, retaining generator version 1 and all existing builds.
