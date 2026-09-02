import * as THREE from 'three';
import { BLOCK_SIZE, BLOCKS } from './world/blocks.js';

export class Particles {
  constructor(scene){
    this.items=[];this.capacity=96;this.dummy=new THREE.Object3D();this.color=new THREE.Color();
    this.mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial(),this.capacity);
    this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);
  }
  burst(x,y,z,id){
    for(let i=0;i<9;i++){
      if(this.items.length===this.capacity)this.items.shift();
      this.items.push({x:(x+.5)*BLOCK_SIZE,y:(y+.5)*BLOCK_SIZE,z:(z+.5)*BLOCK_SIZE,
        vx:(Math.random()-.5)*2.1,vy:Math.random()*1.8,vz:(Math.random()-.5)*2.1,life:.45+Math.random()*.2,color:BLOCKS[id].color});
    }
  }
  update(dt){
    this.items=this.items.filter(p=>p.life>0);
    this.items.forEach((p,i)=>{
      p.life-=dt;p.vy-=5*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
      this.dummy.position.set(p.x,p.y,p.z);this.dummy.scale.setScalar(Math.max(0,p.life)*.13);
      this.dummy.rotation.set(p.life*4,p.life*3,0);this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i,this.dummy.matrix);this.mesh.setColorAt(i,this.color.set(p.color));
    });
    this.mesh.count=this.items.length;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
  }
}
