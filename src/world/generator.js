import { BLOCK as B, BLOCK_SIZE, GENERATOR_VERSION } from './blocks.js';
import { fbm, hash, noise2 } from './noise.js';

const LOBES = Object.freeze([
  { x: 0, z: 0, rx: 78, rz: 67, base: 35 },
  { x: -56, z: -12, rx: 42, rz: 40, base: 37 },
  { x: 46, z: -48, rx: 48, rz: 35, base: 43 },
  { x: 52, z: 43, rx: 48, rz: 41, base: 32 },
  { x: -34, z: 48, rx: 48, rz: 37, base: 31 },
]);

export const ISLANDS = [
  { x: 32, z: 52, rx: 90, rz: 82, top: 35, depth: 40, name: 'First Light' },
];

export const LAKE = Object.freeze({ x: -22, z: 17, radius: 16, waterLevel: 33 });

function landShape(x,z,seed) {
  let best=null,bestInfluence=-Infinity;
  for(const lobe of LOBES){
    const d=Math.hypot((x-lobe.x)/lobe.rx,(z-lobe.z)/lobe.rz),influence=1-d;
    if(influence>bestInfluence){bestInfluence=influence;best=lobe;}
  }
  const ragged=noise2(x*.055,z*.055,seed+404)*.085+noise2(x*.17,z*.17,seed+91)*.025;
  return {inside:bestInfluence+ragged>0,lobe:best,influence:Math.max(0,bestInfluence)};
}

function topHeight(x,z,shape,seed) {
  let top=shape.lobe.base+fbm(x*.035,z*.035,seed)*7+fbm(x*.095,z*.095,seed+57)*2.5;
  const ridge=Math.max(0,1-Math.hypot((x-35)/46,(z+48)/23));top+=ridge*11;
  const west=Math.max(0,1-Math.hypot((x+59)/28,(z+8)/45));top+=west*5;
  const meadow=Math.max(0,1-Math.hypot((x-30)/48,(z-48)/34));top-=meadow*3;
  return Math.floor(top);
}

export function generateWorld(world, version=GENERATOR_VERSION) {
  if(version!==2) throw new Error('This build expects the large-world generator.');
  const {seed}=world;world.surfaces=[];world.landmarks=[];

  for(let x=-104;x<=106;x++) for(let z=-91;z<=91;z++){
    const shape=landShape(x,z,seed);if(!shape.inside)continue;
    let top=topHeight(x,z,shape,seed);
    const lakeDistance=Math.hypot((x-LAKE.x)/1.2,z-LAKE.z);
    if(lakeDistance<LAKE.radius) top=Math.min(top,30+Math.floor(lakeDistance*.16));
    const thickness=Math.max(10,Math.floor(18+shape.influence*30)),bottom=Math.max(2,top-thickness);
    for(let y=bottom;y<=top;y++){
      const caveA=y<top-4&&y>bottom+3&&Math.hypot((x+18)*.42,y-24)<4.4&&z>-30&&z<34;
      const caveB=y<top-5&&y>bottom+4&&Math.hypot((z+31)*.45,y-29)<4.8&&x>8&&x<65;
      if(caveA||caveB)continue;
      const depth=top-y;
      let id;
      if(depth===0) id=B.GRASS;
      else if(y<top-14) id=B.BASALT;
      else {
        const loamPocket=noise2(x*.075+depth*.13,z*.075-depth*.09,seed+311)+noise2(x*.17,z*.11,seed+912)*.45;
        id=depth<=1&&loamPocket>.08?B.SOIL:B.STONE;
        if(depth>1&&depth<7&&loamPocket>.72)id=B.SOIL;
      }
      if(lakeDistance<LAKE.radius+2&&y>=top-1)id=B.SAND;
      if(y===top&&(top>43||Math.abs(noise2(x*.08,z*.08,seed+812))>.78)&&hash(x,y,z,seed+12)>.46)id=B.STONE;
      world.set(x,y,z,id);
    }
    if(lakeDistance<LAKE.radius&&top<LAKE.waterLevel){
      for(let y=top+1;y<=LAKE.waterLevel;y++) world.set(x,y,z,B.WATER);
    }
    world.surfaces.push({x,y:top,z});
  }

  let previousZ=LAKE.z;
  for(let x=-23;x>=-87;x--){
    const targetZ=LAKE.z+Math.round(Math.sin((x+23)*.13)*2);
    const step=Math.sign(targetZ-previousZ);
    for(let centerZ=previousZ;;centerZ+=step){
      for(let dz=-1;dz<=1;dz++){
        const z=centerZ+dz,y=world.surface(x,z);if(y<2)continue;
        world.set(x,y-1,z,B.SAND);world.set(x,y,z,B.SAND);world.set(x,y+1,z,B.WATER);
      }
      if(centerZ===targetZ||step===0)break;
    }
    previousZ=targetZ;
  }

  for(const [cx,cz,length,height,angle] of [
    [-51,-12,15,10,.32],[61,-17,18,13,-.5],[-62,42,13,9,.72],[15,-58,17,12,-.18]
  ]){
    for(let i=-length;i<=length;i++){
      const x=Math.round(cx+Math.cos(angle)*i),z=Math.round(cz+Math.sin(angle)*i);
      const ground=world.surface(x,z);if(ground<2)continue;
      const profile=Math.max(1,Math.round(height*(1-Math.abs(i)/(length+1))));
      for(let y=0;y<profile;y++) world.set(x,ground+y,z,B.STONE);
      if(i%3===0){
        const sideX=x+Math.round(Math.sin(angle)),sideZ=z-Math.round(Math.cos(angle));
        const sideGround=world.surface(sideX,sideZ);
        if(sideGround>2)for(let y=0;y<Math.max(1,profile-3);y++)world.set(sideX,sideGround+y,sideZ,B.STONE);
      }
    }
  }

  for(const [x,z] of [[55,-58],[-70,-17]]){
    const y=world.surface(x,z);if(y>3){world.set(x,y,z,B.CRYSTAL);world.set(x,y+1,z,B.CRYSTAL);world.set(x+1,y,z,B.CRYSTAL);}
  }

  const spawnX=32,spawnZ=52,spawnY=world.surface(spawnX,spawnZ);
  world.spawn={x:(spawnX+.5)*BLOCK_SIZE,y:spawnY*BLOCK_SIZE+.02,z:(spawnZ+.5)*BLOCK_SIZE};

  for(const landmark of [
    {name:'First Light',x:32,z:52},
    {name:'Wind Garden',x:-48,z:-5},
    {name:'North Ridge',x:37,z:-52},
    {name:'Lake Country',x:LAKE.x,z:LAKE.z},
    {name:'West Ribs',x:-72,z:-4},
  ]){
    const y=world.surface(landmark.x,landmark.z);
    world.landmarks.push({name:landmark.name,x:landmark.x*BLOCK_SIZE,y:y*BLOCK_SIZE,z:landmark.z*BLOCK_SIZE});
  }
  world.dirty=new Set(world.chunks.keys());return world;
}
