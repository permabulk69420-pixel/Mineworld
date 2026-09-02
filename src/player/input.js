export class Input {
  constructor(canvas, callbacks) {
    this.canvas=canvas; this.callbacks=callbacks; this.keys=new Set();
    this.mine=false; this.build=false; this.jumpPressed=false;
    this.enabled=false;
    this.ignoreMouseUntil=Infinity;
    const clear=()=>this.clear();
    window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('keydown',e=>{
      if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','F3'].includes(e.code))e.preventDefault();
      if(e.code==='Escape') { callbacks.menu(); return; }
      if(!this.enabled)return;
      this.keys.add(e.code);
      if(e.repeat)return;
      if(e.code==='Space')this.jumpPressed=true;
      if(e.code==='KeyF')callbacks.flight();
      if(e.code==='KeyR')callbacks.home();
      if(e.code==='KeyE')callbacks.cycle(1);
      if(e.code==='KeyQ')callbacks.cycle(-1);
      if(e.code==='F3')callbacks.debug();
      if(/^Digit[1-9]$/.test(e.code))callbacks.select(Number(e.code.at(-1))-1);
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('pointerup',e=>{
      if(e.pointerType==='mouse'){this.mine=false;this.build=false;}
    });
    canvas.addEventListener('pointerdown',e=>{
      if(!this.enabled)return;
      if(e.pointerType!=='mouse')return;
      if(document.pointerLockElement!==canvas) { this.lock(); return; }
      if(e.button===0)this.mine=true;
      if(e.button===2)this.build=true;
      if(e.button===1)callbacks.pick();
    });
    document.addEventListener('mousemove',e=>{
      if(this.enabled&&document.pointerLockElement===canvas&&performance.now()>=this.ignoreMouseUntil)callbacks.look(e.movementX*0.0024,e.movementY*0.0024);
    });
    canvas.addEventListener('wheel',e=>{if(this.enabled){e.preventDefault();callbacks.cycle(e.deltaY>0?1:-1);}},{passive:false});
    document.addEventListener('pointerlockchange',()=>{
      if(document.pointerLockElement===canvas){this.ignoreMouseUntil=performance.now()+180;canvas.focus({preventScroll:true});}
      if(!document.pointerLockElement&&this.enabled) {this.clear();callbacks.unlock();}
    });
  }

  lock(){
    if(!this.canvas.requestPointerLock)return;
    // Ignore the cursor-recentring event on entry; it is not a player look gesture.
    this.ignoreMouseUntil=performance.now()+180;
    try{const request=this.canvas.requestPointerLock();request?.catch(()=>this.callbacks.lockFailed());}
    catch{this.callbacks.lockFailed();}
  }

  clear(){this.keys.clear();this.mine=this.build=this.jumpPressed=false;}

  sample(){
    const held=(...keys)=>keys.some(k=>this.keys.has(k))?1:0;
    const value={forward:held('KeyW','ArrowUp')-held('KeyS','ArrowDown'),
      strafe:held('KeyD','ArrowRight')-held('KeyA','ArrowLeft'),
      vertical:held('Space')-held('ShiftLeft','ShiftRight'),
      jump:this.jumpPressed,sprint:!!held('ShiftLeft','ShiftRight'),mine:this.mine,build:this.build};
    this.jumpPressed=false;return value;
  }
}
