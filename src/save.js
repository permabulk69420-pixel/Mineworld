import { BLOCKS, DEFAULT_SEED, GENERATOR_VERSION, PALETTE, withinWorld, WORLD_LIMIT, HEIGHT_LIMIT, BLOCK_SIZE } from './world/blocks.js';
import { createJourney, snapshotJourney } from './game.js';

export const SAVE_KEY = 'mineworld.skyreach.save.v2';
export const LEGACY_SAVE_KEY = 'mineworld.skyreach.save.v1';
export const SETTINGS_KEY = 'mineworld.settings.v1';
const MAX_EDITS = 50000;

export function validateSave(value) {
  if (!value || typeof value !== 'object' || value.version !== 1 || value.generatorVersion !== GENERATOR_VERSION) {
    throw new Error('This save uses an unsupported world generation version.');
  }
  if (!Number.isInteger(value.seed) || value.seed < 0 || value.seed > 2147483647) throw new Error('Invalid world seed.');
  if (!Array.isArray(value.edits) || value.edits.length > MAX_EDITS) throw new Error('Invalid or oversized world edits.');
  const edits = value.edits.map(edit => {
    if (!Array.isArray(edit) || edit.length !== 4) throw new Error('Invalid block edit.');
    const [x,y,z,id] = edit;
    if (!withinWorld(x,y,z) || !Number.isInteger(id) || !BLOCKS[id]) throw new Error('Invalid block coordinates or material.');
    return [x,y,z,id];
  });
  let player = null;
  const p = value.player;
  if (p && [p.x,p.y,p.z,p.yaw,p.pitch].every(Number.isFinite)
    && Math.abs(p.x) < WORLD_LIMIT * BLOCK_SIZE && Math.abs(p.z) < WORLD_LIMIT * BLOCK_SIZE
    && p.y >= 0 && p.y < HEIGHT_LIMIT * BLOCK_SIZE) {
    player = { x:p.x, y:p.y, z:p.z, yaw:p.yaw, pitch:Math.max(-1.4,Math.min(1.4,p.pitch)), flying:Boolean(p.flying) };
  }
  const journey = createJourney(value.journey);
  return { version:1, generatorVersion:GENERATOR_VERSION, seed:value.seed, edits, player,
    selected:Number.isInteger(value.selected) && value.selected >= 0 && value.selected < PALETTE.length ? value.selected : 0,
    journey:snapshotJourney(journey), savedAt:typeof value.savedAt === 'string' ? value.savedAt : null };
}

export function readSave(storage) {
  let raw;
  try { raw = storage.getItem(SAVE_KEY); }
  catch { return { data:null, writable:false, message:'Browser storage is unavailable. Export a save before leaving.' }; }
  if (!raw) {
    let legacy=false;
    try { legacy=Boolean(storage.getItem(LEGACY_SAVE_KEY)); } catch {}
    return { data:null, writable:true, message:legacy?'New large world · previous prototype save preserved':'New world' };
  }
  try { return { data:validateSave(JSON.parse(raw)), writable:true, message:'World restored' }; }
  catch { return { data:null, writable:false, raw, message:'An unreadable save is protected. Export it before replacing it.' }; }
}

export function createSave(world, player, selected, journey) {
  return { version:1, generatorVersion:GENERATOR_VERSION, seed:world.seed ?? DEFAULT_SEED,
    edits:[...world.edits.values()], player:player.snapshot(), selected,
    journey:snapshotJourney(journey), savedAt:new Date().toISOString() };
}

export function writeSave(storage, save) {
  try {
    if (save.edits.length > MAX_EDITS) return { ok:false, message:'Save limit reached. Export your world.' };
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return { ok:true, message:'Saved on this device' };
  } catch { return { ok:false, message:'Could not save on this device. Export your world.' }; }
}

export function readSettings(storage) {
  try {
    const value = JSON.parse(storage.getItem(SETTINGS_KEY) || '{}');
    return { turning:value.turning === 'snap' ? 'snap' : 'smooth', sound:value.sound !== false,
      quality:value.quality === 'high' ? 'high' : 'balanced' };
  } catch { return { turning:'smooth', sound:true, quality:'balanced' }; }
}
