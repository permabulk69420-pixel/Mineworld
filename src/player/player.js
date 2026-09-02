import * as THREE from 'three';
import { collides, moveBody, safeHome, EYE_HEIGHT } from './physics.js';

export class Player {
  constructor(world,scene) {
    this.world=world;
    this.rig=new THREE.Group(); scene.add(this.rig);
    this.camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,0.045,550);
    this.camera.position.y=EYE_HEIGHT; this.rig.add(this.camera);
    this.pitch=-0.08; this.camera.rotation.x=this.pitch;
    this.verticalVelocity=0; this.grounded=false; this.flying=false; this.inXR=false;
    this.offset=new THREE.Vector3(); this.body=new THREE.Vector3(); this.direction=new THREE.Vector3();
    this.home();
  }

  home() {
    const p=safeHome(this.world);
    this.rig.position.set(p.x,p.y,p.z);
    this.rig.rotation.y=0; this.verticalVelocity=0;
    this.body.copy(this.rig.position); this.flying=false;
    if(!this.inXR) { this.pitch=-0.08; this.camera.rotation.set(this.pitch,0,0); }
  }

  getBody() {
    this.offset.set(this.inXR ? this.camera.position.x : 0,0,this.inXR ? this.camera.position.z : 0).applyQuaternion(this.rig.quaternion);
    return this.body.copy(this.rig.position).add(this.offset);
  }

  height() { return this.inXR ? THREE.MathUtils.clamp(this.camera.position.y,1,2.1) : EYE_HEIGHT; }

  look(dx,dy) {
    if(this.inXR) return;
    this.rig.rotation.y-=dx;
    this.pitch=THREE.MathUtils.clamp(this.pitch-dy,-1.48,1.48);
    this.camera.rotation.x=this.pitch;
  }

  turn(angle) {
    // Rotate around the tracked head rather than the room's origin.
    const before=this.getBody().clone();
    this.rig.rotation.y+=angle;
    const after=this.getBody();
    this.rig.position.x+=before.x-after.x; this.rig.position.z+=before.z-after.z;
  }

  setXR(active) {
    this.inXR=active;
    this.camera.position.set(0,active?0:EYE_HEIGHT,0);
    this.camera.rotation.set(active?0:this.pitch,0,0);
    this.verticalVelocity=0;
  }

  toggleFlight() { this.flying=!this.flying; this.verticalVelocity=0; }

  restore(p) {
    if(!p) return;
    const pos={x:p.x,y:p.y,z:p.z};
    if(collides(this.world,pos)) return;
    this.rig.position.set(p.x,p.y,p.z); this.rig.rotation.y=p.yaw;
    this.pitch=p.pitch; this.camera.rotation.x=this.pitch; this.flying=p.flying;
  }

  snapshot() {
    const p=this.getBody();
    return {x:p.x,y:p.y,z:p.z,yaw:this.rig.rotation.y,pitch:this.pitch,flying:this.flying};
  }

  teleport(point) {
    const landing={x:point.x,y:point.y+0.018,z:point.z};
    if(collides(this.world,landing,this.height())) return false;
    this.getBody(); this.rig.position.set(landing.x-this.offset.x,landing.y,landing.z-this.offset.z);
    this.verticalVelocity=0; return true;
  }

  update(dt,input) {
    const height=this.height(), body=this.getBody();
    this.camera.getWorldDirection(this.direction);
    this.direction.y=0;
    if(this.direction.lengthSq()<0.001) this.direction.set(0,0,-1).applyQuaternion(this.rig.quaternion);
    this.direction.normalize();
    const mx=this.direction.x*input.forward-this.direction.z*input.strafe;
    const mz=this.direction.z*input.forward+this.direction.x*input.strafe;
    const length=Math.max(1,Math.hypot(mx,mz));
    const speed=this.flying ? (input.sprint?9:5.3) : (input.sprint?5.8:3.2);
    const support={x:body.x,y:body.y-0.055,z:body.z};
    this.grounded=collides(this.world,support,height);
    if(this.flying) this.verticalVelocity=input.vertical*4;
    else {
      if(input.jump && this.grounded) this.verticalVelocity=5.6;
      else if(this.grounded && this.verticalVelocity<0) this.verticalVelocity=0;
      this.verticalVelocity-=16*dt;
    }
    const result=moveBody(this.world,body,{x:mx/length*speed*dt,y:this.verticalVelocity*dt,z:mz/length*speed*dt},height,this.grounded&&!this.flying);
    if(result.y) this.verticalVelocity=0;
    this.rig.position.copy(body).sub(this.offset);
    if(body.y < -12) { this.home(); return 'home'; }
    return null;
  }
}
