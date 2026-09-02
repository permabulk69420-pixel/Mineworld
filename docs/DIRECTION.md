# Direction: a world worth returning to

Mineworld should become a beautiful, tactile, solitary VR exploration/building game. Voxel interaction is useful vocabulary, but the project only earns new systems when they feel convincing in a headset.

## What Mineworld is actually becoming

A large landscape is necessary but it is not a game by itself. The v0.3 First Light continent is the **home region and first chapter space**, not the intended total world.

The world should be structured around a small number of **large, memorable playable regions** rather than many tiny progression islands. A major region should be large enough that walking across it has meaning, contains multiple distinct environments and vertical layers, and remains useful after its first objective is complete. Small sky-islets can exist as scenery, secrets, resources or traversal challenges, but they should not masquerade as complete levels.

First Light is the place the player learns the game, establishes a home, opens the underground, and earns the first traversal capability. Later major landmasses should be visible or foreshadowed from high points and reached through physical travel. Do not return to the old pattern of walking into a glowing plane and instantly appearing on a tiny pad.

## Proposed world structure

### Region 1 — First Light

First Light remains one broad connected landmass with several subregions: southern meadow/home country, cedar vale, lake and stream, western cliffs, broad caves/deepstone, and the high northern ridge.

The important change is that these places acquire **different gameplay uses**. They are not merely names on the same terrain:

- meadow/home country: safest building space, storage, later utility stations;
- cedar country: renewable/harvestable wood and eventually ecology;
- lake country: distinct resources and a reason to care about water later;
- caves: first meaningful depth progression, ores/minerals and danger/atmosphere;
- west cliffs / north ridge: traversal tests and long-range landmarks;
- high ridge: first strong reveal of the wider world and eventual route outward.

A player should be able to spend a meaningful opening session on First Light without feeling trapped there or being told to leave after five minutes.

### Later regions

After First Light earns its first major traversal capability, reveal another **large** landmass rather than another micro-island. Each later region should introduce a different environment, resource ecology and physical problem while preserving reasons to return home.

The ideal long-term topology is a handful of large landmasses plus smaller optional islets between them. If the current finite world bounds become too small, expand the chunk/world architecture or stream additional terrain rather than shrinking destinations to fit the old bounds.

Travel between major regions should have spatial meaning: a restored cable route, glider/sky-sail, lift, bridge, moving platform, vehicle, or another physical traversal system. Instant portals are not the default solution.

## Progression spine

Progression should be **capability-driven and spatial**, not `collect N glowing objects → teleport to next pad`.

A plausible first chapter spine is:

1. **Exist in First Light.** Walk, explore, gather loose/simple materials and choose where home starts to form.
2. **Earn one real mining tool.** This must be a convincing one-handed VR interaction, not a controller ornament. For its first test build the tool may simply be granted; acquisition can be designed only after the interaction itself is worth keeping.
3. **The tool opens geology.** Stone and cave materials become physically obtainable, giving the caves a concrete reason to exist.
4. **Bring underground value home.** A later polished utility station lets mined resources become something useful. Do not add this station until its object design and interaction pass the same quality bar as the tool.
5. **Create the first traversal capability.** Underground/processed materials should enable something that changes movement or access: climbing/tethering, a cable system, gliding/sky-sailing, a powered lift, or another VR-appropriate mechanic.
6. **Re-read First Light with the new capability.** Previously awkward cliffs, ridge routes, caves or gaps become accessible. The upgrade should change the old world before it merely unlocks a new one.
7. **Reveal and physically reach the next major region.** From the ridge or another strong landmark, the player gets a real destination beyond First Light and a persistent route to it.
8. **New region, new problem.** The next landmass should not simply contain stronger rock. It should add an ecological, environmental, traversal or survival problem that meaningfully changes play.

This gives the game a repeating macro-loop:

> **explore a real place → gain a physical capability → use it to reinterpret that place → reach a new large place → bring new value home**

## Building and home

Building remains central, but it should become useful without checklist quests such as `build 20 blocks`.

Useful reasons to build can emerge from storage, processing, shelter from environmental conditions, creature/ecology interactions, farming/gardening, equipment racks, transport infrastructure, or simply creating a convenient base around the systems the player chooses to use.

Home should accumulate utility over time. Progress should not make First Light disposable.

## Interface and locomotion principles

VR interaction should not assume every locomotion scheme is active simultaneously.

- **Stick movement is the Journey default.**
- Teleport is an optional locomotion mode selected in settings. In teleport mode left-stick translation is disabled; in stick mode teleport input/arc is disabled.
- Turning remains a separate smooth/snap preference.
- The wrist display is information on demand, not permanent scenery. It is hidden by default and Y toggles it during Journey; settings can choose the default visibility.
- Progression should rely on world readability and physical cues before permanent objective text.

## Current foundation

The v0.2 progression prototype failed the quality bar. It moved too quickly from system to system: small islands, a crude workbench, primitive glowing portals, tiny resonators, and a decorative pick attached to both hands even though mining was still button-driven. Those systems made the project broader without making it better.

The playable build has therefore been cut back to a **v0.3 foundation**. The old v1 prototype save remains preserved, while a generator-v2 save starts on a much larger connected First Light landmass. The current build is about establishing a credible place and interaction foundation before the progression spine above is implemented.

## Development method

**One important thing at a time.** A feature does not ship merely because it works technically.

The immediate sequence is:

1. **Foundation defects and comfort.** Fix terrain/water bugs, locomotion exclusivity, wrist presence, controller mapping and other obvious headset problems.
2. **One physical VR mining tool.** Model, orientation, reach, swing/hit logic, feedback, sound and gameplay effect belong to the same interaction. No bench or second tool in the same pass.
3. **Give the caves a reason to exist.** Once mining itself is good, design the first underground resource/depth loop around that tool.
4. **One polished home utility object.** Only then introduce a station/storage/processing object whose physical design is worth keeping.
5. **One traversal capability.** Make it change how First Light can be explored before using it to reach another major region.
6. **Second large region.** Expand the world only after First Light has an actual game loop and a reason to return.

Do not build three mediocre progression beats when one polished interaction would teach us more.

## Quality bar

Before a new Journey feature is retained, ask:

- Does it look intentional at headset scale from close range?
- Does the player understand what it is without explanatory text compensating for weak form?
- If it appears in the player's hand, does the hand/controller pose make physical sense?
- Does the visible object actually participate in the interaction rather than decorating a button press?
- Does it give the player a new reason to move, build, return, or experiment?
- Does it make the world feel richer rather than smaller or more gamey?
- Would we be comfortable leaving it unchanged for several builds while developing around it?

If the answer is no, remove it rather than layering another feature over it.

## Guardrails

- Quest 3 is the principal device. Headset judgment overrides flat-browser impressions for scale and interaction.
- Keep the product focused on VR. Desktop controls remain an opt-in regression/development harness; there are no phone gameplay controls.
- Stay original: no copied textures, sounds, names, UI, creature designs, or Minecraft branding.
- Preserve old saves rather than silently destroying them. The v1 prototype save uses `mineworld.skyreach.save.v1`; the v2 foundation uses its own save slot.
- Do not re-enable dormant v0.2 bench/portal/resonator/tool progression just because the code still exists. Rebuild features deliberately when their turn comes.
- Do not use tiny islands to create artificial content count. Major destinations must justify the trip.
- Preserve the GitHub Pages workflow and stable play link.
- Inspect generated screenshots for obvious composition/rendering failures before asking for headset testing, while recognizing that screenshots cannot validate VR scale or physical interaction.
