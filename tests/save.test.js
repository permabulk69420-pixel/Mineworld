import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelWorld } from '../src/world/world.js';
import { BLOCK as B, DEFAULT_SEED } from '../src/world/blocks.js';
import { createJourney, TOOL } from '../src/game.js';
import { createSave, validateSave, writeSave, readSave, readSettings, SAVE_KEY, PREVIOUS_SAVE_KEY, LEGACY_SAVE_KEY, SETTINGS_KEY } from '../src/save.js';

const player={snapshot:()=>({x:1,y:28,z:3,yaw:0,pitch:0,flying:false})};
function memory(){const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};}

test('export/import preserves v3 edits, material selection, seed, and position',()=>{
  const world=new VoxelWorld(DEFAULT_SEED);world.set(1,2,3,B.STONE);world.set(1,2,3,B.AIR,true);world.set(-1,2,-3,B.CRYSTAL,true);
  const save=validateSave(JSON.parse(JSON.stringify(createSave(world,player,7))));
  const restored=new VoxelWorld(save.seed);restored.set(1,2,3,B.STONE);restored.applyEdits(save.edits);
  assert.equal(restored.get(1,2,3),B.AIR);assert.equal(restored.get(-1,2,-3),B.CRYSTAL);assert.equal(save.selected,7);assert.equal(save.player.y,28);assert.equal(save.generatorVersion,3);
  const storage=memory();assert.equal(writeSave(storage,save).ok,true);assert.deepEqual(readSave(storage).data,save);
});

test('foundation inventory survives save validation while discarded prototype progression does not',()=>{
  const world=new VoxelWorld(DEFAULT_SEED);
  const journey=createJourney({tool:TOOL.RESONANT,archAwake:true,lumenReached:true,deepstoneReached:true,quarryReached:true,inventory:{[B.WOOD]:5,[B.STONE]:4}});
  const save=validateSave(JSON.parse(JSON.stringify(createSave(world,player,3,journey))));
  assert.equal(save.journey.tool,TOOL.HAND);assert.equal(save.journey.archAwake,false);assert.equal(save.journey.quarryReached,false);
  assert.equal(save.journey.inventory[B.WOOD],5);assert.equal(save.journey.inventory[B.STONE],4);
});

test('v2 First Light and v1 prototype saves remain untouched when v3 starts',()=>{
  const storage=memory();storage.setItem(PREVIOUS_SAVE_KEY,'previous-first-light');storage.setItem(LEGACY_SAVE_KEY,'old-prototype-world');
  const state=readSave(storage);
  assert.equal(state.data,null);assert.equal(state.writable,true);assert.match(state.message,/Previous First Light world preserved/);
  assert.equal(storage.getItem(PREVIOUS_SAVE_KEY),'previous-first-light');assert.equal(storage.getItem(LEGACY_SAVE_KEY),'old-prototype-world');assert.equal(storage.getItem(SAVE_KEY),null);
});

test('VR settings default to stick movement and a hidden wrist, with teleport opt-in',()=>{
  const storage=memory();
  assert.deepEqual(readSettings(storage),{turning:'smooth',locomotion:'stick',wrist:'hidden',sound:true,quality:'balanced'});
  storage.setItem(SETTINGS_KEY,JSON.stringify({turning:'snap',locomotion:'teleport',wrist:'visible',sound:false,quality:'high'}));
  assert.deepEqual(readSettings(storage),{turning:'snap',locomotion:'teleport',wrist:'visible',sound:false,quality:'high'});
  storage.setItem(SETTINGS_KEY,JSON.stringify({locomotion:'nonsense',wrist:'nonsense'}));
  assert.equal(readSettings(storage).locomotion,'stick');assert.equal(readSettings(storage).wrist,'hidden');
});

test('corrupt or future-version v3 saves are preserved instead of silently overwritten',()=>{
  const storage=memory();storage.setItem(SAVE_KEY,'important-broken-save');
  const state=readSave(storage);assert.equal(state.writable,false);assert.equal(state.raw,'important-broken-save');assert.equal(storage.getItem(SAVE_KEY),'important-broken-save');
  const save=createSave(new VoxelWorld(DEFAULT_SEED),player,0);save.generatorVersion=4;
  assert.throws(()=>validateSave(save),/unsupported/);
});

test('save validation rejects malformed edits and handles denied storage',()=>{
  const save=createSave(new VoxelWorld(DEFAULT_SEED),player,0);
  for(const edit of [[0,-1,0,1],[0,1,0,999],[999,1,0,1],[0,1,0,1,1],[0,.2,0,1]])assert.throws(()=>validateSave({...save,edits:[edit]}));
  const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}};
  assert.equal(readSave(denied).writable,false);assert.equal(writeSave(denied,save).ok,false);
});
