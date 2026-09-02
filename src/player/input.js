export class Input {
  constructor(canvas, callbacks) {
    this.canvas=canvas; this.callbacks=callbacks; this.keys=new Set();
    this.mine=false; this.build=false; this.jumpPressed=false;
    this.stick={x:0,y:0}; this.touchVertical=0; this.lookPointer=null;
    this.enabled=false; this.coarse=matchMedia('(pointer: coarse)').matches;
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
      if(e.pointerType==='touch') {
        this.lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY}; canvas.setPointerCapture(e.pointerId); return;
      }
      if(document.pointerLockElement!==canvas) { this.lock(); return; }
      if(e.button===0)this.mine=true;
      if(e.button===2)this.build=true;
      if(e.button===1)callbacks.pick();
    });
    canvas.addEventListener('pointermove',e=>{
      if(!this.enabled)return;
      if(this.lookPointer?.id===e.pointerId){
        callbacks.look((e.clientX-this.lookPointer.x)*0.004,(e.clientY-this.lookPointer.y)*0.004);
        this.lookPointer.x=e.clientX;this.lookPointer.y=e.clientY;
      }
    });
    const endLook=e=>{if(this.lookPointer?.id===e.pointerId)this.lookPointer=null;};
    canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);
    document.addEventListener('mousemove',e=>{
      if(this.enabled&&document.pointerLockElement===canvas)callbacks.look(e.movementX*0.0024,e.movementY*0.0024);
    });
    canvas.addEventListener('wheel',e=>{if(this.enabled){e.preventDefault();callbacks.cycle(e.deltaY>0?1:-1);}},{passive:false});
    document.addEventListener('pointerlockchange',()=>{
      if(!document.pointerLockElement&&this.enabled&&!this.coarse) {this.clear();callbacks.unlock();}
    });
    const stick=document.querySelector('#move-stick'),knob=document.querySelector('#stick-knob');
    let stickId=null;
    const moveStick=e=>{
      const rect=stick.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;
      const factor=Math.min(1,40/Math.max(1,Math.hypot(dx,dy)));
      this.stick.x=dx*factor/40;this.stick.y=-dy*factor/40;
      knob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;
    };
    stick.addEventListener('pointerdown',e=>{if(!this.enabled)return; e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
    stick.addEventListener('pointermove',e=>{if(stickId===e.pointerId)moveStick(e);});
    const releaseStick=e=>{if(stickId===e.pointerId){stickId=null;this.stick.x=this.stick.y=0;knob.style.transform='';}};
    stick.addEventListener('pointerup',releaseStick);stick.addEventListener('pointercancel',releaseStick);
    for(const [id,action] of [['touch-mine','mine'],['touch-build','build'],['touch-up','up'],['touch-down','down']]){
      const el=document.getElementById(id);
      el.addEventListener('pointerdown',e=>{
        if(!this.enabled)return;e.preventDefault();el.setPointerCapture(e.pointerId);
        if(action==='up'){this.touchVertical=1;this.jumpPressed=true;}
        else if(action==='down')this.touchVertical=-1;
        else this[action]=true;
      });
      const release=()=>{if(action==='up'||action==='down')this.touchVertical=0;else this[action]=false;};
      el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
    }
  }

  lock(){
    if(this.coarse||!this.canvas.requestPointerLock)return;
    try{const request=this.canvas.requestPointerLock();request?.catch(()=>this.callbacks.lockFailed());}
    catch{this.callbacks.lockFailed();}
  }

  clear(){this.keys.clear();this.mine=this.build=this.jumpPressed=false;this.stick.x=this.stick.y=this.touchVertical=0;this.lookPointer=null;const knob=document.querySelector('#stick-knob');if(knob)knob.style.transform='';}

  sample(){
    const held=(...keys)=>keys.some(k=>this.keys.has(k))?1:0;
    const value={forward:held('KeyW','ArrowUp')-held('KeyS','ArrowDown')+this.stick.y,
      strafe:held('KeyD','ArrowRight')-held('KeyA','ArrowLeft')+this.stick.x,
      vertical:held('Space')-held('ShiftLeft','ShiftRight')+this.touchVertical,
      jump:this.jumpPressed,sprint:!!held('ShiftLeft','ShiftRight'),mine:this.mine,build:this.build};
    this.jumpPressed=false;return value;
  }
}
