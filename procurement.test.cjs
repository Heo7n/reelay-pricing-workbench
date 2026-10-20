'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const E = require('./engine.js');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const equal = (a,b,message) => assert.equal(E.cmp(a,b),0,message);
const models = ['seedance-2.0','seedance-2.5','seedance-2.0-fast'];
const task = model => ({model,res:'480p',ratio:'16:9',seconds:'4',video:false,vin:'2'});

function boot(t, stored=null) {
  const errors=[],downloads=[],blobs=new Map();
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(read('template.html'),{url:'https://reelay-test.invalid/',runScripts:'outside-only',virtualConsole});
  const w=dom.window;
  w.Blob=Blob;
  w.URL.createObjectURL=blob=>{const id='blob:test-'+blobs.size;blobs.set(id,blob);return id;};
  w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:blobs.get(this.href)});};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.navigator.clipboard={writeText:async()=>{}};
  if(stored)w.localStorage.setItem('reelay_pricing_v9_official',JSON.stringify(stored));
  for(const file of ['engine.js','generated-minima.js','data.js','generated-model-minima.js','models.js','app.js'])w.eval(read(file));
  t.after(()=>dom.window.close());
  const good=()=>assert.deepEqual(errors,[],'no uncaught DOM errors');
  const input=(id,value,event='input')=>{const el=w.document.getElementById(id);assert.ok(el,id);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));good();};
  const click=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();good();};
  const update=fn=>{const state=w.ReelayApp.getState();fn(state);w.ReelayApp.setState(state);good();};
  const select=model=>input('model',model,'change');
  good();
  return{w,api:w.ReelayApp,input,click,update,select,downloads,good};
}

test('only standard 2.0 starts with discounted procurement and switching restores each model',t=>{
  const h=boot(t),quotes={};
  assert.deepEqual(plain(h.api.getState().plan.procurementByModel),{'seedance-2.0':'0.735','seedance-2.5':'1','seedance-2.0-fast':'1'});
  for(const model of models){
    h.select(model);
    const state=h.api.getState(),expected=model==='seedance-2.0'?'0.735':'1';
    assert.equal(state.plan.procurementModel,model);
    assert.equal(h.w.document.getElementById('pricing-model').textContent,h.w.ReelayModels.get(model).label);
    equal(state.plan.q,expected);equal(h.api.current().x.p.q,expected);
    quotes[model]=E.decimalString(h.api.quote().calc.P,20);
    const status=h.w.document.getElementById('procurement-status');
    assert.match(status.textContent,model==='seedance-2.0'?/已有折扣供应商/:/暂无折扣供应商 · 按刊例价/);
    assert.equal(status.classList.contains('is-simulation'),false);
  }
  h.select('seedance-2.0');equal(h.api.getState().plan.q,'0.735');
  h.input('purchase-discount','6');equal(h.api.getState().plan.q,'0.6');
  h.select('seedance-2.5');h.input('purchase-discount','8');
  assert.match(h.w.document.getElementById('procurement-status').textContent,/模拟折扣 · 暂无供应商/);
  assert.equal(h.w.document.getElementById('procurement-status').classList.contains('is-simulation'),true);
  h.select('seedance-2.0-fast');h.input('purchase-discount','9');
  for(const [model,q] of [['seedance-2.0','0.6'],['seedance-2.5','0.8'],['seedance-2.0-fast','0.9']]){
    h.select(model);equal(h.api.getState().plan.q,q);
    equal(h.api.quote().calc.P,quotes[model],'procurement never changes the model quote');
  }
  h.select('seedance-2.5');h.input('purchase-discount','10');
  assert.equal(h.w.document.getElementById('procurement-status').classList.contains('is-simulation'),false);
  h.select('seedance-2.0-fast');equal(h.api.getState().plan.q,'0.9');
});

