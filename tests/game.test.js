import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK, BLOCK_SIZE } from '../src/world/blocks.js';
import { createJourney, collectBlock, canPlace, spendBlock, harvestInfo, benchRecipeReady, quarryRecipeReady, craftQuarryPick, useJourney, resonatorCount, resonatorsReady, updateJourney, archPortalActive, hollowPortalActive, quarryForgePortalActive, quarryReturnPortalActive, journeyObjective, TOOL, HOLLOW_RESONATORS, HOLLOW_FORGE, OLD_QUARRY } from '../src/game.js';

test('Journey starts with an empty pack and only gathered materials become buildable', () => {
  const journey = createJourney();
  assert.equal(journey.inventory[BLOCK.PLANKS], 0);
  assert.equal(journey.inventory[BLOCK.STONE], 0);
  assert.equal(journey.bench, null);
  assert.equal(canPlace(journey, BLOCK.PLANKS), false);
  collectBlock(journey, BLOCK.STONE);
  assert.equal(canPlace(journey, BLOCK.STONE), true);
  assert.equal(spendBlock(journey, BLOCK.STONE), true);
  assert.equal(journey.inventory[BLOCK.STONE], 0);
  assert.equal(spendBlock(journey, BLOCK.STONE), false);
});

test('the player must establish a field bench before crafting the quarry pick', () => {
  const journey = createJourney();
  const home={x:1.5*BLOCK_SIZE,z:25.5*BLOCK_SIZE};
  assert.equal(journey.tool, TOOL.HAND);
  assert.equal(harvestInfo(journey, BLOCK.CRYSTAL).allowed, false);
  assert.match(journeyObjective(journey), /Field bench/);
  for (let i = 0; i < 5; i++) collectBlock(journey, BLOCK.WOOD);
  for (let i = 0; i < 6; i++) collectBlock(journey, BLOCK.STONE);
  assert.equal(benchRecipeReady(journey), true);
  assert.equal(quarryRecipeReady(journey), false, 'the pick cannot be crafted before a bench exists');

  const built=useJourney(journey,home,0);
  assert.deepEqual(built,{ok:true,event:'bench-built'});
  assert.ok(journey.bench);
  assert.equal(journey.inventory[BLOCK.WOOD],2);
  assert.equal(journey.inventory[BLOCK.STONE],4);
  assert.equal(quarryRecipeReady(journey),true);
  assert.match(journeyObjective(journey),/Return to your field bench/);
  assert.deepEqual(updateJourney(journey,home),[], 'proximity alone must not craft');

  const away=craftQuarryPick(journey,{x:60,z:60});
  assert.equal(away.ok,false);assert.match(away.message,/field bench/);
  const result=useJourney(journey,journey.bench);
  assert.deepEqual(result,{ok:true,event:'tool-crafted'});
  assert.equal(journey.tool,TOOL.QUARRY);
  assert.equal(journey.inventory[BLOCK.WOOD],0);
  assert.equal(journey.inventory[BLOCK.STONE],0);
  assert.equal(harvestInfo(journey,BLOCK.CRYSTAL).allowed,true);
  assert.equal(harvestInfo(journey,BLOCK.BASALT).allowed,false);
});

test('untouched prototype saves lose only the obsolete eight-plank starter gift',()=>{
  const fresh=createJourney({tool:TOOL.HAND,inventory:{[BLOCK.PLANKS]:8}});
  assert.equal(fresh.inventory[BLOCK.PLANKS],0);
  const progressed=createJourney({tool:TOOL.HAND,inventory:{[BLOCK.PLANKS]:8,[BLOCK.WOOD]:1}});
  assert.equal(progressed.inventory[BLOCK.PLANKS],8);
  assert.equal(progressed.inventory[BLOCK.WOOD],1);
});

