// Browser-independent render/event smoke tests. Does not replace visual browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const listeners={},events={},memory=new Map();
const container={innerHTML:'',addEventListener:(name,fn)=>listeners[name]=fn};
const results={innerHTML:''};
globalThis.document={querySelector:s=>s==='#app'?container:results,documentElement:{},getElementById:()=>({scrollIntoView(){}})};
globalThis.location={pathname:'/boardgames/sniper-elite/index.html',hash:'#mission'};
globalThis.scrollY=0;globalThis.scrollTo=()=>{};globalThis.requestAnimationFrame=f=>f();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
globalThis.window={addEventListener:(name,fn)=>events[name]=fn,scrollTo(){},print(){}};
globalThis.history={replaceState:(a,b,hash)=>{location.hash=hash;}};
await import('../sniper-elite/app.js');
function change(dataset,value,checked=false,type='select-one'){listeners.change({target:{dataset,value,checked,type}});}
function click(dataset){listeners.click({target:{closest:()=>({dataset,hasAttribute:()=>false})}});}
function go(hash){location.hash=hash;events.hashchange();}
function verify(){assert(!container.innerHTML.includes('undefined'));for(const m of container.innerHTML.matchAll(/(?:src|href)="(file:[^"]+)"/g)){const u=new URL(m[1]);assert(existsSync(u),u.href);}}
test('renders all sections in both languages, including every manual page',()=>{for(const lang of ['pt','en']){click({lang});for(const section of ['mission','icons','quick','setup','victory','turns','examples','manual']){go('#'+section);verify();assert(container.innerHTML.includes('<main id="main">'));}for(const [book,count] of [['core',16],['eagle',8],['escalation',20],['kraken',8]])for(let p=1;p<=count;p++){go(`#manual/${book}/${p}`);verify();}assert.equal(document.documentElement.lang,lang==='pt'?'pt-BR':'en-US');}});
test('expansions, maps, roles and edge choices persist and render without broken assets',()=>{go('#mission');for(const exp of ['eagle','escalation','kraken'])change({exp},'',true,'checkbox');change({field:'rank'},'3');change({list:'defenderEdges'},'hunter',true,'checkbox');change({list:'sniperEdges'},'goodboy',true,'checkbox');for(const map of ['launch','pens','water','nest','village','carrier']){click({map});for(const side of ['sniper','defender']){click({role:side});for(const view of ['mission','icons','quick','setup','victory','turns','examples']){go('#'+view);verify();}}}const saved=JSON.parse(memory.get('boardgames.sniper-elite.v1'));assert.equal(saved.map,'carrier');assert.equal(saved.role,'defender');assert(saved.expansions.includes('kraken'));});
test('deep links select the correct role and search filters rendered rules',()=>{go('#turns/shoot');assert.equal(JSON.parse(memory.get('boardgames.sniper-elite.v1')).role,'sniper');listeners.input({target:{id:'search',value:'zzz-no-rule'}});assert(results.innerHTML.includes('No rules found'));go('#turns/attack');assert.equal(JSON.parse(memory.get('boardgames.sniper-elite.v1')).role,'defender');});
test('setup checkboxes persist and configuration changes clear stale checks',()=>{go('#setup');change({check:'board'},'',true,'checkbox');assert(JSON.parse(memory.get('boardgames.sniper-elite.v1')).checks.includes('board'));click({map:'launch'});assert.deepEqual(JSON.parse(memory.get('boardgames.sniper-elite.v1')).checks,[]);});
test('defender cards, source tags and component groups render as scannable instructions',()=>{
 click({lang:'en'});click({role:'defender'});go('#turns');
 assert(container.innerHTML.indexOf('id="defender-turn"')<container.innerHTML.indexOf('id="defender-move"'));
 assert(!container.innerHTML.includes('id="bag"'));
 assert(container.innerHTML.includes('Available action · 1 squad action'));
 assert(container.innerHTML.includes('origin-core'));
 assert(container.innerHTML.includes('class="instruction-list"'));
 assert(container.innerHTML.includes('<details class="enemy-reference"'));
 go('#setup');
 assert.equal((container.innerHTML.match(/data-check="component-sniper"/g)||[]).length,1);
 assert(container.innerHTML.includes('<span class="component-line">1 sniper miniature</span>'));
 assert(container.innerHTML.includes('<span class="component-line">1 dry-erase marker</span>'));
 assert(container.innerHTML.includes('<span class="component-line">1 shot bag</span>'));
});
