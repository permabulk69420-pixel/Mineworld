# Direction: a world worth returning to

Mineworld should become a beautiful, tactile, solitary VR exploration/building game. Voxel interaction is useful vocabulary, but the project only earns new systems when they feel convincing in a headset.

## Current foundation

The v0.2 progression prototype failed the quality bar. It moved too quickly from system to system: small islands, a crude workbench, primitive glowing portals, tiny resonators, and a decorative pick attached to both hands even though mining was still button-driven. Those systems made the project broader without making it better.

The playable build has therefore been cut back to a **v0.3 foundation**. The old v1 prototype save remains preserved, while a generator-v2 save starts on a much larger connected First Light landmass. The current build is about judging place, scale, locomotion, gathering, and building—not pretending unfinished props are finished gameplay.

First Light should feel large enough to inhabit before progression sends the player anywhere else. The current terrain includes an open southern meadow, long sightlines, cedar country, a lake and stream, broad caves, a northern ridge, western cliffs, and distant natural landmarks. Different parts of the same landmass should feel like places worth walking toward rather than small level pads separated by teleports.

## Development method

**One important thing at a time.** A feature does not ship merely because it works technically.

The immediate sequence is:

1. **World scale and composition.** Validate in Quest that First Light feels like a real landscape rather than a toy map. Fix terrain, sightlines, density, landmarks, and scale until it does.
2. **One physical VR tool.** Only after the world passes, build a single one-handed mining/gathering interaction. The model, orientation, reach, animation, collision/feedback, sound, and actual gameplay effect must all belong to the same interaction. Do not attach decorative tools to both controller grips or leave a tool visually disconnected from the action.
3. **One polished world object or station.** A workbench or equivalent returns only when its visual design, scale, placement, interaction, and reason to exist are worth keeping. No primitive-box placeholder is allowed into Journey simply to unlock another system.
4. **One progression beat.** Progression can then grow outward from interactions that already feel good. Travel, portals, creatures, crafting, and additional regions come later and must each clear the same bar.

Do not build three mediocre progression beats when one polished interaction would teach us more.

## Quality bar

Before a new Journey feature is retained, ask:

- Does it look intentional at headset scale from close range?
- Does the player understand what it is without explanatory text compensating for weak form?
- If it appears in the player's hand, does the hand/controller pose make physical sense?
- Does the visible object actually participate in the interaction rather than decorating a button press?
- Does it make the world feel richer rather than smaller or more gamey?
- Would we be comfortable leaving it unchanged for several builds while developing around it?

If the answer is no, remove it rather than layering another feature over it.

## Development priorities

1. Quest 3 scale, locomotion, targeting, reach, sustained performance, and visual composition.
2. A satisfying physical gathering/mining interaction.
3. Terrain variety and landmarks that reward exploration across First Light.
4. Building that is pleasant and eventually useful, without checklist-style house quests.
5. Progression, creatures, traversal upgrades, and additional regions only after the foundation is strong.

## Guardrails

- Quest 3 is the principal device. Headset judgment overrides flat-browser impressions for scale and interaction.
- Keep the product focused on VR. Desktop controls remain an opt-in regression/development harness; there are no phone gameplay controls.
- Stay original: no copied textures, sounds, names, UI, creature designs, or Minecraft branding.
- Preserve old saves rather than silently destroying them. The v1 prototype save uses `mineworld.skyreach.save.v1`; the v2 foundation uses its own save slot.
- Do not re-enable dormant v0.2 bench/portal/resonator/tool progression just because the code still exists. Rebuild features deliberately when their turn comes.
- Preserve the GitHub Pages workflow and stable play link.
- Inspect generated screenshots for obvious composition/rendering failures before asking for headset testing, while recognizing that screenshots cannot validate VR scale or physical interaction.
