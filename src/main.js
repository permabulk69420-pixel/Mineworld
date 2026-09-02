import './style.css';
import * as THREE from 'three';
import { BLOCK, BLOCKS, BLOCK_SIZE as S, DEFAULT_SEED, PALETTE, withinWorld } from './world/blocks.js';
import { VoxelWorld, voxelRaycast } from './world/world.js';
import { generateWorld } from './world/generator.js';
import { WorldRenderer } from './world/mesher.js';
import { Player } from './player/player.js';
import { Input } from './player/input.js';
import { XRControls } from './player/xr.js';
import { blockOverlapsBody } from './player/physics.js';
import { Environment } from './environment.js';
import { Particles } from './particles.js';
import { Sound } from './audio.js';
import { UI } from './ui/ui.js';
import { createJourney, collectBlock, canPlace, spendBlock, refundBlock, harvestInfo, quarryRecipeReady, useJourney, resonatorCount, resonatorsReady, updateJourney, archPortalActive, hollowPortalActive, quarryForgePortalActive, quarryReturnPortalActive, journeyObjective, HOME, ARCH, LUMEN_HOLLOW, HOLLOW_FORGE, HOLLOW_RESONATORS, OLD_QUARRY } from './game.js';
import { readSave, createSave, writeSave, validateSave, readSettings, SETTINGS_KEY } from './save.js';

const $=id=>document.getElementById(id);
let renderer,ui;

