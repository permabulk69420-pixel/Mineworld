import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCK, BLOCK_SIZE } from '../src/world/blocks.js';
import { createJourney, collectBlock, canPlace, spendBlock, updateJourney, journeyObjective } from '../src/game.js';

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

test('six lumen crystals awaken the arch and advance the exploration objective', () => {
  const journey = createJourney();
  for (let i = 0; i < 6; i++) collectBlock(journey, BLOCK.CRYSTAL);
  assert.match(journeyObjective(journey), /Old Arch/);
  const events = updateJourney(journey, { x: 9 * BLOCK_SIZE, z: -11 * BLOCK_SIZE });
  assert.deepEqual(events, ['arch-awake']);
  assert.equal(journey.inventory[BLOCK.CRYSTAL], 0);
  assert.match(journeyObjective(journey), /Lumen Hollow/);
});