test('six lumen crystals awaken a persistent two-way passage to Lumen Hollow', () => {
  const journey = createJourney({ tool:TOOL.QUARRY });
  for (let i = 0; i < 6; i++) collectBlock(journey, BLOCK.CRYSTAL);
  assert.match(journeyObjective(journey), /Old Arch/);
  const arch = { x:9.5 * BLOCK_SIZE, z:-10.5 * BLOCK_SIZE };
  const hollow = { x:63.5 * BLOCK_SIZE, z:-81.5 * BLOCK_SIZE };
  const events = updateJourney(journey, arch);
  assert.deepEqual(events, ['arch-awake']);
  assert.equal(journey.inventory[BLOCK.CRYSTAL], 0);
  assert.equal(archPortalActive(journey, arch), true);
  assert.equal(hollowPortalActive(journey, hollow), false);
  assert.match(journeyObjective(journey), /step through/);
  const hollowEvents = updateJourney(journey, hollow);
  assert.deepEqual(hollowEvents, ['lumen-reached']);
  assert.equal(archPortalActive(journey, arch), true);
  assert.equal(hollowPortalActive(journey, hollow), true);
  assert.match(journeyObjective(journey), /Hollow resonators/);
});

test('Lumen Hollow consumes three crystals, tempers a deepstone tool, and opens Old Quarry', () => {
  const journey=createJourney({
    tool:TOOL.QUARRY,archAwake:true,lumenReached:true,
    inventory:{[BLOCK.CRYSTAL]:3},resonators:[false,false,false],
  });
  assert.equal(resonatorCount(journey),0);
  assert.equal(resonatorsReady(journey),false);
  assert.equal(harvestInfo(journey,BLOCK.BASALT).allowed,false);
  assert.match(journeyObjective(journey),/0\/3/);

  for(let i=0;i<HOLLOW_RESONATORS.length;i++){
    const result=useJourney(journey,HOLLOW_RESONATORS[i]);
    assert.deepEqual(result,{ok:true,event:'resonator-awake',index:i});
    assert.equal(resonatorCount(journey),i+1);
    assert.equal(journey.inventory[BLOCK.CRYSTAL],2-i);
  }
  assert.equal(resonatorsReady(journey),true);
  assert.match(journeyObjective(journey),/forge awake/);
  assert.match(useJourney(journey,{x:0,z:0}).message,/Stand beside it/);

  const temper=useJourney(journey,HOLLOW_FORGE);
  assert.deepEqual(temper,{ok:true,event:'tool-resonant'});
  assert.equal(journey.tool,TOOL.RESONANT);
  assert.equal(harvestInfo(journey,BLOCK.BASALT).allowed,true);
  assert.match(journeyObjective(journey),/beneath the Hollow/);
  collectBlock(journey,BLOCK.BASALT);
  assert.equal(journey.inventory[BLOCK.BASALT],1);
  assert.equal(journey.deepstoneReached,true);
  assert.equal(canPlace(journey,BLOCK.BASALT),false,'deepstone is a carried progression resource, not a hotbar block');
  assert.equal(quarryForgePortalActive(journey,HOLLOW_FORGE),true);
  assert.match(journeyObjective(journey),/new passage/);

  const quarryEvents=updateJourney(journey,OLD_QUARRY);
  assert.deepEqual(quarryEvents,['quarry-reached']);
  assert.equal(journey.quarryReached,true);
  assert.equal(quarryReturnPortalActive(journey,OLD_QUARRY),true);
  assert.match(journeyObjective(journey),/Old Quarry reached/);
});

test('resonant and quarry progression restore without moving an upgraded save backwards', () => {
  const restored=createJourney({tool:TOOL.RESONANT,archAwake:true,lumenReached:true,resonators:[false,false,false],deepstoneReached:true,quarryReached:true,inventory:{[BLOCK.BASALT]:3}});
  assert.equal(restored.tool,TOOL.RESONANT);
  assert.deepEqual(restored.resonators,[true,true,true]);
  assert.equal(restored.deepstoneReached,true);
  assert.equal(restored.quarryReached,true);
  assert.equal(restored.inventory[BLOCK.BASALT],3);
  assert.equal(harvestInfo(restored,BLOCK.BASALT).allowed,true);
});