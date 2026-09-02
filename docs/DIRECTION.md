# Direction: build the world before the game systems

Mineworld should become a beautiful, tactile VR exploration/adventure game in a mutable voxel world. The current problem is more fundamental than progression: **the playable space still reads as a small Minecraft-like island in the headset.** Until that changes, adding tools, traversal mechanics, creatures, crafting, combat, quests, or progression is premature.

## Current judgement

The v0.3 generator solved the previous toy-island problem only numerically. The landmass is larger on paper, but headset judgement is what matters, and in Quest it still feels like a small island rather than a world.

It also inherits too much of Minecraft's visual language: exposed cube terrain, blocky trees, familiar grass/soil/stone layering, similarly scaled terrain noise, and a world whose edge/coastline is easy to comprehend at a glance. Mineworld can remain voxel-based without looking like a Minecraft imitation.

The next milestone is therefore **WORLD**. Do not build a grapple, pickaxe, crafting station, creature, progression loop, new quest, or traversal upgrade until the world itself passes.

## Do not expand one biome forever

Making the existing meadow/cedar terrain four times larger is not the solution. The current green country should become **one starting biome inside a much broader geographic region**, not the template repeated to the horizon.

Expansion must introduce genuinely different biome-scale places. A biome is not just a palette swap. Its terrain grammar, vegetation silhouettes, ground materials, water relationship, atmospheric character, density and major landforms should change.

The initial world target should contain at least three large-scale environmental identities with long, natural transitions between them. A plausible art-direction test set is:

- **First Light / green country** — the comparatively familiar starting landscape: open grass country, cedar groves, lakes and sheltered valleys. Keep it as an anchor rather than the whole game.
- **Wind-cut stone country** — a broad drier basin or upland dominated by long exposed strata, fins, shelves, pillars, arches and ravines. Sparse vegetation should use non-block silhouettes and the horizon should read radically differently from First Light.
- **Dark wet lowlands** — a lower, wetter region with substantial continuous water, channels, giant roots/reeds or other unusual growth, darker ground and a denser atmospheric silhouette. It should not look like a Minecraft swamp.
- **High pale country** can become a later extension: major elevation, exposed pale geology, cloud/haze, sparse strange vegetation and distant monumental forms.

These names and exact themes are provisional. The requirement is diversity of **form**, not attachment to a specific biome list.

Biome transitions should take meaningful travel time and follow geography. Avoid checkerboard noise or abrupt `grass -> desert -> snow` borders. Valleys can become wetter; elevation can expose different geology; rain shadows can create dry country; forests can thin naturally into stone uplands.

## What the next world must achieve

### 1. It must feel genuinely large in VR

The player should not spawn somewhere that lets them mentally measure the whole playable landmass in seconds.

A major destination should take minutes of actual walking to reach, not a short jog. Distant mountains, forests, cliffs and landmarks should sit at scales that create real depth in the headset. The normal view should suggest more world beyond what can immediately be understood.

First Light and its neighbouring biome-scale country should be on the order of **hundreds of metres of meaningful traversal scale**, with room to grow toward roughly half-kilometre to kilometre-class regions if Quest performance and streaming support it. Do not achieve this by generating an enormous flat empty sheet.

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
- continuous-looking water rather than water reading as another pile of cubes;
- atmospheric depth, sky, clouds/haze and distant silhouettes that make scale legible;
- landmarks whose silhouettes remain readable from hundreds of metres away.

Do not chase photorealism. A stylised world is fine. It simply needs to look intentionally like **Mineworld**, not like an approximation of Minecraft assets made with Three.js primitives.

### 4. First Light must become one part of a region, not an island-shaped level pad

The immediate target is a convincing starting geography in which First Light occupies only part of what the player can travel through. It can contain broad open country, forest and water, but walking outward should eventually produce a major environmental transition instead of more copies of the same hills and trees.

The player does not need quests yet, but walking should continuously reveal new compositions and destinations. A ridge should actually tower over a valley. A forest should have an interior. A cave entrance should imply real depth. Water should occupy geographic space rather than decorate one small depression.

Do not fake world size by surrounding First Light with a collection of tiny pads or islands.

## World acceptance test

Do not move on to gameplay-system development until a Quest test can answer yes to most of these:

- Does this feel like a place I could get lost in rather than an arena I can immediately understand?
- Can I look toward several destinations that feel genuinely far away?
- After travelling for minutes, have I entered places whose geology and vegetation genuinely differ from where I started?
- Do biome transitions feel geographic rather than like procedural tiles?
- Do elevation and landmarks feel large at human scale?
- Does the landscape have a visual identity that would not immediately be described as Minecraft?
- Are forests, water, cliffs and caves convincing environments rather than small props/features on one island?
- Does Quest performance remain comfortable while delivering that scale?

If the answer is no, continue working on the world. **Do not compensate by adding gameplay systems.**

## Gameplay direction — deliberately unresolved for now

A large world is not itself a game, but deciding the exact progression loop before the world exists has repeatedly pushed development toward bad implementations: tiny portal islands, crude crafting props, fake tool tiers, and then premature traversal ideas.

Mineworld will eventually need exploration, creatures, danger, equipment, useful building, progression and reasons to travel. None of those are committed to a specific implementation yet.

## Current comfort fixes

The current deployed foundation keeps the necessary VR cleanup already completed:

- stick locomotion is the default Journey mode;
- teleport locomotion is optional rather than active at the same time;
- smooth/snap turning remains separate;
- the wrist display is hidden by default and can be toggled;
- the lake waterline defect has regression coverage.

Preserve these while rebuilding the world.

## Guardrails

- Quest 3 is the principal device. Headset judgement overrides flat-browser impressions for scale and interaction.
- Keep the product focused on VR. Desktop controls remain an opt-in regression/development harness; there are no phone gameplay controls.
- Stay original: no copied textures, sounds, names, UI, creature designs, or Minecraft branding.
- Preserve old saves rather than silently destroying them. Generator changes that invalidate terrain require a new save/generator version or an explicit migration strategy.
- Do not re-enable dormant v0.2 bench/portal/resonator/tool progression just because the code still exists.
- Do not use tiny islands to create artificial content count.
- Preserve the GitHub Pages workflow and stable play link.
- Inspect generated screenshots for obvious composition/rendering failures before asking for headset testing, while recognizing that screenshots cannot validate VR scale or physical interaction.
