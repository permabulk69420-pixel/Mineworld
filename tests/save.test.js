import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelWorld } from '../src/world/world.js';
import { BLOCK as B, DEFAULT_SEED } from '../src/world/blocks.js';
import { createJourney, TOOL } from '../src/game.js';
import { createSave, validateSave, writeSave, readSave, SAVE_KEY, LEGACY_SAVE_KEY } from '../src/save.js';

const player={snapshot:()=>({x:1,y:28,z:3,yaw:0,pitch:0,flying:false})};
function memory(){const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};}

test('export/import preserves v2 edits, material selection, seed, and position',()=>{
  const world=new VoxelWorld(DEFAULT_SEED);world.set(1,2,3,B.STONE);world.set(1,2,3,B.AIR,true);world.set(-1,2,-3,B.CRYSTAL,true);
  const save=validateSave(JSON.parse(JSON.stringify(createSave(world,player,7))));
  const restored=new VoxelWorld(save.seed);restored.set(1,2,3,B.STONE);restored.applyEdits(save.edits);
  assert.equal(restored.get(1,2,3),B.AIR);assert.equal(restored.get(-1,2,-3),B.CRYSTAL);assert.equal(save.selected,7);assert.equal(save.player.y,28);assert.equal(save.generatorVersion,2);
  const storage=memory();assert.equal(writeSave(storage,save).ok,true);assert.deepEqual(readSave(storage).data,save);
});

test('foundation inventory survives save validation while discarded prototype progression does not',()=>{
  const world=new VoxelWorld(DEFAULT_SEED);
  const journey=createJourney({tool:TOOL.RESONANT,archAwake:true,lumenReached:true,deepstoneReached:true,quarryReached:true,inventory:{[B.WOOD]:5,[B.STONE]:4}});
  const save=validateSave(JSON.parse(JSON.stringify(createSave(world,player,3,journey))));
  assert.equal(save.journey.tool,TOOL.HAND);assert.equal(save.journey.archAwake,false);assert.equal(save.journey.quarryReached,false);
  assert.equal(save.journey.inventory[B.WOOD],5);assert.equal(save.journey.inventory[B.STONE],4);
});

test('the v1 prototype save remains untouched when the v2 world starts',()=>{
  const storage=memory();storage.setItem(LEGACY_SAVE_KEY,'old-prototype-world');
  const state=readSave(storage);
  assert.equal(state.data,null);assert.equal(state.writable,true);assert.match(state.message,/preserved/);
  assert.equal(storage.getItem(LEGACY_SAVE_KEY),'old-prototype-world');assert.equal(storage.getItem(SAVE_KEY),null);
});

test('corrupt or future-version v2 saves are preserved instead of silently overwritten',()=>{
  const storage=memory();storage.setItem(SAVE_KEY,'important-broken-save');
  const state=readSave(storage);assert.equal(state.writable,false);assert.equal(state.raw,'important-broken-save');assert.equal(storage.getItem(SAVE_KEY),'important-broken-save');
  const save=createSave(new VoxelWorld(DEFAULT_SEED),player,0);save.generatorVersion=3;
  assert.throws(()=>validateSave(save),/unsupported/);
});

test('save validation rejects malformed edits and handles denied storage',()=>{
  const save=createSave(new VoxelWorld(DEFAULT_SEED),player,0);
  for(const edit of [[0,-1,0,1],[0,1,0,999],[999,1,0,1],[0,1,0,1,1],[0,.2,0,1]])assert.throws(()=>validateSave({...save,edits:[edit]}));
  const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}};
  assert.equal(readSave(denied).writable,false);assert.equal(writeSave(denied,save).ok,false);
});
