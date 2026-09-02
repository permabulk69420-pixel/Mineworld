# Mineworld

A Three.js VR exploration/building project for Meta Quest. The current **v0.4 WORLD STUDY** is deliberately focused on one problem: make the world itself feel large, distinctive, and worth inhabiting before adding more gameplay systems.

**[Play Mineworld](https://permabulk69420-pixel.github.io/Mineworld/)** · [Build and deployment](https://github.com/permabulk69420-pixel/Mineworld/actions)

## Current build

- The earlier v0.2 workbench/portal/resonator/tool-tier progression remains dormant. It is not the design direction.
- First Light is still a finite starting region while the world architecture and art direction are rebuilt. Do not mistake the current region for the intended final world scale.
- The old Minecraft-like natural presentation is being removed: generated block trees are gone, natural terrain uses a smoother visual surface over the editable voxel data, the grass/dirt/stone banding has been broken up, and the terrain atlas no longer uses a pixel-art/nearest-neighbour treatment.
- First Light now uses an initial **wind-garden** language: sunmoss ground, blue shale, sparse rose-loam pockets, rock ribs, shoreline reeds, and procedural non-cubic sail flora. This is an art-direction experiment, not a locked final biome.
- Natural vegetation is renderer-side procedural geometry. `Sailwood` / `Sailleaf` voxels remain available as player building materials but are not used to construct generated forests.
- The next world expansion must introduce genuinely different biome-scale places rather than extending the starting biome forever.
- Fresh Journey still starts with an empty pack. Gathering/building remain available as foundation mechanics, but there is no active crafting/progression loop to validate yet.
- There is no visible fake pickaxe or decorative hand tool.
- Creative mode remains an explicit `?creative=1` development/free-build harness with the full palette and flight.

## Quest controls

| Action | Quest controllers |
| --- | --- |
| Move | Left stick in Stick locomotion mode |
| Look / turn | Head / right stick |
| Gather | Hold right trigger |
| Place selected carried material | Hold right grip |
| Carried material | X next / left grip previous |
| Wrist display | Y toggles |
| Jump | A |
| Teleport | Optional locomotion mode selected in settings |

Stick locomotion is the Journey default. Teleport is **not** active at the same time; select it explicitly in Controls & settings. Smooth/snap turning remains a separate preference. The wrist display is hidden by default and can be toggled with Y.

On Quest, open the play link in the headset browser and choose **Enter VR**. Hand tracking is not implemented.

## Saves

The visual-reset terrain uses a new save slot rather than silently applying old edits to changed geography:

- v0.4 / generator v3: `mineworld.skyreach.save.v3`
- v0.3 large-world foundation / generator v2: `mineworld.skyreach.save.v2`
- earlier v0.1–v0.2 prototype: `mineworld.skyreach.save.v1`

Both earlier save slots are left untouched. Saves remain browser/device-local; use **Controls & settings → Export world** for backups.

## Development standard

The current milestone is **WORLD**. Do not add a grapple, pickaxe progression, crafting station, creature system, combat loop, or quest chain to compensate for a world that still feels small or derivative.

The immediate sequence is:

1. give the starting area a visual identity that does not immediately read as Minecraft;
2. expand into multiple large biome-scale environments instead of repeating First Light;
3. move toward deterministic chunk streaming/distant representation so scale is not constrained by keeping the whole world resident;
4. validate scale, visual identity, biome transitions, and Quest performance in-headset;
5. only then choose the first real gameplay system based on what is actually fun in that world.

See [the direction](docs/DIRECTION.md) for the world acceptance test and [the development journal](docs/DEVELOPMENT.md) for iteration history.

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

The regression covers generator-v3 determinism, connected terrain, lake continuity, absence of generated WOOD/LEAVES forests, save-slot preservation, locomotion/wrist defaults, Journey/Creative rendering, v3 saving/export, and browser/runtime errors. SwiftShader frame rate is **not** a Quest performance benchmark.

## Deployment

Code pushes to `main` run unit tests, production build, rendered browser checks, screenshot capture, and GitHub Pages deployment. The stable play URL remains the same.
