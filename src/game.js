import { BLOCK, PALETTE, BLOCK_SIZE } from './world/blocks.js';

const STARTING_INVENTORY = Object.freeze({
  [BLOCK.PLANKS]: 8,
});

const HOME = Object.freeze({ x: 1.5 * BLOCK_SIZE, z: 25.5 * BLOCK_SIZE });
const ARCH = Object.freeze({ x: 9.5 * BLOCK_SIZE, z: -10.5 * BLOCK_SIZE });
const LUMEN_HOLLOW = Object.freeze({ x: 63.5 * BLOCK_SIZE, z: -81.5 * BLOCK_SIZE });
const REQUIRED_WOOD = 4;
const REQUIRED_STONE = 6;
const REQUIRED_CRYSTALS = 6;
const MAX_STACK = 99;

export const TOOL = Object.freeze({ HAND: 'hand', QUARRY: 'quarry' });

export function createJourney(saved = null) {
  const inventory = {};
  for (const id of PALETTE) inventory[id] = 0;
  Object.assign(inventory, STARTING_INVENTORY);
  if (saved?.inventory) {
    for (const id of PALETTE) {
      const value = saved.inventory[id];
      if (Number.isInteger(value) && value >= 0) inventory[id] = Math.min(MAX_STACK, value);
    }
  }
  // Saves created by the first Journey build could already have activated the arch
  // before tool progression existed. Treat that as proof the quarry tool was earned.
  const tool = saved?.tool === TOOL.QUARRY || saved?.archAwake || saved?.lumenReached ? TOOL.QUARRY : TOOL.HAND;
  return {
    inventory,
    tool,
    archAwake: Boolean(saved?.archAwake),
    lumenReached: Boolean(saved?.lumenReached),
  };
}

export function snapshotJourney(journey = null) {
  const value = journey || createJourney();
  return {
    inventory: { ...value.inventory },
    tool: value.tool === TOOL.QUARRY ? TOOL.QUARRY : TOOL.HAND,
    archAwake: Boolean(value.archAwake),
    lumenReached: Boolean(value.lumenReached),
  };
}

export function collectBlock(journey, id) {
  if (!PALETTE.includes(id)) return 0;
  journey.inventory[id] = Math.min(MAX_STACK, (journey.inventory[id] || 0) + 1);
  return journey.inventory[id];
}

export function canPlace(journey, id) {
  return PALETTE.includes(id) && (journey.inventory[id] || 0) > 0;
}

export function spendBlock(journey, id) {
  if (!canPlace(journey, id)) return false;
  journey.inventory[id] -= 1;
  return true;
}

export function refundBlock(journey, id) {
  if (!PALETTE.includes(id)) return;
  journey.inventory[id] = Math.min(MAX_STACK, (journey.inventory[id] || 0) + 1);
}

/** Mining rules are intentionally small and readable. Later tools can extend this table. */
export function harvestInfo(journey, id) {
  const quarry = journey.tool === TOOL.QUARRY;
  if (id === BLOCK.CRYSTAL && !quarry) {
    return { allowed:false, duration:0, message:'Lumen crystal needs a quarry pick.' };
  }
  if (id === BLOCK.BASALT) {
    return { allowed:false, duration:0, message:quarry?'Deepstone still resists your quarry pick.':'Deepstone is far too hard by hand.' };
  }
  const duration = {
    [BLOCK.LEAVES]: 0.22,
    [BLOCK.GRASS]: 0.32,
    [BLOCK.PLANKS]: 0.34,
    [BLOCK.GLASS]: 0.38,
    [BLOCK.SOIL]: 0.42,
    [BLOCK.SAND]: 0.42,
    [BLOCK.WOOD]: quarry ? 0.42 : 0.65,
    [BLOCK.STONE]: quarry ? 0.42 : 1.05,
    [BLOCK.CRYSTAL]: 0.72,
  }[id];
  if (!Number.isFinite(duration)) return { allowed:false, duration:0, message:'That cannot be gathered.' };
  return { allowed:true, duration, message:'' };
}

