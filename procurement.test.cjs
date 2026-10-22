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
  for(const file of ['engine.js','generated-minima.js','data.js','generated-model-minima.js','models.js','pricing-profiles.js','app.js'])w.eval(read(file));
  t.after(()=>dom.window.close());
  const good=()=>assert.deepEqual(errors,[],'no uncaught DOM errors');
  const input=(id,value,event='input')=>{const el=w.document.getElementById(id);assert.ok(el,id);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));good();};
  const click=selector=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();good();};
  const update=fn=>{const state=w.ReelayApp.getState();fn(state);w.ReelayApp.setState(state);good();};
  const select=model=>input('model',model,'change');
  const manual=value=>{click('#edit-multiplier');input('manual-m',value);click('#save-multiplier');};
  good();
  return{w,api:w.ReelayApp,input,click,update,select,downloads,good,manual};
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
    assert.equal(status.hidden,true,'normal procurement does not add an explanatory notice');
    assert.equal(state.plan.discount,model==='seedance-2.0'?'7.35':'10');
    assert.equal(state.plan.pricingModel,model);equal(h.api.pricing().usedM,model==='seedance-2.0'?'1.538':'1.65');
    assert.equal(state.plan.mode,model==='seedance-2.0'?'ideal':'manual');
    assert.equal(status.classList.contains('is-simulation'),false);
  }
  h.select('seedance-2.0');equal(h.api.getState().plan.q,'0.735');
  h.input('purchase-discount','6');equal(h.api.getState().plan.q,'0.6');
  h.select('seedance-2.5');h.input('purchase-discount','8');
  assert.equal(h.w.document.getElementById('procurement-status').textContent,'模拟');
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

test('current task record comparison follows the selected model policy without carrying another model record or discount',t=>{
  const h=boot(t),doc=h.w.document,amounts=['2','3','4'],multipliers=['1.5','2','2.5'];
  h.update(s=>{
    s.task=task(models[0]);
    s.observations=models.map((model,i)=>({id:'match-'+model,title:model,params:task(model),P:'10',C:amounts[i],N:String(83+i),date:'',note:'fixture'}));
  });
  const original=plain(h.api.getState().observations);
  for(const [i,model] of models.entries()){
    h.select(model);h.manual(multipliers[i]);
  }
  const value=id=>(doc.getElementById(id).tagName==='INPUT'?doc.getElementById(id).value:doc.getElementById(id).textContent).replace(/[¥￥≈,\s]/g,'');
  for(const [i,model] of models.entries()){
    h.select(model);const basis=doc.getElementById('cost-tab-actual');assert.notEqual(basis.getAttribute('aria-disabled'),'true');basis.click();
    assert.equal(h.api.getState().plan.mode,'manual');equal(h.api.pricing().usedM,multipliers[i]);
    equal(value('record-cost'),amounts[i]);equal(value('raw-points'),E.mul(E.mul(amounts[i],multipliers[i]),10));
    equal(value('integer-points'),E.ceil(E.mul(E.mul(amounts[i],multipliers[i]),10)));
    h.click('#details');assert.match(doc.getElementById('drawer-body').textContent,new RegExp(String(83+i)));h.click('#close-drawer');
    const before=value('integer-points');h.input('purchase-discount','5');
    assert.equal(value('integer-points'),before,'recorded procurement is not discounted again');
    equal(h.api.current().x.C,E.mul(h.api.current().x.P,'0.5'),'theory still adopts the current model procurement setting');
    assert.deepEqual(plain(h.api.getState().observations),original);
  }
  h.input('seconds','5');assert.equal(doc.getElementById('cost-tab-actual').getAttribute('aria-disabled'),'false');assert.equal(doc.getElementById('cost-tab-actual').getAttribute('aria-selected'),'true');
  for(const id of ['raw-points','integer-points','actual-cash','task-target-amount','task-gap','task-effective','model-profit'])assert.equal(doc.getElementById(id).textContent.trim(),'—');
});