async function boot(){
  let storage;
  try{storage=window.localStorage;}catch{storage={getItem(){throw new Error('Storage unavailable');},setItem(){throw new Error('Storage unavailable');}};}
  const saved=readSave(storage),settings=readSettings(storage);
  const world=new VoxelWorld(saved.data?.seed??DEFAULT_SEED);
  let writable=saved.writable,selected=saved.data?.selected??0,started=false,dirty=false,saveTimer=0;
  let lastMine=0,lastBuild=0,elapsed=0,frames=0,fps=0,statsTime=0,saveTime=0;
  let mineKey='',mineStarted=0,lastBlockedMine=-10,lastPortal=-10;
  const params=new URLSearchParams(location.search),desktopTest=params.has('test'),creative=params.get('creative')==='1';
  const journey=createJourney(saved.data?.journey);
  if(!creative&&!canPlace(journey,PALETTE[selected])){
    const available=PALETTE.findIndex(id=>canPlace(journey,id));if(available>=0)selected=available;
  }
  const canvas=$('world');
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.setSize(innerWidth,innerHeight);
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
  const scene=new THREE.Scene(),player=new Player(world,scene),sound=new Sound(settings.sound);
  function applySettings(value){
    Object.assign(settings,value);sound.setEnabled(settings.sound);
    renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='high'?2:1.35));
    if(!renderer.xr.isPresenting)renderer.xr.setFramebufferScaleFactor(settings.quality==='high'?1:0.85);
    renderer.xr.setFoveation(settings.quality==='high'?0.5:1);
    try{storage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}
  }
  function persist(){
    clearTimeout(saveTimer);if(!writable)return;
    const result=writeSave(storage,createSave(world,player,selected,journey));ui.saved(result.message);
    if(result.ok)dirty=false;else ui.toast(result.message,6000);
  }
  function markDirty(){dirty=true;if(!writable){ui.saved(saved.message);return;}ui.saved('Saving…');clearTimeout(saveTimer);saveTimer=setTimeout(persist,900);}
  function select(index){selected=(index+PALETTE.length)%PALETTE.length;ui.select(selected);if(started)markDirty();}
  function cycle(amount){
    if(creative){select(selected+amount);return;}
    const direction=Math.sign(amount)||1;
    for(let step=1;step<=PALETTE.length;step++){
      const index=(selected+direction*step+PALETTE.length*2)%PALETTE.length;
      if(canPlace(journey,PALETTE[index])){select(index);return;}
    }
  }
  function flight(){
    if(!creative){
      const result=useJourney(journey,player.getBody());
      if(result.ok)handleJourneyEvents([result]);else ui.toast(result.message,3600);
      return;
    }
    player.toggleFlight();ui.flight(player.flying);ui.toast(player.flying?'Flight on · Rise above the islands':'Back on your feet');markDirty();
  }
  function home(){player.home();if(player.flying&&!creative)player.toggleFlight();ui.flight(player.flying);markDirty();ui.toast('Welcome back to First Light.');}
  function menu(){
    if(renderer.xr.isPresenting)return;
    if(!started)return;
    if(ui.menu){play();return;}
    input.enabled=false;input.clear();ui.setMenu(true);persist();
    if(document.pointerLockElement)document.exitPointerLock();
  }
  function play(){
    if(!desktopTest)return;
    started=true;ui.playing=true;ui.setMenu(false);input.enabled=true;input.clear();sound.start();input.lock();
    ui.flight(player.flying);markDirty();
  }
  function exportWorld(){
    const raw=!writable&&saved.raw?saved.raw:JSON.stringify(createSave(world,player,selected,journey),null,2);
    const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`mineworld-${world.seed}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
    ui.toast(!writable&&saved.raw?'Original save exported.':'World exported.');
  }
  async function importWorld(file){
    try{
      if(file.size>6*1024*1024)throw new Error('That file is too large. Choose a Mineworld save under 6 MB.');
      const data=validateSave(JSON.parse(await file.text()));
      if(!window.confirm('Replace the world in this browser with this imported world? Export your current world first if you want to keep it.'))return;
      clearTimeout(saveTimer);const result=writeSave(storage,data);
      if(!result.ok)throw new Error(result.message);
      writable=false;location.reload();
    }catch(error){ui.toast(error.message||'Could not read that world.',6000);}
  }
  ui=new UI({play,menu,flight,home,select,export:exportWorld,import:importWorld,settings:applySettings},desktopTest);
  ui.setSettings(settings);ui.select(selected);applySettings(settings);
  const input=new Input(canvas,{look:(x,y)=>player.look(x,y),menu,flight,home,cycle,select,debug:()=>ui.toggleDebug(),
    unlock:()=>{if(!ui.menu)menu();},lockFailed:()=>ui.toast('Click the world to capture the mouse.'),
    pick:()=>{if(target){const index=PALETTE.indexOf(target.id);if(index>=0)select(index);}}});

  await new Promise(resolve=>setTimeout(resolve,0));
  generateWorld(world);
  const generatedArchBase=world.surface(9,-11)-11;
  const generatedHollowGround=world.surface(63,-82);
  const generatedQuarryGround=world.surface(53,-31);
  if(saved.data)world.applyEdits(saved.data.edits);
  player.home();player.restore(saved.data?.player);
  if(!creative&&player.flying)player.toggleFlight();
  ui.flight(player.flying);
  const worldRenderer=new WorldRenderer(world,scene);
  while(world.dirty.size){worldRenderer.flush(14);await new Promise(resolve=>setTimeout(resolve,0));}
  const environment=new Environment(scene,world),particles=new Particles(scene);
  const xr=new XRControls(renderer,player,world,scene,{cycle,flight,home,teleport:()=>{sound.play('teleport');markDirty();}});
  xr.updateTool(journey.tool,creative);
  const showcase=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.1,550);
  showcase.position.set(42,49,66);showcase.lookAt(-1,26,-7);
  const highlight=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S*1.012,S*1.012,S*1.012)),new THREE.LineBasicMaterial({color:0xfff0b5,transparent:true,opacity:.85}));
  scene.add(highlight);highlight.visible=false;
  const ghost=new THREE.Mesh(new THREE.BoxGeometry(S*.99,S*.99,S*.99),new THREE.MeshBasicMaterial({color:0xcde8a6,transparent:true,opacity:.19,depthWrite:false}));
  scene.add(ghost);ghost.visible=false;

  // First Light field bench: a persistent in-world place for deliberate tool crafting.
  const fieldBench=new THREE.Group();
  fieldBench.position.set(HOME.x+2.4*S,world.spawn.y,HOME.z-2.1*S);
  const benchWood=new THREE.MeshLambertMaterial({color:0x8d6446}),benchStone=new THREE.MeshLambertMaterial({color:0x8f9b95});
  const benchTop=new THREE.Mesh(new THREE.BoxGeometry(S*2.25,S*.22,S*.92),benchWood);benchTop.position.y=S*.72;fieldBench.add(benchTop);
  for(const x of [-S*.82,S*.82])for(const z of [-S*.27,S*.27]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(S*.18,S*.72,S*.18),benchWood);leg.position.set(x,S*.34,z);fieldBench.add(leg);
  }
  const benchSlab=new THREE.Mesh(new THREE.BoxGeometry(S*.66,S*.16,S*.48),benchStone);benchSlab.position.set(-S*.48,S*.92,0);benchSlab.rotation.y=.17;fieldBench.add(benchSlab);
  const benchHandle=new THREE.Mesh(new THREE.CylinderGeometry(S*.055,S*.065,S*.78,7),benchWood);benchHandle.position.set(S*.34,S*1.08,0);benchHandle.rotation.z=-.62;fieldBench.add(benchHandle);
  const benchHead=new THREE.Mesh(new THREE.BoxGeometry(S*.52,S*.16,S*.18),benchStone);benchHead.position.set(S*.57,S*1.31,0);benchHead.rotation.z=-.62;fieldBench.add(benchHead);
  const benchGlow=new THREE.Mesh(new THREE.OctahedronGeometry(S*.16,0),new THREE.MeshBasicMaterial({color:0x6ccfbc,transparent:true,opacity:.32,depthWrite:false}));
  benchGlow.position.set(0,S*1.08,-S*.2);fieldBench.add(benchGlow);scene.add(fieldBench);

  const portal=new THREE.Mesh(new THREE.PlaneGeometry(S*5.6,S*7.2),new THREE.MeshBasicMaterial({color:0x70f5df,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  portal.position.set(ARCH.x,(generatedArchBase+4.7)*S,ARCH.z);portal.renderOrder=3;portal.visible=false;scene.add(portal);
  const portalRing=new THREE.Mesh(new THREE.RingGeometry(S*1.8,S*2.15,36),new THREE.MeshBasicMaterial({color:0xb8fff0,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  portalRing.position.copy(portal.position);portalRing.scale.y=1.7;portalRing.renderOrder=4;portalRing.visible=false;scene.add(portalRing);

  const hollowWaystone=new THREE.Group();
  hollowWaystone.position.set(LUMEN_HOLLOW.x,generatedHollowGround*S,LUMEN_HOLLOW.z);
  const waystoneRing=new THREE.Mesh(new THREE.TorusGeometry(S*1.55,S*.11,8,28),new THREE.MeshBasicMaterial({color:0x8cf6e1,transparent:true,opacity:.68,depthWrite:false,blending:THREE.AdditiveBlending}));
  waystoneRing.position.y=S*2.05;hollowWaystone.add(waystoneRing);
  const waystoneCore=new THREE.Mesh(new THREE.CircleGeometry(S*1.33,32),new THREE.MeshBasicMaterial({color:0x5de0d2,transparent:true,opacity:.23,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  waystoneCore.position.y=S*2.05;hollowWaystone.add(waystoneCore);
  for(const x of [-S*1.75,S*1.75]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(S*.13,S*.2,S*3.3,7),new THREE.MeshLambertMaterial({color:0x667b79}));post.position.set(x,S*1.65,0);hollowWaystone.add(post);
  }
  hollowWaystone.visible=false;scene.add(hollowWaystone);

  // Lumen Hollow resonance encounter. These props do not modify generator-v1 terrain.
  const hollowStone=new THREE.MeshLambertMaterial({color:0x667774}),hollowDark=new THREE.MeshLambertMaterial({color:0x334947});
  const resonatorProps=HOLLOW_RESONATORS.map((point,index)=>{
    const group=new THREE.Group(),vx=Math.floor(point.x/S),vz=Math.floor(point.z/S);
    group.position.set(point.x,world.surface(vx,vz)*S,point.z);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(S*.58,S*.78,S*.34,7),hollowStone);base.position.y=S*.17;group.add(base);
    for(const x of [-S*.31,S*.31]){
      const prong=new THREE.Mesh(new THREE.BoxGeometry(S*.18,S*1.25,S*.22),hollowDark);prong.position.set(x,S*.88,0);prong.rotation.z=x<0?-.13:.13;group.add(prong);
    }
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(S*.26,0),new THREE.MeshBasicMaterial({color:0x6f9992,transparent:true,opacity:.35,depthWrite:false}));core.position.y=S*.92;group.add(core);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(S*.38,S*.045,6,20),new THREE.MeshBasicMaterial({color:0x8cf6e1,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending}));halo.position.y=S*.92;halo.rotation.x=Math.PI/2;group.add(halo);
    group.visible=false;scene.add(group);return {group,core,halo,index,vx,vz};
  });

  const hollowForge=new THREE.Group(),forgeVX=Math.floor(HOLLOW_FORGE.x/S),forgeVZ=Math.floor(HOLLOW_FORGE.z/S);
  hollowForge.position.set(HOLLOW_FORGE.x,world.surface(forgeVX,forgeVZ)*S,HOLLOW_FORGE.z);
  const forgeBase=new THREE.Mesh(new THREE.CylinderGeometry(S*.9,S*1.1,S*.34,8),hollowStone);forgeBase.position.y=S*.17;hollowForge.add(forgeBase);
  const forgeTable=new THREE.Mesh(new THREE.BoxGeometry(S*1.45,S*.26,S*.8),hollowDark);forgeTable.position.y=S*.74;hollowForge.add(forgeTable);
  const forgePick=new THREE.Mesh(new THREE.CylinderGeometry(S*.055,S*.07,S*1.05,7),benchWood);forgePick.position.set(-S*.12,S*1.02,0);forgePick.rotation.z=-.55;hollowForge.add(forgePick);
  const forgeHead=new THREE.Mesh(new THREE.BoxGeometry(S*.72,S*.16,S*.2),hollowStone);forgeHead.position.set(S*.17,S*1.31,0);forgeHead.rotation.z=-.55;hollowForge.add(forgeHead);
  const forgeCore=new THREE.Mesh(new THREE.OctahedronGeometry(S*.28,0),new THREE.MeshBasicMaterial({color:0x629a91,transparent:true,opacity:.22,depthWrite:false,blending:THREE.AdditiveBlending}));forgeCore.position.set(0,S*1.48,-S*.22);hollowForge.add(forgeCore);
  const forgeHalo=new THREE.Mesh(new THREE.TorusGeometry(S*.48,S*.055,7,24),new THREE.MeshBasicMaterial({color:0xa5fff0,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending}));forgeHalo.position.copy(forgeCore.position);forgeHalo.rotation.x=Math.PI/2;hollowForge.add(forgeHalo);
  const forgePassage=new THREE.Group();forgePassage.position.set(0,S*2.05,S*.34);forgePassage.visible=false;hollowForge.add(forgePassage);
  const forgePortalCore=new THREE.Mesh(new THREE.PlaneGeometry(S*1.75,S*2.55),new THREE.MeshBasicMaterial({color:0x75eadc,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));forgePassage.add(forgePortalCore);
  const forgePortalRing=new THREE.Mesh(new THREE.TorusGeometry(S*.72,S*.075,7,28),new THREE.MeshBasicMaterial({color:0xc2fff3,transparent:true,opacity:.66,depthWrite:false,blending:THREE.AdditiveBlending}));forgePortalRing.scale.y=1.45;forgePassage.add(forgePortalRing);
  hollowForge.visible=false;scene.add(hollowForge);

  // The Old Quarry return waystone is deliberately heavier and darker than Hollow's.
  const quarryWaystone=new THREE.Group();quarryWaystone.position.set(OLD_QUARRY.x,generatedQuarryGround*S,OLD_QUARRY.z);
  const quarryRing=new THREE.Mesh(new THREE.TorusGeometry(S*1.42,S*.13,8,24),new THREE.MeshBasicMaterial({color:0x9ddfd7,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending}));quarryRing.position.y=S*1.9;quarryRing.scale.y=1.12;quarryWaystone.add(quarryRing);
  const quarryCore=new THREE.Mesh(new THREE.CircleGeometry(S*1.18,28),new THREE.MeshBasicMaterial({color:0x577d7b,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));quarryCore.position.y=S*1.9;quarryWaystone.add(quarryCore);
  for(const x of [-S*1.62,S*1.62]){
    const post=new THREE.Mesh(new THREE.BoxGeometry(S*.32,S*3.1,S*.48),new THREE.MeshLambertMaterial({color:0x4c5d64}));post.position.set(x,S*1.55,0);post.rotation.z=x<0?.06:-.06;quarryWaystone.add(post);
  }
  quarryWaystone.visible=false;scene.add(quarryWaystone);

  const aimOrigin=new THREE.Vector3(),aimDirection=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
  let target=null,placement=null,lastObjective='';

  function resetMining(){mineKey='';mineStarted=0;highlight.scale.setScalar(1);highlight.material.opacity=.85;}

  function aim(){
    if(renderer.xr.isPresenting){const ray=xr.ray();if(!ray){target=null;highlight.visible=ghost.visible=false;resetMining();return;}aimOrigin.copy(ray.origin);aimDirection.copy(ray.direction);}
    else{player.camera.getWorldPosition(aimOrigin);player.camera.getWorldDirection(aimDirection);}
    target=voxelRaycast(world,aimOrigin,aimDirection,7.5);
    highlight.visible=!!target;ghost.visible=false;placement=null;
    ui.target(target?BLOCKS[target.id].name:'');
    if(!target){resetMining();return;}
    highlight.position.set((target.x+.5)*S,(target.y+.5)*S,(target.z+.5)*S);
    const x=target.x+target.normal.x,y=target.y+target.normal.y,z=target.z+target.normal.z;
    const material=world.get(x,y,z);
    const valid=withinWorld(x,y,z)&&(material===BLOCK.AIR||material===BLOCK.WATER)
      &&!blockOverlapsBody(x,y,z,player.getBody(),player.height())
      &&(creative||canPlace(journey,PALETTE[selected]));
    if(valid){placement={x,y,z};ghost.position.set((x+.5)*S,(y+.5)*S,(z+.5)*S);ghost.visible=true;}
    const right=xr.byHand('right');if(right)right.beam.scale.z=Math.min(7.5,target.distance);
  }

  function actions(state){
    if(state.mine&&target){
      const {x,y,z,id}=target,key=`${x},${y},${z}`;
      const info=creative?{allowed:true,duration:.17,message:''}:harvestInfo(journey,id);
      if(!info.allowed){
        resetMining();
        if(elapsed-lastBlockedMine>1.15){lastBlockedMine=elapsed;ui.toast(info.message,2300);}
      }else{
        if(mineKey!==key){mineKey=key;mineStarted=elapsed;}
        const progress=Math.min(1,(elapsed-mineStarted)/info.duration);
        highlight.material.opacity=.48+progress*.5;highlight.scale.setScalar(1+progress*.055);
        if(progress>=1&&elapsed-lastMine>.12){
          if(world.set(x,y,z,BLOCK.AIR,true)){
            if(!creative)collectBlock(journey,id);
            particles.burst(x,y,z,id);sound.play('mine',id===BLOCK.CRYSTAL);lastMine=elapsed;markDirty();resetMining();aim();
          }
        }
      }
    }else resetMining();
    if(state.build&&placement&&elapsed-lastBuild>.22){
      const {x,y,z}=placement,id=PALETTE[selected];
      if(!creative&&!spendBlock(journey,id)){ui.toast(`No ${BLOCKS[id].name.toLowerCase()} in your pack.`);return;}
      if(world.set(x,y,z,id,true)){
        sound.play('build',id===BLOCK.CRYSTAL);lastBuild=elapsed;markDirty();
        if(!creative&&!canPlace(journey,id))cycle(1);
        aim();
      }else if(!creative)refundBlock(journey,id);
    }
  }

  function handleJourneyEvents(events){
    for(const raw of events){
      const event=typeof raw==='string'?{event:raw}:raw;
      if(event.event==='tool-crafted'){
        sound.play('build');xr.updateTool(journey.tool,false);
        if(!canPlace(journey,PALETTE[selected]))cycle(1);
        ui.toast('Quarry pick made. Lumen crystal can now be harvested.',6000);markDirty();
      }
      if(event.event==='arch-awake'){
        sound.play('build',true);ui.toast('The Old Arch wakes. Step into the light.',6500);markDirty();
      }
      if(event.event==='lumen-reached'){
        sound.play('build',true);ui.toast('Lumen Hollow discovered. Three dormant resonators answer the waystone.',6500);markDirty();
      }
      if(event.event==='resonator-awake'){
        const prop=resonatorProps[event.index];
        sound.play('build',true);
        if(prop)particles.burst(prop.vx,Math.max(0,world.surface(prop.vx,prop.vz)),prop.vz,BLOCK.CRYSTAL);
        ui.toast(`Hollow resonator awakened · ${resonatorCount(journey)}/3`,4300);markDirty();
      }
      if(event.event==='tool-resonant'){
        sound.play('build',true);xr.updateTool(journey.tool,false);
        ui.toast('The quarry pick resonates. Deepstone can now be broken.',6500);markDirty();
      }
      if(event.event==='quarry-reached'){
        sound.play('build',true);ui.toast('The Old Quarry answers. Its waystone now returns to Lumen Hollow.',6500);markDirty();
      }
    }
  }

  function surfaceDestination(x,z){
    const vx=Math.floor(x/S),vz=Math.floor(z/S);
    return {x,y:world.surface(vx,vz)*S,z,vx,vz};
  }

  function travel(destination,message){
    if(!player.teleport(destination))return false;
    lastPortal=elapsed;sound.play('teleport');particles.burst(destination.vx,Math.max(0,Math.floor(destination.y/S)-1),destination.vz,BLOCK.CRYSTAL);
    ui.toast(message,4200);markDirty();return true;
  }

  function progression(){
    if(creative)return 'Creative build mode';
    handleJourneyEvents(updateJourney(journey,player.getBody()));
    if(elapsed-lastPortal>2.2){
      const body=player.getBody();
      if(archPortalActive(journey,body)){
        const destination=surfaceDestination(LUMEN_HOLLOW.x,LUMEN_HOLLOW.z+3*S);
        if(travel(destination,'The arch folds the cloud sea around you…'))handleJourneyEvents(updateJourney(journey,player.getBody()));
      }else if(hollowPortalActive(journey,body)){
        const destination=surfaceDestination(ARCH.x,ARCH.z+3*S);
        travel(destination,'The waystone answers. First Light returns around you.');
      }else if(quarryForgePortalActive(journey,body)){
        const destination=surfaceDestination(OLD_QUARRY.x,OLD_QUARRY.z+3*S);
        if(travel(destination,'Deepstone splits the passage toward the Old Quarry…'))handleJourneyEvents(updateJourney(journey,player.getBody()));
      }else if(quarryReturnPortalActive(journey,body)){
        const destination=surfaceDestination(LUMEN_HOLLOW.x,LUMEN_HOLLOW.z+3*S);
        travel(destination,'The quarry waystone pulls you back toward Lumen Hollow.');
      }
    }
    const objective=journeyObjective(journey);
    if(objective!==lastObjective){lastObjective=objective;if(started)ui.toast(objective,4200);}
    return objective;
  }

  let last=performance.now();
  renderer.setAnimationLoop(time=>{
    const wallDt=Math.max((time-last)/1000,0),dt=Math.min(wallDt,.05);last=time;elapsed+=dt;frames++;statsTime+=wallDt;saveTime+=wallDt;
    const active=started&&(!ui.menu||renderer.xr.isPresenting);
    let objective=creative?'Creative build mode':journeyObjective(journey);
    if(active){
      if(renderer.xr.isPresenting){player.rig.updateMatrixWorld(true);renderer.xr.updateCamera(player.camera);}
      const state=renderer.xr.isPresenting?xr.sample(dt,settings.turning):input.sample();
      const result=player.update(dt,state);if(result==='home'){ui.flight(false);ui.toast('The clouds carried you home.');markDirty();}
      player.rig.updateMatrixWorld(true);aim();actions(state);objective=progression();
      xr.updateTool(journey.tool,creative);
      xr.updateWrist(selected,player.flying,{creative,inventory:journey.inventory,objective,tool:journey.tool});
    }else{highlight.visible=ghost.visible=false;resetMining();}

    const recipeReady=!creative&&quarryRecipeReady(journey);
    benchGlow.material.color.set(recipeReady?0xffe38f:journey.tool==='hand'?0x6ccfbc:0x5c8f87);
    benchGlow.material.opacity=recipeReady?.88:journey.tool==='hand'?.32:.14;
    benchGlow.rotation.y=elapsed*.9;benchGlow.position.y=S*(1.08+(recipeReady?Math.sin(elapsed*3)*.05:0));

    portal.visible=portalRing.visible=!creative&&journey.archAwake;
    hollowWaystone.visible=!creative&&journey.lumenReached;
    hollowForge.visible=!creative&&journey.lumenReached;
    quarryWaystone.visible=!creative&&journey.quarryReached;
    for(const prop of resonatorProps){
      prop.group.visible=!creative&&journey.lumenReached;
      const awake=Boolean(journey.resonators?.[prop.index]);
      prop.core.material.color.set(awake?0x8dffe9:0x6f9992);
      prop.core.material.opacity=awake?.92:.30;
      prop.core.rotation.y=elapsed*(awake?1.6:.28)+prop.index;
      prop.halo.material.opacity=awake?.55:.08;
      prop.halo.scale.setScalar(awake?1+Math.sin(elapsed*2.6+prop.index)*.07:1);
      prop.halo.rotation.z=elapsed*(awake?.48:.08);
    }
    const forgeReady=!creative&&journey.tool==='quarry'&&resonatorsReady(journey);
    const forgeDone=journey.tool==='resonant';
    const forgePortalOn=!creative&&journey.deepstoneReached;
    forgeCore.material.color.set(forgePortalOn?0xbffff2:forgeDone?0xc7fff3:forgeReady?0xffe38f:0x629a91);
    forgeCore.material.opacity=forgePortalOn?.9:forgeDone?.82:forgeReady?.95:.22;
    forgeCore.rotation.y=elapsed*(forgePortalOn?2.4:forgeDone?1.5:forgeReady?2.2:.3);
    forgeHalo.material.opacity=forgePortalOn?.68:forgeDone?.45:forgeReady?.7:.08;
    forgeHalo.rotation.z=-elapsed*(forgeReady?.65:.15);
    forgeHalo.scale.setScalar(forgeReady?1+Math.sin(elapsed*3)*.09:1);
    forgePassage.visible=forgePortalOn;
    if(forgePortalOn){
      forgePortalCore.material.opacity=.22+Math.sin(elapsed*2.7)*.08;
      forgePortalRing.material.opacity=.55+Math.sin(elapsed*2+1)*.12;
      forgePortalRing.rotation.z=elapsed*.32;
    }

    if(portal.visible){
      portal.material.opacity=.25+Math.sin(elapsed*2.2)*.09;portalRing.material.opacity=.45+Math.sin(elapsed*1.6+1)*.12;
      portalRing.rotation.z=elapsed*.18;
    }
    if(hollowWaystone.visible){
      waystoneRing.rotation.y=elapsed*.28;waystoneCore.material.opacity=.18+Math.sin(elapsed*2)*.07;
    }
    if(quarryWaystone.visible){
      quarryRing.rotation.y=-elapsed*.23;quarryCore.material.opacity=.22+Math.sin(elapsed*1.7+.7)*.08;
    }
    worldRenderer.flush(renderer.xr.isPresenting?2:5);particles.update(dt);
    const camera=started?player.camera:showcase;
    if(!started&&!matchMedia('(prefers-reduced-motion: reduce)').matches){showcase.position.x=42+Math.sin(elapsed*.025)*2;showcase.lookAt(-1,26,-7);}
    camera.getWorldPosition(cameraPosition);environment.update(elapsed,{position:cameraPosition});
    renderer.render(scene,camera);
    if(statsTime>.5){
      fps=Math.round(frames/statsTime);frames=0;statsTime=0;
      const p=player.getBody();let nearest=world.landmarks[0],distance=Infinity;
      for(const landmark of world.landmarks){const d=Math.hypot(p.x-landmark.x,p.z-landmark.z);if(d<distance){nearest=landmark;distance=d;}}
      ui.location(`${nearest.name} · ${creative?(player.flying?'Flying':'Creative'):'Journey'}`);
      const toolName=journey.tool==='resonant'?'Resonant pick':journey.tool==='quarry'?'Quarry pick':'Field tool';
      ui.debug(`${fps} FPS${renderer.xr.isPresenting?' · VR':''}\n${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles.toLocaleString()} triangles\n${worldRenderer.meshes.size} chunks · ${world.edits.size} block edits\nXYZ ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}\nYaw ${Math.round(player.rig.rotation.y*180/Math.PI)}° · Pitch ${Math.round(player.pitch*180/Math.PI)}°\n${creative?'Creative':`${toolName} · ${objective}`} · Seed ${world.seed}`);
    }
    if(saveTime>15){saveTime=0;if(started&&(dirty||active))persist();}
  });
  ui.ready(!!saved.data);ui.saved(saved.message);$('world-seed').textContent=`SEED ${world.seed}`;
  if(!writable)ui.toast(saved.message,9000);

  const vrButton=$('vr-button');
  try{
    const available=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');
    vrButton.disabled=!available;vrButton.textContent='Enter VR';
    $('vr-note').textContent=available?(creative?'Creative mode · unlimited materials':'Journey mode · gather, craft tools, restore the old passages'):'Open in your Quest browser to step inside.';
  }catch{vrButton.disabled=true;vrButton.textContent='Enter VR';}
  vrButton.addEventListener('click',async()=>{
    if(renderer.xr.isPresenting)return;vrButton.disabled=true;
    let session;
    try{
      session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor'],optionalFeatures:['bounded-floor']});
      await renderer.xr.setSession(session);sound.start();
    }catch(error){if(session)await session.end().catch(()=>{});ui.toast(`VR could not start: ${error.message}`,6000);}
    finally{vrButton.disabled=false;}
  });
  renderer.xr.addEventListener('sessionstart',()=>{
    started=true;ui.playing=true;input.enabled=false;input.clear();
    if(document.pointerLockElement)document.exitPointerLock();
    player.setXR(true);xr.reset();xr.updateTool(journey.tool,creative);ui.setMenu(false);ui.setXR(true);markDirty();
    if(!creative)ui.toast(journeyObjective(journey),5000);
  });
  renderer.xr.addEventListener('sessionend',()=>{
    player.setXR(false);xr.reset();ui.setXR(false);ui.setMenu(true);input.enabled=false;
    player.camera.aspect=innerWidth/innerHeight;player.camera.fov=72;player.camera.updateProjectionMatrix();applySettings(settings);persist();
  });
  window.addEventListener('resize',()=>{
    if(renderer.xr.isPresenting)return;
    for(const camera of [player.camera,showcase]){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
    renderer.setSize(innerWidth,innerHeight);
  });
  window.addEventListener('pagehide',()=>{if(started)persist();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&started){persist();input.clear();}last=performance.now();});
}

boot().catch(error=>{
  console.error(error);renderer?.setAnimationLoop(null);
  const message=error.message?.includes('WebGL')?'This browser could not start 3D graphics. Try a current browser with hardware acceleration, or open this page in your Quest browser.':`The world could not load. ${error.message||'Please reload and try again.'}`;
  if(ui)ui.fatal(message);else{$('fatal-message').textContent=message;$('fatal').hidden=false;}
});