# Direction: build the world before the game systems

Mineworld should become a beautiful, tactile VR exploration/adventure game in a mutable voxel world. The current problem is more fundamental than progression: **the world must stop reading as a small Minecraft-like island before more game systems are allowed to define it.**

The next milestone remains **WORLD**. Do not build a grapple, pickaxe progression, crafting station, creature system, combat loop, quest chain, or traversal upgrade to compensate for an environment that is not yet convincing.

## Current judgement

The v0.3 generator solved the original toy-island problem only numerically. It made the landmass larger on paper, but in Quest the starting area still read immediately as Minecraft: stepped cube terrain, familiar green/brown/stone layering, block trees and a comprehensible island edge.

A v0.4 visual-reset experiment attempted to solve this by draping a smoother decorative ground mesh over the editable voxel world and adding separate procedural flora/cloud geometry. **That experiment failed and has been rolled back.** In Quest it destroyed block/step readability, the player could visibly clip through the decorative surface and see the old authoritative terrain underneath, and the experimental atmosphere produced a large black view-following artifact.

The deployed runtime is therefore back on the coherent generator-v2/v0.3 foundation while the world redesign continues. The v0.4/v3 save created during the failed experiment remains untouched in browser storage but is not the active save slot.

## Non-negotiable VR world rule: one authoritative surface

Where the player sees the ground is where collision, walking, raycasts, gathering, placement and block edits must agree the ground is.

Do **not** solve visual identity by placing a second decorative terrain shell over the voxel collision surface. In VR, even small disagreement between visual and physical surfaces destroys spatial trust.

Future terrain rendering may use bevels, alternate topology, richer shaders/materials, different voxel shapes, higher-resolution terrain cells, marching/surface extraction, or another representation, but the visible surface and the interaction/collision surface must be derived from the same authoritative geometry/data. If natural terrain becomes smooth, physics and interaction must understand that same smooth surface. If interaction remains block-addressable, block boundaries must remain readable enough that the player can predict where they can stand and what they can edit.

Decorative vegetation, rocks and distant scenery may use non-voxel meshes because they are not the walkable terrain itself, but they must not masquerade as solid geometry unless collision/interaction supports them.

## Do not expand one biome forever

Making the current starting country four times larger is not the solution. First Light should become **one biome-scale part of a much broader region**, not the template repeated to the horizon.

Expansion must introduce genuinely different places. A biome is not a palette swap. Its terrain grammar, vegetation silhouettes, ground materials, water relationship, atmospheric character, density and major landforms must change.

The broad world should eventually contain at least three strong environmental identities with long geographic transitions. Exact names/themes are provisional; diversity of **form** is the invariant. One region may be lush/open country, another a wind-cut stone basin with long strata and arches, another a dark wet lowland with substantial continuous water and radically different vegetation, and later high country may use major elevation and pale exposed geology.

Biome transitions should take meaningful travel time and follow geography. Avoid checkerboard climate noise or abrupt `grass -> desert -> snow` borders.

## What the world must achieve

### 1. It must feel genuinely large in VR

The player should not spawn somewhere that lets them mentally measure the whole playable landmass in seconds. Major destinations should take minutes of actual walking to reach. Distant mountains, forests, cliffs and landmarks should create real headset depth and suggest more world beyond what can immediately be understood.

First Light plus neighbouring biome-scale country should reach hundreds of metres of meaningful traversal scale, with room to grow toward roughly half-kilometre to kilometre-class regions if Quest performance and streaming support it. Do not achieve this with a giant empty sheet.

### 2. The world architecture must stop assuming everything is resident

The current generator still eagerly creates the finite region. Move toward deterministic chunk streaming around the player so larger geography does not imply permanently resident detailed chunks. Preserve edits independently of residency and use cheaper distant representation where useful.

This infrastructure matters only if it quickly produces a visibly larger and more varied world. Do not disappear into engine work for its own sake.

### 3. Stop looking like Minecraft without breaking spatial truth

The starting area's identity still needs replacement. Change the actual terrain/material/vegetation language rather than hiding it under another mesh.

Useful avenues include different terrain cell proportions or topology, larger-scale geology instead of noise hills, custom material relationships, non-block natural vegetation, more continuous water treatment, atmosphere/distant silhouettes, and biome-specific landforms. But any change to walkable terrain must obey the one-authoritative-surface rule above.

### 4. First Light must become one part of a region

Walking outward from First Light should eventually produce a major environmental transition instead of more copies of the same hills and vegetation. A ridge should tower over a valley. A forest/growth field should have an interior. A cave entrance should imply real depth. Water should occupy geographic space. Distant silhouettes should create destinations before any quest text does.

Do not fake world size by surrounding the start with tiny pads or islands.

## World acceptance test

Do not move on to gameplay-system development until a Quest test can answer yes to most of these:

- Does this feel like a place I could get lost in rather than an arena I can immediately understand?
- Can I look toward several destinations that feel genuinely far away?
- After travelling for minutes, have I entered places whose geology and vegetation genuinely differ from where I started?
- Do biome transitions feel geographic rather than procedural tiles?
- Do elevation and landmarks feel large at human scale?
- Would someone seeing the opening area without context immediately call it Minecraft-like? If yes, keep changing it.
- Does every walkable visible surface agree with collision and interaction?
- Can the player visually understand steps, ledges and editable terrain boundaries?
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

The active coherent world is generator v2 / `mineworld.skyreach.save.v2`. The earlier prototype remains `mineworld.skyreach.save.v1`. The failed visual experiment used `mineworld.skyreach.save.v3`; do not delete or silently migrate it, but do not make it active again unless a compatible generator is deliberately restored.

Future generator changes that materially alter geography still require a new save slot or an explicit migration strategy.

## Guardrails

- Quest 3 is the principal device. Headset judgement overrides flat-browser impressions for scale and interaction.
- Keep the product focused on VR. Desktop controls remain an opt-in regression/development harness; there are no phone gameplay controls.
- Stay original: no copied textures, sounds, names, UI, creature designs, or Minecraft branding.
- Do not re-enable dormant v0.2 bench/portal/resonator/tool progression just because the code still exists.
- Do not use tiny islands to create artificial content count.
- Preserve the GitHub Pages workflow and stable play link.
- Inspect generated screenshots for obvious composition/rendering failures before asking for headset testing, while recognizing screenshots cannot validate VR scale, stereo artifacts or physical surface agreement.
