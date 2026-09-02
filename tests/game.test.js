import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK, BLOCK_SIZE } from '../src/world/blocks.js';
import { createJourney, collectBlock, canPlace, spendBlock, harvestInfo, quarryRecipeReady, craftQuarryPick, useJourney, resonatorCount, resonatorsReady, updateJourney, archPortalActive, hollowPortalActive, journeyObjective, TOOL, HOLLOW_RESONATORS, HOLLOW_FORGE } from '../src/game.js';

test('Journey mode gathers finite materials and spends them when building', () => {
  const journey = createJourney();
  assert.equal(journey.inventory[BLOCK.PLANKS], 8);
  assert.equal(journey.inventory[BLOCK.STONE], 0);
  collectBlock(journey, BLOCK.STONE);
  assert.equal(canPlace(journey, BLOCK.STONE), true);
  assert.equal(spendBlock(journey, BLOCK.STONE), true);
  assert.equal(journey.inventory[BLOCK.STONE], 0);
  assert.equal(spendBlock(journey, BLOCK.STONE), false);
});

test('the first quarry pick requires a deliberate craft at the First Light field bench', () => {
  const journey = createJourney();
  assert.equal(journey.tool, TOOL.HAND);
  assert.equal(harvestInfo(journey, BLOCK.CRYSTAL).allowed, false);
  for (let i = 0; i < 4; i++) collectBlock(journey, BLOCK.WOOD);
  for (let i = 0; i < 6; i++) collectBlock(journey, BLOCK.STONE);
  assert.equal(quarryRecipeReady(journey), true);
  assert.match(journeyObjective(journey), /press Y/);
  assert.deepEqual(updateJourney(journey, { x:1.5 * BLOCK_SIZE, z:25.5 * BLOCK_SIZE }), [], 'proximity alone must not craft');
  const away = craftQuarryPick(journey, { x:60, z:60 });
  assert.equal(away.ok, false);
  assert.match(away.message, /field bench/);
  const result = craftQuarryPick(journey, { x:1.5 * BLOCK_SIZE, z:25.5 * BLOCK_SIZE });
  assert.deepEqual(result, { ok:true, event:'tool-crafted' });
  assert.equal(journey.tool, TOOL.QUARRY);
  assert.equal(journey.inventory[BLOCK.WOOD], 0);
  assert.equal(journey.inventory[BLOCK.STONE], 0);
  assert.equal(harvestInfo(journey, BLOCK.CRYSTAL).allowed, true);
  assert.equal(harvestInfo(journey, BLOCK.BASALT).allowed, false);
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

test('Lumen Hollow consumes three crystals to wake resonators and temper a deepstone tool', () => {
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
  assert.match(journeyObjective(journey),/first deepstone/);
  collectBlock(journey,BLOCK.BASALT);
  assert.equal(journey.deepstoneReached,true);
  assert.match(journeyObjective(journey),/Old Quarry/);
});

test('resonant progression restores without moving an upgraded save backwards', () => {
  const restored=createJourney({tool:TOOL.RESONANT,archAwake:true,lumenReached:true,resonators:[false,false,false],deepstoneReached:true});
  assert.equal(restored.tool,TOOL.RESONANT);
  assert.deepEqual(restored.resonators,[true,true,true]);
  assert.equal(restored.deepstoneReached,true);
  assert.equal(harvestInfo(restored,BLOCK.BASALT).allowed,true);
});