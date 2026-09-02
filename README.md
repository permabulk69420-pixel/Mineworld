# Mineworld

A Three.js VR voxel game for Meta Quest. The current **v0.3 foundation** deliberately strips the earlier progression prototype back to the parts worth validating: a large place to inhabit, VR movement, finite gathering, and building.

**[Play Mineworld](https://permabulk69420-pixel.github.io/Mineworld/)** · [Build and deployment](https://github.com/permabulk69420-pixel/Mineworld/actions)

## Current build

- **Journey is quality-first again.** The crude workbench, glowing portal chain, resonators, and decorative tool upgrades from the v0.2 prototype are dormant and do not appear in normal play.
- Generator v2 replaces the tiny-island progression layout with one connected **First Light** landmass spanning well over 130 metres across its major dimensions.
- The player starts in an open southern meadow with a long sightline into the landscape rather than inside a small prefab lookout or dense tree tunnel.
- First Light contains cedar country, an open meadow, lake and stream, broad walkable caves, a northern ridge, western cliffs, elevation changes, and distant natural landmarks.
- Fresh Journey starts with an empty pack. Only materials actually gathered become selectable/buildable; placing them consumes inventory.
- Normal wood, soil, limestone, sand, foliage, and other basic materials can be gathered. Lumen crystal and deepstone remain intentionally unavailable until a future physical tool system deserves to unlock them.
- There is **no visible pickaxe or fake hand tool** in Journey. The previous prototype attached a primitive sideways prop to both controllers while mining remained button-driven; that visual has been removed completely.
- Gathering temporarily remains trigger/raycast-based. The next major interaction, after world scale is accepted in Quest, is one properly designed **one-handed physical mining tool**.
- Walking, collision, stepping, jumping, head-relative locomotion, smooth/snap turning, teleporting, finite inventory, voxel removal/placement, local saves, and export/import remain functional.
- Creative mode remains an explicit `?creative=1` development/free-build harness with the full palette and flight.

## Quest controls

| Action | Quest controllers |
| --- | --- |
| Move | Left stick |
| Look / turn | Head / right stick |
| Gather | Hold right trigger |
| Place selected carried material | Hold right grip |
| Carried material | X next / left grip previous |
| Jump | A |
| Teleport | Hold left trigger, aim, release |

The Journey wrist starts at **PACK EMPTY** and only shows materials you actually carry. It does not advertise dormant crafting/progression actions.

On Quest, open the play link in the headset browser and choose **Enter VR**. Hand tracking is not implemented. Smooth turning is the default; snap turning is available in Controls & settings before entering VR.

## Saves

The v0.3 foundation intentionally uses a new save slot:

- v0.3 / generator v2: `mineworld.skyreach.save.v2`
- earlier v0.1–v0.2 prototype: `mineworld.skyreach.save.v1`

The old prototype save is left untouched rather than silently migrated into a fundamentally different landscape. Saves remain browser/device-local; use **Controls & settings → Export world** for backups.

## Development standard

Mineworld is now developed **one important feature at a time**. A technically functioning primitive is not enough to keep a feature in Journey. The current sequence is:

1. validate world scale/composition in Quest;
2. build one polished, one-handed physical mining interaction;
3. only then consider a polished station/world object;
4. grow progression from interactions that already meet the quality bar.

See [the direction](docs/DIRECTION.md) for the explicit quality criteria and [the development journal](docs/DEVELOPMENT.md) for the reset history.

## Development

Node 22.12+:

```sh
npm ci
npm run dev
npm run check
```

For checks without a headset, append `?test=1`. This exposes the desktop regression harness only; the public product remains VR-focused and has no phone gameplay controls. Append `?creative=1` only for deliberate unrestricted testing.

Browser regression:

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:browser
```

The current regression verifies the large generator-v2 foundation, empty Journey inventory, absence of old progression language/state, Creative rendering/flight, v2 saving/export, and browser/runtime errors. Its SwiftShader frame rate is **not** a Quest performance benchmark.

## Deployment

Code pushes to `main` run unit tests, production build, rendered browser checks, screenshot capture, and GitHub Pages deployment. Documentation-only pushes do not replace the runtime build. The stable play URL remains the same.
