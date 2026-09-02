import { BLOCK, PALETTE, BLOCK_SIZE } from './world/blocks.js';

const INVENTORY_IDS = Object.freeze([...PALETTE, BLOCK.BASALT]);
const MAX_STACK = 99;

// Legacy coordinates stay exported so dormant prototype scene code keeps compiling.
// They are deliberately inactive in the current foundation build.
const HOME = Object.freeze({ x: 0, z: 34 * BLOCK_SIZE });
const ARCH = Object.freeze({ x: 0, z: 0 });
const LUMEN_HOLLOW = Object.freeze({ x: 0, z: 0 });
const HOLLOW_FORGE = Object.freeze({ x: 0, z: 0 });
const OLD_QUARRY = Object.freeze({ x: 0, z: 0 });
const HOLLOW_RESONATORS = Object.freeze([]);
const BENCH_WOOD = 0;
const BENCH_STONE = 0;
const REQUIRED_WOOD = 0;
const REQUIRED_STONE = 0;
const REQUIRED_CRYSTALS = 0;

export const TOOL = Object.freeze({ HAND: 'hand', QUARRY: 'quarry', RESONANT: 'resonant' });

export function createJourney(saved = null) {
  const inventory = {};
  for (const id of INVENTORY_IDS) inventory[id] = 0;
  if (saved?.inventory) {
    for (const id of INVENTORY_IDS) {
      const value = saved.inventory[id];
      if (Number.isInteger(value) && value >= 0) inventory[id] = Math.min(MAX_STACK, value);
    }
  }
  return {
    inventory,
    tool: TOOL.HAND,
    bench: null,
    archAwake: false,
    lumenReached: false,
    resonators: [],
    deepstoneReached: false,
    quarryReached: false,
  };
}

export function snapshotJourney(journey = null) {
  const value = journey || createJourney();
  return {
    inventory: Object.fromEntries(INVENTORY_IDS.map(id=>[
      id,
      Math.max(0,Math.min(MAX_STACK,Number.isInteger(value.inventory?.[id])?value.inventory[id]:0)),
    ])),
    tool: TOOL.HAND,
    bench: null,
    archAwake: false,
    lumenReached: false,
    resonators: [],
    deepstoneReached: false,
    quarryReached: false,
  };
}

export function collectBlock(journey, id) {
  if (!INVENTORY_IDS.includes(id)) return 0;
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
  journey.inventory[id] = Math.min(MAX_STACK, (journey.inventory[id] || 0) + 1;
}

/** Foundation build: gather/build stays usable while fake tool progression is removed. */
export function harvestInfo(_journey, id) {
  if (id === BLOCK.CRYSTAL) return { allowed:false, duration:0, message:'Lumen crystal is not harvestable in this foundation build yet.' };
  if (id === BLOCK.BASALT) return { allowed:false, duration:0, message:'Deepstone is not harvestable in this foundation build yet.' };
  const duration = {
    [BLOCK.LEAVES]: 0.22,
    [BLOCK.GRASS]: 0.32,
    [BLOCK.PLANKS]: 0.34,
    [BLOCK.GLASS]: 0.38,
    [BLOCK.SOIL]: 0.42,
    [BLOCK.SAND]: 0.42,
    [BLOCK.WOOD]: 0.65,
    [BLOCK.STONE]: 1.05,
  }[id];
  if (!Number.isFinite(duration)) return { allowed:false, duration:0, message:'That cannot be gathered.' };
  return { allowed:true, duration, message:'' };
}

export function benchRecipeReady() { return false; }
export function buildFieldBench() { return { ok:false, message:'Workbench progression is being rebuilt.' }; }
export function quarryRecipeReady() { return false; }
export function craftQuarryPick() { return { ok:false, message:'Tool progression is being rebuilt.' }; }
export function resonatorCount() { return 0; }
export function resonatorsReady() { return false; }
export function useJourney() { return { ok:false, message:'Nothing to use here yet.' }; }
export function updateJourney() { return []; }
export function archPortalActive() { return false; }
export function hollowPortalActive() { return false; }
export function quarryForgePortalActive() { return false; }
export function quarryReturnPortalActive() { return false; }

export function journeyObjective() {
  return 'Explore First Light · gather, build, and get a feel for the land';
}

export { BENCH_WOOD, BENCH_STONE, REQUIRED_WOOD, REQUIRED_STONE, REQUIRED_CRYSTALS, HOME, ARCH, LUMEN_HOLLOW, HOLLOW_FORGE, HOLLOW_RESONATORS, OLD_QUARRY };
