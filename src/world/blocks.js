export const BLOCK = Object.freeze({
  AIR: 0, GRASS: 1, SOIL: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  PLANKS: 6, CRYSTAL: 7, SAND: 8, GLASS: 9, WATER: 10, BASALT: 11,
});

export const BLOCKS = Object.freeze([
  { name: 'Air', solid: false, opaque: false, color: '#ffffff' },
  { name: 'Sunmoss', solid: true, opaque: true, color: '#9aa86d', tiles: [1, 0, 2] },
  { name: 'Rose loam', solid: true, opaque: true, color: '#75594f', tiles: [2, 2, 2] },
  { name: 'Blue shale', solid: true, opaque: true, color: '#718187', tiles: [3, 3, 3] },
  { name: 'Sailwood', solid: true, opaque: true, color: '#6d5847', tiles: [4, 5, 5] },
  { name: 'Sailleaf', solid: true, opaque: true, color: '#728f78', tiles: [6, 6, 6] },
  { name: 'Sailwood boards', solid: true, opaque: true, color: '#a78362', tiles: [7, 7, 7] },
  { name: 'Lumen crystal', solid: true, opaque: true, color: '#73eddf', tiles: [8, 8, 8], glow: true },
  { name: 'Silver silt', solid: true, opaque: true, color: '#c9bd9e', tiles: [9, 9, 9] },
  { name: 'Glass', solid: true, opaque: false, color: '#b1e4ea', tiles: [10, 10, 10] },
  { name: 'Spring water', solid: false, opaque: false, color: '#3699a8', tiles: [11, 11, 11] },
  { name: 'Nightstone', solid: true, opaque: true, color: '#425662', tiles: [12, 12, 12] },
]);

export const PALETTE = [BLOCK.GRASS, BLOCK.SOIL, BLOCK.STONE, BLOCK.WOOD,
  BLOCK.LEAVES, BLOCK.PLANKS, BLOCK.SAND, BLOCK.CRYSTAL, BLOCK.GLASS];
export const BLOCK_SIZE = 0.75;
export const CHUNK_SIZE = 16;
export const WORLD_LIMIT = 128;
export const HEIGHT_LIMIT = 128;
export const GENERATOR_VERSION = 3;
export const DEFAULT_SEED = 734921;
export const isSolid = id => Boolean(BLOCKS[id]?.solid);
export const isOpaque = id => Boolean(BLOCKS[id]?.opaque);

export function withinWorld(x, y, z) {
  return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z)
    && Math.abs(x) < WORLD_LIMIT && Math.abs(z) < WORLD_LIMIT && y >= 0 && y < HEIGHT_LIMIT;
}
