import { BLOCK, PALETTE, BLOCK_SIZE } from './world/blocks.js';

const STARTING_INVENTORY = Object.freeze({
  [BLOCK.PLANKS]: 8,
});

const ARCH = Object.freeze({ x: 9 * BLOCK_SIZE, z: -11 * BLOCK_SIZE });
const LUMEN_HOLLOW = Object.freeze({ x: 63 * BLOCK_SIZE, z: -82 * BLOCK_SIZE });
const REQUIRED_CRYSTALS = 6;
const MAX_STACK = 99;

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
  return {
    inventory,
    archAwake: Boolean(saved?.archAwake),
    lumenReached: Boolean(saved?.lumenReached),
  };
}

export function snapshotJourney(journey = null) {
  const value = journey || createJourney();
  return {
    inventory: { ...value.inventory },
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

export function updateJourney(journey, body) {
  const events = [];
  if (!journey.archAwake && (journey.inventory[BLOCK.CRYSTAL] || 0) >= REQUIRED_CRYSTALS) {
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

export function journeyObjective(journey) {
  if (!journey.archAwake) {
    const crystals = journey.inventory[BLOCK.CRYSTAL] || 0;
    if (crystals < REQUIRED_CRYSTALS) return `Gather lumen crystal · ${crystals}/${REQUIRED_CRYSTALS}`;
    return 'Carry 6 lumen crystal to the Old Arch';
  }
  if (!journey.lumenReached) return 'The arch points east · find Lumen Hollow';
  return 'Lumen Hollow reached · make this place yours';
}

export { REQUIRED_CRYSTALS };
