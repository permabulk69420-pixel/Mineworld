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

function crown(world, x, y, z, radius, seed) {
  for (let dx=-radius;dx<=radius;dx++) for (let dz=-radius;dz<=radius;dz++) for (let dy=-2;dy<=2;dy++) {
    if ((dx*dx+dz*dz)/(radius*radius)+dy*dy/7>1.14) continue;
    if (hash(x+dx,y+dy,z+dz,seed)<0.08) continue;
    if (world.get(x+dx,y+dy,z+dz)===B.AIR) world.set(x+dx,y+dy,z+dz,B.LEAVES);
  }
}

function tree(world,x,y,z,seed,large=false) {
  const height=large?12+Math.floor(hash(x,y,z,seed)*4):6+Math.floor(hash(x,y,z,seed)*5);
  for(let dy=0;dy<height;dy++) world.set(x,y+dy,z,B.WOOD);
  if(large) for(let dy=0;dy<height-3;dy++) world.set(x+1,y+dy,z,B.WOOD);
  crown(world,x,y+height,z,large?6:3+(hash(x,0,z,seed)>.55?1:0),seed);
  if(large){
    for(const [dx,dz] of [[-5,1],[4,4],[2,-5]]){
      for(let i=0;i<6;i++) world.set(x+Math.round(dx*i/5),y+height-5+i,z+Math.round(dz*i/5),B.WOOD);
      crown(world,x+dx,y+height,z+dz,4,seed+dx*17+dz);
    }
  }
}

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
  const columns=[];

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
      let id=y===top?B.GRASS:y>=top-3?B.SOIL:y<top-14?B.BASALT:B.STONE;
      if(lakeDistance<LAKE.radius+2&&y>=top-1)id=B.SAND;
      if(y===top&&(top>43||Math.abs(noise2(x*.08,z*.08,seed+812))>.78)&&hash(x,y,z,seed+12)>.46)id=B.STONE;
      world.set(x,y,z,id);
    }
    // The basin and water use the same radius. The previous v2 pass carved the basin
    // farther than it filled it, leaving a visibly dry ring/gaps at the shoreline.
    if(lakeDistance<LAKE.radius&&top<LAKE.waterLevel){
      for(let y=top+1;y<=LAKE.waterLevel;y++) world.set(x,y,z,B.WATER);
    }
    columns.push({x,z,top,lakeDistance});world.surfaces.push({x,y:top,z});
  }

  // A continuous three-voxel-wide stream leaves the lake. Each successive centre cell
  // overlaps the previous width so diagonal meanders cannot open one-voxel holes.
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

  for(const {x,z,top,lakeDistance} of columns){
    if(lakeDistance<22)continue;
    // A broad south-to-north meadow gives the player a genuine long-range vista at spawn.
    if(Math.abs(x-32)<19&&z>-8&&z<68)continue;
    const openMeadow=Math.hypot((x-34)/45,(z-49)/28)<1;
    const chance=openMeadow?.91:.78;
    if(x%5!==0||z%5!==0||hash(x,0,z,seed+85)<chance)continue;
    tree(world,x,top+1,z,seed+31,hash(x,top,z,seed+510)>.86);
  }

  for(const [x,z] of [[-48,-8],[-18,-42],[42,-38],[68,18],[-38,54]]){
    const y=world.surface(x,z);if(y>2)tree(world,x,y+1,z,seed+700+x,true);
  }

  for(const [x,z] of [[55,-58],[-70,-17]]){
    const y=world.surface(x,z);if(y>3){world.set(x,y+1,z,B.CRYSTAL);world.set(x,y+2,z,B.CRYSTAL);world.set(x+1,y+1,z,B.CRYSTAL);}
  }

  const spawnX=32,spawnZ=52,spawnY=world.surface(spawnX,spawnZ);
  for(let x=spawnX-10;x<=spawnX+10;x++) for(let z=spawnZ-10;z<=spawnZ+10;z++){
    const top=world.surface(x,z);if(top<2)continue;
    for(let y=top+1;y<Math.min(127,top+20);y++) if(world.get(x,y,z)===B.WOOD||world.get(x,y,z)===B.LEAVES)world.set(x,y,z,B.AIR);
  }
  world.spawn={x:(spawnX+.5)*BLOCK_SIZE,y:spawnY*BLOCK_SIZE+.02,z:(spawnZ+.5)*BLOCK_SIZE};

  for(const landmark of [
    {name:'First Light',x:32,z:52},
    {name:'Cedar Vale',x:-48,z:-5},
    {name:'North Ridge',x:37,z:-52},
    {name:'Lake Country',x:LAKE.x,z:LAKE.z},
    {name:'West Cliffs',x:-72,z:-4},
  ]){
    const y=world.surface(landmark.x,landmark.z);
    world.landmarks.push({name:landmark.name,x:landmark.x*BLOCK_SIZE,y:y*BLOCK_SIZE,z:landmark.z*BLOCK_SIZE});
  }
  world.dirty=new Set(world.chunks.keys());return world;
}
