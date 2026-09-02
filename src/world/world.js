import { BLOCK, BLOCKS, BLOCK_SIZE, CHUNK_SIZE, withinWorld } from './blocks.js';

const key = (x, y, z) => `${x},${y},${z}`;
const local = n => ((n % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
const index = (x, y, z) => local(x) + local(z) * CHUNK_SIZE + local(y) * CHUNK_SIZE ** 2;

/** Sparse 16³ chunks. All persistence is in voxel coordinates, independent of rendering. */
export class VoxelWorld {
  constructor(seed) {
    this.seed = seed;
    this.chunks = new Map();
    this.dirty = new Set();
    this.edits = new Map();
    this.revision = 0;
    this.landmarks = [];
    this.spawn = { x:0, y:0, z:0 };
  }

  get(x, y, z) {
    if (!withinWorld(x, y, z)) return BLOCK.AIR;
    const chunk = this.chunks.get(key(Math.floor(x / 16), Math.floor(y / 16), Math.floor(z / 16)));
    return chunk?.data[index(x, y, z)] ?? BLOCK.AIR;
  }

  set(x, y, z, id, record = false) {
    if (!withinWorld(x, y, z) || !Number.isInteger(id) || !BLOCKS[id]) return false;
    if (this.get(x, y, z) === id) return false;
    const cx = Math.floor(x / 16), cy = Math.floor(y / 16), cz = Math.floor(z / 16);
    const ck = key(cx, cy, cz);
    let chunk = this.chunks.get(ck);
    if (!chunk) {
      chunk = { cx, cy, cz, data: new Uint8Array(CHUNK_SIZE ** 3) };
      this.chunks.set(ck, chunk);
    }
    chunk.data[index(x, y, z)] = id;
    this.dirty.add(ck);
    for (const [dx, dy, dz] of [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]]) {
      if (Math.floor((x + dx) / 16) !== cx || Math.floor((y + dy) / 16) !== cy || Math.floor((z + dz) / 16) !== cz) {
        const nk = key(Math.floor((x + dx) / 16), Math.floor((y + dy) / 16), Math.floor((z + dz) / 16));
        if (this.chunks.has(nk)) this.dirty.add(nk);
      }
    }
    if (record) { this.edits.set(key(x, y, z), [x, y, z, id]); this.revision++; }
    return true;
  }

  solidAt(x, y, z) {
    return Boolean(BLOCKS[this.get(Math.floor(x / BLOCK_SIZE), Math.floor(y / BLOCK_SIZE), Math.floor(z / BLOCK_SIZE))]?.solid);
  }

  surface(x, z) {
    for (let y = 127; y >= 0; y--) if (BLOCKS[this.get(x, y, z)]?.solid) return y + 1;
    return 0;
  }

  applyEdits(edits) {
    for (const [x, y, z, id] of edits) {
      this.set(x, y, z, id);
      this.edits.set(key(x, y, z), [x, y, z, id]);
    }
    this.revision++;
  }
}

/** Amanatides–Woo traversal; face normals point toward the previous empty cell. */
export function voxelRaycast(world, origin, direction, maxDistance = 7, includeWater = false) {
  const len = Math.hypot(direction.x, direction.y, direction.z);
  if (len < 1e-9) return null;
  const o = [origin.x / BLOCK_SIZE, origin.y / BLOCK_SIZE, origin.z / BLOCK_SIZE];
  const d = [direction.x / len, direction.y / len, direction.z / len];
  const cell = o.map(Math.floor);
  const step = d.map(v => v >= 0 ? 1 : -1);
  const delta = d.map(v => Math.abs(v) < 1e-12 ? Infinity : Math.abs(1 / v));
  const next = d.map((v, i) => Math.abs(v) < 1e-12 ? Infinity : (cell[i] + (step[i] > 0 ? 1 : 0) - o[i]) / v);
  let distance = 0, normal = [0, 0, 0];
  for (let i = 0; i < 1024 && distance * BLOCK_SIZE <= maxDistance; i++) {
    const id = world.get(...cell);
    if (id !== BLOCK.AIR && (includeWater || id !== BLOCK.WATER)) {
      const meters = Math.max(0, distance * BLOCK_SIZE);
      return { x: cell[0], y: cell[1], z: cell[2], id, distance: meters,
        normal: { x: normal[0], y: normal[1], z: normal[2] },
        point: { x: origin.x + d[0] * meters, y: origin.y + d[1] * meters, z: origin.z + d[2] * meters } };
    }
    const axis = next[0] <= next[1] && next[0] <= next[2] ? 0 : next[1] <= next[2] ? 1 : 2;
    distance = next[axis];
    cell[axis] += step[axis];
    next[axis] += delta[axis];
    normal = [0, 0, 0]; normal[axis] = -step[axis];
  }
  return null;
}
