import { BLOCKS, PALETTE } from '../world/blocks.js';

const $=id=>document.getElementById(id);
export class UI {
  constructor(callbacks,desktopTest) {
    this.callbacks=callbacks;this.desktopTest=desktopTest;this.creative=new URLSearchParams(location.search).get('creative')==='1';
    this.playing=false;this.menu=true;this.selected=0;this.inventoryValue={};this.inventoryKey='';
    $('play-button').hidden=!desktopTest;$('desktop-test-controls').hidden=!desktopTest;
    this.hotbar=$('hotbar');
    PALETTE.forEach((id,i)=>{
      const block=BLOCKS[id],button=document.createElement('button');
      button.type='button';button.dataset.block=String(id);button.title=`${i+1} · ${block.name}`;button.setAttribute('aria-label',block.name);button.setAttribute('aria-pressed','false');
      button.innerHTML=`<svg viewBox="0 0 32 36" aria-hidden="true"><path fill="${block.color}" d="m16 1 15 9-15 9L1 10Z"/><path fill="${block.color}" d="m1 10 15 9v16L1 26Z"/><path fill="#000" opacity=".16" d="m1 10 15 9v16L1 26Z"/><path fill="${block.color}" d="m31 10-15 9v16l15-9Z"/><path fill="#000" opacity=".31" d="m31 10-15 9v16l15-9Z"/></svg><small>${i+1}</small>`;
      button.addEventListener('pointerdown',e=>e.stopPropagation());
      button.addEventListener('click',()=>callbacks.select(i));this.hotbar.append(button);
    });
    $('play-button').addEventListener('click',()=>callbacks.play());
    $('menu-button').addEventListener('click',()=>callbacks.menu());
    $('flight-button').addEventListener('click',()=>callbacks.flight());
    $('controls-button').addEventListener('click',()=>this.showSettings(true));
    $('close-settings').addEventListener('click',()=>this.showSettings(false));
    $('home-button').addEventListener('click',()=>{callbacks.home();this.showSettings(false);});
    $('export-button').addEventListener('click',()=>callbacks.export());
    $('import-button').addEventListener('click',()=>$('import-file').click());
    $('import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(file)await callbacks.import(file);e.target.value='';});
    for(const name of ['locomotion','turning','wrist','quality','sound'])$(name).addEventListener('change',()=>callbacks.settings(this.readSettings()));
    this.inventory({});this.select(0);
  }

  showSettings(show){$('settings-panel').hidden=!show;$('welcome-card').hidden=show;if(show)$('close-settings').focus();}
  setSettings(settings){
    $('locomotion').value=settings.locomotion;$('turning').value=settings.turning;$('wrist').value=settings.wrist;
    $('quality').value=settings.quality;$('sound').checked=settings.sound;
  }
  readSettings(){
    return {locomotion:$('locomotion').value,turning:$('turning').value,wrist:$('wrist').value,quality:$('quality').value,sound:$('sound').checked};
  }
  ready(saved){$('play-button').disabled=false;$('play-label').textContent=saved?'Resume desktop test':'Start desktop test';}
  inventory(inventory={}){
    const key=this.creative?'creative':PALETTE.map(id=>inventory[id]||0).join(',');if(key===this.inventoryKey)return;this.inventoryKey=key;this.inventoryValue={...inventory};
    [...this.hotbar.children].forEach((button,i)=>{button.hidden=!this.creative&&(inventory[PALETTE[i]]||0)<=0;});
    this.select(this.selected);
  }
  select(index){
    this.selected=index;[...this.hotbar.children].forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index&&!el.hidden)));
    const id=PALETTE[index],count=this.inventoryValue[id]||0;
    $('selected-label').textContent=this.creative?BLOCKS[id].name:count>0?`${BLOCKS[id].name} ×${count}`:'Hands · empty pack';
  }
  setMenu(show){
    this.menu=show;$('welcome').hidden=!show;this.showSettings(false);
    for(const id of ['hotbar-wrap','crosshair','menu-button'])$(id).hidden=show;
    $('flight-button').hidden=show||!this.creative;
    $('target-name').hidden=show;
    if(this.playing){$('play-label').textContent='Resume desktop test';$('welcome-title').innerHTML='Stay a<br>little longer.';}
  }
  setXR(active){document.body.classList.toggle('xr-active',active);}
  flight(enabled){$('flight-button').innerHTML=enabled?'Flying <kbd>F</kbd>':'Fly <kbd>F</kbd>';$('flight-button').setAttribute('aria-pressed',String(enabled));}
  saved(message){$('save-status').textContent=message;}
  toast(message,ms=3200){clearTimeout(this.toastTimer);$('toast').textContent=message;$('toast').hidden=false;this.toastTimer=setTimeout(()=>$('toast').hidden=true,ms);}
  target(name){$('target-name').textContent=name||'';}
  location(name){$('location').textContent=name;}
  debug(text){$('debug').textContent=text;}
  toggleDebug(){$('debug').hidden=!$('debug').hidden;}
  fatal(message){$('fatal-message').textContent=message;$('fatal').hidden=false;}
}
