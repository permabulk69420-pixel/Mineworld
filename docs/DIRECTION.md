# Direction: build the world before the game systems

Mineworld should become a beautiful, tactile VR exploration/adventure game in a mutable voxel world. The current problem is more fundamental than progression: **the playable space still reads as a small Minecraft-like island in the headset.** Until that changes, adding tools, traversal mechanics, creatures, crafting, combat, quests, or progression is premature.

## Current judgement

The v0.3 generator solved the previous toy-island problem only numerically. The landmass is larger on paper, but headset judgement is what matters, and in Quest it still feels like a small island rather than a world.

It also inherits too much of Minecraft's visual language: exposed cube terrain, blocky trees, familiar grass/soil/stone layering, similarly scaled terrain noise, and a world whose edge/coastline is easy to comprehend at a glance. Mineworld can remain voxel-based without looking like a Minecraft imitation.

The next milestone is therefore **WORLD**. Do not build a grapple, pickaxe, crafting station, creature, progression loop, new quest, or traversal upgrade until the world itself passes.

## What the next world must achieve

### 1. It must feel genuinely large in VR

The player should not spawn somewhere that lets them mentally measure the whole playable landmass in seconds.

A major destination should take minutes of actual walking to reach, not a short jog. Distant mountains, forests, cliffs and landmarks should sit at scales that create real depth in the headset. The normal view should suggest more world beyond what can immediately be understood.

First Light should be on the order of **hundreds of metres of meaningful traversal scale**, with room to grow toward roughly half-kilometre to kilometre-class regions if Quest performance and streaming support it. Do not achieve this by generating an enormous flat empty sheet.

### 2. The world architecture must stop assuming the whole world is resident

The current generator eagerly creates the whole finite landmass. That architecture encourages tiny worlds because every expansion permanently increases resident chunks, meshes and draw cost.

Before simply multiplying the existing island dimensions, move toward **deterministic chunk streaming around the player**:

- generate/load nearby chunks;
- unload distant detailed chunks safely;
- preserve edits independently of whether a chunk is resident;
- use cheaper distant terrain/landmark representation where useful;
- keep generation deterministic from the world seed;
- maintain safe Quest memory and draw-call budgets.

This is infrastructure in service of visible world scale, not an excuse to disappear into engine work. The result must quickly produce a larger, better-looking playable landscape.

### 3. It must stop looking like Minecraft

Voxel editability does not require every visible object to be a one-metre cube.

Terrain may remain voxel-derived, but the presentation should develop its own visual language:

- custom terrain materials and colour relationships rather than familiar Minecraft-like grass/dirt/stone bands;
- stronger macro geology: long cliffs, shelves, ravines, valleys, ridges, arches, overhangs and exposed strata;
- vegetation that is not a trunk made of blocks with a cube/blob leaf crown;
- non-cubic procedural meshes for trees, shrubs, grasses, rocks, roots and other surface detail where appropriate;
- a continuous-looking water treatment rather than water reading as another pile of cubes;
- atmospheric depth, sky, clouds/haze and distant silhouettes that make scale legible;
- landmarks whose silhouettes remain readable from hundreds of metres away.

Do not chase photorealism. A stylised world is fine. It simply needs to look intentionally like **Mineworld**, not like an approximation of Minecraft assets made with Three.js primitives.

### 4. First Light must be a region, not an island-shaped level pad

The immediate target is one convincing starting region containing materially different spaces: broad open country, dense forest, substantial elevation, water, cliffs/ravines, caves and at least a few strong natural landmarks.

The player does not need quests yet, but walking should continuously reveal new compositions and destinations. A ridge should actually tower over a valley. A forest should have an interior. A cave entrance should imply real depth. Water should occupy geographic space rather than decorate one small depression.

The outer world can eventually contain multiple large regions/landmasses, but do not fake scale by surrounding First Light with a collection of tiny pads.

## World acceptance test

Do not move on to gameplay-system development until a Quest test can answer yes to most of these:

- Does this feel like a place I could get lost in rather than an arena I can immediately understand?
- Can I look toward at least several destinations that feel genuinely far away?
- Do elevation and landmarks feel large at human scale?
- Does moving for several minutes continue to reveal meaningfully different terrain?
- Does the landscape have a visual identity that would not immediately be described as Minecraft?
- Are forests, water, cliffs and caves convincing environments rather than small props/features on one island?
- Does Quest performance remain comfortable while delivering that scale?

If the answer is no, continue working on the world. **Do not compensate by adding gameplay systems.**

## Gameplay direction — deliberately unresolved for now

A large world is not itself a game, but deciding the exact progression loop before the world exists has repeatedly pushed development toward bad implementations: tiny portal islands, crude crafting props, fake tool tiers, and then premature traversal ideas.

Mineworld will eventually need exploration, creatures, danger, equipment, useful building, progression and reasons to travel. None of those are committed to a specific implementation yet.

In particular:

- no Minecraft-style material/tool ladder is assumed;
- no grapple or traversal mechanic is currently scheduled;
- no workbench/crafting tree is currently scheduled;
- no portal-to-the-next-island progression is returning;
- no single gimmick has to define the whole game.

Once the world itself is compelling, choose the next gameplay addition based on what that world naturally makes fun and useful.

## Interface and locomotion principles

The current comfort fixes remain valid regardless of future game design:

- Stick movement is the Journey default.
- Teleport is optional in settings and is mutually exclusive with stick translation.
- Turning is separately selectable as smooth or snap.
- The wrist display is information on demand, hidden by default and toggleable during Journey.
- The player should not be forced to stare at objective/UI text in their peripheral vision.

## Development method

**One important problem at a time.** Right now the important problem is the world.

Immediate sequence:

1. Keep the water/locomotion/wrist cleanup stable.
2. Establish scalable chunk/world streaming sufficient for a genuinely larger region.
3. Rebuild First Light's macro terrain at much larger perceived scale.
4. Replace the most Minecraft-like visual signatures, especially vegetation, terrain palette and water presentation.
5. Add large natural landmarks and stronger biome/subregion composition.
6. Inspect flat screenshots for obvious failures, then judge scale and identity in Quest.
7. Repeat world work until the headset test passes.
8. **Only then choose the first real gameplay system.**

## Guardrails

- Quest 3 is the principal device. Headset judgement overrides dimensions on paper and flat-browser impressions.
- Keep the product VR-first. Desktop remains an opt-in development/regression harness; there are no phone gameplay controls.
- Stay original: no copied Minecraft textures, sounds, names, UI, vegetation designs or progression structures.
- Preserve existing saves where technically possible; if a fundamental generator change requires a new generation slot, preserve older saves separately rather than silently destroying them.
- Do not re-enable dormant v0.2 bench/portal/resonator/tool code because it already exists.
- Do not add traversal, crafting or progression merely to make the build seem more game-like while the world is still weak.
- Preserve GitHub Pages deployment and automated browser regression checks.
- Inspect generated screenshots before asking for headset testing, while recognising screenshots cannot establish VR scale.
