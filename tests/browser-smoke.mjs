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
  await page.goto(url+'?test=1');await ready(page);
  await page.getByRole('button',{name:'Start desktop test'}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Grounded'));
  assert.match(await page.locator('#debug').textContent(),/Pitch -5°/,'Capturing the mouse preserves the initial view');
  await page.screenshot({path:resolve(out,'first-light.jpg'),type:'jpeg',quality:90});
  await page.keyboard.press('8');assert.equal(await page.getByRole('button',{name:'Lumen crystal',exact:true}).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('f');await page.keyboard.down('Space');await pause(450);await page.keyboard.up('Space');
  // Look down from flight so mining and rebuilding cannot place the player in the edited cell.
  // CDP's absolute mouse coordinates can report zero relative motion while locked.
  // Supply a relative movement event through the same document input handler.
  await page.dispatchEvent('body','mousemove',{movementX:0,movementY:460,bubbles:true});
  await page.waitForFunction(()=>document.querySelector('#target-name').textContent.length>0);
  const before=await editCount(page);
  await page.mouse.down({button:'left'});
  await page.waitForFunction(n=>Number(document.querySelector('#debug').textContent.match(/(\d+) block edits/)?.[1])>n,before,{timeout:10000});
  await page.mouse.up({button:'left'});
  await page.mouse.down({button:'right'});await pause(400);await page.mouse.up({button:'right'});
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
  notes.push('Desktop test mode: WebGL render, pointer lock, flight, mining, placement, material selection, reload, and save export passed.');
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
