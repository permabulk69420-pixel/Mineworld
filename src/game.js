import { BLOCK, PALETTE, BLOCK_SIZE } from './world/blocks.js';

const STARTING_INVENTORY = Object.freeze({
  [BLOCK.PLANKS]: 8,
});
const INVENTORY_IDS = Object.freeze([...PALETTE, BLOCK.BASALT]);

const HOME = Object.freeze({ x: 1.5 * BLOCK_SIZE, z: 25.5 * BLOCK_SIZE });
const ARCH = Object.freeze({ x: 9.5 * BLOCK_SIZE, z: -10.5 * BLOCK_SIZE });
const LUMEN_HOLLOW = Object.freeze({ x: 63.5 * BLOCK_SIZE, z: -81.5 * BLOCK_SIZE });
const HOLLOW_FORGE = Object.freeze({ x: 61.5 * BLOCK_SIZE, z: -85 * BLOCK_SIZE });
const OLD_QUARRY = Object.freeze({ x: 53.5 * BLOCK_SIZE, z: -30.5 * BLOCK_SIZE });
const HOLLOW_RESONATORS = Object.freeze([
  Object.freeze({ x: 57.5 * BLOCK_SIZE, z: -80.5 * BLOCK_SIZE }),
  Object.freeze({ x: 66.5 * BLOCK_SIZE, z: -76.5 * BLOCK_SIZE }),
  Object.freeze({ x: 68.5 * BLOCK_SIZE, z: -85.5 * BLOCK_SIZE }),
]);
const REQUIRED_WOOD = 4;
const REQUIRED_STONE = 6;
const REQUIRED_CRYSTALS = 6;
const MAX_STACK = 99;

export const TOOL = Object.freeze({ HAND: 'hand', QUARRY: 'quarry', RESONANT: 'resonant' });

export function createJourney(saved = null) {
  const inventory = {};
  for (const id of INVENTORY_IDS) inventory[id] = 0;
  Object.assign(inventory, STARTING_INVENTORY);
  if (saved?.inventory) {
    for (const id of INVENTORY_IDS) {
      const value = saved.inventory[id];
      if (Number.isInteger(value) && value >= 0) inventory[id] = Math.min(MAX_STACK, value);
    }
  }
  // Saves created by the first Journey build could already have activated the arch
  // before tool progression existed. Treat that as proof the quarry tool was earned.
  const resonant = saved?.tool === TOOL.RESONANT || Boolean(saved?.deepstoneReached) || Boolean(saved?.quarryReached);
  const tool = resonant ? TOOL.RESONANT
    : saved?.tool === TOOL.QUARRY || saved?.archAwake || saved?.lumenReached ? TOOL.QUARRY : TOOL.HAND;
  const resonators = resonant ? [true, true, true]
    : Array.from({ length:3 },(_,i)=>Boolean(Array.isArray(saved?.resonators) && saved.resonators[i]));
  return {
    inventory,
    tool,
    archAwake: Boolean(saved?.archAwake),
    lumenReached: Boolean(saved?.lumenReached),
    resonators,
    deepstoneReached: Boolean(saved?.deepstoneReached) || Boolean(saved?.quarryReached),
    quarryReached: Boolean(saved?.quarryReached),
  };
}

export function snapshotJourney(journey = null) {
  const value = journey || createJourney();
  const tool = value.tool === TOOL.RESONANT ? TOOL.RESONANT : value.tool === TOOL.QUARRY ? TOOL.QUARRY : TOOL.HAND;
  return {
    inventory: Object.fromEntries(INVENTORY_IDS.map(id=>[id,Math.max(0,Math.min(MAX_STACK,Number.isInteger(value.inventory?.[id])?value.inventory[id]:0))])),
    tool,
    archAwake: Boolean(value.archAwake),
    lumenReached: Boolean(value.lumenReached),
    resonators: Array.from({ length:3 },(_,i)=>Boolean(value.resonators?.[i])),
    deepstoneReached: Boolean(value.deepstoneReached),
    quarryReached: Boolean(value.quarryReached),
  };
}

export function collectBlock(journey, id) {
  if (!INVENTORY_IDS.includes(id)) return 0;
  journey.inventory[id] = Math.min(MAX_STACK, (journey.inventory[id] || 0) + 1);
  if (id === BLOCK.BASALT && journey.tool === TOOL.RESONANT) journey.deepstoneReached = true;
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
  const quarry = journey.tool === TOOL.QUARRY || journey.tool === TOOL.RESONANT;
  const resonant = journey.tool === TOOL.RESONANT;
  if (id === BLOCK.CRYSTAL && !quarry) {
    return { allowed:false, duration:0, message:'Lumen crystal needs a quarry pick.' };
  }
  if (id === BLOCK.BASALT && !resonant) {
    return { allowed:false, duration:0, message:quarry?'Deepstone hums against the quarry pick. Something in Lumen Hollow may change it.':'Deepstone is far too hard by hand.' };
  }
  const duration = {
    [BLOCK.LEAVES]: 0.22,
    [BLOCK.GRASS]: 0.32,
    [BLOCK.PLANKS]: 0.34,
    [BLOCK.GLASS]: 0.38,
    [BLOCK.SOIL]: 0.42,
    [BLOCK.SAND]: 0.42,
    [BLOCK.WOOD]: quarry ? 0.42 : 0.65,
    [BLOCK.STONE]: resonant ? 0.30 : quarry ? 0.42 : 1.05,
    [BLOCK.CRYSTAL]: resonant ? 0.48 : 0.72,
    [BLOCK.BASALT]: 1.15,
  }[id];
  if (!Number.isFinite(duration)) return { allowed:false, duration:0, message:'That cannot be gathered.' };
  return { allowed:true, duration, message:'' };
}

