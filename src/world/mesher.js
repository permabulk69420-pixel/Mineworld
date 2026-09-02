import * as THREE from 'three';
import { BLOCK, BLOCKS, BLOCK_SIZE as S, CHUNK_SIZE as C, isOpaque } from './blocks.js';
import { hash } from './noise.js';

// Each basis has u × v = normal, so every triangle faces outwards.
const FACES = [
  { n:[1,0,0], u:[0,0,-1], v:[0,1,0], light:0.83 },
  { n:[-1,0,0], u:[0,0,1], v:[0,1,0], light:0.70 },
  { n:[0,1,0], u:[1,0,0], v:[0,0,-1], light:1 },
  { n:[0,-1,0], u:[1,0,0], v:[0,0,1], light:0.48 },
  { n:[0,0,1], u:[1,0,0], v:[0,1,0], light:0.90 },
  { n:[0,0,-1], u:[-1,0,0], v:[0,1,0], light:0.76 },
];

function makeAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const colors = ['#79a961','#956348','#93634a','#acb8b2','#826047','#b78e62','#53856c','#c69a6a','#62d9ca','#ddcfaa','#a5d4de','#59c4d1','#556777'];
  for (let t = 0; t < colors.length; t++) {
    const tx = (t % 4) * 32, ty = Math.floor(t / 4) * 32;
    ctx.fillStyle = colors[t]; ctx.fillRect(tx, ty, 32, 32);
    for (let px = 0; px < 16; px++) for (let py = 0; py < 16; py++) {
      const h = hash(px, t, py, 824);
      ctx.fillStyle = h > 0.5 ? `rgba(255,255,255,${(h - 0.5) * 0.23})` : `rgba(10,24,28,${(0.5 - h) * 0.22})`;
      ctx.fillRect(tx + px * 2, ty + py * 2, 2, 2);
    }
    if (t === 1) {
      ctx.fillStyle = '#659357'; ctx.fillRect(tx, ty, 32, 7);
      for (let x = 0; x < 32; x += 2) ctx.fillRect(tx + x, ty + 6, 2, 2 + Math.floor(hash(x, 0, 0, 31) * 5));
    }
    if (t === 4) {
      ctx.fillStyle = '#634b3b';
      for (let x = 3; x < 32; x += 7) ctx.fillRect(tx + x, ty, 2, 32);
    }
    if (t === 5) {
      ctx.strokeStyle = '#795c43'; ctx.lineWidth = 2;
      for (let r = 4; r <= 13; r += 4) ctx.strokeRect(tx + 16 - r, ty + 16 - r, r * 2, r * 2);
    }
    if (t === 7) {
      ctx.fillStyle = '#8f6d4c';
      for (let y = 7; y < 32; y += 8) { ctx.fillRect(tx, ty + y, 32, 1); ctx.fillRect(tx + (y % 3) * 10, ty + y - 7, 1, 7); }
    }
    if (t === 8) {
      ctx.fillStyle = '#b6ffdf'; ctx.fillRect(tx + 6, ty + 4, 3, 19); ctx.fillRect(tx + 22, ty + 15, 3, 12);
      ctx.fillStyle = '#2e998e'; ctx.fillRect(tx + 13, ty + 8, 4, 15);
    }
    if (t === 10) {
      ctx.fillStyle = '#ddf8ff'; ctx.fillRect(tx, ty, 32, 2); ctx.fillRect(tx, ty, 2, 32);
      ctx.fillRect(tx + 29, ty, 3, 32); ctx.fillRect(tx, ty + 29, 32, 3);
      ctx.fillRect(tx + 6, ty + 7, 3, 8);
    }
    if (t === 12) {
      ctx.fillStyle = '#42586a'; ctx.fillRect(tx, ty + 15, 32, 2); ctx.fillRect(tx + 15, ty, 1, 15);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.anisotropy = 2;
  return texture;
}

export class WorldRenderer {
  constructor(world, scene) {
    this.world = world; this.scene = scene; this.meshes = new Map();
    this.atlas = makeAtlas();
    this.materials = [
      new THREE.MeshLambertMaterial({ map:this.atlas, vertexColors:true }),
      new THREE.MeshLambertMaterial({ map:this.atlas, vertexColors:true, transparent:true, opacity:0.55, depthWrite:false }),
      new THREE.MeshBasicMaterial({ map:this.atlas, vertexColors:true }),
    ];
  }

  buildChunk(chunk) {
    const positions = [], normals = [], colors = [], uvs = [], indices = [[],[],[]];
    let vertices = 0;
    const { world } = this;
    for (let ly = 0; ly < C; ly++) for (let lz = 0; lz < C; lz++) for (let lx = 0; lx < C; lx++) {
      const id = chunk.data[lx + lz * C + ly * C * C];
      if (!id) continue;
      const x = chunk.cx * C + lx, y = chunk.cy * C + ly, z = chunk.cz * C + lz;
      const block = BLOCKS[id], group = block.glow ? 2 : block.opaque ? 0 : 1;
      const variation = 0.94 + hash(x, y, z, world.seed) * 0.10;
      for (const face of FACES) {
        const { n,u,v } = face;
        const neighbor = world.get(x+n[0], y+n[1], z+n[2]);
        if (isOpaque(neighbor) || neighbor === id) continue;
        const tile = block.tiles[n[1] > 0 ? 1 : n[1] < 0 ? 2 : 0];
        const tileX = tile % 4, tileY = Math.floor(tile / 4);
        for (const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
          positions.push((lx+.5+n[0]*.5+u[0]*a*.5+v[0]*b*.5)*S,
            (ly+.5+n[1]*.5+u[1]*a*.5+v[1]*b*.5)*S,
            (lz+.5+n[2]*.5+u[2]*a*.5+v[2]*b*.5)*S);
          normals.push(...n);
          const sample = (su,sv) => isOpaque(world.get(x+n[0]+u[0]*su+v[0]*sv, y+n[1]+u[1]*su+v[1]*sv, z+n[2]+u[2]*su+v[2]*sv)) ? 1 : 0;
          const s1 = sample(a,0), s2 = sample(0,b), corner = sample(a,b);
          const ao = s1 && s2 ? 0.60 : 1 - (s1+s2+corner)*0.105;
          const light = block.glow ? 1 : face.light * ao * variation;
          colors.push(light,light,light);
          uvs.push((tileX+(a+1)/2*0.98+0.01)/4, 1-(tileY+(1-b)/2*0.98+0.01)/4);
        }
        indices[group].push(vertices,vertices+1,vertices+2,vertices,vertices+2,vertices+3);
        vertices += 4;
      }
    }
    if (!vertices) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals,3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
    let offset = 0;
    indices.forEach((list,i) => { if (list.length) geo.addGroup(offset,list.length,i); offset += list.length; });
    geo.setIndex(indices.flat()); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo,this.materials);
    mesh.position.set(chunk.cx*C*S, chunk.cy*C*S, chunk.cz*C*S);
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    return mesh;
  }

  flush(budget = Infinity) {
    const start = performance.now();
    for (const key of this.world.dirty) {
      const previous = this.meshes.get(key);
      if (previous) { this.scene.remove(previous); previous.geometry.dispose(); this.meshes.delete(key); }
      const chunk = this.world.chunks.get(key);
      const mesh = chunk && this.buildChunk(chunk);
      if (mesh) { this.meshes.set(key,mesh); this.scene.add(mesh); }
      this.world.dirty.delete(key);
      if (performance.now() - start > budget) break;
    }
  }

  dispose() {
    for (const mesh of this.meshes.values()) { this.scene.remove(mesh); mesh.geometry.dispose(); }
    this.materials.forEach(m => m.dispose()); this.atlas.dispose(); this.meshes.clear();
  }
}
