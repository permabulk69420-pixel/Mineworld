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
import { readSave, createSave, writeSave, validateSave, readSettings, SETTINGS_KEY, SAVE_KEY } from './save.js';

const $=id=>document.getElementById(id);
let renderer,ui;

async function boot(){
  // A blocked localStorage getter must not prevent the game from starting.
  let storage;
  try{storage=window.localStorage;}catch{storage={getItem(){throw new Error('Storage unavailable');},setItem(){throw new Error('Storage unavailable');}};}
  const saved=readSave(storage),settings=readSettings(storage);
  const world=new VoxelWorld(saved.data?.seed??DEFAULT_SEED);
  let writable=saved.writable,selected=saved.data?.selected??0,started=false,dirty=false,saveTimer=0;
  let lastMine=0,lastBuild=0,elapsed=0,frames=0,fps=0,statsTime=0,saveTime=0;
  const touch=matchMedia('(pointer:coarse)').matches||new URLSearchParams(location.search).has('touch');
  const canvas=$('world');
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.setSize(innerWidth,innerHeight);
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
  const scene=new THREE.Scene(),player=new Player(world,scene),sound=new Sound(settings.sound);
  // Player is constructed before generation, so the temporary origin is replaced below.
  function applySettings(value){
    Object.assign(settings,value);sound.setEnabled(settings.sound);
    renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='high'?2:1.35));
    if(!renderer.xr.isPresenting)renderer.xr.setFramebufferScaleFactor(settings.quality==='high'?1:0.85);
    renderer.xr.setFoveation(settings.quality==='high'?0.5:1);
    try{storage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}
  }
  function persist(){
    clearTimeout(saveTimer);if(!writable)return;
    const result=writeSave(storage,createSave(world,player,selected));ui.saved(result.message);
    if(result.ok)dirty=false;else ui.toast(result.message,6000);
  }
  function markDirty(){dirty=true;if(!writable){ui.saved(saved.message);return;}ui.saved('Saving…');clearTimeout(saveTimer);saveTimer=setTimeout(persist,900);}
  function select(index){selected=(index+PALETTE.length)%PALETTE.length;ui.select(selected);if(started)markDirty();}
  function cycle(amount){select(selected+amount);}
  function flight(){player.toggleFlight();ui.flight(player.flying);ui.toast(player.flying?'Flight on · Rise above the islands':'Back on your feet');markDirty();}
  function home(){player.home();ui.flight(false);markDirty();ui.toast('Welcome back to First Light.');}
  function menu(){
    if(renderer.xr.isPresenting)return;
    if(!started)return;
    if(ui.menu){play();return;}
    input.enabled=false;input.clear();ui.setMenu(true);persist();
    if(document.pointerLockElement)document.exitPointerLock();
  }
  function play(){
    started=true;ui.playing=true;ui.setMenu(false);input.enabled=true;input.clear();sound.start();
    if(!touch)input.lock();
    ui.flight(player.flying);markDirty();
  }
  function exportWorld(){
    const raw=!writable&&saved.raw?saved.raw:JSON.stringify(createSave(world,player,selected),null,2);
    const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`mineworld-${world.seed}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
    ui.toast(!writable&&saved.raw?'Original save exported.':'World exported.');
  }
  async function importWorld(file){
    try{
      if(file.size>6*1024*1024)throw new Error('That file is too large. Choose a Mineworld save under 6 MB.');
      const data=validateSave(JSON.parse(await file.text()));
      if(!window.confirm('Replace the world in this browser with this imported world? Export your current world first if you want to keep it.'))return;
      // Disable the outgoing world’s lifecycle save before installing the new one.
      clearTimeout(saveTimer);const result=writeSave(storage,data);
      if(!result.ok)throw new Error(result.message);
      writable=false;location.reload();
    }catch(error){ui.toast(error.message||'Could not read that world.',6000);}
  }
  ui=new UI({play,menu,flight,home,select,export:exportWorld,import:importWorld,settings:applySettings},touch);
  ui.setSettings(settings);ui.select(selected);applySettings(settings);
  const input=new Input(canvas,{look:(x,y)=>player.look(x,y),menu,flight,home,cycle,select,debug:()=>ui.toggleDebug(),
    unlock:()=>{if(!ui.menu)menu();},lockFailed:()=>ui.toast('Click the world to capture the mouse.'),
    pick:()=>{if(target){const index=PALETTE.indexOf(target.id);if(index>=0)select(index);}}});
  input.coarse=touch;

  // Let the loading label paint before generating and meshing the deterministic world.
  await new Promise(resolve=>setTimeout(resolve,0));
  generateWorld(world);
  if(saved.data)world.applyEdits(saved.data.edits);
  player.home();player.restore(saved.data?.player);ui.flight(player.flying);
  const worldRenderer=new WorldRenderer(world,scene);
  while(world.dirty.size){worldRenderer.flush(14);await new Promise(resolve=>setTimeout(resolve,0));}
  const environment=new Environment(scene,world),particles=new Particles(scene);
  const xr=new XRControls(renderer,player,world,scene,{cycle,flight,home,teleport:()=>{sound.play('teleport');markDirty();}});
  const showcase=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.1,550);
  showcase.position.set(42,49,66);showcase.lookAt(-1,26,-7);
  const highlight=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S*1.012,S*1.012,S*1.012)),new THREE.LineBasicMaterial({color:0xfff0b5,transparent:true,opacity:.85}));
  scene.add(highlight);highlight.visible=false;
  const ghost=new THREE.Mesh(new THREE.BoxGeometry(S*.99,S*.99,S*.99),new THREE.MeshBasicMaterial({color:0xcde8a6,transparent:true,opacity:.19,depthWrite:false}));
  scene.add(ghost);ghost.visible=false;
  const aimOrigin=new THREE.Vector3(),aimDirection=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
  let target=null,placement=null;

  function aim(){
    if(renderer.xr.isPresenting){const ray=xr.ray();if(!ray){target=null;highlight.visible=ghost.visible=false;return;}aimOrigin.copy(ray.origin);aimDirection.copy(ray.direction);}
    else{player.camera.getWorldPosition(aimOrigin);player.camera.getWorldDirection(aimDirection);}
    target=voxelRaycast(world,aimOrigin,aimDirection,7.5);
    highlight.visible=!!target;ghost.visible=false;placement=null;
    ui.target(target?BLOCKS[target.id].name:'');
    if(!target)return;
    highlight.position.set((target.x+.5)*S,(target.y+.5)*S,(target.z+.5)*S);
    const x=target.x+target.normal.x,y=target.y+target.normal.y,z=target.z+target.normal.z;
    const material=world.get(x,y,z);
    const valid=withinWorld(x,y,z)&&(material===BLOCK.AIR||material===BLOCK.WATER)
      &&!blockOverlapsBody(x,y,z,player.getBody(),player.height());
    if(valid){placement={x,y,z};ghost.position.set((x+.5)*S,(y+.5)*S,(z+.5)*S);ghost.visible=true;}
    const right=xr.byHand('right');if(right)right.beam.scale.z=Math.min(7.5,target.distance);
  }

  function actions(state){
    if(state.mine&&target&&elapsed-lastMine>.17){
      const {x,y,z,id}=target;
      if(world.set(x,y,z,BLOCK.AIR,true)){particles.burst(x,y,z,id);sound.play('mine',id===BLOCK.CRYSTAL);lastMine=elapsed;markDirty();aim();}
    }else if(state.build&&placement&&elapsed-lastBuild>.22){
      const {x,y,z}=placement;
      if(world.set(x,y,z,PALETTE[selected],true)){sound.play('build',PALETTE[selected]===BLOCK.CRYSTAL);lastBuild=elapsed;markDirty();aim();}
    }
  }

  let last=performance.now();
  renderer.setAnimationLoop(time=>{
    const dt=Math.min(Math.max((time-last)/1000,0),.05);last=time;elapsed+=dt;frames++;statsTime+=dt;saveTime+=dt;
    const active=started&&(!ui.menu||renderer.xr.isPresenting);
    if(active){
      const state=renderer.xr.isPresenting?xr.sample(dt,settings.turning):input.sample();
      const result=player.update(dt,state);if(result==='home'){ui.flight(false);ui.toast('The clouds carried you home.');markDirty();}
      player.rig.updateMatrixWorld(true);aim();actions(state);
      xr.updateWrist(selected,player.flying);
    }else{highlight.visible=ghost.visible=false;}
    worldRenderer.flush(renderer.xr.isPresenting?2:5);particles.update(dt);
    const camera=started?player.camera:showcase;
    if(!started&&!matchMedia('(prefers-reduced-motion: reduce)').matches){showcase.position.x=42+Math.sin(elapsed*.025)*2;showcase.lookAt(-1,26,-7);}
    camera.getWorldPosition(cameraPosition);environment.update(elapsed,{position:cameraPosition});
    renderer.render(scene,camera);
    if(statsTime>.5){
      fps=Math.round(frames/statsTime);frames=0;statsTime=0;
      const p=player.getBody();let nearest=world.landmarks[0],distance=Infinity;
      for(const landmark of world.landmarks){const d=Math.hypot(p.x-landmark.x,p.z-landmark.z);if(d<distance){nearest=landmark;distance=d;}}
      ui.location(`${nearest.name} · ${player.flying?'Flying':'Creative'}`);
      ui.debug(`${fps} FPS${renderer.xr.isPresenting?' · VR':''}\n${renderer.info.render.calls} draw calls · ${renderer.info.render.triangles.toLocaleString()} triangles\n${worldRenderer.meshes.size} chunks · ${world.edits.size} block edits\nXYZ ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}\n${player.flying?'Flying':player.grounded?'Grounded':'Falling'} · Seed ${world.seed}`);
    }
    if(saveTime>15){saveTime=0;if(started&&(dirty||active))persist();}
  });
  ui.ready(!!saved.data);ui.saved(saved.message);$('world-seed').textContent=`SEED ${world.seed}`;
  if(!writable)ui.toast(saved.message,9000);

  const vrButton=$('vr-button');
  try{
    const available=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');
    vrButton.disabled=!available;vrButton.textContent='Enter VR';
    $('vr-note').textContent=available?'Use your controllers. Your world is ready.':'Open in your Quest browser to step inside.';
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
    player.setXR(true);xr.reset();ui.setMenu(false);ui.setXR(true);markDirty();
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