test('legacy global procurement migrates only to standard 2.0 regardless of the active model',t=>{
  const initial=boot(t);
  for(const model of models){
    const old=initial.api.defaults();old.task=task(model);old.plan.q='0.61';
    delete old.plan.procurementByModel;delete old.plan.procurementModel;
    const original=JSON.stringify(old),h=boot(t,old),state=h.api.getState();
    assert.deepEqual(plain(state.plan.procurementByModel),{'seedance-2.0':'0.61','seedance-2.5':'1','seedance-2.0-fast':'1'});
    equal(state.plan.q,model==='seedance-2.0'?'0.61':'1');
    assert.match(h.w.document.getElementById('migration-note').textContent,/旧值保留给 2.0/);
    assert.equal(JSON.stringify(old),original);
    assert.deepEqual(plain(state.observations),plain(old.observations).map(o=>({...o,usage:o.usage||''})));
    const imported=h.api.migrate({format:'reelay.pricing.v9',state:old});
    assert.match(imported.note,/旧值保留给 2.0/);
    equal(imported.value.plan.q,model==='seedance-2.0'?'0.61':'1');
    h.select('seedance-2.0');equal(h.api.getState().plan.q,'0.61');
  }
});

test('invalid platform drafts never persist an invalid or cross-model procurement mirror',t=>{
  const h=boot(t);
  h.input('purchase-discount','6');
  h.input('pay','');
  h.select('seedance-2.5');
  const saved=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  assert.equal(saved.task.model,'seedance-2.5');
  assert.equal(saved.plan.pay,'100');
  assert.equal(saved.plan.procurementModel,'seedance-2.5');
  equal(saved.plan.q,'1');
  equal(saved.plan.procurementByModel['seedance-2.0'],'0.6');
  assert.match(h.w.document.getElementById('procurement-status').textContent,/按刊例价/);
  h.input('pay','100');h.input('purchase-discount','');
  const invalidSaved=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  equal(invalidSaved.plan.q,'1');
  equal(invalidSaved.plan.procurementByModel['seedance-2.5'],'1');
  h.select('seedance-2.0');equal(h.api.getState().plan.q,'0.6');
  h.select('seedance-2.5');equal(h.api.getState().plan.q,'1');
  const restored=boot(t,invalidSaved);
  equal(restored.api.current().x.p.q,'1');
});

test('mixed task rows use each model procurement and automatic multiplier while explicit plans remain explicit',t=>{
  const h=boot(t);
  h.input('purchase-discount','6');
  h.select('seedance-2.0-fast');h.input('purchase-discount','9');
  h.input('discount','8');
  h.update(s=>{s.tab='tasks';s.tasks=models.map((model,i)=>({id:'mixed-'+i,title:model,params:task(model),qty:'2'}));});
  const expected={'seedance-2.0':'0.6','seedance-2.5':'1','seedance-2.0-fast':'0.9'};
  const before=plain(h.api.getTheoryRows());
  for(const row of before){
    const p=E.plan({pay:'100',total:'1538',discount:'8',q:expected[row.model]});
    equal(row.procurementRatio,expected[row.model]);
    equal(row.M,E.decimalString(p.usedM,20));equal(row.C,E.mul(row.P,p.q));equal(row.raw,E.mul(E.mul(row.C,p.usedM),'10'));
    assert.equal(row.procurementSimulated,row.model==='seedance-2.0-fast');
    equal(h.api.theory(task(row.model)).x.C,row.C);
  }
  h.select('seedance-2.5');
  assert.deepEqual(plain(h.api.getTheoryRows()),before,'changing the selected model must not recalculate other models with its q');
  const explicit=E.plan({pay:'100',total:'2000',q:'0.5',discount:'9',appliedM:'2.5'});
  const quoted=h.api.theory(task('seedance-2.5'),h.api.getState().rules,explicit);
  equal(quoted.x.C,E.mul(quoted.x.P,'0.5'));equal(quoted.x.p.usedM,'2.5');
  assert.equal(quoted.procurement.procurementSimulated,true);
  h.click('[data-load-task="mixed-0"]');
  assert.equal(h.api.getState().task.model,'seedance-2.0');
  equal(h.api.getState().plan.q,'0.6');
});

test('saved precision is applied after each model multiplier and legacy task specs still mean standard 2.0',t=>{
  const h=boot(t);
  h.input('purchase-discount','6');h.input('discount','8');
  h.select('seedance-2.0-fast');h.input('purchase-discount','9');
  h.update(s=>{s.plan.mode='saved';s.plan.digits=2;s.plan.round='nearest';});
  const expected={'seedance-2.0':'0.6','seedance-2.5':'1','seedance-2.0-fast':'0.9'};
  for(const model of models){
    const exact=E.plan({pay:'100',total:'1538',discount:'8',q:expected[model]});
    equal(h.api.theory(task(model)).x.p.usedM,E.decimalString(exact.M,2));
  }
  const legacy=task('seedance-2.0');delete legacy.model;
  equal(h.api.theory(legacy).x.p.q,'0.6');
  const record=h.api.recalcRecord({P:'10',C:'5',N:''});
  equal(record.raw,E.mul(E.mul('5','2.05'),'10'));
  h.update(s=>{s.plan.mode='manual';s.plan.manualM='1.65';});
  for(const model of models){
    const x=h.api.theory(task(model)).x;
    equal(x.p.usedM,'1.65');
    equal(x.C,E.mul(x.P,expected[model]));
  }
});

