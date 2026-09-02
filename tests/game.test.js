import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK } from '../src/world/blocks.js';
import { createJourney, collectBlock, canPlace, spendBlock, refundBlock, harvestInfo, useJourney, journeyObjective, archPortalActive, hollowPortalActive, quarryForgePortalActive, quarryReturnPortalActive, TOOL } from '../src/game.js';

test('foundation Journey starts empty and only exposes gathered build materials',()=>{
  const journey=createJourney();
  assert.equal(journey.tool,TOOL.HAND);
  for(const count of Object.values(journey.inventory))assert.equal(count,0);
  assert.equal(canPlace(journey,BLOCK.WOOD),false);
  collectBlock(journey,BLOCK.WOOD);
  assert.equal(journey.inventory[BLOCK.WOOD],1);
  assert.equal(canPlace(journey,BLOCK.WOOD),true);
  assert.equal(spendBlock(journey,BLOCK.WOOD),true);
  assert.equal(canPlace(journey,BLOCK.WOOD),false);
  refundBlock(journey,BLOCK.WOOD);
  assert.equal(journey.inventory[BLOCK.WOOD],1);
});

test('foundation gathering works without pretending a decorative tool is required',()=>{
  const journey=createJourney();
  assert.equal(harvestInfo(journey,BLOCK.WOOD).allowed,true);
  assert.equal(harvestInfo(journey,BLOCK.STONE).allowed,true);
  assert.equal(harvestInfo(journey,BLOCK.SOIL).allowed,true);
  assert.equal(harvestInfo(journey,BLOCK.CRYSTAL).allowed,false);
  assert.equal(harvestInfo(journey,BLOCK.BASALT).allowed,false);
  assert.match(journeyObjective(journey),/Explore First Light/);
  assert.equal(useJourney(journey,{x:0,z:0}).ok,false);
});

test('placeholder progression and portals are dormant in the quality-reset build',()=>{
  const journey=createJourney({tool:TOOL.RESONANT,archAwake:true,lumenReached:true,deepstoneReached:true,quarryReached:true});
  assert.equal(journey.tool,TOOL.HAND);
  assert.equal(journey.archAwake,false);
  assert.equal(journey.lumenReached,false);
  assert.equal(journey.deepstoneReached,false);
  assert.equal(journey.quarryReached,false);
  const body={x:0,z:0};
  assert.equal(archPortalActive(journey,body),false);
  assert.equal(hollowPortalActive(journey,body),false);
  assert.equal(quarryForgePortalActive(journey,body),false);
  assert.equal(quarryReturnPortalActive(journey,body),false);
});
