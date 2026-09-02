import * as THREE from 'three';
import { BLOCK, BLOCKS, BLOCK_SIZE as S, CHUNK_SIZE as C, isOpaque } from './blocks.js';
import { hash } from './noise.js';

const FACES = [
  { n:[1,0,0], u:[0,0,-1], v:[0,1,0], light:0.86 },
  { n:[-1,0,0], u:[0,0,1], v:[0,1,0], light:0.73 },
  { n:[0,1,0], u:[1,0,0], v:[0,0,-1], light:1 },
  { n:[0,-1,0], u:[1,0,0], v:[0,0,1], light:0.52 },
  { n:[0,0,1], u:[1,0,0], v:[0,1,0], light:0.92 },
  { n:[0,0,-1], u:[-1,0,0], v:[0,1,0], light:0.79 },
];

function paintTile(ctx,t,color,accent,kind='grain'){
  const size=64,tx=(t%4)*size,ty=Math.floor(t/4)*size;
  ctx.fillStyle=color;ctx.fillRect(tx,ty,size,size);
  const seed=t*137+91;
  if(kind==='moss'){
    for(let i=0;i<95;i++){
      const x=hash(i,seed,2,77)*size,y=hash(i,seed,4,79)*size,r=1.5+hash(i,seed,6,81)*7;
      ctx.fillStyle=`rgba(${accent},${.025+hash(i,3,seed,83)*.08})`;
      ctx.beginPath();ctx.ellipse(tx+x,ty+y,r,r*.45,hash(i,5,seed,85)*Math.PI,0,Math.PI*2);ctx.fill();
    }
  }else if(kind==='strata'){
    ctx.strokeStyle=`rgba(${accent},.16)`;ctx.lineWidth=2;
    for(let i=0;i<8;i++){
      ctx.beginPath();
      const base=ty+8+i*7;
      for(let x=0;x<=size;x+=8){const y=base+(hash(i,x,seed,87)-.5)*4; x===0?ctx.moveTo(tx+x,y):ctx.lineTo(tx+x,y);}
      ctx.stroke();
    }
  }else if(kind==='water'){
    ctx.strokeStyle=`rgba(${accent},.10)`;ctx.lineWidth=1.5;
    for(let i=0;i<7;i++){const y=ty+8+i*8;ctx.beginPath();ctx.moveTo(tx,y);ctx.bezierCurveTo(tx+18,y-3,tx+43,y+3,tx+size,y);ctx.stroke();}
  }else{
    for(let i=0;i<70;i++){
      const x=hash(i,seed,2,89)*size,y=hash(i,seed,4,91)*size,r=.7+hash(i,seed,6,93)*2.8;
      ctx.fillStyle=`rgba(${accent},${.025+hash(i,3,seed,95)*.07})`;ctx.beginPath();ctx.arc(tx+x,ty+y,r,0,Math.PI*2);ctx.fill();
    }
  }
}

function makeAtlas() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  paintTile(ctx,0,'#a7ad72','245,238,180','moss');
  paintTile(ctx,1,'#8f9d65','229,219,155','moss');
  paintTile(ctx,2,'#73594f','197,145,118','strata');
  paintTile(ctx,3,'#71848b','215,228,222','strata');
  paintTile(ctx,4,'#665348','210,177,137','strata');
  paintTile(ctx,5,'#8d775c','229,197,150','grain');
  paintTile(ctx,6,'#789276','190,217,153','moss');
  paintTile(ctx,7,'#9c795a','232,193,139','strata');
  paintTile(ctx,8,'#5fd9cb','222,255,244','strata');
  paintTile(ctx,9,'#c9bd9e','247,232,194','grain');
  paintTile(ctx,10,'#addde1','255,255,255','grain');
  paintTile(ctx,11,'#3999aa','214,250,241','water');
  paintTile(ctx,12,'#425762','154,190,193','strata');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=4;
  return texture;
}

