import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

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
const errors=[],notes=[];let page;
const collect=p=>{p.on('pageerror',error=>errors.push(error.message));p.on('console',message=>{if(message.type()==='error')errors.push(message.text());});};
const ready=async p=>{
  await p.waitForFunction(()=>!document.querySelector('#play-button').disabled||!document.querySelector('#fatal').hidden,null,{timeout:90000});
  assert.equal(await p.locator('#fatal').isVisible(),false,await p.locator('#fatal-message').textContent());
  await p.waitForFunction(()=>document.querySelector('#debug').textContent.includes('draw calls'),null,{timeout:90000});
};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

try{
  const desktop=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
  page=await desktop.newPage();collect(page);await page.goto(url);await ready(page);
  await page.screenshot({path:resolve(out,'skyreach-title.jpg'),type:'jpeg',quality:90});
  assert.equal(await page.locator('#play-button').isVisible(),false,'The public entry is VR only');
  assert.equal(await page.locator('#touch-controls').count(),0);

  await page.getByRole('button',{name:'Controls & settings'}).click();
  assert.equal(await page.locator('#locomotion').inputValue(),'stick');
  assert.equal(await page.locator('#wrist').inputValue(),'hidden');
  await page.locator('#locomotion').selectOption('teleport');
  await page.locator('#wrist').selectOption('visible');
  let vrSettings=await page.evaluate(()=>JSON.parse(localStorage.getItem('mineworld.settings.v1')));
  assert.equal(vrSettings.locomotion,'teleport');assert.equal(vrSettings.wrist,'visible');
  await page.locator('#locomotion').selectOption('stick');
  await page.locator('#wrist').selectOption('hidden');
  vrSettings=await page.evaluate(()=>JSON.parse(localStorage.getItem('mineworld.settings.v1')));
  assert.equal(vrSettings.locomotion,'stick');assert.equal(vrSettings.wrist,'hidden');
  await page.getByRole('button',{name:'Close settings'}).click();
  notes.push('VR settings: stick movement is default, teleport is opt-in, and wrist display defaults hidden.');

  await page.setViewportSize({width:1280,height:800});
  await page.goto(url+'?test=1');await ready(page);
  await page.getByRole('button',{name:/Start desktop test|Resume desktop test/}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Explore First Light'));
  assert.equal(await page.locator('#hotbar button:visible').count(),0);
  assert.equal(await page.locator('#selected-label').textContent(),'Hands · empty pack');
  assert.doesNotMatch(await page.locator('#debug').textContent(),/Quarry pick|Hollow|Old Quarry|field bench/i);
  await pause(900);
  await page.screenshot({path:resolve(out,'foundation-start.jpg'),type:'jpeg',quality:90});
  notes.push('Foundation Journey: large-world start rendered with empty pack and no bench/portal/tool progression exposed.');

  await page.goto(url+'?test=1&creative=1');await ready(page);
  await page.getByRole('button',{name:/Start desktop test|Resume desktop test/}).click();
  await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.keyboard.press('F3');
  await page.waitForFunction(()=>document.querySelector('#debug').textContent.includes('Creative'));
  assert.equal(await page.locator('#hotbar button:visible').count(),9);
  await page.keyboard.press('8');assert.equal(await page.getByRole('button',{name:'Lumen crystal',exact:true}).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('f');await page.waitForFunction(()=>document.querySelector('#location').textContent.includes('Flying'));
  await page.keyboard.down('w');await pause(1200);await page.keyboard.up('w');
  await page.screenshot({path:resolve(out,'large-world-flight.jpg'),type:'jpeg',quality:90});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mineworld.skyreach.save.v2')));
  assert.equal(stored.generatorVersion,2);assert.equal(stored.selected,7);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#welcome').hidden);
  await page.getByRole('button',{name:'Controls & settings'}).click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export world'}).click();
  const download=await downloadPromise;await download.saveAs(resolve(out,'world-export.json'));
  const exported=JSON.parse(await readFile(resolve(out,'world-export.json'),'utf8'));
  assert.equal(exported.generatorVersion,2);assert.equal(exported.seed,stored.seed);
  notes.push('Creative developer mode: large-world WebGL render, pointer lock, flight, material selection, v2 save, and export passed.');

  assert.deepEqual(errors,[],'No browser runtime or shader errors');
  notes.push(`Desktop diagnostics: ${await page.locator('#debug').textContent()}`);
  notes.push('Actual Quest scale and interaction still require headset validation.');
  console.log(notes.join('\n'));
}catch(error){
  if(page){await page.screenshot({path:resolve(out,'failure.jpg'),type:'jpeg',quality:88}).catch(()=>{});notes.push(await page.locator('body').innerText().catch(()=>''));}
  notes.push(error.stack||String(error));throw error;
}finally{
  await writeFile(resolve(out,'browser-report.txt'),[...notes,'Browser errors:',...errors].join('\n'));
  console.log([...notes,'Browser errors:',...new Set(errors)].join('\n'));
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
