# Mineworld

A Three.js VR voxel game for Meta Quest. The first chapter, **Skyreach**, is a quiet archipelago of floating islands, cedar groves, springs, caves, ruins, lumen crystals, and buried deepstone. Gather real resources, establish a home, make tools, restore old passages, and build somewhere worth returning to.

**[Play Mineworld](https://permabulk69420-pixel.github.io/Mineworld/)** · [Build and deployment](https://github.com/permabulk69420-pixel/Mineworld/actions)

![The Skyreach Isles in Mineworld](docs/skyreach.jpg)

## Current game

- Seven deterministic, fully editable islands with original procedural textures.
- **Journey mode is the normal game:** a fresh world starts with an empty pack. Only materials actually gathered are selectable/buildable, and placing blocks consumes them.
- The Journey wrist is an inventory, not a creative palette: at the start it reads **PACK EMPTY** and exposes no build slots. Material slots appear only when that material is carried.
- Gathering is tool-aware. Cedar and limestone can be gathered with the field tool; lumen crystal requires the quarry pick; deepstone requires the later resonant pick.
- The opening now requires the player to establish their own workspace. Gather **3 cedar + 2 limestone**, choose a spot on First Light, and press **Y** to construct and place the field bench there. Its position persists with the save.
- After the bench exists, gather **2 more cedar + 4 limestone** and use **Y** beside your own bench to make the quarry pick. There is no prebuilt station at spawn.
- With the quarry pick, gather **6 lumen crystals** and carry them to the Old Arch. The restored arch becomes a real portal to Lumen Hollow, where a paired waystone provides a persistent route home.
- **Lumen Hollow is a second progression beat:** feed one lumen crystal into each of three resonators around the island, then use the awakened Hollow forge to temper the quarry pick into the luminous resonant pick.
- Deepstone exists beneath the islands rather than as a decorative quest item. The resonant pick can break it; carried deepstone is tracked separately from the building inventory.
- Recovering the first deepstone wakes a second passage in the Hollow forge. Entering it reaches **The Old Quarry**, whose heavier return waystone permanently reconnects the Quarry to Lumen Hollow.
- Different materials have different hold-to-gather times, with visible targeting progress and blocked-material feedback.
- Walking, collision, single-block stepping, jumping, teleporting, and head-relative VR locomotion.
- Quest WebXR: tracked controllers, smooth or snap turning, teleport arc, three visible hand-tool states, and a wrist inventory/objective display. The resonant wrist also shows carried deepstone.
- Automatic saves in the current browser, plus JSON export/import for backups and device transfers. Bench location, tool upgrades, resonators, deepstone, and discovered passages persist with the world.
- Chunk meshes with hidden-face removal and vertex ambient occlusion; instanced foliage and debris.
- GitHub Actions tests, builds, captures fresh-Journey/First Light/Hollow/Quarry screenshots, exercises real portal traversal, and deploys to GitHub Pages.

Creative mode remains available as an explicit development/free-building mode with `?creative=1`; it is not the product default. Flight and unlimited placement live there instead of weakening Journey progression.

## Controls

| Action | Quest controllers |
| --- | --- |
| Move | Left stick |
| Look / turn | Head / right stick |
| Gather / mine | Hold right trigger |
| Place selected carried material | Hold right grip |
| Carried material | X next / left grip previous |
| Craft / build station / use / feed resonator | Y |
| Jump | A |
| Teleport | Hold left trigger, aim at ground, release |
| Return home / settings | Leave VR using the headset control, then open Controls & settings |

The wrist shows only materials currently carried, their counts, your current tool, and the current Journey objective. A fresh game has no build slots. Material cycling skips empty stacks. Once the resonant pick is earned, the wrist also shows deepstone carried outside the build palette. Flight is disabled in Journey mode. In explicit creative mode, the full palette is available, Y toggles flight, and A/B move vertically.

On Quest, open the play link **in the headset browser** and choose **Enter VR**. Grant the requested immersive-session permission and use controllers. Hand tracking is not implemented. Smooth turning is the default; snap turning is available in Controls & settings before entering VR.

## Saves

Saves belong to a browser and device. They do not sync to GitHub. Use **Controls & settings → Export world** to keep a backup or carry a build to another headset. Importing asks before replacing the current device's world. Unsupported or corrupt saves are preserved rather than overwritten.

The seed and terrain generator version are stored with coordinate-based block edits. Journey inventory, player-established bench location, tool state, resonator state, deepstone progress, and passage discoveries are stored alongside them. Generator version 1 remains a compatibility contract so existing worlds keep their original terrain.

The short-lived prototype that gifted eight cedar planks on a completely untouched Journey save is migrated to the new empty-pack opening. Progressed saves and player edits are not discarded.

## Development

Node 22.12+:

```sh
npm ci
npm run dev
npm run check
```

The game has no runtime API, CDN, account, or key dependency. The Three.js bundle and all assets ship with the game. One block is 0.75 metres. The finite build region is approximately 190 × 190 metres, with a vertical limit of 96 metres.

For checks without a headset, append `?test=1` to the game URL. This exposes **Start desktop test** and its control reference. It remains a development aid; the public product is VR only, with no phone gameplay controls. Append `?creative=1` only when deliberately testing unrestricted building/flight.

For browser regression checks (the same checks run in Actions):

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:browser
```

Screenshots and a text report are produced in `artifacts/`. Browser tests exercise the production build under `/Mineworld/` so relative asset paths are checked too. The fresh Journey check asserts that no unowned build slots are visible and captures `journey-start.jpg`. Staged Journey checks also render Lumen Hollow and use the actual runtime forge passage to reach The Old Quarry. The software renderer's frame rate is **not** a Quest benchmark.

Push builds also keep the latest screenshot set and report on the `previews` branch, including failure captures. This branch contains test output only and never deploys the game.

## Deployment

This repository deploys through **GitHub Actions → GitHub Pages**. Code pushes to `main` run world/physics/save/game tests, build, run the browser check, and deploy. Documentation-only pushes skip deployment. Pull requests run validation without publishing. The workflow can also be run manually from Actions.

For a new fork, select **Settings → Pages → GitHub Actions** as the source once. Browser sign-in is not required for routine code updates through the GitHub connection.

See [the direction](docs/DIRECTION.md) and [the development journal](docs/DEVELOPMENT.md) before extending the game.