test('platform-base record scenarios use each model current procurement while direct invoices and screenshot history remain independent',t=>{
  const h=boot(t),doc=h.w.document;
  h.update(s=>{
    s.task=task(models[0]);
    s.observations=models.map((model,i)=>({id:'base-'+model,title:model,params:task(model),P:'10',C:i===1?'5':'',costBasis:i===1?'recorded':'platform-list',N:String(90+i),date:'',note:'fixture',supplierReference:{q:'0.735',C:'7.350000'}}));
  });
  const originals=plain(h.api.getState().observations);
  for(const [i,model] of models.entries()){
    h.select(model);h.input('purchase-discount',String(5+i));h.manual('2');
  }
  const expectedCost={'seedance-2.0':'5','seedance-2.5':'5','seedance-2.0-fast':'7'};
  for(const model of models){
    h.select(model);const rows=plain(h.api.getActualRows());
    for(const row of rows){
      equal(row.recalcC,expectedCost[row.model]);equal(row.recalcN,E.mul(expectedCost[row.model],20));
      assert.equal(row.recordedC,row.model==='seedance-2.5'?'5':'');
      assert.equal(row.supplierReferenceC,'7.350000');assert.equal(row.supplierReferenceQ,'0.735');
    }
    equal(doc.getElementById('record-cost').value,expectedCost[model]);
    assert.deepEqual(plain(h.api.getState().observations),originals);
  }
});