export function quarryRecipeReady(journey) {
  return journey.tool !== TOOL.QUARRY
    && (journey.inventory[BLOCK.WOOD] || 0) >= REQUIRED_WOOD
    && (journey.inventory[BLOCK.STONE] || 0) >= REQUIRED_STONE;
}

/** The first recipe is crafted deliberately at the field bench, never by proximity alone. */
export function craftQuarryPick(journey, body) {
  if (journey.tool === TOOL.QUARRY) return { ok:false, message:'Your quarry pick is already ready.' };
  const nearBench = Math.hypot(body.x - HOME.x, body.z - HOME.z) < 6.5;
  if (!nearBench) return { ok:false, message:'Craft the quarry pick at the First Light field bench.' };
  const wood = journey.inventory[BLOCK.WOOD] || 0;
  const stone = journey.inventory[BLOCK.STONE] || 0;
  if (wood < REQUIRED_WOOD || stone < REQUIRED_STONE) {
    return { ok:false, message:`Quarry pick needs cedar ${wood}/${REQUIRED_WOOD} · limestone ${stone}/${REQUIRED_STONE}.` };
  }
  journey.inventory[BLOCK.WOOD] -= REQUIRED_WOOD;
  journey.inventory[BLOCK.STONE] -= REQUIRED_STONE;
  journey.tool = TOOL.QUARRY;
  return { ok:true, event:'tool-crafted' };
}

export function updateJourney(journey, body) {
  const events = [];
  if (journey.tool === TOOL.QUARRY && !journey.archAwake && (journey.inventory[BLOCK.CRYSTAL] || 0) >= REQUIRED_CRYSTALS) {
    const distance = Math.hypot(body.x - ARCH.x, body.z - ARCH.z);
    if (distance < 5.5) {
      journey.inventory[BLOCK.CRYSTAL] -= REQUIRED_CRYSTALS;
      journey.archAwake = true;
      events.push('arch-awake');
    }
  }
  if (journey.archAwake && !journey.lumenReached) {
    const distance = Math.hypot(body.x - LUMEN_HOLLOW.x, body.z - LUMEN_HOLLOW.z);
    if (distance < 9) {
      journey.lumenReached = true;
      events.push('lumen-reached');
    }
  }
  return events;
}

export function archPortalActive(journey, body) {
  return journey.archAwake && Math.hypot(body.x - ARCH.x, body.z - ARCH.z) < 1.6;
}

export function hollowPortalActive(journey, body) {
  return journey.archAwake && journey.lumenReached && Math.hypot(body.x - LUMEN_HOLLOW.x, body.z - LUMEN_HOLLOW.z) < 1.6;
}

export function journeyObjective(journey) {
  if (journey.tool !== TOOL.QUARRY) {
    const wood = journey.inventory[BLOCK.WOOD] || 0;
    const stone = journey.inventory[BLOCK.STONE] || 0;
    if (wood < REQUIRED_WOOD || stone < REQUIRED_STONE) return `Quarry pick · cedar ${wood}/${REQUIRED_WOOD} · limestone ${stone}/${REQUIRED_STONE}`;
    return 'First Light field bench · press Y to craft quarry pick';
  }
  if (!journey.archAwake) {
    const crystals = journey.inventory[BLOCK.CRYSTAL] || 0;
    if (crystals < REQUIRED_CRYSTALS) return `Gather lumen crystal · ${crystals}/${REQUIRED_CRYSTALS}`;
    return 'Carry 6 lumen crystal into the Old Arch';
  }
  if (!journey.lumenReached) return 'The Old Arch is awake · step through the light';
  return 'Lumen Hollow reached · return waystone active · explore';
}

export { REQUIRED_WOOD, REQUIRED_STONE, REQUIRED_CRYSTALS, HOME, ARCH, LUMEN_HOLLOW };
