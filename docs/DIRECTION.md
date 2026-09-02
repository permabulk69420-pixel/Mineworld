# Direction: build the world before the game systems

Mineworld should become a beautiful, tactile VR exploration/adventure game in a mutable voxel world. The current problem is more fundamental than progression: **the world must stop reading as a small Minecraft-like island before more game systems are allowed to define it.**

The next milestone is therefore **WORLD**. Do not build a grapple, pickaxe progression, crafting station, creature system, combat loop, quest chain, or traversal upgrade to compensate for an environment that is not yet convincing.

## Current judgement

The v0.3 generator solved the original toy-island problem only numerically. It made the landmass larger on paper, but in Quest the starting area still read immediately as Minecraft: stepped cube terrain, green cap over brown dirt, stone beneath, block trunks, block/blob foliage, and a comprehensible island edge.

The v0.4 world study begins removing that visual inheritance rather than merely scaling it up.

Current visual-reset work includes:

- generated WOOD/LEAVES forests removed entirely;
- natural vegetation rendered as procedural non-cubic geometry;
- a smoother visual ground skin draped over the editable voxel terrain;
- familiar grass/dirt/stone stratigraphy broken into sunmoss, blue shale and sparse loam pockets;
- pixel-art/nearest-neighbour terrain treatment replaced by broader painted material structure;
- cubic clouds replaced by soft ellipsoidal cloud forms;
- long rock ribs introduced as macro silhouettes rather than relying only on noise hills;
- shoreline reeds and wind-shaped sail flora used as the first non-Minecraft vegetation study.

This art direction is **not locked**. If the sail flora or sunmoss world still looks cheap, generic, over-stylised, or derivative in Quest, change it. The requirement is a recognisable Mineworld identity, not attachment to the first experiment.

## Do not expand one biome forever

Making the current starting country four times larger is not the solution. First Light should become **one biome-scale part of a much broader region**, not the template repeated to the horizon.

Expansion must introduce genuinely different places. A biome is not a palette swap. Its terrain grammar, vegetation silhouettes, ground materials, water relationship, atmospheric character, density and major landforms must change.

The initial broad world should eventually contain at least three strong environmental identities with long geographic transitions. A useful working set is:

- **First Light / wind garden** — the comparatively open starting country: sunmoss, low rolling ground, sail flora, lake country and exposed blue shale. This is the familiar anchor, not the whole world.
- **Wind-cut stone country** — a broad drier basin/upland dominated by long exposed strata, fins, shelves, pillars, natural arches and ravines. Sparse vegetation should have a radically different silhouette from First Light.
- **Dark wet lowlands** — lower terrain with substantial continuous water, channels, reeds/roots or other unusual growth, darker geology and denser atmospheric depth. It must not read as a Minecraft swamp.
- **High pale country** can become a later extension: major elevation, exposed pale geology, cloud/haze, sparse strange vegetation and monumental distant forms.

These names and exact themes are provisional. The invariant is diversity of **form**.

Biome transitions should take meaningful travel time and follow geography. Avoid checkerboard climate noise or abrupt `grass -> desert -> snow` borders. Valleys can become wetter; elevation can expose different geology; rain shadows can create dry country; vegetation should thin, change and overlap through transition zones.

## What the world must achieve

### 1. It must feel genuinely large in VR

The player should not spawn somewhere that lets them mentally measure the whole playable landmass in seconds.

Major destinations should take minutes of actual walking to reach. Distant mountains, forests, cliffs and landmarks should sit at scales that create real depth in the headset. The normal view should suggest more world beyond what can immediately be understood.

First Light plus neighbouring biome-scale country should reach **hundreds of metres of meaningful traversal scale**, with room to grow toward roughly half-kilometre to kilometre-class regions if Quest performance and streaming support it. Do not achieve this with a giant flat sheet.

### 2. The world architecture must stop assuming everything is resident

The current generator still eagerly creates the finite region. That architecture encourages small worlds because expansion permanently increases resident chunks, meshes and draw cost.

Move toward deterministic chunk streaming around the player:

- generate/load nearby chunks;
- unload distant detailed chunks safely;
- preserve edits independently of chunk residency;
- use cheaper distant terrain/landmark representation where useful;
- keep generation deterministic from the seed;
- maintain safe Quest memory and draw-call budgets.

This infrastructure only matters if it quickly produces a visibly larger and more varied world. Do not disappear into engine work for its own sake.

### 3. Voxel data does not dictate voxel presentation

The world remains mutable and block-addressable underneath, but natural scenery should not look constructed from the same cubes the player places.

Use non-cubic procedural geometry, smooth visual terrain treatments, continuous-looking water, macro geology, atmospheric depth and distant silhouettes. Player edits can still expose or place discrete voxel forms; untouched nature should have its own presentation layer.

### 4. First Light must become one part of a region

Walking outward from First Light should eventually produce a major environmental transition instead of more copies of the same hills and vegetation.

A ridge should tower over a valley. A forest/growth field should have an interior. A cave entrance should imply real depth. Water should occupy geographic space. Distant silhouettes should create destinations before any quest text does.

Do not fake world size by surrounding the start with tiny pads or islands.

## World acceptance test

Do not move on to gameplay-system development until a Quest test can answer yes to most of these:

- Does this feel like a place I could get lost in rather than an arena I can immediately understand?
- Can I look toward several destinations that feel genuinely far away?
- After travelling for minutes, have I entered places whose geology and vegetation genuinely differ from where I started?
- Do biome transitions feel geographic rather than procedural tiles?
- Do elevation and landmarks feel large at human scale?
- Would someone seeing the opening area without context immediately call it Minecraft-like? If yes, keep changing it.
- Are vegetation, water, cliffs and caves convincing environments rather than small props/features?
- Does Quest performance remain comfortable while delivering that scale?

If the answer is no, continue working on the world. **Do not compensate by adding gameplay systems.**

## Gameplay direction — deliberately unresolved

A large world is not itself a game, but inventing progression before the world existed repeatedly pushed development into bad implementations: tiny portal islands, crude crafting props, fake tool tiers, and premature traversal ideas.

Mineworld will eventually need exploration, creatures, danger, equipment, useful building, progression and reasons to travel. None of those are committed to a specific implementation yet. Once the world is worth inhabiting, choose the first real system based on what is actually fun there.

## Current comfort fixes to preserve

- Stick locomotion is the default Journey mode.
- Teleport is an optional locomotion mode rather than active simultaneously.
- Smooth/snap turning is a separate preference.
- The wrist display is hidden by default and Y toggles it.
- The lake waterline defect has regression coverage.

## Save/version guardrail

Generator changes that materially alter terrain get a new save slot rather than silently applying old edits to new geography.

- generator v3 / v0.4 world study: `mineworld.skyreach.save.v3`
- generator v2 / v0.3 large-world foundation: `mineworld.skyreach.save.v2`
- earlier prototype: `mineworld.skyreach.save.v1`

Keep prior slots untouched.

## Guardrails

- Quest 3 is the principal device. Headset judgement overrides flat-browser impressions for scale and interaction.
- Keep the product focused on VR. Desktop controls remain an opt-in regression/development harness; there are no phone gameplay controls.
- Stay original: no copied textures, sounds, names, UI, creature designs, or Minecraft branding.
- Do not re-enable dormant v0.2 bench/portal/resonator/tool progression just because the code still exists.
- Do not use tiny islands to create artificial content count.
- Preserve the GitHub Pages workflow and stable play link.
- Inspect generated screenshots for obvious composition/rendering failures before asking for headset testing, while recognizing screenshots cannot validate VR scale or physical interaction.