test('record recalculations and detail exports use the record model without rewriting history',async t=>{
  const h=boot(t);
  h.input('purchase-discount','6');h.input('discount','8');
  h.select('seedance-2.0-fast');h.input('purchase-discount','9');
  h.update(s=>{s.observations=models.map((model,i)=>({id:'record-'+i,title:'记录 '+i,params:task(model),P:'10',C:'5',N:'99',usage:'100000',date:'2026-10-20',note:'原始记录'}));});
  const original=plain(h.api.getState().observations),before=plain(h.api.getActualRows());
  const expected={'seedance-2.0':'0.6','seedance-2.5':'1','seedance-2.0-fast':'0.9'};
  for(const row of before){
    const p=E.plan({pay:'100',total:'1538',discount:'8',q:expected[row.model]});
    equal(row.procurementRatio,expected[row.model]);equal(row.M,E.decimalString(p.usedM,20));
    equal(row.recalcN,E.ceil(E.mul(E.mul('5',p.usedM),'10')));
    equal(row.theoryC,E.mul(row.theoryP,p.q));
    assert.equal(row.recordedC,'5');assert.equal(row.recordedN,'99');
  }
  h.select('seedance-2.5');
  assert.deepEqual(plain(h.api.getActualRows()),before);
  for(const [i,model] of models.entries()){
    h.api.openDetails('actual','record-'+i);h.good();
    const text=h.w.document.getElementById('drawer-body').textContent;
    assert.ok(text.includes('采购 '+E.trim(E.mul(expected[model],10),4)+'折'));
    if(model==='seedance-2.0-fast')assert.match(text,/模拟折扣/);
    h.click('#export-calculation');
    const exported=await h.downloads.at(-1).blob.text();
    assert.ok(exported.includes('采购比例 '+expected[model]));
    assert.ok(exported.includes(h.w.ReelayModels.get(model).label));
    h.click('#close-drawer');
  }
  assert.deepEqual(plain(h.api.getState().observations),original);
  assert.equal(h.api.getState().task.model,'seedance-2.5');
});

test('JSON and CSV exports retain model-specific procurement and label simulated scenarios',async t=>{
  const h=boot(t);
  h.select('seedance-2.5');h.input('purchase-discount','8.5');
  h.update(s=>{s.tab='tasks';s.tasks=models.map((model,i)=>({id:'export-'+i,title:model,params:task(model),qty:'1'}));});
  const observations=plain(h.api.getState().observations);
  h.click('#export');h.click('#export-json');
  const payload=JSON.parse(await h.downloads.at(-1).blob.text());
  assert.equal(payload.procurementProfiles.length,3);
  assert.equal(payload.taskEstimates.length,3);
  const simulated=payload.procurementProfiles.find(row=>row.model==='seedance-2.5');
  equal(simulated.procurementRatio,'0.85');assert.equal(simulated.procurementSimulated,true);
  assert.equal(simulated.supplierAvailable,false);
  assert.ok(payload.taskEstimates.every(row=>row.model&&row.procurementRatio));
  assert.ok(payload.recordRecalculations.every(row=>row.model&&row.procurementRatio));
  assert.deepEqual(payload.state.observations,observations);
  const loaded=h.api.migrate(payload).value;
  equal(loaded.plan.q,'0.85');
  equal(loaded.plan.procurementByModel['seedance-2.0'],'0.735');
  h.click('#export-theory');
  const csv=await h.downloads.at(-1).blob.text();
  assert.match(csv,/采购折扣为模拟/);assert.match(csv,/模拟折扣 · 暂无供应商/);
  for(const model of models)assert.ok(csv.includes(model));
  h.click('#export-actual');
  const actualCsv=await h.downloads.at(-1).blob.text();
  assert.match(actualCsv,/当前复算采购比例/);assert.match(actualCsv,/采购状态/);
});
