import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK, BLOCK_SIZE } from '../src/world/blocks.js';
import { createJourney, collectBlock, canPlace, spendBlock, harvestInfo, updateJourney, archPortalActive, hollowPortalActive, journeyObjective, TOOL } from '../src/game.js';

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

test('the first quarry pick is earned from cedar and limestone at the home lookout', () => {
  const journey = createJourney();
  assert.equal(journey.tool, TOOL.HAND);
  assert.equal(harvestInfo(journey, BLOCK.CRYSTAL).allowed, false);
  for (let i = 0; i < 4; i++) collectBlock(journey, BLOCK.WOOD);
  for (let i = 0; i < 6; i++) collectBlock(journey, BLOCK.STONE);
  assert.match(journeyObjective(journey), /First Light lookout/);
  assert.deepEqual(updateJourney(journey, { x:60, z:60 }), []);
  const events = updateJourney(journey, { x:1.5 * BLOCK_SIZE, z:25.5 * BLOCK_SIZE });
  assert.deepEqual(events, ['tool-crafted']);
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
  assert.match(journeyObjective(journey), /return waystone active/);
});