export function quarryRecipeReady(journey) {
  return journey.tool === TOOL.HAND
    && (journey.inventory[BLOCK.WOOD] || 0) >= REQUIRED_WOOD
    && (journey.inventory[BLOCK.STONE] || 0) >= REQUIRED_STONE;
}

/** The first recipe is crafted deliberately at the field bench, never by proximity alone. */
export function craftQuarryPick(journey, body) {
  if (journey.tool !== TOOL.HAND) return { ok:false, message:'Your quarry pick is already ready.' };
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

export function resonatorCount(journey) {
  return Array.from({ length:3 },(_,i)=>Boolean(journey.resonators?.[i])).filter(Boolean).length;
}

export function resonatorsReady(journey) {
  return resonatorCount(journey) === HOLLOW_RESONATORS.length;
}

function nearestDormantResonator(journey, body) {
  let nearest = -1, distance = Infinity;
  for (let i=0;i<HOLLOW_RESONATORS.length;i++) {
    if (journey.resonators?.[i]) continue;
    const point=HOLLOW_RESONATORS[i],d=Math.hypot(body.x-point.x,body.z-point.z);
    if (d<distance){distance=d;nearest=i;}
  }
  return distance < 1.7 ? nearest : -1;
}

/** Journey's context action: craft at First Light, feed Hollow resonators, then temper the tool. */
export function useJourney(journey, body) {
  if (journey.tool === TOOL.HAND) return craftQuarryPick(journey, body);
  if (!journey.lumenReached) return { ok:false, message:'There is nothing here to use yet.' };
  if (journey.tool === TOOL.QUARRY) {
    const index=nearestDormantResonator(journey,body);
    if (index>=0) {
      const crystals=journey.inventory[BLOCK.CRYSTAL]||0;
      if (crystals<1) return { ok:false, message:'This resonator needs one lumen crystal.' };
      journey.inventory[BLOCK.CRYSTAL]-=1;
      journey.resonators[index]=true;
      return { ok:true, event:'resonator-awake', index };
    }
    if (resonatorsReady(journey) && Math.hypot(body.x-HOLLOW_FORGE.x,body.z-HOLLOW_FORGE.z)<1.8) {
      journey.tool=TOOL.RESONANT;
      return { ok:true, event:'tool-resonant' };
    }
    const count=resonatorCount(journey);
    if (count<3) return { ok:false, message:`Wake the Hollow resonators with lumen crystal · ${count}/3.` };
    return { ok:false, message:'The resonators answer the Hollow forge. Stand beside it and press Y.' };
  }
  return { ok:false, message:'The resonant pick is already awake.' };
}

export function updateJourney(journey, body) {
  const events = [];
  if (journey.tool !== TOOL.HAND && !journey.archAwake && (journey.inventory[BLOCK.CRYSTAL] || 0) >= REQUIRED_CRYSTALS) {
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
  if (journey.deepstoneReached && !journey.quarryReached) {
    const distance=Math.hypot(body.x-OLD_QUARRY.x,body.z-OLD_QUARRY.z);
    if(distance<9){journey.quarryReached=true;events.push('quarry-reached');}
  }
  return events;
}

export function archPortalActive(journey, body) {
  return journey.archAwake && Math.hypot(body.x - ARCH.x, body.z - ARCH.z) < 1.6;
}

export function hollowPortalActive(journey, body) {
  return journey.archAwake && journey.lumenReached && Math.hypot(body.x - LUMEN_HOLLOW.x, body.z - LUMEN_HOLLOW.z) < 1.6;
}

export function quarryForgePortalActive(journey, body) {
  return journey.deepstoneReached && Math.hypot(body.x-HOLLOW_FORGE.x,body.z-HOLLOW_FORGE.z)<1.45;
}

export function quarryReturnPortalActive(journey, body) {
  return journey.quarryReached && Math.hypot(body.x-OLD_QUARRY.x,body.z-OLD_QUARRY.z)<1.6;
}

export function journeyObjective(journey) {
  if (journey.tool === TOOL.HAND) {
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
  if (journey.tool === TOOL.QUARRY) {
    const awake=resonatorCount(journey);
    if (awake<3) return `Wake Hollow resonators · ${awake}/3 · feed lumen with Y`;
    return 'Hollow forge awake · press Y to temper quarry pick';
  }
  if (!journey.deepstoneReached) return 'Resonant pick ready · deepstone lies beneath the Hollow';
  if (!journey.quarryReached) return 'Deepstone wakes the Hollow forge · step into its new passage';
  return 'The Old Quarry reached · passage back to Lumen Hollow active';
}

export { REQUIRED_WOOD, REQUIRED_STONE, REQUIRED_CRYSTALS, HOME, ARCH, LUMEN_HOLLOW, HOLLOW_FORGE, HOLLOW_RESONATORS, OLD_QUARRY };