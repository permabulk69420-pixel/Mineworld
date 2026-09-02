import { BLOCK as B, BLOCK_SIZE, GENERATOR_VERSION } from './blocks.js';
import { fbm, hash, noise2 } from './noise.js';

// Version 1 is a save-file contract. Add new generators without changing old seeds.
export const ISLANDS = [
  { x: 0, z: 0, rx: 35, rz: 32, top: 35, depth: 28, name: 'First Light' },
  { x: -53, z: -28, rx: 20, rz: 19, top: 46, depth: 30, name: 'Cedar Reach' },
  { x: 53, z: -31, rx: 22, rz: 18, top: 38, depth: 27, name: 'The Old Quarry' },
  { x: 1, z: -76, rx: 17, rz: 16, top: 62, depth: 40, name: 'Cloudspire' },
  { x: -59, z: 40, rx: 17, rz: 15, top: 31, depth: 25, name: 'Mossgarden' },
  { x: 57, z: 42, rx: 17, rz: 17, top: 49, depth: 32, name: 'Sunward' },
  { x: 63, z: -82, rx: 13, rz: 12, top: 47, depth: 26, name: 'Lumen Hollow' },
];

function crown(world, x, y, z, radius, seed) {
  for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
    for (let dy = -2; dy <= 2; dy++) {
      if ((dx * dx + dz * dz) / (radius * radius) + dy * dy / 7 > 1.13) continue;
      if (hash(x + dx, y + dy, z + dz, seed) < 0.09) continue;
      if (world.get(x + dx, y + dy, z + dz) === B.AIR) world.set(x + dx, y + dy, z + dz, B.LEAVES);
    }
  }
}

function tree(world, x, y, z, seed, large = false) {
  const height = large ? 11 : 5 + Math.floor(hash(x, y, z, seed) * 3);
  for (let dy = 0; dy < height; dy++) {
    world.set(x, y + dy, z, B.WOOD);
    if (large) world.set(x + 1, y + dy, z, B.WOOD);
  }
  crown(world, x, y + height, z, large ? 6 : 3, seed);
  if (large) {
    for (const [dx, dz] of [[-4, 0], [3, 3], [0, -4]]) {
      for (let i = 0; i < 5; i++) world.set(x + Math.round(dx * i / 4), y + height - 4 + i, z + Math.round(dz * i / 4), B.WOOD);
      crown(world, x + dx, y + height, z + dz, 4, seed + dx);
    }
  }
}

function arch(world, cx, y, cz) {
  for (let x = -5; x <= 5; x++) for (let z = -2; z <= 2; z++) world.set(cx + x, y, cz + z, B.STONE);
  for (let dy = 1; dy <= 8; dy++) for (const dx of [-4, 4]) {
    world.set(cx + dx, y + dy, cz, dy % 4 === 0 ? B.CRYSTAL : B.STONE);
    world.set(cx + dx, y + dy, cz + 1, B.STONE);
  }
  for (let x = -3; x <= 3; x++) {
    const h = Math.abs(x) === 3 ? 9 : 10;
    world.set(cx + x, y + h, cz, B.STONE);
    world.set(cx + x, y + h, cz + 1, B.STONE);
  }
  world.set(cx, y + 10, cz, B.CRYSTAL);
}

