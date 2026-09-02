# Mineworld

A Three.js VR exploration/building project for Meta Quest. The active runtime is back on the coherent **v0.3 large-world foundation** while the next milestone remains **WORLD**: make the environment larger, more varied and visually distinct before adding more gameplay systems.

**[Play Mineworld](https://permabulk69420-pixel.github.io/Mineworld/)** · [Build and deployment](https://github.com/permabulk69420-pixel/Mineworld/actions)

## Current build

- The earlier v0.2 workbench/portal/resonator/tool-tier progression remains dormant.
- Generator v2 provides the connected First Light starting region and includes the lake/stream waterline fix.
- Stick locomotion is the Journey default. Teleport is an optional setting rather than active simultaneously.
- The wrist display is hidden by default and Y toggles it.
- Fresh Journey starts with an empty pack. Gathering/building remain foundation mechanics; there is no active crafting/progression loop.
- There is no visible fake pickaxe or decorative hand tool.
- Creative mode remains an explicit `?creative=1` development/free-build harness with the full palette and flight.

## Rolled-back v0.4 visual experiment

The first attempt to make First Light look less Minecraft-like used a separate smooth visual ground shell over the authoritative voxel terrain, plus renderer-side flora and a new atmosphere treatment. Quest testing showed that architecture was unacceptable:

- the visible ground did not match collision;
- block/step boundaries became unreadable;
- the player could clip through the decorative surface and see the voxel terrain underneath;
- the atmosphere produced a large black view-following artifact.

That experiment has been fully rolled back from the active runtime. Its browser save slot (`mineworld.skyreach.save.v3`) is left untouched rather than deleted, but the game is again using generator v2 / `mineworld.skyreach.save.v2`.

Future terrain work must follow a **single authoritative surface** rule: the surface you see must be the same surface used for walking, collision, raycasts and editing. We can change the renderer/topology/material language, but not by draping a second fake landscape over the real one.

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

On Quest, open the play link in the headset browser and choose **Enter VR**. Hand tracking is not implemented.

## Saves

- active v0.3 / generator v2: `mineworld.skyreach.save.v2`
- failed v0.4 visual study / generator v3: `mineworld.skyreach.save.v3` (preserved, inactive)
- earlier v0.1–v0.2 prototype: `mineworld.skyreach.save.v1`

Saves remain browser/device-local; use **Controls & settings → Export world** for backups.

## Development standard

The current milestone is **WORLD**. Do not add traversal mechanics, pickaxe progression, crafting stations, creature systems, combat loops or quests to compensate for a world that still feels small or derivative.

The next sequence is:

1. redesign the starting area's actual terrain/material/vegetation language without separating visuals from collision;
2. expand into multiple large biome-scale environments rather than repeating First Light;
3. move toward deterministic chunk streaming/distant representation so scale is not limited by fully resident terrain;
4. validate scale, surface readability, visual identity, biome transitions and Quest performance in-headset;
5. only then choose the first real gameplay system based on what is actually fun in that world.

See [the direction](docs/DIRECTION.md) for the world acceptance test and single-surface rule.

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

The regression covers generator-v2 determinism, connected terrain, lake continuity, save validation, locomotion/wrist defaults, Journey/Creative rendering, v2 saving/export, and browser/runtime errors. SwiftShader frame rate is **not** a Quest performance benchmark.

## Deployment

Code pushes to `main` run unit tests, production build, rendered browser checks, screenshot capture, and GitHub Pages deployment. The stable play URL remains the same.
