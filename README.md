# Mineworld

A Three.js voxel sandbox for Meta Quest, desktop, and phone. The first chapter, **Skyreach**, is a quiet archipelago of floating islands, cedar groves, springs, caves, and lumen crystals. Mine the landscape, build a home, and fly to the next island.

**[Play Mineworld](https://permabulk69420-pixel.github.io/Mineworld/)** · [Build and deployment](https://github.com/permabulk69420-pixel/Mineworld/actions)

## First build: v0.1

- Seven deterministic, fully editable islands with original procedural textures.
- Mining and unlimited creative building with nine materials.
- Walking, collision, single-block stepping, jumping, and flight.
- Quest WebXR: tracked controllers, head-relative locomotion, smooth or snap turning, teleport arc, and a wrist palette.
- Desktop keyboard/mouse and phone touch controls.
- Automatic saves in the current browser, plus JSON export/import for backups and device transfers.
- Chunk meshes with hidden-face removal and vertex ambient occlusion; instanced foliage and debris.
- GitHub Actions tests, builds, captures screenshots, and deploys to GitHub Pages.

This is a playable foundation, not a finished Minecraft replacement. There is no survival, crafting, enemies, multiplayer, infinite terrain, or flowing-water simulation yet. Quest performance and controller feel still need an actual headset playtest.

## Controls

| Action | Desktop | Quest controllers | Phone |
| --- | --- | --- | --- |
| Move | WASD / arrows | Left stick | Left thumbstick |
| Look / turn | Mouse | Head / right stick | Drag the world |
| Mine | Hold left click | Hold right trigger | Hold Mine |
| Place | Hold right click | Hold right grip | Hold Build |
| Material | 1–9 / scroll / Q, E | X next / left grip previous | Tap hotbar |
| Jump | Space | A | ↑ |
| Toggle flight | F | Y | Fly |
| Fly up / down | Space / Shift | A / B | ↑ / ↓ |
| Teleport | — | Hold left trigger, aim at ground, release | — |
| Return home | R / menu | Leave VR, then menu | Menu |
| Menu | Esc | Headset's exit-VR control | ☰ |
| Diagnostics | F3 | — | — |

On Quest, open the play link **in the headset browser** and choose **Enter VR**. Grant the requested immersive-session permission and use controllers. Hand tracking is not implemented. Smooth turning is the default; snap turning is available in Controls & settings before entering VR.

## Saves

Saves belong to a browser and device. They do not sync to GitHub. Use **Controls & settings → Export world** to keep a backup or carry a build to your headset. Importing asks before replacing the current device's world. Unsupported or corrupt saves are preserved rather than overwritten.

The seed and terrain generator version are stored with coordinate-based block edits. Generator version 1 is a compatibility contract: future updates must keep it available for existing worlds.

## Development

Node 22.12+:

```sh
npm ci
npm run dev
npm run check
```

The game has no runtime API, CDN, account, or key dependency. The Three.js bundle and all assets ship with the game. One block is 0.75 metres. The finite build region is approximately 190 × 190 metres, with a vertical limit of 96 metres.

For browser regression checks (the same checks run in Actions):

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:browser
```

Screenshots and a text report are produced in `artifacts/`. Browser tests exercise the production build under `/Mineworld/` so relative asset paths are checked too. The software renderer's frame rate is **not** a Quest benchmark.

Push builds also keep the latest screenshot set and report on the `previews` branch, including failure captures. This branch contains test output only and never deploys the game.

## Deployment

In repository **Settings → Pages**, select **GitHub Actions** as the source once. Every push to `main` then runs world/physics/save tests, builds, runs the browser check, and deploys. Pull requests run validation without publishing. The workflow can also be run manually from Actions.

If the game builds but the Pages configuration step fails, enable the Pages source above and rerun the workflow. Browser sign-in is not required for routine code updates through the GitHub connection.

See [the direction](docs/DIRECTION.md) and [the development journal](docs/DEVELOPMENT.md) before extending the game.
