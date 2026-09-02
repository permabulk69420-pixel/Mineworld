import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { VoxelWorld, voxelRaycast } from '../src/world/world.js';
import { BLOCK as B, BLOCK_SIZE as S, DEFAULT_SEED, GENERATOR_VERSION } from '../src/world/blocks.js';
import { generateWorld } from '../src/world/generator.js';
import { collides, safeHome } from '../src/player/physics.js';
import { WorldRenderer } from '../src/world/mesher.js';

test('negative coordinates and chunk boundaries retain separate blocks',()=>{
  const w=new VoxelWorld(1);
  for(const x of [-17,-16,-1,0,15,16])w.set(x,17,-1,B.STONE);
  for(const x of [-17,-16,-1,0,15,16])assert.equal(w.get(x,17,-1),B.STONE);
  assert.equal(w.get(-2,17,-1),B.AIR);
  w.dirty.clear();w.set(-1,17,-1,B.AIR,true);
  assert.ok(w.dirty.has('-1,1,-1'));assert.ok(w.dirty.has('0,1,-1'));assert.equal(w.edits.size,1);
});

test('world rejects illegal coordinates and block values',()=>{
  const w=new VoxelWorld(1);
  for(const p of [[128,2,0],[-128,2,0],[0,-1,0],[0,128,0],[.5,2,0],[NaN,2,0]])assert.equal(w.set(...p,B.STONE,true),false);
  assert.equal(w.set(0,2,0,99,true),false);assert.equal(w.edits.size,0);
});

test('ray traversal finds the correct face, distance, and empty neighbor',()=>{
  const w=new VoxelWorld(1);w.set(-2,2,0,B.STONE);
  const hit=voxelRaycast(w,{x:1,y:2.5*S,z:.5*S},{x:-1,y:0,z:0},5);
  assert.equal(hit.x,-2);assert.deepEqual(hit.normal,{x:1,y:0,z:0});assert.ok(Math.abs(hit.distance-(1+S))<1e-10);
  assert.equal(voxelRaycast(w,{x:1,y:2.5*S,z:.5*S},{x:0,y:0,z:0},5),null);
  assert.equal(voxelRaycast(w,{x:1,y:2.5*S,z:.5*S},{x:-1,y:0,z:0},1),null);
});

test('rays ignore decorative water and handle starting on a grid boundary',()=>{
  const w=new VoxelWorld(1);w.set(0,2,0,B.WATER);w.set(0,0,0,B.STONE);
  const hit=voxelRaycast(w,{x:S/2,y:3*S,z:S/2},{x:0,y:-1,z:0},5);
  assert.equal(hit.y,0);assert.equal(hit.distance,2*S);assert.deepEqual(hit.normal,{x:0,y:1,z:0});
  const water=voxelRaycast(w,{x:S/2,y:3*S,z:S/2},{x:0,y:-1,z:0},5,true);
  assert.equal(water.id,B.WATER);assert.equal(water.distance,0);
});

test('mesher hides shared faces, including across chunk boundaries',()=>{
  const w=new VoxelWorld(1);w.set(15,2,2,B.STONE);w.set(16,2,2,B.STONE);
  const context={world:w,materials:[]};
  const meshes=[...w.chunks.values()].map(chunk=>WorldRenderer.prototype.buildChunk.call(context,chunk));
  assert.equal(meshes.reduce((sum,m)=>sum+m.geometry.index.count,0),60);
  for(const mesh of meshes){
    const pos=mesh.geometry.attributes.position.array,normals=mesh.geometry.attributes.normal.array;
    for(let i=0;i<pos.length;i+=12){
      const a=[pos[i+3]-pos[i],pos[i+4]-pos[i+1],pos[i+5]-pos[i+2]],b=[pos[i+6]-pos[i],pos[i+7]-pos[i+1],pos[i+8]-pos[i+2]];
      const dot=(a[1]*b[2]-a[2]*b[1])*normals[i]+(a[2]*b[0]-a[0]*b[2])*normals[i+1]+(a[0]*b[1]-a[1]*b[0])*normals[i+2];
      assert.ok(dot>0,'Faces point outwards');
    }
    mesh.geometry.dispose();
  }
});

test('generator v2 is repeatable, large, connected at key regions, and gives a safe home',()=>{
  assert.equal(GENERATOR_VERSION,2);
  const a=generateWorld(new VoxelWorld(DEFAULT_SEED)),b=generateWorld(new VoxelWorld(DEFAULT_SEED));
  const digest=w=>{const h=createHash('sha256');for(const [key,chunk] of w.chunks){h.update(key);h.update(chunk.data);}return h.digest('hex');};
  assert.equal(digest(a),digest(b));assert.equal(a.edits.size,0);assert.ok(a.landmarks.length>=5);
  for(const [x,z] of [[0,34],[-48,-5],[37,-52],[39,51],[-72,-4]])assert.ok(a.surface(x,z)>2,`expected connected terrain at ${x},${z}`);
  const xs=a.surfaces.map(p=>p.x),zs=a.surfaces.map(p=>p.z);
  assert.ok(Math.max(...xs)-Math.min(...xs)>175,'continent should span more than 130 metres');
  assert.ok(Math.max(...zs)-Math.min(...zs)>150,'continent should have substantial depth');
  const home=safeHome(a);assert.ok(Number.isFinite(home.y));assert.equal(collides(a,home),false);
  assert.equal(collides(a,{...home,y:home.y-.08}),true);
});