test('legacy global procurement migrates only to standard 2.0 regardless of the active model',t=>{
  const initial=boot(t);
  for(const model of models){
    const old=initial.api.defaults();old.task=task(model);old.plan.q='0.61';
    delete old.plan.procurementByModel;delete old.plan.procurementModel;delete old.plan.modelPricing;delete old.plan.pricingModel;
    const original=JSON.stringify(old),h=boot(t,old),state=h.api.getState();
    assert.deepEqual(plain(state.plan.procurementByModel),{'seedance-2.0':'0.61','seedance-2.5':'1','seedance-2.0-fast':'1'});
    equal(state.plan.q,model==='seedance-2.0'?'0.61':'1');
    assert.equal(h.w.document.getElementById('migration-note').hidden,true);
    assert.equal(h.w.document.getElementById('migration-note').textContent,'');
    assert.equal(JSON.stringify(old),original);
    assert.deepEqual(plain(state.observations),plain(old.observations).map(o=>({...o,usage:o.usage||''})));
    const imported=h.api.migrate({format:'reelay.pricing.v9',state:old});
    assert.equal(imported.note,'已导入方案。');
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
  assert.equal(h.w.document.getElementById('procurement-status').hidden,true);
  h.input('pay','100');h.input('purchase-discount','');
  const invalidSaved=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  equal(invalidSaved.plan.q,'1');
  equal(invalidSaved.plan.procurementByModel['seedance-2.5'],'1');
  h.select('seedance-2.0');equal(h.api.getState().plan.q,'0.6');
  h.select('seedance-2.5');equal(h.api.getState().plan.q,'1');
  const restored=boot(t,invalidSaved);
  equal(restored.api.current().x.p.q,'1');
});

test('cross-model quotes use their own procurement and pricing policy while explicit plans remain explicit',t=>{
  const h=boot(t);
  h.input('purchase-discount','6');h.select('seedance-2.0-fast');h.input('purchase-discount','9');h.input('discount','8');
  const expected={'seedance-2.0':'0.6','seedance-2.5':'1','seedance-2.0-fast':'0.9'};
  const quotes=()=>models.map(model=>h.api.theory(task(model)));
  const before=quotes();
  for(const [i,model] of models.entries()){
    const p=E.plan({pay:'100',total:'1538',discount:{'seedance-2.0':'7.35','seedance-2.5':'10','seedance-2.0-fast':'8'}[model],q:expected[model],...(model==='seedance-2.5'?{appliedM:'1.65',targetAvailable:false}:{})}),v=before[i],x=v.x;
    equal(x.p.q,expected[model]);equal(x.p.usedM,p.usedM);equal(x.C,E.mul(x.P,p.q));equal(x.raw,E.mul(E.mul(x.C,p.usedM),'10'));
    assert.equal(v.procurement.procurementSimulated,model==='seedance-2.0-fast');
  }
  h.select('seedance-2.5');
  for(const [i,v] of quotes().entries()){equal(v.x.C,before[i].x.C);equal(v.x.p.usedM,before[i].x.p.usedM);}
  const explicit=E.plan({pay:'100',total:'2000',q:'0.5',discount:'9',appliedM:'2.5'});
  const quoted=h.api.theory(task('seedance-2.5'),h.api.getState().rules,explicit);
  equal(quoted.x.C,E.mul(quoted.x.P,'0.5'));equal(quoted.x.p.usedM,'2.5');assert.equal(quoted.procurement.procurementSimulated,true);
});

test('each model retains its own basis, target, manual multiplier and precision',t=>{
  const h=boot(t);
  h.input('purchase-discount','6');h.input('discount','8');h.click('#plan-settings');h.input('plan-digits','2','change');
  h.select('seedance-2.5');h.input('pricing-basis','margin','change');h.input('target-margin','20');
  h.select('seedance-2.0-fast');h.input('purchase-discount','9');h.manual('1.65');
  const expected={'seedance-2.0':{q:'0.6',targetMode:'discount',discount:'8',mode:'saved',M:'2.05'},'seedance-2.5':{q:'1',targetMode:'margin',margin:'20',mode:'ideal',M:'1.9225'},'seedance-2.0-fast':{q:'0.9',targetMode:'discount',discount:'10',mode:'manual',M:'1.65'}};
  const profiles=plain(h.api.getState().plan.modelPricing);
  for(const model of models){
    h.select(model);const plan=h.api.getState().plan,want=expected[model];
    for(const key of ['q','targetMode','mode'])assert.equal(plan[key],want[key]);
    if(want.discount)assert.equal(plan.discount,want.discount);if(want.margin)assert.equal(plan.margin,want.margin);
    equal(h.api.pricing().usedM,want.M);equal(h.api.theory(task(model)).x.p.usedM,want.M);
    if(model==='seedance-2.0'){assert.equal(plan.digits,2);assert.equal(plan.round,'nearest');}
    assert.deepEqual(plain(plan.modelPricing),profiles,'selection never propagates a rule to another model');
  }
  const legacy=task('seedance-2.0');delete legacy.model;equal(h.api.theory(legacy).x.p.usedM,'2.05');
  equal(h.api.recalcRecord({P:'10',C:'5',N:''}).raw,E.mul('5','20.5'));
  h.input('pay','200');h.input('total','3000');
  for(const model of models){h.select(model);assert.equal(h.api.getState().plan.pay,'200');assert.equal(h.api.getState().plan.total,'3000');}
  equal(h.api.pricingForModel('seedance-2.0-fast').usedM,'1.65','recharge edits do not alter an explicitly specified multiplier');
});

test('record recalculations and detail exports use the record model without rewriting history',async t=>{
  const h=boot(t);
  h.input('purchase-discount','6');h.input('discount','8');
  h.select('seedance-2.0-fast');h.input('purchase-discount','9');
  h.update(s=>{s.observations=models.map((model,i)=>({id:'record-'+i,title:'记录 '+i,params:task(model),P:'10',C:'5',N:'99',usage:'100000',date:'2026-10-20',note:'原始记录'}));});
  const original=plain(h.api.getState().observations),before=plain(h.api.getActualRows());
  const expected={'seedance-2.0':'0.6','seedance-2.5':'1','seedance-2.0-fast':'0.9'};
  for(const row of before){
    const p=E.plan({pay:'100',total:'1538',discount:row.model==='seedance-2.0'?'8':'10',q:expected[row.model],...(row.model!=='seedance-2.0'?{appliedM:'1.65',targetAvailable:false}:{})});
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
  assert.equal(payload.pricingProfiles.length,3);
  assert.deepEqual(payload.state.plan.modelPricing,plain(h.api.getState().plan.modelPricing));
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
  assert.equal(h.w.document.getElementById('export-theory'),null,'discount export has been removed');
  h.click('#export-actual');
  const actualCsv=await h.downloads.at(-1).blob.text();
  assert.match(actualCsv,/当前复算采购比例/);assert.match(actualCsv,/采购状态/);
});


test('legacy global pricing migrates to every model without changing its prior charge',t=>{
  const h=boot(t);
  for(const mode of ['ideal','saved','manual']){
    const legacy=plain(h.api.defaults());delete legacy.plan.modelPricing;delete legacy.plan.pricingModel;
    Object.assign(legacy.plan,{mode,targetMode:'margin',margin:'17.25',manualM:'1.65',digits:3,round:'truncate',q:'0.9',procurementModel:'seedance-2.0-fast',procurementByModel:{'seedance-2.0':'0.61','seedance-2.5':'1','seedance-2.0-fast':'0.9'}});
    legacy.task=task('seedance-2.0-fast');legacy.frozenM={n:'999',d:'1'};
    const source=JSON.stringify(legacy),migrated=h.api.migrate({format:'reelay.pricing.v9',state:legacy}).value;
    assert.equal(JSON.stringify(legacy),source);assert.equal(migrated.frozenM,null);
    const loaded=boot(t,migrated);
    for(const model of models){
      const q=legacy.plan.procurementByModel[model],ideal=E.plan({pay:'100',total:'1538',q,targetMode:'margin',margin:'17.25'});
      const M=mode==='manual'?'1.65':mode==='saved'?E.decimalString(ideal.M,3,'truncate'):ideal.M;
      equal(loaded.api.theory(task(model)).x.p.usedM,M);equal(loaded.api.theory(task(model)).x.C,E.mul(loaded.api.quote(task(model)).calc.P,q));
      assert.equal(loaded.api.getState().plan.modelPricing[model].mode,mode);
    }
  }
});

test('canonical profiles survive reload and imports even when compatibility mirrors are stale',t=>{
  const h=boot(t);
  h.manual('1.65');
  h.select('seedance-2.5');h.input('pricing-basis','margin','change');h.input('target-margin','20');
  h.select('seedance-2.0-fast');h.input('discount','9');
  const source=plain(h.api.getState()),profiles=plain(source.plan.modelPricing);
  Object.assign(source.plan,{q:'0.01',mode:'manual',manualM:'999',discount:'1',pricingModel:'seedance-2.0',procurementModel:'seedance-2.0'});
  const restored=boot(t,source);
  assert.deepEqual(plain(restored.api.getState().plan.modelPricing),profiles);
  assert.equal(restored.api.getState().plan.q,'1');assert.equal(restored.api.getState().plan.discount,'9');
  equal(restored.api.pricingForModel('seedance-2.0').usedM,'1.65');equal(restored.api.pricingForModel('seedance-2.5').usedM,'1.9225');
  const before=JSON.stringify(restored.api.getState()),invalid=plain(source);invalid.plan.modelPricing['seedance-2.5'].q='0';
  assert.throws(()=>restored.api.migrate({format:'reelay.pricing.v9',state:invalid}),/模型定价规则无效/);
  assert.equal(JSON.stringify(restored.api.getState()),before,'bad imports are atomic');
});

test('incomplete model rule edits never overwrite that model or another model on switch',t=>{
  const h=boot(t);h.manual('1.65');
  const profile=plain(h.api.getState().plan.modelPricing['seedance-2.0']);h.click('#edit-multiplier');h.input('manual-m','');
  assert.equal(h.w.document.getElementById('platformError').hidden,true);assert.equal(h.w.document.getElementById('manual-m').getAttribute('aria-invalid'),'true');
  h.select('seedance-2.5');assert.equal(h.w.document.getElementById('platformError').hidden,true);equal(h.api.pricing().usedM,'1.65');
  assert.deepEqual(plain(h.api.getState().plan.modelPricing['seedance-2.0']),profile);
  h.select('seedance-2.0');equal(h.api.pricing().usedM,'1.65');h.click('#edit-multiplier');assert.equal(h.w.document.getElementById('manual-m').value,'1.65');
});


test('editing a valid model policy while recharge is incomplete preserves it with the last valid recharge',t=>{
  const h=boot(t);h.input('pay','');h.input('discount','8.2');
  const saved=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  assert.equal(saved.plan.pay,'100');assert.equal(saved.plan.modelPricing['seedance-2.0'].discount,'8.2');
  assert.equal(h.api.getState().plan.pay,'','the active recharge draft is not silently repaired');
  h.select('seedance-2.5');h.input('purchase-discount','9');
  const restored=boot(t,JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official')));
  assert.equal(restored.api.getState().plan.pay,'100');assert.equal(restored.api.getState().plan.q,'0.9');
  assert.equal(restored.api.getState().plan.modelPricing['seedance-2.0'].discount,'8.2');
});

test('a zero effective multiplier remains a draft and cannot poison another model or the saved profile',t=>{
  const h=boot(t),doc=h.w.document;
  h.click('#plan-settings');h.input('plan-digits','0','change');h.input('plan-round','truncate','change');
  equal(h.api.pricing().usedM,'1');const before=plain(h.api.getState().plan.modelPricing['seedance-2.0']);
  h.input('discount','0.1');assert.equal(doc.getElementById('platformError').hidden,false);
  assert.equal(doc.getElementById('plan-principle').textContent,'—');assert.equal(doc.getElementById('policy-notice').hidden,true);
  const saved=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  assert.deepEqual(saved.plan.modelPricing['seedance-2.0'],before);
  h.select('seedance-2.5');assert.equal(doc.getElementById('platformError').hidden,true);h.click('#model-pricing-overview');assert.equal(doc.querySelectorAll('.pricing-overview-table tbody tr').length,3);h.click('#close-drawer');
  h.select('seedance-2.0');assert.equal(h.api.getState().plan.discount,'7.35');equal(h.api.pricing().usedM,'1');
});
