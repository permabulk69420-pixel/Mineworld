import * as THREE from 'three';
import { PALETTE, BLOCKS, BLOCK } from '../world/blocks.js';
import { voxelRaycast } from '../world/world.js';
import { collides } from './physics.js';

export function stickAxes(gamepad) {
  const axes=gamepad?.axes??[];
  const start=axes.length>=4?2:0;
  const dead=v=>Math.abs(v||0)<0.17?0:Math.sign(v)*(Math.abs(v)-0.17)/0.83;
  return {x:dead(axes[start]),y:dead(axes[start+1])};
}

export class XRControls {
  constructor(renderer,player,world,scene,callbacks) {
    this.renderer=renderer;this.player=player;this.world=world;this.callbacks=callbacks;
    this.controllers=[];this.previous=new Map();this.teleportHeld=false;this.destination=null;this.snapReady=true;
    this.origin=new THREE.Vector3();this.direction=new THREE.Vector3();this.rotation=new THREE.Matrix4();
    const beamGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);
    for(let i=0;i<2;i++){
      const controller=renderer.xr.getController(i),grip=renderer.xr.getControllerGrip(i);
      player.rig.add(controller,grip);
      controller.addEventListener('connected',event=>{controller.userData.source=event.data;grip.userData.hand=event.data.handedness;});
      controller.addEventListener('disconnected',()=>{controller.userData.source=null;grip.userData.hand=null;this.previous.clear();});
      const beam=new THREE.Line(beamGeometry,new THREE.LineBasicMaterial({color:0xc4fff0,transparent:true,opacity:0.5}));
      beam.scale.z=6;controller.add(beam);
      const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.019,0.026,0.18,8),new THREE.MeshLambertMaterial({color:0x34494d}));
      handle.rotation.x=-0.32;handle.position.set(0,-0.005,0.005);grip.add(handle);
      const head=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.025,0.07),new THREE.MeshLambertMaterial({color:0x88e6c7}));
      head.position.set(0,0.085,-0.025);grip.add(head);
      const pick=new THREE.Mesh(new THREE.ConeGeometry(0.022,0.18,5),new THREE.MeshLambertMaterial({color:0xb9c8c3}));
      pick.rotation.z=Math.PI/2;pick.position.set(0.085,0.09,-0.028);pick.visible=false;grip.add(pick);
      const resonance=new THREE.Mesh(new THREE.TorusGeometry(0.042,0.006,6,18),new THREE.MeshBasicMaterial({color:0x9dffe9,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending}));
      resonance.position.set(0,0.087,-0.026);resonance.rotation.x=Math.PI/2;resonance.visible=false;grip.add(resonance);
      this.controllers.push({controller,grip,beam,head,pick,resonance});
    }
    this.wristCanvas=document.createElement('canvas');this.wristCanvas.width=512;this.wristCanvas.height=256;
    this.wristTexture=new THREE.CanvasTexture(this.wristCanvas);this.wristTexture.colorSpace=THREE.SRGBColorSpace;
    this.wrist=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.17),new THREE.MeshBasicMaterial({map:this.wristTexture,transparent:true,side:THREE.DoubleSide,depthTest:false}));
    this.wrist.position.set(0,0.10,-0.075);this.wrist.rotation.x=-0.85;this.wrist.renderOrder=20;
    this.arcGeometry=new THREE.BufferGeometry();this.arcGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(64*3),3));
    this.arc=new THREE.Line(this.arcGeometry,new THREE.LineBasicMaterial({color:0x8df4d2}));this.arc.frustumCulled=false;this.arc.visible=false;scene.add(this.arc);
    this.marker=new THREE.Mesh(new THREE.RingGeometry(0.22,0.29,32),new THREE.MeshBasicMaterial({color:0xb8ffe4,side:THREE.DoubleSide}));
    this.marker.rotation.x=-Math.PI/2;this.marker.visible=false;scene.add(this.marker);
    this.wristKey='';this.toolKey='';
  }

  reset(){this.previous.clear();this.teleportHeld=false;this.destination=null;this.arc.visible=this.marker.visible=false;this.snapReady=true;}

  byHand(hand){return this.controllers.find(c=>c.controller.userData.source?.handedness===hand);}

  ray(hand='right'){
    const info=this.byHand(hand);
    if(!info)return null;
    info.controller.updateWorldMatrix(true,false);
    this.origin.setFromMatrixPosition(info.controller.matrixWorld);
    this.rotation.extractRotation(info.controller.matrixWorld);
    this.direction.set(0,0,-1).applyMatrix4(this.rotation).normalize();
    return {origin:this.origin,direction:this.direction};
  }

  edge(hand,index,pressed){
    const key=`${hand}:${index}`,was=this.previous.get(key)||false;
    this.previous.set(key,pressed);return pressed&&!was;
  }

  sample(dt,turning){
    const result={forward:0,strafe:0,vertical:0,jump:false,sprint:false,mine:false,build:false};
    let leftTrigger=false;
    for(const {controller,grip,beam} of this.controllers){
      const source=controller.userData.source;if(!source?.gamepad){beam.visible=false;continue;}
      const hand=source.handedness,gp=source.gamepad,axes=stickAxes(gp);
      const down=i=>!!gp.buttons[i]?.pressed;
      beam.visible=hand==='right';
      if(hand==='left'){
        if(this.wrist.parent!==grip)grip.add(this.wrist);
        result.forward=-axes.y;result.strafe=axes.x;
        leftTrigger=down(0);
        if(this.edge(hand,1,down(1)))this.callbacks.cycle(-1);
        if(this.edge(hand,4,down(4)))this.callbacks.cycle(1);
        if(this.edge(hand,5,down(5)))this.callbacks.flight();
      }else if(hand==='right'){
        result.mine=down(0);result.build=down(1);
        result.vertical=(down(4)?1:0)-(down(5)?1:0);
        result.jump=this.edge(hand,4,down(4));
        if(turning==='smooth')this.player.turn(-axes.x*1.8*dt);
        else if(Math.abs(axes.x)>0.65&&this.snapReady){this.player.turn(-Math.sign(axes.x)*Math.PI/6);this.snapReady=false;}
        if(Math.abs(axes.x)<0.25)this.snapReady=true;
      }
    }
    if(leftTrigger)this.updateTeleport();
    else if(this.teleportHeld){
      if(this.destination&&this.player.teleport(this.destination))this.callbacks.teleport();
      this.arc.visible=this.marker.visible=false;this.destination=null;
    }
    this.teleportHeld=leftTrigger;
    if(leftTrigger){result.forward=result.strafe=0;result.mine=result.build=false;}
    return result;
  }

  updateTeleport(){
    const ray=this.ray('left');if(!ray)return;
    const start=ray.origin.clone(),velocity=ray.direction.clone().multiplyScalar(8);velocity.y+=2.5;
    const attribute=this.arcGeometry.attributes.position;
    let previous=start.clone(),count=0;this.destination=null;
    for(let i=0;i<64;i++){
      const t=i*0.038;
      const point=start.clone().addScaledVector(velocity,t);point.y-=4.9*t*t;
      const segment=point.clone().sub(previous),length=segment.length();
      const hit=length>0?voxelRaycast(this.world,previous,segment,length):null;
      if(hit){
        attribute.setXYZ(count++,hit.point.x,hit.point.y+0.01,hit.point.z);
        const landing={x:hit.point.x,y:hit.point.y+0.018,z:hit.point.z};
        if(hit.normal.y>0.9&&!collides(this.world,landing,this.player.height()))this.destination=hit.point;
        break;
      }
      attribute.setXYZ(count++,point.x,point.y,point.z);previous=point;
    }
    attribute.needsUpdate=true;this.arcGeometry.setDrawRange(0,count);this.arc.visible=true;
    this.arc.material.color.set(this.destination?0x9effd9:0xeab58b);
    this.marker.visible=!!this.destination;
    if(this.destination)this.marker.position.set(this.destination.x,this.destination.y+0.025,this.destination.z);
  }

  updateTool(tool,creative=false){
    const key=`${tool}:${creative}`;if(this.toolKey===key)return;this.toolKey=key;
    const resonant=!creative&&tool==='resonant';
    const quarry=creative||tool==='quarry'||resonant;
    for(const info of this.controllers){
      info.pick.visible=quarry;
      info.resonance.visible=resonant;
      info.pick.material.color.set(resonant?0xd8fff6:0xb9c8c3);
      info.head.material.color.set(resonant?0x79e9d1:quarry?0xb8c6bf:0x88e6c7);
      info.head.scale.set(quarry?1.35:1,quarry?1.15:1,quarry?0.8:1);
      info.resonance.scale.setScalar(resonant?1.12:1);
    }
  }

  updateWrist(selected,flying,game=null){
    const count=game?.creative?'∞':game?.inventory?.[PALETTE[selected]]??0;
    const deepstone=game?.creative?0:game?.inventory?.[BLOCK.BASALT]??0;
    const objective=game?.creative?'Creative build mode':game?.objective||'Explore Skyreach';
    const tool=game?.creative?'BUILDER TOOL':game?.tool==='resonant'?'RESONANT PICK':game?.tool==='quarry'?'QUARRY PICK':'FIELD TOOL';
    const key=`${selected}:${flying}:${count}:${deepstone}:${objective}:${tool}`;if(this.wristKey===key)return;this.wristKey=key;
    const ctx=this.wristCanvas.getContext('2d');ctx.clearRect(0,0,512,256);
    ctx.fillStyle='rgba(12,30,35,.92)';ctx.beginPath();ctx.roundRect(0,0,512,256,22);ctx.fill();
    ctx.fillStyle='#a0e4c1';ctx.font='600 22px system-ui';ctx.fillText('MINEWORLD',24,40);
    ctx.textAlign='right';ctx.fillStyle='#cfddd5';ctx.fillText(game?.creative?(flying?'CREATIVE · FLY':'CREATIVE'):tool,488,40);ctx.textAlign='left';
    ctx.font='600 30px system-ui';ctx.fillStyle='#ffffff';ctx.fillText(`${BLOCKS[PALETTE[selected]].name}  ×${count}`,24,84);
    PALETTE.forEach((id,i)=>{ctx.fillStyle=BLOCKS[id].color;ctx.fillRect(26+i*53,102,38,38);if(i===selected){ctx.strokeStyle='#fff3b8';ctx.lineWidth=4;ctx.strokeRect(22+i*53,98,46,46);}});
    ctx.font='600 18px system-ui';ctx.fillStyle='#d9e6df';ctx.fillText(objective.slice(0,52),24,177);
    ctx.font='18px system-ui';ctx.fillStyle='#9fb4b4';
    const hint=game?.creative?'X: material · Y: flight · trigger mine · grip build':game?.tool==='resonant'?`Deepstone ×${deepstone} · trigger: gather · Y: use`:'Trigger: gather · grip: place · X: material · Y: craft/use';
    ctx.fillText(hint,24,211);
    ctx.font='17px system-ui';ctx.fillStyle='#819999';ctx.fillText('Left trigger: teleport · right stick: turn',24,238);
    this.wristTexture.needsUpdate=true;
  }
}