import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

// This is the repository's CI browser suite. It does not depend on an authenticated browser.
const out=resolve('artifacts');await mkdir(out,{recursive:true});
const root=resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!pathname.startsWith('/Mineworld/')){res.writeHead(404).end();return;}
    const file=resolve(root,pathname.slice('/Mineworld/'.length)||'index.html');
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
  }catch{if(!res.headersSent)res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/Mineworld/`;
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const errors=[],notes=[];
let page;
const collect=p=>{p.on('pageerror',error=>errors.push(error.message));p.on('console',message=>{if(message.type()==='error')errors.push(message.text());});};
const ready=async p=>{
  await p.waitForFunction(()=>!document.querySelector('#play-button').disabled||!document.querySelector('#fatal').hidden,null,{timeout:60000});
  assert.equal(await p.locator('#fatal').isVisible(),false,await p.locator('#fatal-message').textContent());
  await p.waitForFunction(()=>document.querySelector('#debug').textContent.includes('draw calls'));
};
const editCount=p=>p.locator('#debug').textContent().then(t=>Number(t.match(/(\d+) block edits/)?.[1]||0));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

try{
  const desktop=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
  page=await desktop.newPage();collect(page);await page.goto(url);await ready(page);
  await page.screenshot({path:resolve(out,'skyreach-title.jpg'),type:'jpeg',quality:90});
  assert.equal(await page.locator('#play-button').isVisible(),false,'The public entry is VR only');
  assert.equal(await page.locator('#touch-controls').count(),0);

  // Journey must read as a game from frame one: empty pack, no creative palette, no flight.
  await page.setViewportSize({width:1024,height:768});
  await page.goto(url+'?test=1');await ready(page);
  await page.getByRole('button',{name:/Start desktop test|Resume desktop test/}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Field tool'));
  await page.keyboard.press('f');await pause(250);
  assert.doesNotMatch(await page.locator('#debug').textContent(),/Flying/,'Journey mode must not enable flight');
  assert.match(await page.locator('#debug').textContent(),/Field bench · cedar 0\/3 · limestone 0\/2/);
  assert.equal(await page.locator('#hotbar button:visible').count(),0,'Journey must not expose unowned build materials');
  assert.equal(await page.locator('#selected-label').textContent(),'Hands · empty pack');
  await page.screenshot({path:resolve(out,'journey-start.jpg'),type:'jpeg',quality:90});
  notes.push('Journey default: empty pack, no exposed creative palette, player-built bench objective, and creative flight disabled.');

  // Creative mode stays available as an explicit development harness so visual regression
  // can reach arbitrary geometry without weakening the normal game rules.
  await page.goto(url+'?test=1&creative=1');await ready(page);
  await page.getByRole('button',{name:/Start desktop test|Resume desktop test/}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Creative'));
  assert.match(await page.locator('#debug').textContent(),/Pitch -5°/,'Capturing the mouse preserves the initial view');
  await page.screenshot({path:resolve(out,'first-light.jpg'),type:'jpeg',quality:90});
  await page.keyboard.press('8');assert.equal(await page.getByRole('button',{name:'Lumen crystal',exact:true}).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('f');await page.keyboard.down('Space');await pause(450);await page.keyboard.up('Space');
  await page.waitForFunction(()=>document.querySelector('#location').textContent.includes('Flying'));
  await page.dispatchEvent('body','mousemove',{movementX:0,movementY:460,bubbles:true});
  await page.waitForFunction(()=>document.querySelector('#target-name').textContent.length>0);
  const before=await editCount(page);
  await page.dispatchEvent('#world','pointerdown',{pointerType:'mouse',button:0,buttons:1,bubbles:true});
  await page.waitForFunction(n=>Number(document.querySelector('#debug').textContent.match(/(\d+) block edits/)?.[1])>n,before,{timeout:10000});
  await page.dispatchEvent('#world','pointerup',{pointerType:'mouse',button:0,buttons:0,bubbles:true});
  await page.dispatchEvent('#world','pointerdown',{pointerType:'mouse',button:2,buttons:2,bubbles:true});
  await page.waitForFunction(()=>document.querySelector('#target-name').textContent==='Lumen crystal',null,{timeout:10000});
  await page.dispatchEvent('#world','pointerup',{pointerType:'mouse',button:2,buttons:0,bubbles:true});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mineworld.skyreach.save.v1')||'null')?.edits.some(e=>e[3]===7),null,{timeout:12000});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mineworld.skyreach.save.v1')));
  assert.ok(stored.edits.some(e=>e[3]===7));assert.equal(stored.selected,7);
  await page.screenshot({path:resolve(out,'building.jpg'),type:'jpeg',quality:90});
  await page.reload();await ready(page);
  assert.equal(await page.locator('#hotbar button').nth(7).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Controls & settings'}).click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export world'}).click();
  const download=await downloadPromise;await download.saveAs(resolve(out,'world-export.json'));
  const exported=JSON.parse(await readFile(resolve(out,'world-export.json'),'utf8'));
  assert.deepEqual(exported.edits,stored.edits);assert.equal(exported.seed,stored.seed);
  notes.push('Creative developer mode: WebGL render, pointer lock, flight, mining, placement, material selection, reload, and save export passed.');

  // Load a deterministic mid-Hollow Journey state so the new progression props are
  // rendered and inspected by CI without requiring browser automation to replay the whole chapter.
  await page.evaluate(save=>{
    save.edits=[];save.selected=7;
    save.player={x:47.625,y:42,z:-55.125,yaw:0,pitch:-0.16,flying:false};
    save.journey={
      inventory:{1:0,2:0,3:0,4:0,5:0,6:0,7:2,8:0,9:0,11:0},
      tool:'quarry',archAwake:true,lumenReached:true,resonators:[true,false,true],deepstoneReached:false,quarryReached:false,
    };
    localStorage.setItem('mineworld.skyreach.save.v1',JSON.stringify(save));
  },structuredClone(stored));
  await page.goto(url+'?test=1');await ready(page);
  await page.getByRole('button',{name:/Start desktop test|Resume desktop test/}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Wake Hollow resonators'));
  await pause(1300);
  assert.match(await page.locator('#location').textContent(),/Lumen Hollow/);
  assert.match(await page.locator('#debug').textContent(),/2\/3/);
  await page.screenshot({path:resolve(out,'lumen-hollow.jpg'),type:'jpeg',quality:90});
  notes.push('Lumen Hollow staged Journey render: waystone, forge, resonator progression state, and objective rendered without browser errors.');

  await page.goto(url);await ready(page);

  // Start directly on the deepstone-awakened forge. The runtime must perform the actual
  // portal traversal, discover Old Quarry, and enable its paired return state.
  await page.evaluate(save=>{
    save.edits=[];save.selected=7;
    save.player={x:46.125,y:42,z:-63.75,yaw:0,pitch:-0.12,flying:false};
    save.journey={
      inventory:{1:0,2:0,3:2,4:0,5:0,6:0,7:0,8:0,9:0,11:1},
      tool:'resonant',archAwake:true,lumenReached:true,resonators:[true,true,true],deepstoneReached:true,quarryReached:false,
    };
    localStorage.setItem('mineworld.skyreach.save.v1',JSON.stringify(save));
  },structuredClone(stored));
  await page.goto(url+'?test=1');await ready(page);
  await page.getByRole('button',{name:/Start desktop test|Resume desktop test/}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Old Quarry reached'),null,{timeout:12000});
  await pause(700);
  assert.match(await page.locator('#location').textContent(),/Old Quarry/);
  const quarrySave=await page.evaluate(()=>JSON.parse(localStorage.getItem('mineworld.skyreach.save.v1')));
  assert.equal(quarrySave.journey.quarryReached,true);
  assert.equal(quarrySave.journey.inventory['11'],1);
  await page.screenshot({path:resolve(out,'old-quarry.jpg'),type:'jpeg',quality:90});
  notes.push('Deepstone forge passage: runtime traversal reached Old Quarry, persisted discovery, and rendered the return waystone.');
  notes.push(`Desktop diagnostics: ${await page.locator('#debug').textContent()}`);

  assert.deepEqual(errors,[],'No browser runtime or shader errors');
  notes.push('Actual immersive Quest sessions and headset performance require a device playtest.');
  console.log(notes.join('\n'));
}catch(error){
  if(page){await page.screenshot({path:resolve(out,'failure.jpg'),type:'jpeg',quality:88}).catch(()=>{});notes.push(await page.locator('body').innerText().catch(()=>''));}
  notes.push(error.stack||String(error));throw error;
}finally{
  await writeFile(resolve(out,'browser-report.txt'),[...notes,'Browser errors:',...errors].join('\n'));
  console.log([...notes,'Browser errors:',...new Set(errors)].join('\n'));
  await browser.close();await new Promise(resolve=>server.close(resolve));
}