export function generateWorld(world, version = GENERATOR_VERSION) {
  if (version !== 1) throw new Error('This world uses a newer terrain generator.');
  const { seed } = world;
  world.surfaces = [];
  for (let n = 0; n < ISLANDS.length; n++) {
    const island = ISLANDS[n];
    const columns = [];
    for (let x = island.x - island.rx - 2; x <= island.x + island.rx + 2; x++) {
      for (let z = island.z - island.rz - 2; z <= island.z + island.rz + 2; z++) {
        const dx = x - island.x, dz = z - island.z;
        const distance = Math.hypot(dx / island.rx, dz / island.rz);
        const edge = 1 + noise2(x * 0.2, z * 0.2, seed + n) * 0.08;
        if (distance > edge) continue;
        let top = Math.floor(island.top + fbm(x * 0.075, z * 0.075, seed) * 5 + Math.max(0, 1 - distance) * 3);
        const lakeDistance = Math.hypot((x + 9) / 1.15, z - 2);
        if (n === 0 && lakeDistance < 9) top = Math.min(top, 32 + Math.floor(lakeDistance / 8));
        const thickness = Math.max(2, Math.floor(island.depth * Math.pow(Math.max(0, 1 - distance ** 1.5), 0.65)));
        const bottom = Math.max(2, island.top - thickness);
        for (let y = bottom; y <= top; y++) {
          // Two connected, daylight-visible tunnels beneath the home island.
          const cave = n === 0 && y < top - 3 && y > bottom + 2 &&
            (Math.hypot(y - 27, (x - 8) * 0.9) < 3.2 || Math.hypot(y - 25, (z + 13) * 0.8) < 3.1);
          if (cave) continue;
          let block = y === top ? B.GRASS : y >= top - 3 ? B.SOIL : y < island.top - 9 ? B.BASALT : B.STONE;
          if (n === 0 && lakeDistance < 10 && y >= top - 1) block = B.SAND;
          if (y < top - 4 && hash(x, y, z, seed) > 0.982) block = B.CRYSTAL;
          if (n === 2 && y === top && hash(x, y, z, seed) > 0.35) block = B.STONE;
          world.set(x, y, z, block);
        }
        if (n === 0 && lakeDistance < 8.5) for (let y = top + 1; y <= 34; y++) world.set(x, y, z, B.WATER);
        columns.push({ x, z, top, distance, lakeDistance });
        world.surfaces.push({x,y:top,z});
      }
    }
    for (const { x, z, top, distance, lakeDistance } of columns) {
      if (distance > 0.82 || (n === 0 && (lakeDistance < 12 || (Math.abs(x) < 9 && z > 14) || Math.hypot(x - 9, z + 10) < 10))) continue;
      if (x % 6 !== 0 || z % 6 !== 0 || hash(x, 0, z, seed + 85) < 0.40 || n === 2) continue;
      tree(world, x, top + 1, z, seed + n);
    }
    const ly = world.surface(island.x, island.z);
    world.landmarks.push({ name: island.name, x: island.x * BLOCK_SIZE, y: ly * BLOCK_SIZE, z: island.z * BLOCK_SIZE });
  }

  tree(world, -19, world.surface(-19, -11), -11, seed + 100, true);
  const archY = world.surface(9, -11);
  arch(world, 9, archY, -11);

  // The spring crosses the cliff and spills into the cloud sea. Water is decorative in v1.
  for(let x=-17;x>=-34;x--) for(let z=1;z<=2;z++) {
    for(let y=35;y<=44;y++) world.set(x,y,z,B.AIR);
    world.set(x,32,z,B.SAND);
    world.set(x,33,z,B.WATER);world.set(x,34,z,B.WATER);
  }
  for(let y=7;y<=34;y++) for(let z=1;z<=2;z++) world.set(-35,y,z,B.WATER);

  // A buildable cedar lookout makes a safe, recognizable home location.
  const homeY = world.surface(1, 23);
  for (let x = -3; x <= 5; x++) for (let z = 21; z <= 28; z++) {
    for (let y = homeY; y < homeY + 5; y++) world.set(x, y, z, B.AIR);
    world.set(x, homeY - 1, z, B.PLANKS);
  }
  for (const [x, z] of [[-3, 27], [5, 27]]) {
    for (let y = homeY; y < homeY + 2; y++) world.set(x, y, z, B.WOOD);
    world.set(x, homeY + 2, z, B.CRYSTAL);
  }
  world.spawn = { x: 1.5 * BLOCK_SIZE, y: homeY * BLOCK_SIZE + 0.02, z: 25.5 * BLOCK_SIZE };

  // Exposed lumen outcrops, all real editable blocks.
  for (const [x, z] of [[18,8],[-8,-24],[52,-32],[63,-81]]) {
    const y = world.surface(x,z);
    for (let i = 0; i < 4; i++) world.set(x, y + i, z, B.CRYSTAL);
    world.set(x + 1, y, z, B.CRYSTAL);
    world.set(x - 1, y + 1, z, B.CRYSTAL);
  }
  world.dirty = new Set(world.chunks.keys());
  return world;
}
