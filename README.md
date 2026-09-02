# Mineworld

A Three.js VR voxel sandbox for Meta Quest. The first chapter, **Skyreach**, is a quiet archipelago of floating islands, cedar groves, springs, caves, and lumen crystals. Mine the landscape, build a home, and fly to the next island.

**[Play Mineworld](https://permabulk69420-pixel.github.io/Mineworld/)** · [Build and deployment](https://github.com/permabulk69420-pixel/Mineworld/actions)

## First build: v0.1

- Seven deterministic, fully editable islands with original procedural textures.
- Mining and unlimited creative building with nine materials.
- Walking, collision, single-block stepping, jumping, and flight.
- Quest WebXR: tracked controllers, head-relative locomotion, smooth or snap turning, teleport arc, and a wrist palette.
- Automatic saves in the current browser, plus JSON export/import for backups and device transfers.
- Chunk meshes with hidden-face removal and vertex ambient occlusion; instanced foliage and debris.
- GitHub Actions tests, builds, captures screenshots, and deploys to GitHub Pages.

This first foundation focuses on creative exploration and building. Survival, crafting, enemies, multiplayer, infinite terrain, and flowing-water simulation are future possibilities. Quest performance and controller feel still need an actual headset playtest.

## Controls

| Action | Quest controllers |
| --- | --- |
| Move | Left stick |
| Look / turn | Head / right stick |
| Mine | Hold right trigger |
| Place | Hold right grip |
| Material | X next / left grip previous |
| Jump | A |
| Toggle flight | Y |
| Fly up / down | A / B |
| Teleport | Hold left trigger, aim at ground, release |
| Return home / settings | Leave VR using the headset control, then open Controls & settings |

On Quest, open the play link **in the headset browser** and choose **Enter VR**. Grant the requested immersive-session permission and use controllers. Hand tracking is not implemented. Smooth turning is the default; snap turning is available in Controls & settings before entering VR.

## Saves

Saves belong to a browser and device. They do not sync to GitHub. Use **Controls & settings → Export world** to keep a backup or carry a build to another headset. Importing asks before replacing the current device's world. Unsupported or corrupt saves are preserved rather than overwritten.

The seed and terrain generator version are stored with coordinate-based block edits. Generator version 1 is a compatibility contract: future updates must keep it available for existing worlds.

## Development

Node 22.12+:

```sh
npm ci
npm run dev
npm run check
```

The game has no runtime API, CDN, account, or key dependency. The Three.js bundle and all assets ship with the game. One block is 0.75 metres. The finite build region is approximately 190 × 190 metres, with a vertical limit of 96 metres.

For checks without a headset, append `?test=1` to the game URL. This exposes **Start desktop test** and its control reference: WASD/mouse, left/right click to mine/place, 1–9 to choose blocks, F to fly, Space/Shift to rise/descend, R to return home, Esc for the menu, and F3 for diagnostics. This is a development aid. The public game is VR only, and has no phone gameplay controls.

For browser regression checks (the same checks run in Actions):

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:browser
```

Screenshots and a text report are produced in `artifacts/`. Browser tests exercise the production build under `/Mineworld/` so relative asset paths are checked too. The software renderer's frame rate is **not** a Quest benchmark.

Push builds also keep the latest screenshot set and report on the `previews` branch, including failure captures. This branch contains test output only and never deploys the game.

## Deployment

In repository **Settings → Pages**, select **GitHub Actions** as the source once. Code pushes to `main` then run world/physics/save tests, build, run the browser check, and deploy. Documentation-only pushes skip deployment. Pull requests run validation without publishing. The workflow can also be run manually from Actions.

If the game builds but the Pages configuration step fails, enable the Pages source above and rerun the workflow. Browser sign-in is not required for routine code updates through the GitHub connection.

See [the direction](docs/DIRECTION.md) and [the development journal](docs/DEVELOPMENT.md) before extending the game.
