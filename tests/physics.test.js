import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelWorld } from '../src/world/world.js';
import { BLOCK as B, BLOCK_SIZE as S } from '../src/world/blocks.js';
import { collides, moveBody, blockOverlapsBody } from '../src/player/physics.js';
import { stickAxes } from '../src/player/xr.js';

function floor(){const w=new VoxelWorld(1);for(let x=-5;x<6;x++)for(let z=-5;z<6;z++)w.set(x,0,z,B.STONE);return w;}

test('falling and large movements do not tunnel through a floor or wall',()=>{
  const w=floor();const p={x:S*.5,y:8,z:S*.5};
  const result=moveBody(w,p,{x:0,y:-15,z:0});
  assert.equal(result.y,true);assert.ok(p.y>=S);assert.ok(p.y<S+.16);assert.equal(collides(w,p),false);
  for(let y=1;y<6;y++)w.set(2,y,0,B.STONE);
  const hit=moveBody(w,p,{x:5,y:0,z:0});assert.equal(hit.x,true);assert.ok(p.x<2*S);
});

test('a one-block step works and a low ceiling prevents climbing into it',()=>{
  const w=floor();w.set(1,1,0,B.STONE);
  const p={x:S*.5,y:S+.005,z:S*.5};
  const result=moveBody(w,p,{x:.7,y:0,z:0},1.65,true);
  assert.equal(result.stepped,true);assert.ok(p.y>=2*S);assert.equal(collides(w,p),false);
  const blocked={x:S*.5,y:S+.005,z:S*.5};
  w.set(0,4,0,B.STONE);w.set(1,4,0,B.STONE);
  const blockedResult=moveBody(w,blocked,{x:.7,y:0,z:0},1.65,true);
  assert.equal(blockedResult.stepped,false);assert.equal(collides(w,blocked),false);
});

test('placement cannot intersect a standing player, but can support their feet',()=>{
  const p={x:S*.5,y:S,z:S*.5};
  assert.equal(blockOverlapsBody(0,1,0,p),true);
  assert.equal(blockOverlapsBody(0,0,0,p),false);
  assert.equal(blockOverlapsBody(2,1,0,p),false);
});

test('Quest sticks use xr-standard axes, with deadzone and two-axis fallback',()=>{
  assert.deepEqual(stickAxes({axes:[0,0,1,-1]}),{x:1,y:-1});
  assert.deepEqual(stickAxes({axes:[.1,-.1]}),{x:0,y:0});
  assert.deepEqual(stickAxes({axes:[-1,1]}),{x:-1,y:1});
  assert.deepEqual(stickAxes(null),{x:0,y:0});
});