export class WorldRenderer {
  constructor(world, scene) {
    this.world=world;this.scene=scene;this.meshes=new Map();this.atlas=makeAtlas();
    this.materials=[
      new THREE.MeshLambertMaterial({map:this.atlas,vertexColors:true,roughness:1}),
      new THREE.MeshLambertMaterial({map:this.atlas,vertexColors:true,transparent:true,opacity:.62,depthWrite:false}),
      new THREE.MeshBasicMaterial({map:this.atlas,vertexColors:true}),
    ];
  }

  buildChunk(chunk) {
    const positions=[],normals=[],colors=[],uvs=[],indices=[[],[],[]];let vertices=0;
    const {world}=this;
    for(let ly=0;ly<C;ly++)for(let lz=0;lz<C;lz++)for(let lx=0;lx<C;lx++){
      const id=chunk.data[lx+lz*C+ly*C*C];if(!id)continue;
      const x=chunk.cx*C+lx,y=chunk.cy*C+ly,z=chunk.cz*C+lz;
      const block=BLOCKS[id],group=block.glow?2:block.opaque?0:1;
      const broad=hash(Math.floor(x/4),Math.floor(y/3),Math.floor(z/4),world.seed);
      const variation=.91+broad*.13;
      for(const face of FACES){
        const {n,u,v}=face,neighbor=world.get(x+n[0],y+n[1],z+n[2]);
        if(isOpaque(neighbor)||neighbor===id)continue;
        const tile=block.tiles[n[1]>0?1:n[1]<0?2:0],tileX=tile%4,tileY=Math.floor(tile/4);
        for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
          positions.push((lx+.5+n[0]*.5+u[0]*a*.5+v[0]*b*.5)*S,(ly+.5+n[1]*.5+u[1]*a*.5+v[1]*b*.5)*S,(lz+.5+n[2]*.5+u[2]*a*.5+v[2]*b*.5)*S);
          normals.push(...n);
          const sample=(su,sv)=>isOpaque(world.get(x+n[0]+u[0]*su+v[0]*sv,y+n[1]+u[1]*su+v[1]*sv,z+n[2]+u[2]*su+v[2]*sv))?1:0;
          const s1=sample(a,0),s2=sample(0,b),corner=sample(a,b),ao=s1&&s2?.62:1-(s1+s2+corner)*.095;
          let tint=variation;
          if(id===BLOCK.GRASS&&n[1]>0)tint*=.96+hash(Math.floor(x/7),0,Math.floor(z/7),world.seed+61)*.09;
          if(id===BLOCK.STONE)tint*=.94+hash(Math.floor(x/5),Math.floor(y/5),Math.floor(z/5),world.seed+12)*.12;
          const light=block.glow?1:face.light*ao*tint;colors.push(light,light,light);
          uvs.push((tileX+(a+1)/2*.97+.015)/4,1-(tileY+(1-b)/2*.97+.015)/4);
        }
        indices[group].push(vertices,vertices+1,vertices+2,vertices,vertices+2,vertices+3);vertices+=4;
      }
    }
    if(!vertices)return null;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    let offset=0;indices.forEach((list,i)=>{if(list.length)geo.addGroup(offset,list.length,i);offset+=list.length;});
    geo.setIndex(indices.flat());geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,this.materials);mesh.position.set(chunk.cx*C*S,chunk.cy*C*S,chunk.cz*C*S);mesh.matrixAutoUpdate=false;mesh.updateMatrix();return mesh;
  }

  flush(budget=Infinity){
    const start=performance.now();
    for(const key of this.world.dirty){
      const previous=this.meshes.get(key);if(previous){this.scene.remove(previous);previous.geometry.dispose();this.meshes.delete(key);}
      const chunk=this.world.chunks.get(key),mesh=chunk&&this.buildChunk(chunk);if(mesh){this.meshes.set(key,mesh);this.scene.add(mesh);}
      this.world.dirty.delete(key);if(performance.now()-start>budget)break;
    }
  }

  dispose(){for(const mesh of this.meshes.values()){this.scene.remove(mesh);mesh.geometry.dispose();}this.materials.forEach(m=>m.dispose());this.atlas.dispose();this.meshes.clear();}
}
