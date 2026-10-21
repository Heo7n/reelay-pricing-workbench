'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const E = require('./engine.js');
const R = require('./data.js');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const equal = (a,b,message) => assert.equal(E.cmp(a,b), 0, message);
const plain = value => JSON.parse(JSON.stringify(value));

function boot(t, storedEntries = []) {
  const errors = [], downloads = [], blobs = new Map();
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(read('template.html'), {
    url:'https://reelay-test.invalid/', runScripts:'outside-only', virtualConsole,
  });
  const w = dom.window;
  w.Blob = Blob;
  w.URL.createObjectURL = blob => {const id='blob:test-'+blobs.size; blobs.set(id,blob); return id;};
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () {downloads.push({name:this.download, blob:blobs.get(this.href)});};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.navigator.clipboard = {writeText:async () => {}};
  for (const [key,value] of storedEntries) w.localStorage.setItem(key,value);
  for (const file of ['engine.js', 'generated-minima.js', 'data.js', 'generated-model-minima.js', 'models.js', 'pricing-profiles.js', 'app.js']) w.eval(read(file));
  t.after(() => dom.window.close());
  const api = w.ReelayApp;
  const good = () => {
    assert.deepEqual(errors, [], 'no uncaught DOM errors');
    const error = w.document.getElementById('globalError');
    assert.equal(error.hidden, true, error.textContent);
  };
  const update = fn => {const s=api.getState(); fn(s); api.setState(s); good();};
  const input = (id,value,event='input') => {
    const el=w.document.getElementById(id); assert.ok(el,id+' exists');
    el.value=value; el.dispatchEvent(new w.Event(event,{bubbles:true})); good();
  };
  const click = selector => {const el=w.document.querySelector(selector); assert.ok(el,selector+' exists'); el.click(); good();};
  const setVideo = enabled => {
    const el=w.document.querySelector('[data-video="'+enabled+'"]');assert.ok(el,'the requested video-input button exists');
    el.click();good();assert.equal(el.getAttribute('aria-pressed'),'true');assert.equal(api.getState().task.video,enabled);
    assert.equal(w.document.querySelector('[data-video="'+!enabled+'"]').getAttribute('aria-pressed'),'false');
  };
  good();
  return {w,api,downloads,good,update,input,click,setVideo};
}

test('all 192 historical Oct19 display values remain consistent with the newly verified lookup', () => {
  const evidence = JSON.parse(read('official-table-evidence.json'));
  const minima = R.buildMinima();
  assert.equal(Object.keys(minima).length, 288);
  let displayedRecords = 0, expandedSpecs = 0, fractionalSpecs = 0;
  for (const [res,groups] of Object.entries(evidence.rows)) {
    for (const [ratios,displayed] of Object.entries(groups)) {
      for (let i=0;i<displayed.length;i++) {
        displayedRecords++;
        for (const ratio of ratios.split(',')) {
          const m = minima[R.key({res,ratio,seconds:String(evidence.seconds[i])})];
          assert.ok(m);
          assert.equal(E.fixed(m.tokens,0),String(displayed[i]), `${res}/${ratio}/${evidence.seconds[i]}`);
          if (E.dec(m.tokens).d!==1n) fractionalSpecs++;
          expandedSpecs++;
        }
      }
    }
  }
  assert.equal(displayedRecords,192);
  assert.equal(expandedSpecs,288);
  assert.ok(fractionalSpecs>0,'exact minima must retain fractions hidden by table display formatting');
});

test('startup uses the official minimum, and 04 matches 4 in both theory and lookup keys', t => {
  const h=boot(t), start=h.api.current();
  equal(start.calc.billedTokens,'67200');
  equal(start.x.P,'1.8816');
  assert.equal(start.partial,false);
  h.update(s=>{s.task.seconds='04';});
  assert.equal(h.api.getState().task.seconds,'4');
  assert.equal(h.api.minimumKey({...h.api.getState().task,seconds:'04'}),h.api.minimumKey(h.api.getState().task));
  equal(h.api.current().x.P,'1.8816');
  h.input('vin','3'); equal(h.api.current().x.P,'1.8816');
  h.input('vin','4'); equal(h.api.current().x.P,'2.1504');
  h.click('[data-tab="matrix"]');
  assert.ok(h.api.getTheoryRows().every(row=>row.coverage==='参数预估'));
});

test('procurement input and target modes change the intended financial quantities', t => {
  const h=boot(t);
  h.input('discount','8');
  const initialTarget=h.api.current().x.target;
  h.input('purchase-discount','6');
  equal(h.api.pricing().q,'0.6');
  equal(h.api.current().x.C,E.mul(h.api.current().x.P,'0.6'));
  equal(h.api.current().x.target,initialTarget,'discount objective keeps the customer target despite a changed procurement ratio');
  h.click('[data-pricing-basis="margin"]');
  h.input('target-margin','30');
  equal(h.api.pricing().d,E.div('0.6','0.7'));
  h.input('purchase-discount','7.35');
  equal(h.api.pricing().d,'1.05');
  equal(h.api.current().x.target,E.mul(h.api.current().x.P,'1.05'));
  assert.match(h.w.document.getElementById('policy-notice').textContent,/高于刊例/);
  h.api.openDetails('theory');
  const detail=h.w.document.getElementById('drawer-body').textContent;
  assert.match(detail,/倍率 = 每元积分 ÷［10 ×（1 − 目标毛利率）］/);
  assert.doesNotMatch(detail,/\$\{/);
});

test('gift input uses total received points exactly once', t => {
  const h=boot(t);
  h.input('total-mode','gift','change');
  assert.equal(h.w.document.getElementById('total').value,'538');
  h.input('pay','200');
  assert.equal(h.api.getState().plan.total,'2538');
  equal(h.api.pricing().U,E.div('200','2538'));
  h.input('total-mode','total','change');
  assert.equal(h.w.document.getElementById('total').value,'2538');
});

test('editing or removing actual records never changes theoretical costs or points', t => {
  const h=boot(t), before=h.api.current().x;
  h.update(s=>{s.observations[2].P='999';s.observations[2].C='800';s.observations[2].N='12345';s.observations[2].usage='100000';});
  equal(h.api.current().x.P,before.P);
  equal(h.api.current().x.C,before.C);
  equal(h.api.current().x.N,before.N);
  const actual=h.api.getActualRows().find(r=>r.record==='平台实测 · 原表第3行');
  assert.equal(actual.recordedP,'999');
  assert.equal(actual.recordedC,'800');
  assert.equal(actual.recordedN,'12345');
  h.update(s=>{s.observations=[];});
  equal(h.api.current().x.P,before.P);
  equal(h.api.current().x.N,before.N);
});

test('actual detail handles missing cost, cost-only margin and zero cost without inventing history', t => {
  const h=boot(t);
  h.update(s=>{s.plan.q='0.6';s.observations=[{id:'cost-gap',title:'缺项核对',params:{...s.task},P:'10',C:'',N:'17',usage:'',date:'',note:'fixture'}];});
  h.api.openDetails('actual','cost-gap');
  let detail=h.w.document.getElementById('drawer-body').textContent;
  assert.match(detail,/缺少平台实际采购金额/);
  assert.doesNotMatch(detail,/\$\{|不再乘0\.735/);
  assert.equal(h.api.getState().observations[0].N,'17');
  h.update(s=>{s.plan.targetMode='margin';s.plan.margin='20';s.observations[0].P='';s.observations[0].C='8';});
  h.api.openDetails('actual','cost-gap');
  detail=h.w.document.getElementById('drawer-body').textContent;
  assert.doesNotMatch(detail,/未录入平台刊例P，不计算目标现金/);
  assert.match(detail,/10\.000000/,'cost-only margin target is displayed');
  assert.equal(h.api.getState().observations[0].N,'17');
  h.update(s=>{s.observations[0].P='10';s.observations[0].C='0';});
  h.api.openDetails('actual','cost-gap');
  detail=h.w.document.getElementById('drawer-body').textContent;
  assert.doesNotMatch(detail,/NaN|Infinity|undefined|\$\{/);
});

test('V8 upgrade preserves raw observations and archives legacy minima while adopting official rules', t => {
  const h=boot(t), old=plain(h.api.defaults());
  old.schema='reelay.pricing.v8';
  delete old.plan.q; delete old.plan.targetMode; delete old.plan.margin;
  old.task.seconds='04';
  old.rules={version:'parameter-snapshot-v1',minima:{'480p|1:1|04|video|2':{tokens:'999999',note:'legacy source'}}};
  old.tasks=[{id:'legacy-task',title:'旧任务',params:{...old.task},qty:'3'}];
  const source=JSON.stringify(old);
  const migrated=h.api.migrate({format:'reelay.pricing.v8',state:old}).value;
  assert.equal(JSON.stringify(old),source,'migration is not destructive');
  assert.equal(migrated.schema,'reelay.pricing.v9');
  assert.equal(migrated.plan.q,'0.735');
  assert.equal(migrated.plan.targetMode,'discount');
  assert.equal(migrated.task.seconds,'4');
  assert.equal(migrated.tasks[0].params.seconds,'4');
  assert.equal(migrated.rules.legacyMinima['480p|1:1|04|video|2'].tokens,'999999');
  equal(migrated.rules.minima[R.key(migrated.task)].tokens,'67200');
  assert.equal(migrated.observations[3].C,'33.479641');
  assert.equal(migrated.observations[3].N,'');
  h.api.setState(migrated);h.good();
  equal(h.api.current().x.P,'1.8816');
});

test('JSON export round-trips the financial objective and CSV uses its current procurement ratio', async t => {
  const h=boot(t);
  h.update(s=>{s.plan.q='0.6';s.plan.targetMode='margin';s.plan.margin='20';s.tab='tasks';s.tasks=[{id:'export-task',title:'导出任务',params:{...s.task},qty:'3'}];});
  h.click('#export');h.click('#export-json');
  assert.equal(h.downloads.length,1);
  const payload=JSON.parse(await h.downloads[0].blob.text());
  assert.equal(payload.format,'reelay.pricing.v9');
  assert.equal(payload.state.plan.targetMode,'margin');
  assert.equal(payload.state.plan.margin,'20');
  assert.equal(payload.state.plan.q,'0.6');
  const roundtrip=h.api.migrate(payload).value;
  assert.equal(roundtrip.plan.margin,'20');
  assert.equal(roundtrip.observations[3].C,'33.479641');
  assert.equal(roundtrip.observations[3].N,'');
  h.click('#export-theory');
  const csv=await h.downloads[1].blob.text();
  assert.match(csv,/采购比例/);
  assert.match(csv,/"margin"/);
  assert.match(csv,/"0\.60000000000000000000"/);
  assert.match(csv,/"3"/);
  const rows=h.api.getTheoryRows();
  equal(rows[0].C,E.mul(rows[0].P,'0.6'));
  equal(rows[0].target,E.div(rows[0].C,'0.8'));
});

test('official rules cannot be silently replaced by imported values claiming official provenance', t => {
  const h=boot(t), source=h.api.getState(), k=R.key(source.task);
  source.rules.minima[k]={tokens:'100000',note:'claimed official replacement',kind:'official'};
  const imported=h.api.migrate({format:'reelay.pricing.v9',state:source}).value;
  assert.equal(imported.rules.minima[k].kind,'manual');
  equal(imported.rules.minima[k].tokens,'100000');
  const before=JSON.stringify(h.api.getState());
  source.rules.version='unrecognized-rule-version';
  assert.throws(()=>h.api.migrate({format:'reelay.pricing.v9',state:source}),/规则版本/);
  assert.equal(JSON.stringify(h.api.getState()),before);
});

test('verified lookup preserves fractional tokens and rejects mismatched rule identities', () => {
  const task={model:'seedance-2.0',res:'720p',ratio:'4:3',seconds:'4',video:true,vin:'2'};
  const below=R.estimate(task);
  equal(below.tokens,'130416.75');
  equal(below.minimum,'152152.875');
  equal(below.billedTokens,'152152.875');
  equal(below.P,'4.2602805');
  assert.equal(below.minimumSource.kind,'official');
  equal(R.estimate({...task,vin:'3'}).billedTokens,'152152.875');
  equal(R.estimate({...task,vin:'3.0001'}).billedTokens,'152155.0486125','raw observations keep fractional input seconds');
  equal(R.estimate({...task,vin:'15'}).billedTokens,'412986.375');
  const noVideo=R.estimate({...task,video:false});
  equal(noVideo.billedTokens,'86944.5');equal(noVideo.P,'3.999447');
  assert.equal(noVideo.minimumSource,null);
  assert.throws(()=>R.estimate({...task,model:'seedance-2.5'}),/标准版/);
  assert.throws(()=>R.estimate(task,undefined,'unverified'),/版本/);
  assert.throws(()=>R.estimate(task,{...R.officialMinimum(task),tokens:'152153'}),/快照/);
  assert.throws(()=>R.estimate(task,{tokens:'1',kind:'unknown'}),/来源/);
  equal(R.estimate(task,{tokens:'200000',kind:'manual',note:'contract'}).billedTokens,'200000');
  assert.equal(R.estimate(task,null).partial,true);
});

test('runtime lookup and MAX agree with the captured full formula for all 4032 video configurations', () => {
  const source=require('./source-rules.cjs');
  const table=source.parseClipboard(read('evidence/2026-10-20/minimum-480p.clipboard.json'));
  const formula=source.compileFormula(table.header.find(h=>h.id==='fld0p1bMiB').property.formula);
  let cases=0;
  for(const res of R.RESOLUTIONS)for(const ratio of R.RATIOS)for(let seconds=4;seconds<=15;seconds++){
    const [width,height]=E.DIMS[res][ratio];
    for(const vin of [0,...Array.from({length:14},(_,i)=>i+2)]){
      const task={res,ratio,seconds:String(seconds),video:vin>0,vin:String(vin)};
      const original=formula.evaluate({'时长-输入视频（秒）':String(vin),'时长-输出视频（秒）':String(seconds),'长边（像素）':String(width),'短边（像素）':String(height),'帧率':'24'});
      equal(R.estimate(task).billedTokens,original,`${res}/${ratio}/${seconds}/${vin}`);
      if(vin>0)cases++;
    }
  }
  assert.equal(cases,4032);
});

test('Oct19 drafts upgrade without losing pricing, explicit overrides or raw observations', t => {
  const first=boot(t),old=first.api.getState(),previous=R.PREVIOUS_VERSIONS[0];
  old.plan.mode='manual';old.plan.manualM='1.65';old.plan.q='1';old.plan.discount='10';delete old.plan.modelPricing;delete old.plan.pricingModel;
  old.observations[2].params.vin='3.0001';old.observations[2].usage='67201';
  old.rules.version=previous;
  old.rules.minima=Object.fromEntries(Object.entries(old.rules.minima).map(([key,row])=>[
    key.replace(R.VERSION,previous),{tokens:row.tokens,note:row.note,kind:row.kind}
  ]));
  const manualKey=R.key(old.task,previous);
  old.rules.minima[manualKey]={tokens:'100000',note:'明确的采购约定',kind:'manual'};
  const staleTask={res:'1080p',ratio:'16:9',seconds:'5'},staleKey=R.key(staleTask,previous);
  old.rules.minima[staleKey]={tokens:'999999',note:'旧版本官方值',kind:'official'};
  const serialized=JSON.stringify(old);
  const h=boot(t,[['reelay_pricing_v9_official',serialized]]),now=h.api.getState();
  assert.equal(now.rules.version,R.VERSION);assert.equal(now.rules.previousVersion,previous);
  assert.equal(now.plan.manualM,'1.65');assert.equal(now.plan.mode,'manual');assert.equal(now.plan.q,'1');
  assert.equal(now.rules.minima[R.key(old.task)].kind,'manual');
  assert.equal(now.rules.minima[R.key(old.task)].tokens,'100000');
  assert.equal(now.rules.minima[R.key(staleTask)].kind,'official');
  assert.equal(now.rules.minima[R.key(staleTask)].tokens,'437400');
  assert.equal(now.rules.legacyMinima[staleKey].tokens,'999999','stale official values are archived, never converted into active manual overrides');
  assert.equal(now.observations[2].params.vin,'3.0001');assert.equal(now.observations[2].usage,'67201');
  assert.equal(JSON.stringify(old),serialized,'migration leaves its input untouched');
  assert.ok(Object.keys(now.rules.minima).every(k=>k.includes(R.VERSION)));
  assert.equal(h.api.current().rule.kind,'manual');
});

test('standard procurement can use either the exact cash target or a manually specified multiplier', t => {
  const h=boot(t);
  h.input('purchase-discount','10');
  h.input('discount','10');
  equal(h.api.pricing().usedM,'1.538','100 yuan / 1538 points and list-price sales require 1.538 automatically');
  h.click('[data-pricing-basis="manual"]');
  h.input('manual-m','1.8');
  equal(h.api.pricing().usedM,'1.8');
  h.input('purchase-discount','7.35');
  h.input('pay','200');
  equal(h.api.pricing().usedM,'1.8','manual mode survives changes to procurement and recharge');
  h.input('purchase-discount','10');
  h.input('pay','100');
  h.click('[data-pricing-basis="manual"]');
  h.input('manual-m','1.65');
  assert.equal(h.api.getState().plan.mode,'manual');
  equal(h.api.pricing().usedM,'1.65');
  assert.equal(h.w.document.getElementById('manual-m').value,'1.65');
  equal(h.api.pricing().q,'1');
  assert.equal(h.api.pricing().targetAvailable,false);
  const p=h.api.pricing(), x=h.api.current().x;
  equal(E.div(x.rawCash,x.P),E.div('16.5','15.38'));
  equal(E.mul(E.div(E.sub(x.rawCash,x.C),x.rawCash),100),E.div('1120','165'));
  equal(x.raw,E.mul(x.C,'16.5'));
  equal(x.N,E.ceil(x.raw));
  assert.equal(h.api.current().x.target,null);
  const principle=h.w.document.getElementById('plan-principle').textContent;
  assert.match(principle,/10\.7282/,'manual mode reports its actual unrounded list-price equivalent');
  assert.match(principle,/6\.787[89]/,'manual mode reports its actual unrounded margin rather than the 0% target');
  h.click('[data-pricing-basis="discount"]');
  equal(h.api.pricing().usedM,'1.538');
  equal(h.api.current().x.rawCash,h.api.current().x.target);
  assert.equal(h.api.pricing().targetAvailable,true);
});

test('precision settings contain only precision controls and leave active pricing unchanged until applied', t => {
  const h=boot(t),doc=h.w.document;
  h.input('purchase-discount','10');h.input('discount','10');
  const before=plain(h.api.getState().plan);
  h.click('#plan-settings');
  assert.equal(doc.getElementById('drawer-title').textContent,'倍率精度');
  assert.equal(doc.querySelector('#plan-mode, #plan-manual'),null);
  assert.equal(doc.getElementById('plan-source-value').textContent,'1.538');
  h.click('#plan-limit-precision');h.input('plan-digits','2','change');
  assert.equal(doc.getElementById('plan-used-value').textContent,'1.54');
  assert.match(doc.getElementById('plan-result-note').textContent,/本次任务：\d+ → \d+ 积分/);
  assert.deepEqual(plain(h.api.getState().plan),before);
  h.click('#close-drawer');equal(h.api.pricing().usedM,'1.538','closing a preview does not apply it');
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');
  assert.equal(doc.getElementById('plan-settings').hidden,true,'an explicitly supplied decimal has no automatic rounding setting');
  equal(h.api.pricing().usedM,'1.65');
});

test('automatic precision is optional, persists as a saved plan and restores exact calculation', t => {
  const h=boot(t),doc=h.w.document;
  h.input('purchase-discount','10');h.input('discount','10');
  h.click('#plan-settings');
  assert.equal(doc.getElementById('plan-mode'),null,'precision does not duplicate pricing basis');
  assert.equal(doc.getElementById('plan-limit-precision').checked,false);
  assert.equal(doc.getElementById('plan-precision').hidden,true);
  h.click('#plan-limit-precision');
  assert.equal(doc.getElementById('plan-precision').hidden,false);
  h.input('plan-digits','2','change');
  assert.equal(doc.getElementById('plan-used-value').textContent,'1.54');
  h.input('plan-round','truncate','change');
  assert.equal(doc.getElementById('plan-used-value').textContent,'1.53');
  equal(h.api.pricing().usedM,'1.538','preview leaves the active plan unchanged');
  h.click('#save-plan');
  assert.equal(h.api.getState().plan.mode,'saved');
  equal(h.api.pricing().usedM,'1.53');
  const entries=Array.from({length:h.w.localStorage.length},(_,i)=>{
    const key=h.w.localStorage.key(i);return[key,h.w.localStorage.getItem(key)];
  });
  const restored=boot(t,entries),rdoc=restored.w.document;
  restored.click('#plan-settings');
  assert.equal(rdoc.getElementById('plan-mode'),null);
  assert.equal(rdoc.getElementById('plan-limit-precision').checked,true);
  assert.equal(rdoc.getElementById('plan-digits').value,'2');
  assert.equal(rdoc.getElementById('plan-round').value,'truncate');
  assert.equal(rdoc.getElementById('plan-used-value').textContent,'1.53');
  restored.click('#plan-limit-precision');restored.click('#save-plan');
  assert.equal(restored.api.getState().plan.mode,'ideal');
  equal(restored.api.pricing().usedM,'1.538');
});

test('calculation details derive the multiplier from original inputs without rounding them first', t => {
  const h=boot(t),doc=h.w.document;
  h.input('discount','8');h.click('#details');
  let text=doc.getElementById('drawer-body').textContent;
  assert.match(text,/倍率 = 每元积分 × 客户折扣 ÷ 采购折扣 ÷ 10/);
  assert.match(text,/\(1538 ÷ 100\) × 8 ÷ 7\.35 ÷ 10/);
  assert.match(text,/≈ 1\.674013605442/);
  assert.equal(doc.querySelector('[data-detail-mode]'),null,'theoretical and actual workflows are not mixed into tabs');
  h.click('#close-drawer');h.input('purchase-discount','10');h.input('discount','10');h.input('pay','3');h.input('total','10');h.click('#details');
  text=doc.getElementById('drawer-body').textContent;
  assert.match(text,/\(10 ÷ 3\) × 10 ÷ 10 ÷ 10/);assert.match(text,/≈ 0\.333333333333/);
  equal(h.api.pricing().usedM,E.div('1','3'),'rounded display does not enter the calculation');
});

test('margin-based multiplier stays constant when procurement changes while customer cash price follows cost', t => {
  const h=boot(t),doc=h.w.document;
  h.click('[data-pricing-basis="margin"]');h.input('target-margin','8.125');
  const before=h.api.pricing().usedM,cashBefore=h.api.current().x.target;
  h.click('#details');
  const text=doc.getElementById('drawer-body').textContent;
  assert.match(text,/倍率 = 每元积分 ÷［10 ×（1 − 目标毛利率）］/);
  assert.match(text,/\(1538 ÷ 100\) ÷［10 ×（1 − 8\.125%）］/);
  h.click('#close-drawer');h.input('purchase-discount','5');h.click('#details');
  equal(h.api.pricing().usedM,before);
  assert.notEqual(E.cmp(h.api.current().x.target,cashBefore),0);
  assert.match(doc.getElementById('drawer-body').textContent,/≈ 1\.674013605442/);
});

test('invalid manual values recover through basis selection and zero precision results cannot be applied', t => {
  const h=boot(t),doc=h.w.document;
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','');
  assert.equal(doc.getElementById('platformError').hidden,false);assert.equal(doc.getElementById('manual-m').getAttribute('aria-invalid'),'true');
  assert.equal(doc.getElementById('integer-points').textContent,'—');
  h.click('[data-pricing-basis="discount"]');
  assert.equal(doc.getElementById('platformError').hidden,true);assert.equal(h.api.getState().plan.mode,'ideal');
  h.input('purchase-discount','10');h.input('discount','10');h.input('total','10');
  const before=JSON.stringify(h.api.getState().plan);
  h.click('#plan-settings');h.click('#plan-limit-precision');h.input('plan-digits','0','change');h.input('plan-round','truncate','change');
  assert.equal(doc.getElementById('save-plan').disabled,true);assert.match(doc.getElementById('plan-error').textContent,/倍率为0/);
  doc.getElementById('save-plan').disabled=false;h.click('#save-plan');
  assert.equal(doc.getElementById('save-plan').disabled,true,'save validates even if the button is enabled externally');
  assert.equal(JSON.stringify(h.api.getState().plan),before);equal(h.api.pricing().usedM,'0.01');
  h.input('plan-digits','2','change');assert.equal(doc.getElementById('save-plan').disabled,false);
  h.click('#save-plan');equal(h.api.pricing().usedM,'0.01');
});

test('manual mode and multiplier survive local storage reload and exported JSON round-trip', async t => {
  const h=boot(t);
  h.input('purchase-discount','10');
  h.input('discount','10');
  h.click('[data-pricing-basis="manual"]');
  h.input('manual-m','1.65');
  const entries=Array.from({length:h.w.localStorage.length},(_,i)=>{
    const key=h.w.localStorage.key(i); return [key,h.w.localStorage.getItem(key)];
  });
  assert.ok(entries.length,'the edited plan is persisted');
  const reloaded=boot(t,entries);
  assert.equal(reloaded.api.getState().plan.mode,'manual');
  equal(reloaded.api.pricing().usedM,'1.65');
  assert.equal(reloaded.w.document.querySelector('[data-pricing-basis="manual"]').getAttribute('aria-pressed'),'true');
  h.click('#export'); h.click('#export-json');
  const payload=JSON.parse(await h.downloads[0].blob.text());
  assert.equal(payload.state.plan.mode,'manual');
  assert.equal(payload.state.plan.manualM,'1.65');
  const roundtrip=h.api.migrate(payload).value;
  reloaded.api.setState(roundtrip); reloaded.good();
  equal(reloaded.api.pricing().usedM,'1.65');
  equal(reloaded.api.pricing().q,'1');
  assert.equal(reloaded.api.pricing().targetAvailable,false);
  reloaded.click('[data-pricing-basis="discount"]');
  equal(reloaded.api.pricing().usedM,'1.538');
});

test('task controls and compact input duration update live without changing pricing', t => {
  const h=boot(t), doc=h.w.document;
  const fields=[...doc.querySelectorAll('.fields-layout > .field')];
  assert.deepEqual(fields.map(field=>field.dataset.field),['video','resolution','ratio','seconds']);
  const videoDetail=doc.getElementById('video-detail'),videoTitle=doc.getElementById('video-input-label'),videoControl=doc.getElementById('video-input-control'),videoOptions=doc.getElementById('video-options');
  assert.equal(fields[0].classList.contains('video-input-field'),true);
  assert.equal(videoTitle.textContent,'视频输入');
  assert.equal(videoTitle.nextElementSibling,videoControl);
  assert.equal(videoOptions.getAttribute('role'),'group');assert.equal(videoOptions.getAttribute('aria-labelledby'),'video-input-label');
  assert.equal(videoOptions.parentElement,videoControl);assert.equal(videoDetail.parentElement,videoControl);
  assert.ok(videoDetail.querySelector('.reference-controls'));
  assert.deepEqual([...videoOptions.querySelectorAll('button')].map(button=>[button.type,button.getAttribute('aria-label')]),[['button','无视频输入'],['button','有视频输入']]);
  assert.equal(doc.querySelector('#video-enabled, #video-off-label, label.video-toggle'),null,'explicit mode buttons replace the switch');
  assert.equal(doc.querySelector('.reference-slot'),null,'there is no separate spacer beneath the mode control');
  const ratios=[...fields[2].querySelectorAll('[data-ratio]')].map(button=>button.dataset.ratio);
  assert.deepEqual(ratios,['21:9','16:9','4:3','1:1','3:4','9:16']);
  const seconds=doc.getElementById('seconds'), vin=doc.getElementById('vin'), slider=doc.getElementById('vin-slider');
  assert.equal(seconds.type,'range');
  assert.equal(seconds.min,'4'); assert.equal(seconds.max,'15'); assert.equal(seconds.step,'1');
  assert.equal(vin.type,'number');
  assert.equal(vin.min,'2'); assert.equal(vin.max,'15'); assert.equal(vin.step,'1');
  assert.equal(slider.type,'range');
  assert.equal(slider.min,'2'); assert.equal(slider.max,'15'); assert.equal(slider.step,'1');
  assert.equal(doc.getElementById('vin-label').htmlFor,'vin-slider');
  assert.equal(doc.getElementById('vin-label').textContent,'总时长');
  assert.equal(slider.getAttribute('aria-label'),'输入视频总时长');
  assert.ok(videoDetail.contains(slider));assert.ok(videoDetail.contains(vin));
  assert.equal(slider.nextElementSibling.contains(vin),true);
  assert.equal(doc.getElementById('vin-scrubber'),null);
  assert.equal(doc.getElementById('vin-editor'),null);
  h.click('[data-pricing-basis="manual"]');
  h.input('manual-m','1.65');
  h.setVideo(true);
  assert.equal(doc.getElementById('video-detail').hidden,false);
  h.input('seconds','9');
  vin.focus();
  h.input('vin','7.5');
  assert.equal(h.api.getState().task.seconds,'9');
  equal(h.api.getState().task.vin,'8');
  assert.match(doc.getElementById('seconds-value').textContent,/9/);
  equal(vin.value,'8');
  vin.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));h.good();
  assert.equal(slider.value,'8');
  assert.equal(slider.getAttribute('aria-valuetext'),'8 秒');
  h.input('vin-slider','15');
  equal(h.api.getState().task.vin,'15');
  assert.equal(vin.value,'15');
  equal(h.api.pricing().usedM,'1.65');
  h.setVideo(false);
  assert.equal(videoDetail.getAttribute('aria-hidden'),'true');assert.equal(videoDetail.hasAttribute('inert'),true);
  assert.ok([...videoOptions.querySelectorAll('button')].every(button=>!button.disabled),'video-input choices remain available while duration is disabled');
  assert.equal(slider.disabled,true);assert.equal(vin.disabled,true);
  assert.equal(h.api.getState().task.video,false);
  equal(h.api.pricing().usedM,'1.65');
  assert.equal(doc.getElementById('auto-time'),null);
  assert.equal(doc.getElementById('auto-ratio'),null);
  assert.equal(doc.getElementById('task-mode-range'),null);
  assert.equal(doc.getElementById('task-mode-fixed'),null);
  assert.equal(doc.getElementById('range-options'),null);
  assert.equal(h.api.getState().task.seconds,'9');
  assert.equal(doc.getElementById('seconds').disabled,false);
  assert.ok(h.api.current().x);
  equal(h.api.pricing().usedM,'1.65');
});

test('explicit video choices synchronize task, presets, models and saved drafts without resetting an unchanged mode', t => {
  const h=boot(t),doc=h.w.document,control=doc.getElementById('video-input-control'),detail=doc.getElementById('video-detail'),slider=doc.getElementById('vin-slider'),duration=doc.getElementById('vin');
  const state=enabled=>{
    assert.equal(h.api.getState().task.video,enabled);assert.equal(control.classList.contains('is-video'),enabled);
    for(const value of [false,true]){
      const button=doc.querySelector('[data-video="'+value+'"]');assert.equal(button.disabled,false);assert.equal(button.getAttribute('aria-pressed'),String(value===enabled));
      assert.equal(button.getAttribute('aria-label'),value?'有视频输入':'无视频输入');
    }
    assert.equal(detail.hasAttribute('inert'),!enabled);assert.equal(detail.getAttribute('aria-hidden')==='true',!enabled);
    if(enabled)assert.equal(detail.hidden,false);
    assert.equal(slider.disabled,!enabled);assert.equal(duration.disabled,!enabled);
  };
  const pricing=JSON.stringify(h.api.getState().plan);
  state(true);
  h.setVideo(false);state(false);h.setVideo(true);state(true);
  h.click('#vin-slider');h.input('vin-slider','5');
  h.click('#vin');h.input('vin','7.2');
  h.click('#video-detail');h.click('#video-input-control');
  state(true);
  assert.equal(h.api.getState().task.vin,'8','duration still rounds upward independently of input mode');
  const task=JSON.stringify(h.api.getState().task);
  h.setVideo(true);state(true);assert.equal(control.classList.contains('is-closing'),false);
  assert.equal(JSON.stringify(h.api.getState().task),task,'reselecting the active mode preserves duration and task settings');
  h.setVideo(false);state(false);assert.equal(h.api.getState().task.vin,'2','disabling video retains the existing duration normalization');
  assert.equal(JSON.stringify(h.api.getState().plan),pricing,'video-input edits leave platform pricing unchanged');
  h.input('model','seedance-2.5','change');state(false);
  h.click('#quick-toggle');h.click('[data-example="video-max"]');state(true);
  assert.equal(duration.value,'30');assert.equal(slider.max,'30');
  h.input('model','seedance-2.0-fast','change');state(true);
  assert.equal(duration.value,'15');assert.equal(slider.max,'15');
  h.click('#quick-toggle');h.click('[data-example="none-min"]');state(false);
  assert.equal(duration.value,'2');
  const saved=h.w.localStorage.getItem('reelay_pricing_v9_official');
  const reloaded=boot(t,[['reelay_pricing_v9_official',saved]]),restored=reloaded.w.document;
  assert.equal(restored.querySelector('[data-video="false"]').getAttribute('aria-pressed'),'true');
  assert.ok([...restored.querySelectorAll('[data-video]')].every(button=>!button.disabled));
  assert.deepEqual([...restored.querySelectorAll('[data-video]')].map(button=>button.textContent),['无视频输入','有视频输入']);
  assert.equal(restored.getElementById('video-detail').hidden,true);
  assert.equal(restored.getElementById('vin-slider').disabled,true);assert.equal(restored.getElementById('vin').disabled,true);
  reloaded.setVideo(true);
  assert.equal(restored.getElementById('video-detail').hidden,false);assert.equal(restored.getElementById('video-detail').hasAttribute('inert'),false);
  assert.deepEqual([...restored.querySelectorAll('[data-video]')].map(button=>button.textContent),['无视频输入','有视频输入']);
  assert.equal(reloaded.api.getState().task.vin,'2');
});

test('video input headings and surrounding whitespace never change the selected mode', t => {
  const h=boot(t),doc=h.w.document;
  for(const enabled of [false,true]){
    h.setVideo(enabled);
    const before=JSON.stringify(h.api.getState().task);
    const passive=['#video-input-label','.video-input-field','#video-input-control','#video-options'];
    if(enabled)passive.push('#video-detail','.reference-controls','#vin-label','#vin-slider','#vin');
    for(const selector of passive){
      h.click(selector);
      assert.equal(doc.querySelector('[data-video="'+enabled+'"]').getAttribute('aria-pressed'),'true',selector+' must not toggle video input');
      assert.equal(JSON.stringify(h.api.getState().task),before,selector+' must not change task parameters');
    }
    const next=doc.querySelector('[data-video="'+!enabled+'"]');next.focus();
    assert.equal(doc.activeElement,next,'the explicit mode buttons remain keyboard focusable');
    h.setVideo(!enabled);
    assert.equal(doc.getElementById('video-detail').getAttribute('aria-hidden')==='true',enabled);
  }
});

test('video duration becomes inaccessible immediately while choice text stays stable across transitions', t => {
  const h=boot(t),doc=h.w.document,control=doc.getElementById('video-input-control'),detail=doc.getElementById('video-detail');
  const labelNodes=[...doc.querySelectorAll('#video-options .video-choice-text')];
  const labelMutations=new h.w.MutationObserver(()=>{});
  labelMutations.observe(doc.getElementById('video-options'),{childList:true,characterData:true,subtree:true});
  t.after(()=>labelMutations.disconnect());
  const labels=()=>[...doc.querySelectorAll('#video-options button')].map(button=>button.textContent);
  const transition=(target,propertyName)=>{const event=new h.w.Event('transitionend',{bubbles:true});Object.defineProperty(event,'propertyName',{value:propertyName});target.dispatchEvent(event);h.good();};
  const pricing=JSON.stringify(h.api.getState().plan);
  h.input('vin-slider','9');doc.getElementById('vin').focus();
  assert.deepEqual(labels(),['无视频输入','有视频输入']);
  h.setVideo(false);
  assert.equal(control.classList.contains('is-video'),false);assert.equal(control.classList.contains('is-closing'),true);
  assert.equal(detail.hidden,false,'the duration shell remains available for the closing animation');
  assert.equal(detail.getAttribute('aria-hidden'),'true');assert.equal(detail.hasAttribute('inert'),true);
  assert.equal(doc.getElementById('vin-slider').disabled,true);assert.equal(doc.getElementById('vin').disabled,true);
  assert.equal(doc.activeElement,doc.querySelector('[data-video="false"]'),'focus leaves the now-inert duration control');
  assert.deepEqual(labels(),['无视频输入','有视频输入'],'the same text remains in place while CSS expands its suffix');
  assert.equal(h.api.getState().task.vin,'2');
  transition(detail,'grid-template-columns');assert.equal(detail.hidden,false,'a descendant transition cannot finish the container animation');
  transition(control,'opacity');assert.equal(detail.hidden,false,'unrelated transitions do not finish closing');
  transition(control,'grid-template-columns');
  assert.equal(detail.hidden,true);assert.equal(control.classList.contains('is-closing'),false);assert.deepEqual(labels(),['无视频输入','有视频输入']);
  h.setVideo(true);
  assert.equal(control.classList.contains('is-video'),true);assert.equal(control.classList.contains('is-closing'),false);
  assert.equal(detail.hidden,false);assert.equal(detail.hasAttribute('inert'),false);assert.notEqual(detail.getAttribute('aria-hidden'),'true');
  assert.equal(doc.getElementById('vin-slider').disabled,false);assert.equal(doc.getElementById('vin').disabled,false);assert.deepEqual(labels(),['无视频输入','有视频输入']);
  transition(control,'grid-template-columns');assert.equal(detail.hidden,false,'opening transition completion cannot hide the active duration');
  assert.deepEqual([...doc.querySelectorAll('#video-options .video-choice-text')],labelNodes,'label nodes are preserved through both transitions');
  assert.deepEqual(labelMutations.takeRecords(),[],'neither render nor animation completion replaces or rewrites button text');
  assert.equal(JSON.stringify(h.api.getState().plan),pricing);
});

test('video closing fallback survives repeated selection, cancels on reopening and honors reduced motion', async t => {
  const h=boot(t),doc=h.w.document,control=doc.getElementById('video-input-control'),detail=doc.getElementById('video-detail');
  const wait=ms=>new Promise(resolve=>h.w.setTimeout(resolve,ms));
  const labels=()=>[...doc.querySelectorAll('#video-options button')].map(button=>button.textContent);
  h.setVideo(false);assert.equal(detail.hidden,false);
  await wait(120);h.setVideo(false);await wait(170);h.good();
  assert.equal(detail.hidden,true,'reselecting no video does not restart the 260 ms fallback');
  assert.equal(control.classList.contains('is-closing'),false);assert.deepEqual(labels(),['无视频输入','有视频输入']);
  h.setVideo(true);h.input('vin-slider','8');h.setVideo(false);h.setVideo(true);
  await wait(300);h.good();
  assert.equal(h.api.getState().task.video,true);assert.equal(h.api.getState().task.vin,'2');
  assert.equal(detail.hidden,false);assert.equal(detail.hasAttribute('inert'),false);assert.equal(control.classList.contains('is-closing'),false);assert.deepEqual(labels(),['无视频输入','有视频输入']);
  h.w.matchMedia=query=>({matches:query==='(prefers-reduced-motion: reduce)'});
  h.setVideo(false);
  assert.equal(detail.hidden,true);assert.equal(detail.hasAttribute('inert'),true);assert.equal(control.classList.contains('is-closing'),false);
  assert.deepEqual(labels(),['无视频输入','有视频输入']);
});

test('compact reference slider and number stay synchronized across edits, presets and saved state', t => {
  const h=boot(t),doc=h.w.document,slider=doc.getElementById('vin-slider'),input=doc.getElementById('vin');
  const key=key=>{input.dispatchEvent(new h.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));h.good();};
  const value=expected=>{
    assert.equal(h.api.getState().task.vin,String(expected));
    assert.equal(doc.querySelector('[data-video="'+h.api.getState().task.video+'"]').getAttribute('aria-pressed'),'true','presets and duration edits keep the selected mode in sync');
    assert.equal(input.value,String(expected));assert.equal(slider.value,String(expected));
    assert.equal(slider.getAttribute('aria-valuetext'),expected+' 秒');
    const task=h.api.getState().task;
    equal(h.api.current().x.P,E.estimate(task,task.video?R.officialMinimum(task).tokens:'').P);
    equal(h.api.pricing().usedM,'1.65');
  };
  h.click('[data-pricing-basis="manual"]');
  h.input('manual-m','1.65');
  for(const seconds of [2,8,15,3]){h.input('vin-slider',String(seconds));value(seconds);}
  assert.equal(doc.getElementById('coverage-note').hidden,true,'3-second input exactly reaches the 4-second output threshold');
  h.input('vin-slider','2');value(2);
  assert.equal(doc.getElementById('coverage-note').hidden,true);
  input.focus();h.input('vin','7.2');value(8);key('Escape');value(2);
  input.focus();h.input('vin','9.2');value(10);key('Enter');value(10);
  input.focus();input.value='';input.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(doc.getElementById('globalError').hidden,false);
  input.blur();h.good();value(10);
  h.click('#quick-toggle');h.click('[data-example="video-max"]');value(15);
  assert.equal(slider.style.getPropertyValue('--range-progress'),'100%');
  h.click('#quick-toggle');h.click('[data-example="video-min"]');value(2);
  assert.equal(slider.style.getPropertyValue('--range-progress'),'0%');
  h.setVideo(false);
  assert.equal(doc.getElementById('video-detail').getAttribute('aria-hidden'),'true');assert.equal(doc.getElementById('video-detail').hasAttribute('inert'),true);
  assert.equal(slider.disabled,true);assert.equal(input.disabled,true);
  h.setVideo(true);
  assert.equal(doc.getElementById('video-detail').hidden,false);
  assert.equal(slider.disabled,false);assert.equal(input.disabled,false);value(2);
  h.input('vin-slider','13');value(13);
  const saved=h.w.localStorage.getItem('reelay_pricing_v9_official');
  const reloaded=boot(t,[['reelay_pricing_v9_official',saved]]);
  assert.equal(reloaded.w.document.querySelector('[data-video="true"]').getAttribute('aria-pressed'),'true');
  assert.equal(reloaded.w.document.getElementById('video-detail').hidden,false);
  assert.equal(reloaded.w.document.getElementById('vin-slider').value,'13');
  assert.equal(reloaded.w.document.getElementById('vin').value,'13');
  equal(reloaded.api.pricing().usedM,'1.65');
});

test('input duration rounds upward for theory and imports without rewriting observed durations', t => {
  const h=boot(t);
  h.input('vin','3.0001');
  assert.equal(h.api.getState().task.vin,'4');
  assert.equal(h.w.document.getElementById('vin').value,'4');
  equal(h.api.current().x.P,'2.1504');
  h.input('vin','14.01');
  assert.equal(h.api.getState().task.vin,'15');
  assert.equal(h.w.document.getElementById('vin-slider').value,'15');
  const original=h.api.defaults();
  original.task.vin='2.0001';
  original.tasks=[{id:'fractional-task',title:'旧任务',params:{...original.task,vin:'7.0001'},qty:'1'}];
  original.observations[2].params.vin='7.25';
  const imported=h.api.migrate({format:'reelay.pricing.v9',state:original}).value;
  assert.equal(imported.task.vin,'3');
  assert.equal(imported.tasks[0].params.vin,'8');
  assert.equal(imported.observations[2].params.vin,'7.25');
  assert.equal(imported.observations[2].C,original.observations[2].C);
  assert.equal(original.task.vin,'2.0001','import leaves the source data intact');
  h.api.setState(imported);h.good();
  const invalid={...original,task:{...original.task,vin:'15.0001'}};
  assert.throws(()=>h.api.migrate({format:'reelay.pricing.v9',state:invalid}),/2～15/);
});

test('legacy range drafts and imports resolve to fixed tasks while preserving prices and records', t => {
  const h=boot(t), doc=h.w.document;
  assert.equal(doc.querySelector('.task-mode-switch'),null);
  assert.equal(doc.querySelector('.range-options'),null);
  assert.equal(doc.getElementById('seconds-range'),null);
  assert.equal(doc.getElementById('ratio-scope'),null);
  const original=plain(h.api.defaults());
  original.plan.mode='manual';original.plan.manualM='1.65';delete original.plan.modelPricing;delete original.plan.pricingModel;
  original.tasks=[{id:'keep-task',title:'已保存任务',params:{...original.task},qty:'3'}];
  for(const [ratio,seconds,wantRatio,wantSeconds] of [
    ['auto','auto','16:9','15'], ['auto','9','16:9','9'],
    ['4:3','auto','4:3','15'], ['4:3','9','4:3','9'],
  ]){
    const source={...plain(original),task:{res:'720p',ratio,seconds,video:true,vin:'7.5'}};
    for(const schema of ['reelay.pricing.v9','reelay.pricing.v8']){
      source.schema=schema;
      const imported=h.api.migrate({format:schema,state:source});
      assert.equal(source.task.ratio,ratio,'migration leaves source parameters intact');
      assert.equal(source.task.seconds,seconds);
      assert.equal(imported.value.task.ratio,wantRatio);
      assert.equal(imported.value.task.seconds,wantSeconds);
      assert.equal(imported.value.task.vin,'8');
      for(const [key,value] of Object.entries(original.plan))assert.deepEqual(plain(imported.value.plan[key]),value,key+' is preserved');
      assert.ok(Object.values(imported.value.plan.modelPricing).every(profile=>profile.mode==='manual'&&profile.manualM==='1.65'));
      assert.deepEqual(plain(imported.value.tasks),original.tasks);
      assert.deepEqual(plain(imported.value.observations).map(({usage,...o})=>o),original.observations);
      assert.deepEqual(plain(imported.value.references),original.references);
      if(ratio==='auto'||seconds==='auto')assert.match(imported.note,/旧范围参数已设为/);
      h.api.setState(imported.value);h.good();
      const current=h.api.current(), task=h.api.getState().task;
      assert.equal(current.range,false);
      equal(current.x.P,E.estimate(task,R.officialMinimum(task).tokens).P);
      equal(h.api.pricing().usedM,'1.65');
      assert.equal(doc.getElementById('seconds').value,wantSeconds);
      assert.equal(doc.getElementById('seconds').disabled,false);
      assert.equal(doc.querySelector('[data-ratio][aria-pressed="true"]').dataset.ratio,wantRatio);
      assert.equal(doc.getElementById('add-task').disabled,false);
    }
  }
  const legacy={...plain(original),task:{res:'720p',ratio:'auto',seconds:'auto',video:true,vin:'7.5'}};
  const stored=boot(t,[['reelay_pricing_v9_official',JSON.stringify(legacy)]]);
  assert.equal(stored.api.getState().task.ratio,'16:9');
  assert.equal(stored.api.getState().task.seconds,'15');
  assert.match(stored.w.document.getElementById('toast').textContent,/旧范围参数已设为比例 16:9、输出 15 秒/);
  const persisted=JSON.parse(stored.w.localStorage.getItem('reelay_pricing_v9_official'));
  assert.equal(persisted.task.ratio,'16:9');assert.equal(persisted.task.seconds,'15');
  equal(stored.api.pricing().usedM,'1.65');
  const cost=E.trim(stored.api.current().x.P,12);
  stored.click('#add-task');
  assert.equal(stored.api.getState().tasks.length,2);
  equal(stored.api.current().x.P,cost);
  const v7=stored.api.migrate({format:'reelay.pricing.v7',state:legacy});
  assert.equal(v7.value.task.ratio,'16:9');assert.equal(v7.value.task.seconds,'15');
  assert.match(v7.note,/旧范围参数已设为/);
});

test('minimum usage is indicated by the adopted label without a repeated notice', t => {
  const h=boot(t), doc=h.w.document, note=doc.getElementById('coverage-note');
  equal(h.api.current().calc.tokens,'57600');
  equal(h.api.current().calc.billedTokens,'67200');
  assert.equal(note.hidden,true);
  assert.equal(note.textContent,'');
  assert.equal(doc.getElementById('token-estimate').textContent,'57,600');
  assert.equal(doc.getElementById('token-minimum').textContent,'67,200');
  assert.equal(doc.getElementById('token-minimum-adopted').hidden,false);
  h.input('vin','3');
  equal(h.api.current().calc.tokens,'67200');
  assert.equal(note.hidden,true,'equality with the threshold adds no billable usage');
  h.input('vin','4');
  equal(h.api.current().calc.tokens,'76800');
  assert.equal(note.hidden,true,'usage above the threshold needs no minimum-usage notice');
  h.setVideo(false);
  assert.equal(note.hidden,true);
  h.update(s=>{
    s.task={res:'480p',ratio:'1:1',seconds:'4',video:true,vin:'4'};
    s.rules.minima[R.key(s.task)]={tokens:'100000',note:'人工门槛边界测试',kind:'manual'};
  });
  equal(h.api.current().calc.tokens,'76800');
  equal(h.api.current().calc.billedTokens,'100000');
  assert.equal(note.hidden,true);
  assert.equal(doc.getElementById('token-minimum-adopted').hidden,false);
  assert.match(doc.getElementById('cost-badge').textContent,/人工门槛/);
  h.input('vin','15');
  assert.equal(note.hidden,true,'an untriggered manual rule keeps only its provenance badge');
  assert.match(doc.getElementById('cost-badge').textContent,/人工门槛/);
  // Import always restores missing official minima, so test incomplete-rule handling
  // through the public calculation API instead of inventing an impossible persisted state.
  const incomplete=h.api.theoryOne({res:'480p',ratio:'1:1',seconds:'4',video:true,vin:'2'},
    {version:R.VERSION,minima:{}},h.api.pricing());
  assert.equal(incomplete.partial,true);
  assert.equal(incomplete.calc.status,'base-theory');
  equal(incomplete.calc.billedTokens,'57600');
});

test('usage summary marks the chosen base or minimum without a duplicate amount', t => {
  const h=boot(t),doc=h.w.document;
  const shown=id=>doc.getElementById(id).textContent;
  const adopted=expected=>{
    const chosen=doc.querySelectorAll('.usage-token.is-adopted');
    assert.equal(chosen.length,1,'exactly one value is used for a complete estimate');
    assert.equal(doc.querySelectorAll('.usage-adopted:not([hidden])').length,1,'a text label accompanies the color');
    assert.equal(chosen[0].querySelector('.usage-adopted').hidden,false);
    assert.ok(chosen[0].querySelector('dt').contains(chosen[0].querySelector('.usage-adopted')),'the adopted label stays with the title, separate from the value');
    if(expected)assert.equal(chosen[0].id,'token-'+expected+'-metric');
    return chosen[0].querySelector('dd').textContent;
  };
  const neutral=()=>{
    assert.equal(doc.getElementById('token-estimate-metric').hidden,false);
    assert.equal(doc.getElementById('token-minimum-metric').hidden,true);
    assert.equal(doc.querySelectorAll('.usage-token.is-adopted').length,0,'a single no-video estimate needs no chosen-state highlight');
    assert.equal(doc.querySelectorAll('.usage-adopted:not([hidden])').length,0,'no-video summaries show no adoption label');
  };
  assert.equal(doc.getElementById('token-applied'),null);
  assert.equal(doc.querySelectorAll('.usage-token').length,2);
  assert.equal(doc.getElementById('usage-metrics').classList.contains('is-single'),false);
  const explanation=()=>doc.getElementById('usage-explanation');
  assert.equal(doc.getElementById('usage-details'),null,'the inline disclosure is replaced by a dialog');
  assert.equal(doc.getElementById('modal').hidden,true);
  h.click('#usage-help');
  assert.equal(doc.getElementById('usage-method'),null);
  assert.equal(shown('token-rate'),'28.00');
  assert.equal(shown('token-estimate'),'57,600');
  assert.equal(shown('token-minimum'),'67,200');
  assert.equal(adopted('minimum'),'67,200');
  assert.match(explanation().textContent,/usage.completion_tokens/);
  assert.equal(explanation().querySelector('[data-step="billed"] .usage-formula').textContent,'max(估算 Token 用量, 最低 Token 用量)');
  h.update(s=>{s.task={res:'1080p',ratio:'16:9',seconds:'5',video:true,vin:'2'};});
  assert.equal(shown('token-rate'),'31.00');
  assert.equal(shown('token-estimate'),'340,200');
  assert.equal(shown('token-minimum'),'437,400');
  assert.equal(adopted('minimum'),'437,400');
  equal(h.api.current().x.P,'13.5594');
  assert.equal(shown('cost-p'),'13.56');
  h.input('purchase-discount','10');
  assert.equal(shown('token-rate'),'31.00');assert.equal(adopted('minimum'),'437,400');
  equal(h.api.current().x.C,'13.5594');
  h.input('vin-slider','4');
  assert.equal(shown('token-estimate'),shown('token-minimum'));
  assert.equal(adopted('estimate'),'437,400','equal values keep the base estimate, without suggesting extra usage');
  assert.equal(doc.getElementById('coverage-note').hidden,true);
  h.input('vin-slider','5');
  assert.equal(shown('token-estimate'),'486,000');assert.equal(adopted('estimate'),'486,000');
  assert.equal(doc.getElementById('coverage-note').hidden,true);
  h.setVideo(false);
  assert.equal(shown('token-rate'),'51.00');assert.equal(shown('token-minimum'),'不适用');
  assert.equal(doc.getElementById('token-minimum-metric').hidden,true);
  assert.equal(doc.getElementById('usage-metrics').classList.contains('is-single'),true,'the visible estimate occupies the shared row when no minimum applies');
  assert.equal(shown('token-estimate-label'),'估算 Token 用量');
  assert.equal(shown('token-estimate'),'243,000');neutral();
  assert.match(explanation().querySelector('.usage-choice').textContent,/采用估算 Token 用量/,'the explanation still identifies the value used in calculation');
  assert.equal(doc.querySelectorAll('#usage-price-table [aria-current="true"]').length,1);
  h.setVideo(true);
  assert.equal(adopted('minimum'),'437,400','re-enabling input video restores minimum comparison');
  h.setVideo(false);neutral();
  assert.equal(shown('token-estimate'),'243,000','both former base and minimum highlights clear when video is disabled');
  let fractional;
  for(const res of Object.keys(E.DIMS))for(const ratio of Object.keys(E.DIMS[res])){
    const task={res,ratio,seconds:'5',video:true,vin:'2'};
    if(E.estimate(task,R.officialMinimum(task).tokens).tokens.d!==1n){fractional=task;break;}
  }
  assert.ok(fractional,'there are official mappings with fractional token estimates');
  h.update(s=>{s.task=fractional;});
  assert.equal(doc.getElementById('token-minimum-metric').hidden,false);
  assert.equal(doc.getElementById('usage-metrics').classList.contains('is-single'),false);
  assert.equal(shown('token-estimate-label'),'估算 Token 用量');
  equal(shown('token-estimate').replaceAll(',',''),h.api.current().calc.tokens);
  equal(adopted().replaceAll(',',''),h.api.current().calc.billedTokens);
  h.update(s=>{
    s.task={res:'480p',ratio:'1:1',seconds:'4',video:true,vin:'4'};
    s.rules.minima[R.key(s.task)]={tokens:'76800.000000000001',kind:'manual',note:'人工精度 <来源> 测试'};
  });
  assert.equal(shown('token-minimum-kind'),'人工');
  assert.equal(shown('token-minimum'),'≈ 76,800');
  assert.equal(adopted('minimum'),'≈ 76,800','selection compares exact values, not rounded display values');
  assert.equal(doc.getElementById('token-minimum').title,'76,800.000000000001 Token');
  assert.equal(doc.getElementById('coverage-note').hidden,true,'the adopted badge is sufficient even for an exact fractional threshold');
  assert.match(explanation().textContent,/76,800.000000000001/);
  assert.match(explanation().textContent,/人工精度 <来源> 测试/);
  assert.equal(explanation().querySelector('来源'),null,'rule source is escaped');
  assert.doesNotMatch(explanation().textContent,/等效输入时长为/,'manual rules must not inherit an official duration explanation');
  h.input('vin-slider','15');
  assert.equal(doc.getElementById('coverage-note').hidden,true);
  assert.equal(doc.getElementById('token-minimum-kind').hidden,false,'manual provenance remains visible above the floor');
  adopted('estimate');
  const input=doc.getElementById('vin');input.focus();input.value='';
  input.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(doc.getElementById('globalError').hidden,false);
  assert.equal(doc.getElementById('usage-summary').hidden,true);
  for(const id of ['token-estimate','token-minimum'])assert.equal(shown(id),'—');
  assert.equal(explanation(),null);
  assert.match(doc.getElementById('drawer-body').textContent,/当前输入无效/);
  assert.equal(doc.querySelectorAll('.usage-token.is-adopted').length,0);
  assert.equal(doc.querySelectorAll('.usage-adopted:not([hidden])').length,0);
  input.blur();h.good();assert.equal(doc.getElementById('usage-summary').hidden,false);adopted('estimate');
});

test('usage calculation leads the explanation and substitutes each model specification without input video', t => {
  const h=boot(t),doc=h.w.document;
  h.click('#fee-digits');
  const clean=el=>el.textContent.replace(/[,\s]/g,'');
  const cases=[
    {model:'seedance-2.0',label:'Seedance 2.0',res:'1080p',ratio:'4:3',seconds:'5',wh:[1664,1248],rate:'51',tokens:'243,360',fee:'12.411360',approximate:false},
    {model:'seedance-2.5',label:'Seedance 2.5',res:'480p',ratio:'16:9',seconds:'4',wh:[854,480],rate:'70',tokens:'38,430',fee:'2.690100',approximate:false},
    {model:'seedance-2.0-fast',label:'Seedance 2.0 Fast',res:'720p',ratio:'4:3',seconds:'5',wh:[1112,834],rate:'37',tokens:'108,680.625',fee:'4.021183',approximate:true}
  ];
  for(const entry of cases){
    h.update(s=>{s.task={model:entry.model,res:entry.res,ratio:entry.ratio,seconds:entry.seconds,video:false,vin:'2'};});
    if(doc.getElementById('modal').hidden)h.click('#usage-help');
    const section=doc.getElementById('usage-calculation');
    assert.equal(doc.querySelector('#usage-explanation>section'),section,'the current calculation appears before reference tables');
    assert.equal(section.querySelector('h3').textContent,'本次计算');
    const context=doc.getElementById('usage-calculation-context').textContent;
    for(const expected of [entry.label,entry.res,entry.ratio])assert.ok(context.includes(expected),expected+' appears in task context');
    const estimate=section.querySelector('[data-step="estimate"]');
    for(const expected of [entry.wh[0],entry.wh[1],24,1024])assert.ok(clean(estimate).includes(String(expected)),expected+' appears in the estimate substitution');
    assert.match(clean(estimate),new RegExp('\\(0\\+'+entry.seconds+'\\)'),'no-video estimates substitute zero input seconds');
    assert.equal(doc.getElementById('usage-calc-estimate').textContent,entry.tokens);
    assert.equal(doc.getElementById('usage-calc-billed').textContent,entry.tokens);
    assert.equal(doc.getElementById('token-minimum-metric').hidden,true);
    assert.equal(doc.querySelectorAll('.usage-token.is-adopted').length,0,entry.label+' has a neutral no-video summary');
    assert.equal(doc.querySelectorAll('.usage-adopted:not([hidden])').length,0);
    assert.match(section.querySelector('.usage-choice').textContent,/采用估算 Token 用量/);
    const billed=section.querySelector('[data-step="billed"]');
    assert.match(billed.textContent,/无视频输入.*不应用最低 Token 用量/);
    assert.doesNotMatch(billed.textContent,/max\(|查表|人工设置/,'no-video calculations do not apply a minimum rule');
    assert.equal(section.querySelectorAll('#usage-calculation-accuracy').length,1);
    assert.equal(doc.getElementById('usage-calculation-accuracy').textContent,'Token 用量为估算值，实际以 API 返回的 usage.completion_tokens 为准。');
    const fee=section.querySelector('[data-step="fee"]');
    assert.match(fee.textContent,/计费 Token 用量.*刊例单价/);
    assert.equal(billed.querySelector('h4').textContent,'计费 Token 用量');
    assert.match(clean(fee),/÷1000000/,'the per-million price is converted once');
    assert.ok(clean(fee).includes(entry.rate),'the selected model rate appears in the substitution');
    assert.equal(doc.getElementById('usage-calc-fee').textContent,entry.fee);
    assert.equal(doc.getElementById('cost-p').textContent,entry.fee,'trace and main-panel fee agree');
    assert.equal(fee.textContent.includes('≈'),entry.approximate,'only rounded fee substitutions use approximate equality');
    assert.match(fee.textContent,/元\/个/);
    equal(doc.getElementById('usage-calc-estimate').textContent.replaceAll(',',''),h.api.quote().calc.tokens);
  }
});

test('fee display precision changes only the summary and retains exact pricing', t => {
  const h=boot(t),doc=h.w.document;
  h.update(s=>{s.task={model:'seedance-2.0',res:'720p',ratio:'4:3',seconds:'4',video:true,vin:'2'};});
  h.click('#usage-help');
  const savedState=JSON.stringify(h.api.getState());
  const quoteBefore=h.api.current();
  const calculationBefore=doc.getElementById('usage-calculation').innerHTML;
  const shown=()=>doc.getElementById('cost-p').textContent;
  const toggle=doc.getElementById('fee-digits');
  assert.equal(toggle.tagName,'BUTTON');assert.equal(toggle.type,'button');
  assert.equal(toggle.textContent,'2 位');
  assert.equal(toggle.getAttribute('aria-label'),'费用显示 2 位小数，点击切换为 6 位');
  assert.equal(shown(),'4.26');
  h.click('#fee-digits');
  assert.equal(toggle.textContent,'6 位');
  assert.equal(toggle.getAttribute('aria-label'),'费用显示 6 位小数，点击切换为 2 位');
  assert.equal(shown(),'4.260281');
  equal(h.api.current().x.P,'4.2602805');
  assert.equal(JSON.stringify(h.api.getState()),savedState,'display preference is outside the task and plan');
  assert.deepEqual(h.api.current(),quoteBefore,'all pricing results retain full precision');
  assert.equal(doc.getElementById('usage-calculation').innerHTML,calculationBefore,'detailed calculations retain six decimals');
  h.input('vin-slider','15');
  assert.equal(shown(),E.fixed(h.api.current().x.P,6),'precision survives task changes');
  h.click('#fee-digits');
  assert.equal(toggle.textContent,'2 位');
  assert.equal(shown(),E.fixed(h.api.current().x.P,2));
});

test('usage calculation compares exact minima and follows threshold changes while the dialog is open', t => {
  const h=boot(t),doc=h.w.document;
  h.click('#usage-help');
  const billed=()=>doc.querySelector('#usage-calculation [data-step="billed"]');
  const chosen=()=>doc.querySelector('#usage-calculation .usage-choice').textContent;
  assert.equal(billed().querySelector('h4').textContent,'计费 Token 用量');
  assert.match(billed().textContent,/max/i);
  assert.match(billed().textContent,/有视频输入|输入包含视频/,'minimum usage is scoped to video input');
  assert.match(billed().textContent,/查表/,'official minima come from the current specification lookup');
  for(const field of ['模型','分辨率','比例','输出时长'])assert.ok(billed().textContent.includes(field),field+' identifies the minimum lookup specification');
  assert.equal(doc.getElementById('usage-calc-estimate').textContent,'57,600');
  assert.equal(doc.getElementById('usage-calc-billed').textContent,'67,200');
  assert.match(chosen(),/采用最低 Token 用量/);
  h.input('vin-slider','3');
  assert.equal(doc.getElementById('usage-calc-estimate').textContent,'67,200');
  assert.equal(doc.getElementById('usage-calc-billed').textContent,'67,200');
  assert.match(chosen(),/采用估算 Token 用量/,'equality keeps the estimate instead of suggesting a floor increase');
  h.input('vin-slider','4');
  assert.equal(doc.getElementById('usage-calc-estimate').textContent,'76,800');
  assert.equal(doc.getElementById('usage-calc-billed').textContent,'76,800');
  assert.match(chosen(),/采用估算 Token 用量/);
  const manualNote='精确门槛 <em>测试</em> & 来源';
  h.update(s=>{s.rules.minima[h.api.minimumKey(s.task)]={tokens:'76800.000000000001',kind:'manual',note:manualNote};});
  assert.equal(doc.getElementById('usage-calc-billed').textContent,'76,800.000000000001','the calculation trace retains precision hidden in the summary');
  assert.match(chosen(),/采用最低 Token 用量/,'selection uses exact values even when the rounded summary is equal');
  assert.match(billed().textContent,/人工设置/);
  assert.doesNotMatch(billed().textContent,/查表/,'a manual threshold is never presented as an official lookup');
  const override=billed().querySelector('.usage-override');
  assert.ok(override,'the manual rule and its note belong to the minimum-selection step');
  assert.equal(doc.querySelectorAll('#usage-explanation .usage-override').length,1,'manual provenance is not repeated below the calculation');
  assert.ok(override.textContent.includes(manualNote),'the user note is preserved verbatim');
  assert.equal(override.querySelector('em'),null,'a note containing markup is rendered as text');
  assert.equal(doc.getElementById('usage-calc-fee').textContent,'2.150400');
  assert.match(doc.querySelector('#usage-calculation [data-step="fee"]').textContent,/≈/,'a sub-display-precision difference still requires approximate equality');
});

test('usage calculation stays model-only when platform pricing changes or recharge becomes invalid', t => {
  const h=boot(t),doc=h.w.document;
  h.click('#usage-help');
  const trace=()=>doc.getElementById('usage-calculation').textContent;
  const original=trace();
  h.input('pay','250');
  h.input('total','4000');
  h.input('purchase-discount','10');
  h.input('discount','10');
  assert.equal(trace(),original,'recharge, procurement and customer discounts do not change model usage or list fees');
  h.click('[data-pricing-basis="margin"]');
  h.input('target-margin','20');
  assert.equal(trace(),original,'the platform margin objective does not affect the model calculation');
  h.input('pay','');
  assert.equal(doc.getElementById('usage-help').disabled,false);
  assert.equal(trace(),original,'an invalid platform input leaves the current model calculation readable');
  assert.doesNotMatch(trace(),/采购|充值|积分|毛利|倍率/);
});

test('usage explanation opens as a centered, sourced dialog and restores focus when dismissed', t => {
  const h=boot(t),doc=h.w.document,help=doc.getElementById('usage-help'),modal=doc.getElementById('modal');
  assert.equal(doc.getElementById('cost-badge').textContent,'参数预估');
  assert.equal(doc.getElementById('token-minimum-label').textContent,'最低 Token 用量');
  assert.ok(help.closest('.estimate-heading'));
  assert.equal(doc.querySelector('.usage-rate-line'),null);
  assert.equal(doc.getElementById('token-rate'),null,'rates appear only inside the explanation dialog');
  assert.equal(help.getAttribute('aria-haspopup'),'dialog');
  const before=JSON.stringify(h.api.getState());
  help.focus();h.click('#usage-help');
  assert.equal(modal.hidden,false);assert.equal(modal.classList.contains('centered'),true);
  const dialog=doc.getElementById('drawer');
  assert.equal(dialog.getAttribute('role'),'dialog');assert.equal(dialog.getAttribute('aria-modal'),'true');
  assert.equal(doc.getElementById(dialog.getAttribute('aria-labelledby')).textContent,'用量说明');
  assert.ok(doc.getElementById(dialog.getAttribute('aria-describedby')));
  assert.equal(doc.activeElement.id,'close-drawer');
  const body=doc.getElementById('drawer-body');
  const parse=require('./source-rules.cjs').extractCalculatorSnapshot;
  const estimateFormula=body.querySelector('[data-step="estimate"] .usage-formula').textContent;
  const normalizedFormula=text=>text.replace(/输出视频的/g,'输出').replace(/\//g,'÷').replace(/[,\s]/g,'');
  for(const model of ['seedance-2.0','seedance-2.5']){
    const source=parse(read('evidence/2026-10-20/models/'+model+'-calculator-public.html'));
    const description=field=>source.viewProperty.fieldInfos[field].description.content.map(part=>part.text||'').join('');
    const estimate=description('fld0p1bMiB'),minimum=description('fldbHEcb1g');
    assert.equal(normalizedFormula(estimateFormula),normalizedFormula(estimate.split('\n')[0]),model+' preserves the captured output-dimension formula');
    assert.match(estimate,/usage\.completion_tokens/);
    assert.match(minimum,/输入包含视频时，存在最低 token 用量限制/);
    assert.match(minimum,/估算 token 用量 ＜ 最低 token 用量，则按最低 token 用量计算/);
    assert.match(minimum,/最低 token 用量为估算值/);
    assert.match(minimum,/usage\.completion_tokens/);
  }
  assert.equal(estimateFormula,'(输入视频时长 + 输出视频时长) × 输出宽 × 输出高 × 输出帧率 ÷ 1,024');
  assert.deepEqual([...body.querySelectorAll('#usage-calculation [data-step]')].map(step=>step.dataset.step),['estimate','billed','fee']);
  const accuracy=doc.getElementById('usage-calculation-accuracy');
  assert.equal(body.querySelectorAll('#usage-calculation-accuracy').length,1);
  assert.equal(accuracy.textContent,'估算 Token 用量与最低 Token 用量均为估算值，实际以 API 返回的 usage.completion_tokens 为准。');
  assert.equal(accuracy.previousElementSibling.classList.contains('usage-calculation-steps'),true,'the accuracy note follows the calculation steps');
  assert.equal((body.textContent.match(/usage\.completion_tokens/g)||[]).length,1,'the API accuracy explanation is stated once');
  for(const id of ['usage-estimate-definition','usage-minimum-definition','usage-estimate-description','usage-minimum-description'])assert.equal(doc.getElementById(id),null,'merged definitions are not duplicated below the calculation');
  const priceRows=[...body.querySelectorAll('#usage-price-table tbody tr')];
  assert.equal(priceRows.length,6);
  for(const row of priceRows){
    const model=h.w.ReelayModels.get(row.dataset.model),rates=[...row.querySelectorAll('td.num')].map(el=>el.textContent);
    for(const res of row.dataset.resolutions.split(','))assert.deepEqual(rates,Array.from(model.rates[res],value=>E.fixed(value,2)));
  }
  assert.equal(body.querySelectorAll('#usage-price-table [aria-current="true"]').length,1);
  assert.doesNotMatch(body.textContent,/官方原说明|官方如何说明|核验方法|项目 evidence|本工具的估算依据/);
  assert.ok(body.querySelector('a[href="'+h.w.ReelayModels.get('seedance-2.0').sources.minima.calculatorUrl+'"]'));
  assert.ok(body.querySelector('a[href="'+h.w.ReelayModels.get('seedance-2.5').sources.minima.calculatorUrl+'"]'));
  const sources=body.querySelector('.usage-source-links');
  assert.equal(body.querySelector('#usage-explanation').lastElementChild,sources);
  assert.equal(sources.querySelectorAll('a').length,6);
  assert.equal(body.querySelectorAll('.usage-explanation>section a').length,0,'source links stay together below the explanations');
  assert.ok(sources.querySelector('a[href="https://ark.volcengine.com/region:cn-beijing/docs/model-pricing"]'));
  assert.equal(body.querySelector('a[href$=".md"]'),null,'readable source links must open the normal documentation page');
  for(const [model,tableId] of [['seedance-2.0','tblmNCuMjADrXtDf'],['seedance-2.5','tblheIYDXXwYM43b']]){
    const link=[...body.querySelectorAll('a')].find(a=>a.getAttribute('href')===h.w.ReelayModels.get(model).sources.minima.url);
    assert.ok(link,'each model family has a minimum usage table link');
    assert.equal(new URL(link.href).searchParams.get('table'),tableId,'the two model families must open their separate official tables');
    assert.ok(sources.contains(link));
  }
  assert.equal(body.querySelector('.source-formula'),null);
  assert.equal(doc.getElementById('usage-method'),null);
  // JSDOM has no layout; expose rectangles only to exercise the existing focus trap.
  const focusable=[...dialog.querySelectorAll('button,a[href],summary')];
  for(const el of focusable)el.getClientRects=()=>[{}];
  focusable.at(-1).focus();
  doc.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
  assert.equal(doc.activeElement,focusable[0]);
  doc.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
  assert.equal(doc.activeElement,focusable.at(-1));
  doc.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));h.good();
  assert.equal(modal.hidden,true);assert.equal(doc.activeElement,help);
  assert.equal(JSON.stringify(h.api.getState()),before,'reading the explanation never changes the quote');
  h.click('#usage-help');h.click('#close-drawer');assert.equal(modal.hidden,true);
  h.click('#usage-help');modal.click();assert.equal(modal.hidden,true);
  h.click('#show-formula');assert.equal(modal.classList.contains('centered'),true,'calculation details use the larger centered panel');
  h.click('#close-drawer');
  const vin=doc.getElementById('vin');vin.focus();vin.value='';vin.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(help.disabled,true);vin.blur();h.good();assert.equal(help.disabled,false);
});

test('usage navigation addresses every section and scrolls within the dialog without changing pricing', t => {
  const h=boot(t),doc=h.w.document,before=JSON.stringify(h.api.getState());
  h.click('#usage-help');
  const body=doc.getElementById('drawer-body'),layout=body.querySelector('.usage-layout'),toc=body.querySelector('nav.usage-toc');
  assert.ok(layout?.contains(toc),'the usage dialog includes its own navigation');
  assert.ok(layout.contains(doc.getElementById('usage-explanation')));
  const ids=['usage-calculation','usage-prices','usage-dimensions','usage-sources'];
  const buttons=[...toc.querySelectorAll('button[data-usage-section]')];
  assert.deepEqual(buttons.map(button=>button.dataset.usageSection),ids);
  const current=()=>[...toc.querySelectorAll('[aria-current="location"]')];
  assert.equal(current().length,1);assert.equal(current()[0],buttons[0]);
  let pageScrolls=0;
  h.w.scrollTo=()=>{pageScrolls++;};
  h.w.HTMLElement.prototype.scrollIntoView=()=>{pageScrolls++;};
  doc.documentElement.scrollTop=123;
  // Supply geometry because JSDOM has no layout. Navigation must move the modal
  // scroller, rather than scrolling the underlying document to an anchor.
  body.getBoundingClientRect=()=>({top:100,bottom:900,left:0,right:1000,width:1000,height:800});
  for(const [i,id] of ids.entries()){
    const target=doc.getElementById(id);
    assert.ok(target,'navigation target '+id+' exists');
    assert.ok(doc.getElementById('usage-explanation').contains(target));
    Object.defineProperty(target,'offsetTop',{configurable:true,value:(i+1)*300});
    target.getBoundingClientRect=()=>({top:100+(i+1)*300-body.scrollTop,bottom:200+(i+1)*300-body.scrollTop,left:0,right:800,width:800,height:100});
    if(i===0)continue;
    body.scrollTop=10;
    h.click('[data-usage-section="'+id+'"]');
    assert.equal(current().length,1);assert.equal(current()[0].dataset.usageSection,id);
    assert.ok(body.scrollTop>10,'navigation moves the dialog to '+id);
    assert.equal(doc.documentElement.scrollTop,123,'the underlying page keeps its position');
  }
  Object.defineProperty(body,'clientHeight',{configurable:true,value:500});
  Object.defineProperty(body,'scrollHeight',{configurable:true,value:1700});
  for(const [position,id] of [[600,'usage-prices'],[900,'usage-dimensions'],[1200,'usage-sources']]){
    body.scrollTop=position;body.dispatchEvent(new h.w.Event('scroll'));
    assert.equal(current().length,1);assert.equal(current()[0].dataset.usageSection,id,'the selected title follows manual scrolling');
  }
  // Simulate the narrow-screen row navigation, whose sticky height must not
  // cover the destination heading. JSDOM does not evaluate viewport layouts.
  toc.style.flexDirection='row';
  toc.getBoundingClientRect=()=>({top:100,bottom:148,left:0,right:1000,width:1000,height:48});
  h.click('[data-usage-section="usage-dimensions"]');
  assert.ok(doc.getElementById('usage-dimensions').getBoundingClientRect().top>=148,'the destination clears the sticky navigation');
  body.dispatchEvent(new h.w.Event('scroll'));
  assert.equal(current()[0].dataset.usageSection,'usage-dimensions','scroll synchronization preserves the clicked heading on narrow screens');
  assert.equal(pageScrolls,0,'navigation does not invoke page-level scrolling');
  assert.equal(JSON.stringify(h.api.getState()),before,'reading and navigating usage help never changes pricing or task state');
});

test('usage navigation survives live recalculation and resets only when the dialog is reopened', t => {
  const h=boot(t),doc=h.w.document;
  h.click('#usage-help');
  const body=doc.getElementById('drawer-body');
  const active=()=>doc.querySelector('.usage-toc [aria-current="location"]')?.dataset.usageSection;
  h.click('[data-usage-section="usage-dimensions"]');
  body.scrollTop=728;
  doc.querySelector('.usage-toc').scrollLeft=170;
  doc.getElementById('usage-dimension-table').parentElement.scrollLeft=260;
  h.input('seconds','9');
  assert.equal(active(),'usage-dimensions');assert.equal(body.scrollTop,728,'task recalculation preserves the reading position');
  assert.equal(doc.querySelector('.usage-toc').scrollLeft,170,'recalculation preserves the narrow-screen navigation position');
  assert.equal(doc.getElementById('usage-dimension-table').parentElement.scrollLeft,260,'recalculation preserves the wide mapping table position');
  assert.match(doc.getElementById('usage-calculation-context').textContent,/9/,'preserving navigation does not freeze the calculation');
  h.input('purchase-discount','10');
  assert.equal(active(),'usage-dimensions');assert.equal(body.scrollTop,728,'pricing recalculation also preserves the reading position');
  h.click('#usage-show-pixels');
  assert.equal(active(),'usage-dimensions');assert.equal(body.scrollTop,728);
  h.setVideo(false);
  assert.equal(doc.getElementById('token-minimum-metric').hidden,true);
  assert.equal(doc.querySelectorAll('.usage-token.is-adopted').length,0);
  assert.equal(doc.querySelectorAll('.usage-adopted:not([hidden])').length,0);
  assert.equal(active(),'usage-dimensions');assert.equal(body.scrollTop,728);
  h.click('#close-drawer');h.click('#usage-help');
  assert.equal(active(),'usage-calculation');assert.equal(body.scrollTop,0,'a new visit starts at the calculation');
  h.click('#close-drawer');h.click('#show-formula');
  assert.equal(doc.querySelector('.usage-toc'),null,'platform calculation details do not inherit the usage navigation');
});

test('usage navigation retains a clicked lower heading when its scroll position is clamped at the bottom', t => {
  const h=boot(t),doc=h.w.document;
  h.click('#usage-help');
  const body=doc.getElementById('drawer-body');
  const active=()=>doc.querySelector('.usage-toc [aria-current="location"]')?.dataset.usageSection;
  let scrollPosition=0;
  Object.defineProperties(body,{
    clientHeight:{configurable:true,value:800},
    scrollHeight:{configurable:true,value:1800},
    scrollTop:{configurable:true,get:()=>scrollPosition,set:value=>{scrollPosition=Math.min(1000,Math.max(0,Number(value)));}}
  });
  body.getBoundingClientRect=()=>({top:100,bottom:900,left:0,right:1000,width:1000,height:800});
  const offsets={'usage-calculation':0,'usage-prices':300,'usage-dimensions':1300,'usage-sources':1600};
  for(const [id,offset] of Object.entries(offsets))doc.getElementById(id).getBoundingClientRect=()=>({top:100+offset-scrollPosition,bottom:200+offset-scrollPosition,left:0,right:800,width:800,height:100});
  for(const id of ['usage-dimensions','usage-sources']){
    h.click('[data-usage-section="'+id+'"]');
    assert.equal(body.scrollTop,1000,'the browser cannot scroll this heading to the top');
    body.dispatchEvent(new h.w.Event('scroll'));
    assert.equal(active(),id,'scroll synchronization preserves the explicitly selected lower heading');
  }
  body.scrollTop=650;body.dispatchEvent(new h.w.Event('scroll'));
  assert.equal(active(),'usage-prices','a later user scroll releases the explicit navigation selection');
  body.scrollTop=1000;body.dispatchEvent(new h.w.Event('scroll'));
  assert.equal(active(),'usage-sources','normal scrolling to the bottom selects the last section');
});

test('usage dimension table matches captured official mappings without ranking highlights', t => {
  const h=boot(t),doc=h.w.document;
  const before=JSON.stringify(h.api.getState());
  h.click('#usage-help');
  const table=doc.getElementById('usage-dimension-table');
  assert.ok(table,'the explanation includes the aspect-ratio to pixel-resolution table');
  assert.equal(doc.getElementById('usage-show-pixels').checked,false);
  assert.ok([...table.querySelectorAll('.dimension-total')].every(el=>el.hidden),'total pixels are hidden by default');
  h.click('#usage-show-pixels');
  assert.ok([...table.querySelectorAll('.dimension-total')].every(el=>!el.hidden),'the switch reveals every total without changing dimensions');
  // The oracle is parsed from the captured official document, independently of models.js.
  const catalog=require('./model-catalog-check.cjs');
  const evidence=catalog.readEvidence();
  catalog.validateReceipts(evidence);
  const official=catalog.deriveCatalog(evidence);
  const ratios=['21:9','16:9','4:3','1:1','3:4','9:16'];
  const bodies=[...table.querySelectorAll('tbody[data-model]')];
  assert.deepEqual(bodies.map(body=>body.dataset.model).sort(),Object.keys(official).sort());
  assert.equal(table.querySelectorAll('td[data-ratio]').length,54,'include only supported model/resolution specifications');
  assert.equal(table.querySelector('.is-pixel-maximum, .dimension-maximum'),null);
  assert.doesNotMatch(table.textContent,/最多/);
  for(const body of bodies){
    const model=body.dataset.model,source=official[model];
    const rows=[...body.querySelectorAll('tr[data-resolution]')];
    assert.deepEqual(rows.map(row=>row.dataset.resolution),source.resolutions,model+' resolution coverage');
    for(const row of rows){
      const res=row.dataset.resolution,dims=source.dims[res];
      const cells=[...row.querySelectorAll('td[data-ratio]')];
      assert.deepEqual(cells.map(cell=>cell.dataset.ratio),ratios,model+'/'+res+' ratio order');
      for(const cell of cells){
        const ratio=cell.dataset.ratio,[width,height]=dims[ratio],pixels=width*height;
        const label=model+'/'+res+'/'+ratio;
        assert.equal(cell.querySelector('.dimension-size')?.textContent,width+' × '+height,label+' dimensions');
        assert.equal(cell.querySelector('.dimension-pixels')?.textContent,pixels.toLocaleString('en-US')+' 像素',label+' exact total pixels');
      }
    }
  }
  h.click('#close-drawer');h.click('#usage-help');
  assert.equal(doc.getElementById('usage-show-pixels').checked,true,'the display preference lasts for this page session');
  h.click('#usage-show-pixels');
  assert.ok([...doc.querySelectorAll('#usage-dimension-table .dimension-total')].every(el=>el.hidden));
  assert.equal(JSON.stringify(h.api.getState()),before,'display preferences do not alter quotes or exported pricing state');
});

test('quick options use a compact attached region and close access immediately without changing pricing', t => {
  const h=boot(t),doc=h.w.document,toggle=doc.getElementById('quick-toggle'),drawer=doc.getElementById('quick-drawer'),content=doc.getElementById('quick-content');
  const before=JSON.stringify(h.api.getState());
  const closed=()=>{assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(drawer.hasAttribute('inert'),true);assert.equal(drawer.getAttribute('aria-hidden'),'true');};
  const transition=(target=content,propertyName='transform')=>{const event=new h.w.Event('transitionend',{bubbles:true});Object.defineProperty(event,'propertyName',{value:propertyName});target.dispatchEvent(event);h.good();};
  const finish=()=>{transition();closed();assert.equal(drawer.hidden,true);assert.equal(drawer.style.height,'0px');};
  closed();assert.equal(drawer.hidden,true);
  assert.equal(toggle.getAttribute('aria-controls'),drawer.id);assert.equal(toggle.hasAttribute('aria-haspopup'),false);
  assert.equal(drawer.getAttribute('role'),'region');assert.equal(drawer.getAttribute('aria-labelledby'),'quick-title');assert.equal(drawer.hasAttribute('aria-modal'),false);
  for(const id of ['quick-popover','quick-model','quick-close'])assert.equal(doc.getElementById(id),null);
  assert.equal(drawer.querySelector('h3'),null,'the trigger title is not repeated inside the drawer');
  assert.deepEqual([...drawer.querySelectorAll('.quick-matrix-head>span')].map(el=>el.textContent),['','最低用量','最高用量']);
  const groups=[...drawer.querySelectorAll('section.quick-group')];
  assert.deepEqual(groups.map(group=>doc.getElementById(group.getAttribute('aria-labelledby')).textContent),['无视频','有视频']);
  assert.deepEqual(groups.map(group=>[...group.querySelectorAll('[data-example]')].map(button=>button.dataset.example)),[['none-min','none-max'],['video-min','video-max']]);
  for(const group of groups)assert.equal(group.querySelectorAll(':scope>button[data-example]').length,2,'each input mode owns its two matrix cells');
  h.click('#quick-toggle');
  assert.equal(drawer.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(drawer.hasAttribute('inert'),false);assert.equal(drawer.getAttribute('aria-hidden'),'false');
  assert.equal(doc.activeElement,drawer.querySelector('[data-example][aria-pressed="true"]'),'opening focuses the current preset');
  doc.getElementById('quick-video-title').dispatchEvent(new h.w.Event('pointerdown',{bubbles:true}));
  doc.activeElement.dispatchEvent(new h.w.FocusEvent('focusout',{bubbles:true,relatedTarget:null}));
  h.click('#quick-video-title');
  assert.equal(toggle.getAttribute('aria-expanded'),'true','an internal nonfocusable heading does not dismiss the drawer');
  const openHeight=drawer.style.height;
  h.click('#quick-toggle');closed();assert.equal(doc.activeElement,toggle);
  assert.equal(drawer.hidden,false,'the clipping shell stays present during the slide-back animation');
  assert.equal(drawer.style.height,openHeight,'closing does not combine height collapse with content translation');
  h.click('[data-example="none-max"]');assert.equal(JSON.stringify(h.api.getState()),before,'a preset is not actionable during the closing animation');
  transition(drawer,'transform');assert.equal(drawer.hidden,false,'the clipping shell does not finish the content transition');
  transition(content,'opacity');assert.equal(drawer.hidden,false,'unrelated transitions do not end closing');
  transition(content.querySelector('button'),'transform');assert.equal(drawer.hidden,false,'a descendant transition does not end closing');
  finish();
  h.click('#quick-toggle');
  doc.activeElement.dispatchEvent(new h.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));h.good();
  closed();assert.equal(doc.activeElement,toggle);finish();
  h.click('#quick-toggle');
  h.click('body');closed();finish();
  h.click('#quick-toggle');doc.body.dispatchEvent(new h.w.Event('pointerdown',{bubbles:true}));h.good();closed();finish();
  h.click('#quick-toggle');toggle.focus();assert.equal(toggle.getAttribute('aria-expanded'),'true','focus can return to the trigger without dismissing the drawer');
  doc.getElementById('pay').focus();h.good();closed();finish();
  assert.equal(doc.activeElement,doc.getElementById('pay'),'leaving the drawer does not steal focus back');
  assert.equal(JSON.stringify(h.api.getState()),before,'opening and dismissal do not change task or financial state');
  const pricing=JSON.stringify(h.api.getState().plan);
  h.click('#quick-toggle');h.click('[data-example="none-max"]');
  closed();assert.equal(doc.activeElement,toggle);assert.equal(h.api.getState().task.video,false);finish();
  assert.equal(JSON.stringify(h.api.getState().plan),pricing,'applying a task preset does not alter pricing');
  h.click('#quick-toggle');assert.equal(doc.activeElement,drawer.querySelector('[data-example="none-max"]'));
});

test('quick options refresh model-specific descriptions and focus the first option when no preset matches', t => {
  const h=boot(t),doc=h.w.document,drawer=doc.getElementById('quick-drawer');
  h.input('seconds','9');h.click('#quick-toggle');
  assert.equal(drawer.querySelector('[data-example][aria-pressed="true"]'),null);
  assert.equal(doc.activeElement,drawer.querySelector('[data-example]'));
  h.click('#quick-toggle');
  for(const [model,label,maxSeconds,res] of [['seedance-2.5','Seedance 2.5','30','1080p'],['seedance-2.0-fast','Seedance 2.0 Fast','15','720p']]){
    h.input('model',model,'change');h.click('#quick-toggle');
    const highest=drawer.querySelector('[data-example="video-max"]');
    assert.ok(highest.getAttribute('aria-label').includes(label),'the accessible name retains model identity');
    assert.match(highest.getAttribute('aria-label'),/有视频输入，最高用量/);
    assert.match(highest.querySelector(':scope>span').textContent,new RegExp(res+' · '));
    assert.deepEqual([...highest.querySelectorAll('small>span')].map(el=>el.textContent),['输出 '+maxSeconds+' 秒','输入 '+maxSeconds+' 秒']);
    const pricing=JSON.stringify(h.api.getState().plan);
    h.click('[data-example="video-max"]');
    const task=h.api.getState().task;
    assert.equal(task.model,model);assert.equal(task.seconds,maxSeconds);assert.equal(task.vin,maxSeconds);assert.equal(task.res,res);
    assert.equal(drawer.getAttribute('aria-hidden'),'true');assert.equal(drawer.hasAttribute('inert'),true);assert.equal(doc.activeElement.id,'quick-toggle');
    assert.equal(JSON.stringify(h.api.getState().plan),pricing);
  }
});

test('quick drawer stays attached to its trigger and limits its internal height to available space', t => {
  const h=boot(t),doc=h.w.document,toggle=doc.getElementById('quick-toggle'),drawer=doc.getElementById('quick-drawer'),content=doc.getElementById('quick-content');
  let viewportHeight=800,anchor={top:600,bottom:632,left:40,right:400,width:360,height:32};
  Object.defineProperty(h.w,'innerHeight',{configurable:true,get:()=>viewportHeight});
  toggle.getBoundingClientRect=()=>anchor;
  Object.defineProperty(content,'scrollHeight',{configurable:true,value:280});
  h.click('#quick-toggle');
  assert.equal(h.w.getComputedStyle(drawer).position,'absolute');assert.equal(h.w.getComputedStyle(toggle.closest('.quick-config')).position,'relative');
  assert.equal(h.w.getComputedStyle(drawer).left,'0px');assert.equal(h.w.getComputedStyle(drawer).right,'0px');
  for(const property of ['left','top','width'])assert.equal(drawer.style[property],'','placement stays connected to the parent rather than storing viewport coordinates');
  assert.equal(drawer.dataset.placement,'above');assert.equal(parseFloat(drawer.style.height),240);assert.equal(parseFloat(content.style.maxHeight),240);
  assert.ok(anchor.top-parseFloat(drawer.style.height)>=0,'the upward drawer remains inside the viewport');
  const metrics=doc.getElementById('usage-metrics');
  let metricsTop=410;
  metrics.getBoundingClientRect=()=>({top:metricsTop,bottom:metricsTop+84,left:40,right:400,width:360,height:84});
  for(const top of [410,394,290]){
    metricsTop=top;h.w.dispatchEvent(new h.w.Event('resize'));h.good();
    assert.equal(drawer.dataset.placement,'above','visible Token metrics determine the opening direction');
    assert.equal(anchor.top+1-parseFloat(drawer.style.height),metricsTop,'the drawer top matches the Token block, including the shared 1px trigger border');
    assert.equal(content.style.maxHeight,drawer.style.height,'the visible tray fills the aligned shell');
  }
  metrics.getBoundingClientRect=()=>({top:0,bottom:0,left:0,right:0,width:0,height:0});
  h.click('#quick-toggle');
  viewportHeight=350;anchor={top:20,bottom:52,left:250,right:310,width:60,height:32};
  h.click('#quick-toggle');
  assert.equal(drawer.dataset.placement,'below');assert.ok(anchor.bottom+parseFloat(drawer.style.height)<=viewportHeight);
  h.click('#quick-toggle');
  // 190 px above would clip more content; 500 px below allows the full 240 px limit.
  viewportHeight=738;anchor={top:198,bottom:230,left:40,right:400,width:360,height:32};
  h.click('#quick-toggle');
  assert.equal(drawer.dataset.placement,'below');assert.equal(parseFloat(drawer.style.height),240);
  viewportHeight=260;anchor={top:140,bottom:172,left:40,right:400,width:360,height:32};
  h.w.dispatchEvent(new h.w.Event('resize'));h.good();
  assert.equal(drawer.dataset.placement,'above');assert.ok(parseFloat(content.style.maxHeight)<=132,'resize caps the scroller at the available space');
  assert.ok(parseFloat(drawer.style.height)<=132);
});

test('a height-limited quick drawer reveals its focused preset using only the content scroller', t => {
  const h=boot(t),doc=h.w.document,toggle=doc.getElementById('quick-toggle'),drawer=doc.getElementById('quick-drawer'),content=doc.getElementById('quick-content');
  h.click('#quick-toggle');h.click('[data-example="video-max"]');
  const selected=drawer.querySelector('[data-example="video-max"]');
  Object.defineProperties(h.w,{innerHeight:{configurable:true,value:260},innerWidth:{configurable:true,value:1280}});
  toggle.getBoundingClientRect=()=>({top:140,bottom:172,left:40,right:400,width:360,height:32});
  let scrollPosition=0;
  const contentHeight=()=>Math.min(280,parseFloat(content.style.maxHeight)||280);
  Object.defineProperties(content,{
    clientHeight:{configurable:true,get:contentHeight},scrollHeight:{configurable:true,value:280},
    scrollTop:{configurable:true,get:()=>scrollPosition,set:value=>{scrollPosition=Math.max(0,Math.min(280-contentHeight(),Number(value)));}}
  });
  content.getBoundingClientRect=()=>{const height=contentHeight(),top=140-height;return {top,bottom:top+height,left:40,right:400,width:360,height};};
  selected.getBoundingClientRect=()=>{const top=content.getBoundingClientRect().top+220-scrollPosition;return {top,bottom:top+40,left:50,right:390,width:340,height:40};};
  let pageScrolls=0;
  h.w.scrollTo=()=>{pageScrolls++;};h.w.HTMLElement.prototype.scrollIntoView=()=>{pageScrolls++;};
  doc.documentElement.scrollTop=37;
  h.click('#quick-toggle');
  assert.equal(doc.activeElement,selected);assert.ok(content.clientHeight<content.scrollHeight);
  assert.ok(content.scrollTop>0,'opening reveals the active option even though focus uses preventScroll');
  assert.equal(drawer.scrollTop,0,'the outer animation shell is not scrolled');
  const panel=content.getBoundingClientRect(),option=selected.getBoundingClientRect();
  assert.ok(option.top>=panel.top&&option.bottom<=panel.bottom,'the focused preset is fully visible');
  assert.equal(doc.documentElement.scrollTop,37);assert.equal(pageScrolls,0,'only the drawer content scrolls');
});

test('quick drawer closing fallback is cancelled on reopen and reduced motion finishes immediately', async t => {
  const h=boot(t),doc=h.w.document,toggle=doc.getElementById('quick-toggle'),drawer=doc.getElementById('quick-drawer');
  const before=JSON.stringify(h.api.getState());
  const wait=()=>new Promise(resolve=>h.w.setTimeout(resolve,300));
  h.click('#quick-toggle');h.click('#quick-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(drawer.hidden,false);
  await wait();h.good();assert.equal(drawer.hidden,true);assert.equal(drawer.style.height,'0px');
  h.click('#quick-toggle');h.click('#quick-toggle');h.click('#quick-toggle');
  await wait();h.good();
  assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(drawer.hidden,false);assert.equal(drawer.hasAttribute('inert'),false);
  assert.ok(parseFloat(drawer.style.height)>0,'the previous close timer cannot collapse a reopened drawer');
  h.w.matchMedia=query=>({matches:query==='(prefers-reduced-motion: reduce)'});
  h.click('#quick-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(drawer.hidden,true);assert.equal(drawer.style.height,'0px');
  assert.equal(drawer.hasAttribute('inert'),true);assert.equal(drawer.getAttribute('aria-hidden'),'true');
  assert.equal(JSON.stringify(h.api.getState()),before,'animation timing never changes task or platform data');
});

test('four quick configurations are true official token extrema over all supported specifications', t => {
  const h=boot(t), selectors=['none-min','none-max','video-min','video-max'];
  assert.deepEqual([...h.w.document.querySelectorAll('[data-example]')].map(button=>button.dataset.example),selectors);
  h.click('[data-pricing-basis="manual"]');
  h.input('manual-m','1.65');
  // Independently enumerate the official formula instead of sharing the preset lookup.
  // With video input, effective input is max(actual input, ceil(2 * output / 3)).
  const extrema=(video,vin)=>{
    let minimum=null,maximum=null;
    for(const dimensions of Object.values(E.DIMS)) for(const [width,height] of Object.values(dimensions)) {
      for(let seconds=4;seconds<=15;seconds++) {
        const effectiveSeconds=seconds+(video?Math.max(vin,Math.ceil(2*seconds/3)):0);
        const tokens=E.div(E.mul(String(effectiveSeconds*width*height),'24'),'1024');
        if(minimum===null||E.cmp(tokens,minimum)<0)minimum=tokens;
        if(maximum===null||E.cmp(tokens,maximum)>0)maximum=tokens;
      }
    }
    return {minimum,maximum};
  };
  for(const name of selectors){
    const video=name.startsWith('video'), highest=name.endsWith('max'), vin=highest?15:2;
    h.click('#quick-toggle');
    h.click('[data-example="'+name+'"]');
    const task=h.api.getState().task, expected=extrema(video,vin);
    assert.equal(task.video,video,name+' sets input mode');
    if(video)equal(task.vin,String(vin),name+' uses the endpoint reference duration');
    equal(h.api.current().calc.billedTokens,highest?expected.maximum:expected.minimum,name+' reaches the global official token extreme');
    equal(h.api.pricing().usedM,'1.65',name+' does not mutate the pricing multiplier');
    assert.equal(h.api.getState().plan.mode,'manual');
  }
});

test('architecture: pricing separates shared conditions, model policy and current task results', t => {
  const h=boot(t),doc=h.w.document;
  const workbench=doc.getElementById('theory-workspace'),actual=doc.getElementById('actual-workspace'),work=workbench.querySelector('.work');
  const generation=work.querySelector('.generation-panel'),plan=work.querySelector('.plan');
  assert.equal(h.api.getState().workspace,'theory');assert.equal(actual.hidden,true);
  assert.equal(doc.querySelector('.workspace-nav'),null);assert.equal(doc.getElementById('platform-workspace'),null);
  assert.equal(work.children.length,2);assert.equal(work.firstElementChild,generation);assert.equal(work.lastElementChild,plan);
  for(const id of ['model','seconds','vin-slider','token-estimate','token-minimum','cost-p','usage-help','globalError'])assert.ok(generation.contains(doc.getElementById(id)),id+' stays with generation');
  for(const id of ['pay','total','purchase-discount','procurement-status','discount','target-margin','manual-m','cost-c','integer-points','actual-cash','platformError'])assert.ok(plan.contains(doc.getElementById(id)),id+' belongs to platform pricing');
  assert.equal(doc.querySelectorAll('#cost-p').length,1);assert.equal(plan.contains(doc.getElementById('cost-p')),false);
  assert.equal(doc.getElementById('pixels').closest('[hidden]'),null);assert.match(doc.querySelector('.pixel-line').textContent,/24 fps/);
  assert.equal(doc.getElementById('preview-frame'),null);
  const conditions=plan.querySelector('.pricing-conditions'),rule=plan.querySelector('.pricing-rule-section'),result=plan.querySelector('.customer-charge-section');
  assert.ok(conditions.compareDocumentPosition(rule)&h.w.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(rule.compareDocumentPosition(result)&h.w.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(conditions.querySelector('.pricing-recharge').contains(doc.getElementById('per-point')));
  assert.ok(conditions.querySelector('.pricing-procurement').contains(doc.getElementById('purchase-discount')));
  assert.deepEqual([...rule.querySelectorAll('[data-pricing-basis]')].map(el=>el.dataset.pricingBasis),['discount','margin','manual']);
  assert.equal(doc.querySelector('#pricing-mode, #target-mode, #target-settings, #per-yuan'),null);
  assert.equal(doc.getElementById('plan-principle').closest('details'),null,'policy results are visible before task rounding');
  for(const id of ['list-cost','raw-points','target-cash','pricing-detail','charge-breakdown','unit-check','economics-how','actual-calculation'])assert.equal(doc.getElementById(id),null,id+' is no longer a competing primary metric or entry');
  for(const id of ['integer-points','actual-cash','cost-c','model-profit','model-margin']){
    const el=doc.getElementById(id);assert.ok(result.contains(el));assert.equal(doc.querySelectorAll('#'+id).length,1);assert.equal(el.closest('details'),null);
  }
  assert.ok(result.contains(doc.getElementById('details')));assert.ok(result.contains(doc.getElementById('add-task')));
  assert.equal(doc.getElementById('quick-toggle').closest('[hidden]'),null);assert.equal(doc.getElementById('quick-drawer').hidden,true);
  assert.equal(doc.getElementById('platform-comparison').open,false);
  const estimate=h.api.quote().calc;h.click('#open-actual');assert.equal(actual.hidden,false);assert.equal(workbench.hidden,true);
  h.click('#back-theory');assert.equal(workbench.hidden,false);equal(h.api.quote().calc.P,estimate.P);
  const legacy=h.api.getState();legacy.workspace='platform';legacy.plan.manualM='1.65';legacy.plan.mode='manual';delete legacy.plan.modelPricing;delete legacy.plan.pricingModel;
  const restored=boot(t,[['reelay_pricing_v9_official',JSON.stringify(legacy)]]);
  assert.equal(restored.api.getState().workspace,'theory');assert.equal(restored.api.getState().plan.manualM,'1.65');
});

test('architecture: invalid recharge input clears only platform results and leaves model estimates usable', t => {
  const h=boot(t),doc=h.w.document,before=h.api.quote().calc;
  const shown=Object.fromEntries(['cost-p','token-estimate','token-minimum'].map(id=>[id,doc.getElementById(id).textContent]));
  const platformIds=['cost-c','integer-points','actual-cash','model-profit','model-margin'];
  const resultNodes=Object.fromEntries(platformIds.map(id=>[id,doc.getElementById(id)]));
  const previousResults=Object.fromEntries(platformIds.map(id=>[id,resultNodes[id].textContent]));
  for(const invalid of ['', 'not-a-price', '0']){
    h.input('pay',invalid);
    assert.equal(doc.getElementById('globalError').hidden,true,'platform errors do not invalidate model parameters');
    assert.equal(doc.getElementById('platformError').hidden,false);
    assert.equal(doc.getElementById('usage-summary').hidden,false);
    assert.equal(doc.getElementById('usage-help').disabled,false);
    for(const [id,value] of Object.entries(shown))assert.equal(doc.getElementById(id).textContent,value,id+' remains current');
    const independent=h.api.quote().calc;
    equal(independent.P,before.P);equal(independent.tokens,before.tokens);equal(independent.billedTokens,before.billedTokens);
    for(const id of platformIds){
      const el=doc.getElementById(id);
      assert.equal(el,resultNodes[id],id+' keeps its place in the result layout');
      assert.equal(el.textContent.trim(),'—',id+' cannot retain a stale commercial result');
    }
    h.click('#usage-help');
    assert.equal(doc.getElementById('modal').hidden,false);
    assert.match(doc.getElementById('drawer-body').textContent,/usage\.completion_tokens/);
    h.click('#close-drawer');
  }
  h.input('pay','100');
  assert.equal(doc.getElementById('platformError').hidden,true);
  for(const id of platformIds){
    assert.equal(doc.getElementById(id),resultNodes[id],id+' remains stable on recovery');
    assert.equal(resultNodes[id].textContent,previousResults[id],id+' recovers the current result');
  }
  equal(h.api.current().x.P,before.P);
});

test('platform task results agree with exact accounting across all pricing bases', t => {
  const h=boot(t),doc=h.w.document;
  const observations=plain(h.api.getState().observations),modelEstimate=h.api.quote().calc.P;
  const verify=planInput=>{
    const p=E.plan(planInput),x=E.settle(modelEstimate,E.mul(modelEstimate,p.q),p);
    const expected={'cost-c':'¥'+E.fixed(x.C,6),'integer-points':E.fixed(x.N,0),'actual-cash':'¥'+E.fixed(x.cash,6),'model-profit':'¥'+E.fixed(x.profit,6),'model-margin':E.trim(x.margin,4)+'%'};
    for(const [id,value] of Object.entries(expected))assert.equal(doc.getElementById(id).textContent,value,id+' matches exact accounting');
    assert.match(doc.getElementById('integer-points').textContent,/^\d+$/);
    const loss=E.cmp(x.profit,0)<0;
    assert.equal(doc.getElementById('pricing-loss').hidden,!loss);
    assert.equal(doc.getElementById('model-profit').classList.contains('loss'),loss);
    equal(h.api.quote().calc.P,modelEstimate);assert.deepEqual(plain(h.api.getState().observations),observations);
  };
  const recharge={pay:'100',total:'1538'};
  verify({...recharge,q:'0.735',discount:'7.35'});
  h.input('purchase-discount','10');verify({...recharge,q:'1',discount:'7.35'});
  h.input('purchase-discount','6');verify({...recharge,q:'0.6',discount:'7.35'});
  h.click('[data-pricing-basis="margin"]');h.input('target-margin','20');verify({...recharge,q:'0.6',targetMode:'margin',margin:'20'});
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');verify({...recharge,q:'0.6',targetMode:'margin',targetAvailable:false,appliedM:'1.65'});
  h.input('discount','');h.input('target-margin','100');
  assert.equal(doc.getElementById('platformError').hidden,true,'unselected targets cannot invalidate specified pricing');
  verify({...recharge,q:'0.6',targetAvailable:false,appliedM:'1.65'});
  h.click('[data-pricing-basis="discount"]');assert.equal(doc.getElementById('platformError').hidden,false);
  h.input('discount','8');verify({...recharge,q:'0.6',discount:'8'});
});

test('architecture: model drafts and quote exports remain independent of an invalid platform plan', async t => {
  const h=boot(t),doc=h.w.document;
  h.input('pay','200');
  const lastValidPlan=plain(h.api.getState().plan);
  h.input('pay','');
  h.input('model','seedance-2.5','change');
  h.input('seconds','30');
  h.input('vin-slider','30');
  assert.equal(doc.getElementById('platformError').hidden,false);
  assert.match(doc.getElementById('storage-status').textContent,/输入待修正/);
  assert.match(doc.getElementById('storage-status').textContent,/已保存有效设置/);
  assert.equal(h.api.getState().plan.pay,'','saving a model draft does not silently repair the visible platform input');
  const stored=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  assert.equal(stored.task.model,'seedance-2.5');
  assert.equal(stored.task.seconds,'30');assert.equal(stored.task.vin,'30');
  const modelPlan={...lastValidPlan,...lastValidPlan.modelPricing['seedance-2.5'],procurementModel:'seedance-2.5',pricingModel:'seedance-2.5'};
  assert.deepEqual(stored.plan,modelPlan,'persist valid shared conditions and all policies while aligning the active model profile');
  h.click('#export');
  assert.equal(doc.getElementById('export-quote').disabled,false);
  assert.equal(doc.getElementById('export-json').disabled,true);
  assert.equal(doc.getElementById('export-summary').disabled,true);
  h.click('#export-quote');
  assert.equal(h.downloads.length,1);
  const summary=await h.downloads[0].blob.text();
  assert.match(summary,/Seedance 2\.5/);
  assert.match(summary,/30秒/);
  assert.match(summary,/单价：42 元 \/ 百万 Token/);
  assert.match(summary,/估算 Token 用量：576,000/);
  assert.match(summary,/刊例费用：¥24\.192/);
  assert.doesNotMatch(summary,/采购|充值|积分|毛利|倍率|现金/,'the standalone model summary contains no platform amounts');
  const entries=Array.from({length:h.w.localStorage.length},(_,i)=>{
    const key=h.w.localStorage.key(i);return[key,h.w.localStorage.getItem(key)];
  });
  const restored=boot(t,entries),state=restored.api.getState();
  assert.equal(state.task.model,'seedance-2.5');
  assert.equal(state.task.seconds,'30');assert.equal(state.task.vin,'30');
  assert.deepEqual(plain(state.plan),modelPlan);
  assert.equal(restored.w.document.getElementById('pay').value,'200');
  assert.equal(restored.w.document.getElementById('platformError').hidden,true);
  equal(restored.api.quote().calc.P,h.api.quote().calc.P);
});

test('architecture: reconciliation returns to the workbench and matrix choices focus generation parameters', t => {
  const h=boot(t),doc=h.w.document;
  h.input('model','seedance-2.5','change');
  h.click('#platform-comparison > summary');h.click('[data-tab="matrix"]');
  const headings=[...doc.querySelectorAll('#table th')].map(el=>el.textContent);
  for(const seconds of ['20','25','30'])assert.ok(headings.includes(seconds+'秒'));
  const thirty=[...doc.querySelectorAll('[data-matrix]')].find(el=>{
    const task=JSON.parse(el.dataset.matrix);return task.res==='1080p'&&task.seconds==='30';
  });
  assert.ok(thirty,'the full 30-second 1080p specification is available');
  const expected=h.api.quote(JSON.parse(thirty.dataset.matrix)).calc.P;
  thirty.focus();thirty.click();h.good();
  const selected=h.api.getState();
  assert.equal(selected.workspace,'theory');assert.equal(selected.task.model,'seedance-2.5');
  assert.equal(selected.task.res,'1080p');assert.equal(selected.task.seconds,'30');
  assert.equal(doc.getElementById('seconds').value,'30');
  assert.equal(doc.activeElement,doc.getElementById('model'),'loading a matrix cell focuses editable parameters');
  equal(h.api.quote().calc.P,expected);
  assert.equal(doc.getElementById('cost-c').closest('[hidden]'),null,'platform result remains on the same page');
  h.click('#open-actual');assert.equal(doc.activeElement.id,'actual-title');
  h.click('#back-theory');assert.equal(doc.activeElement.id,'generation-title');
});

test('models: selecting 2.5 uses its 30-second limit and exact 480p pixel map', t => {
  const h=boot(t),doc=h.w.document;
  assert.deepEqual([...doc.getElementById('model').options].map(option=>option.value).sort(),
    ['seedance-2.0','seedance-2.0-fast','seedance-2.5'].sort());
  h.input('model','seedance-2.5','change');
  h.setVideo(false);h.click('[data-ratio="16:9"]');h.click('[data-res="480p"]');
  assert.equal(doc.getElementById('seconds').max,'30');
  assert.equal(doc.getElementById('vin-slider').max,'30');
  assert.match(doc.getElementById('seconds-max-label').textContent,/30/);
  assert.match(doc.getElementById('pixels').textContent,/854\s*×\s*480/);
  h.input('seconds','30');
  const quote=h.api.quote();
  assert.equal(h.api.getState().task.model,'seedance-2.5');
  assert.equal(h.api.getState().task.seconds,'30');
  assert.deepEqual(plain(quote.calc.wh),[854,480]);
  equal(quote.calc.tokens,'288225');
  equal(quote.calc.rate,'70');
  equal(quote.calc.P,'20.17575');
  assert.equal(doc.getElementById('token-minimum').textContent,'不适用');
  assert.equal(doc.querySelector('[data-res="4k"]'),null,'2.5 has no unverified 4K option');
});

test('models: switching from 2.5 to Fast constrains unsupported values and tells the user', t => {
  const h=boot(t),doc=h.w.document;
  h.input('model','seedance-2.5','change');
  h.click('[data-res="1080p"]');
  h.input('seconds','30');h.input('vin-slider','30');
  h.input('model','seedance-2.0-fast','change');
  const task=h.api.getState().task;
  assert.equal(task.model,'seedance-2.0-fast');
  assert.equal(task.seconds,'15');assert.equal(task.vin,'15');
  assert.deepEqual([...doc.querySelectorAll('[data-res]')].map(el=>el.dataset.res),['480p','720p']);
  assert.ok(['480p','720p'].includes(task.res),'resolution must belong to the selected model');
  assert.equal(doc.getElementById('seconds').max,'15');assert.equal(doc.getElementById('vin-slider').max,'15');
  assert.equal(doc.querySelector('[data-res="1080p"]'),null);assert.equal(doc.querySelector('[data-res="4k"]'),null);
  assert.match(doc.getElementById('toast').textContent,/15/);
  assert.match(doc.getElementById('toast').textContent,/调整|改为|设为|切换|限制/);
  assert.equal(doc.getElementById('globalError').hidden,true);
  equal(h.api.quote().calc.rate,'22');
});

test('models: legacy drafts, saved tasks and observations explicitly migrate to standard 2.0', t => {
  const initial=boot(t),legacy=plain(initial.api.defaults());
  legacy.tasks=[{id:'legacy-standard-task',title:'旧标准模型任务',params:{...legacy.task},qty:'2'}];
  delete legacy.task.model;delete legacy.tasks[0].params.model;
  for(const observation of legacy.observations)delete observation.params.model;
  for(const reference of legacy.references)if(reference.params)delete reference.params.model;
  legacy.observations[2].params.vin='7.2';legacy.observations[2].usage='123456';
  const original=JSON.stringify(legacy);
  const h=boot(t,[['reelay_pricing_v9_official',original]]);
  const migrated=h.api.getState();
  assert.equal(migrated.task.model,'seedance-2.0');
  assert.equal(migrated.tasks[0].params.model,'seedance-2.0');
  assert.ok(migrated.observations.every(row=>row.params.model==='seedance-2.0'));
  assert.equal(migrated.observations[2].params.vin,'7.2','historical real duration is not rounded by model migration');
  assert.equal(migrated.observations[2].usage,'123456');
  assert.equal(migrated.observations[2].P,legacy.observations[2].P);
  assert.equal(JSON.stringify(legacy),original,'loading does not rewrite the source object');
  const persisted=JSON.parse(h.w.localStorage.getItem('reelay_pricing_v9_official'));
  assert.equal(persisted.task.model,'seedance-2.0');
  assert.ok(persisted.observations.every(row=>row.params.model==='seedance-2.0'));
  h.input('model','seedance-2.5','change');
  assert.ok(h.api.getState().observations.every(row=>row.params.model==='seedance-2.0'),'changing the active model does not relabel old bills');
});

test('models: task identity, minimum overrides and JSON exports stay scoped to their model', async t => {
  const h=boot(t);
  const common={res:'480p',ratio:'16:9',seconds:'4',video:true,vin:'2'};
  const standard={...common,model:'seedance-2.0'},fast={...common,model:'seedance-2.0-fast'},newer={...common,model:'seedance-2.5'};
  const variants=[standard,fast,newer];
  assert.equal(new Set(variants.map(task=>h.api.key(task))).size,3);
  assert.equal(new Set(variants.map(task=>h.api.minimumKey(task))).size,3);
  const fastBefore=h.api.quote(fast).calc.P;
  h.update(s=>{
    s.task=standard;
    s.rules.minima[h.api.minimumKey(standard)]={tokens:'1000000',kind:'manual',note:'仅标准 2.0 适用的协议门槛'};
    s.tasks=variants.map((params,i)=>({id:'model-task-'+i,title:'模型任务 '+i,params,qty:'1'}));
  });
  equal(h.api.quote(standard).calc.billedTokens,'1000000');
  equal(h.api.quote(fast).calc.P,fastBefore,'a standard-model override cannot leak into Fast');
  assert.equal(h.api.quote(fast).rule.kind,'official');
  h.input('model','seedance-2.5','change');
  h.click('#export');h.click('#export-json');
  const payload=JSON.parse(await h.downloads[0].blob.text());
  assert.equal(payload.state.task.model,'seedance-2.5');
  assert.deepEqual(payload.state.tasks.map(row=>row.params.model),variants.map(task=>task.model));
  assert.ok(payload.state.observations.every(row=>row.params.model==='seedance-2.0'));
  const reloaded=h.api.migrate(payload).value;
  assert.equal(reloaded.task.model,'seedance-2.5');
  assert.deepEqual(plain(reloaded.tasks).map(row=>row.params.model),variants.map(task=>task.model));
  h.api.setState(reloaded);h.good();
  equal(h.api.quote(fast).calc.P,fastBefore);
});

test('models: API usage is priced by each observation model, independently of the current selection', t => {
  const h=boot(t),doc=h.w.document;
  const cases=[['seedance-2.5','7'],['seedance-2.0','4.6'],['seedance-2.0-fast','3.7']];
  h.update(s=>{
    s.task={model:'seedance-2.0-fast',res:'480p',ratio:'16:9',seconds:'4',video:false,vin:'2'};
    s.observations=cases.map(([model],i)=>({
      id:'usage-model-'+i,title:'模型用量记录 '+i,
      params:{model,res:'480p',ratio:'16:9',seconds:'4',video:false,vin:'2'},
      P:'8',C:'5',N:'',usage:'100000',date:'2026-10-20',note:'API completion_tokens 原记录'
    }));
  });
  const selected=h.api.getState().task.model;
  for(const [i,[model,expected]] of cases.entries()){
    h.api.openDetails('actual','usage-model-'+i);h.good();
    const usage=[...doc.querySelectorAll('#drawer-body .detail-section')].find(section=>section.textContent.includes('completion_tokens ='));
    assert.ok(usage,'the actual usage reconciliation is present for '+model);
    assert.ok(usage.textContent.includes('¥'+E.fixed(expected,12)),model+' applies its own current list rate');
    assert.equal(h.api.getState().task.model,selected);
    const row=h.api.getState().observations[i];
    assert.equal(row.params.model,model);assert.equal(row.P,'8');assert.equal(row.C,'5');assert.equal(row.usage,'100000');
    h.click('#close-drawer');
  }
});

test('models: importing an invalid observed output duration cannot normalize it into an accepted auto value', t => {
  const h=boot(t),before=JSON.stringify(h.api.getState());
  for(const model of ['seedance-2.0','seedance-2.0-fast','seedance-2.5']){
    const invalid=plain(h.api.defaults());
    invalid.observations[0].params={model,res:'480p',ratio:'1:1',seconds:'-1',video:true,vin:'2'};
    const original=JSON.stringify(invalid);
    assert.equal(h.api.validState(invalid),false,model+' rejects a negative observed output duration');
    assert.throws(()=>h.api.migrate({format:'reelay.pricing.v9',state:invalid}),/方案参数无效/);
    assert.equal(JSON.stringify(invalid),original,'rejected import leaves its input untouched');
    assert.equal(JSON.stringify(h.api.getState()),before,'rejected import cannot replace the active draft');
  }
});

test('models: upgrading Oct19 standard rules preserves a current 2.5 manual rule in its own namespace', t => {
  const h=boot(t),legacy=plain(h.api.defaults()),previous=R.PREVIOUS_VERSIONS[0];
  const standard={model:'seedance-2.0',res:'480p',ratio:'1:1',seconds:'4',video:true,vin:'2'};
  const newer={...standard,model:'seedance-2.5'};
  legacy.rules.version=previous;
  legacy.rules.minima=Object.fromEntries(Object.entries(legacy.rules.minima).map(([key,row])=>[
    key.replace(R.VERSION,previous),row
  ]));
  const oldStandardKey=R.key(standard,previous),newerKey=h.api.minimumKey(newer);
  legacy.rules.minima[oldStandardKey]={tokens:'100000',kind:'manual',note:'旧标准版专用门槛'};
  legacy.rules.minima[newerKey]={tokens:'900000',kind:'manual',note:'当前 2.5 专用门槛'};
  const original=JSON.stringify(legacy),migrated=h.api.migrate({format:'reelay.pricing.v9',state:legacy}).value;
  assert.equal(migrated.rules.version,R.VERSION);
  assert.equal(migrated.rules.previousVersion,previous);
  assert.equal(migrated.rules.minima[R.key(standard)].tokens,'100000');
  assert.equal(migrated.rules.minima[R.key(standard)].note,'旧标准版专用门槛');
  assert.equal(migrated.rules.minima[newerKey].tokens,'900000');
  assert.equal(migrated.rules.minima[newerKey].note,'当前 2.5 专用门槛');
  assert.equal(migrated.rules.minima[newerKey].kind,'manual');
  assert.equal(Object.hasOwn(migrated.rules.minima,oldStandardKey),false);
  assert.equal(JSON.stringify(legacy),original,'mixed-version migration is non-destructive');
  h.api.setState(migrated);h.good();
  equal(h.api.quote(standard).calc.billedTokens,'100000');
  equal(h.api.quote(newer).calc.billedTokens,'900000');
});

test('architecture: an incomplete composer does not hide saved actual records or block their calculation details', t => {
  const h=boot(t),doc=h.w.document;
  h.update(s=>{s.observations[2].usage='100000';});
  const record=plain(h.api.getState().observations[2]),beforeRows=plain(h.api.getActualRows());
  const vin=doc.getElementById('vin');
  vin.value='';vin.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(h.api.getState().task.vin,'');
  assert.equal(doc.getElementById('globalError').hidden,false);
  doc.getElementById('open-actual').click();
  assert.equal(h.api.getState().workspace,'actual');
  assert.equal(doc.getElementById('actual-workspace').hidden,false);
  assert.equal(h.api.getState().task.vin,'','viewing records does not silently rewrite the incomplete draft');
  assert.deepEqual(plain(h.api.getActualRows()),beforeRows,'all historical reconciliation rows remain available');
  assert.ok(doc.getElementById('actual-table').textContent.includes(record.title));
  const button=[...doc.querySelectorAll('[data-observation]')].find(el=>el.dataset.observation===record.id);
  assert.ok(button);button.click();
  assert.equal(doc.getElementById('modal').hidden,false);
  const detail=doc.getElementById('drawer-body').textContent;
  assert.ok(detail.includes(record.title));assert.ok(detail.includes(record.P));assert.ok(detail.includes(record.C));
  assert.match(detail,/completion_tokens = 100000/);
  assert.doesNotMatch(detail,/NaN|Infinity|undefined/);
  assert.deepEqual(plain(h.api.getState().observations[2]),record);
  doc.getElementById('close-drawer').click();
  h.input('vin','2');h.good();
});

test('model calculation details link to the corresponding usage rules and return without mixing actual records', t => {
  const h=boot(t),doc=h.w.document;
  for(const model of ['seedance-2.0-fast','seedance-2.5']){
    h.input('model',model,'change');const spec=h.w.ReelayModels.get(model),task=h.api.getState().task;
    h.click('#details');
    const calculations=doc.getElementById('drawer-body').textContent;
    assert.match(doc.getElementById('drawer-title').textContent,/计算明细/);
    assert.ok(doc.getElementById('drawer-sub').textContent.includes(spec.label));assert.equal(doc.querySelector('[data-detail-mode]'),null);
    assert.equal(doc.querySelector('#usage-calculation, #usage-price-table'),null,'Token derivation is not repeated in pricing details');
    assert.equal(doc.querySelectorAll('.pricing-details > .detail-section').length,4);
    h.click('#detail-usage');
    assert.equal(doc.getElementById('drawer-title').textContent,'用量说明');
    const sourceLinks=[...doc.querySelectorAll('#drawer-body a')].map(el=>el.getAttribute('href'));
    for(const url of [spec.sources.minima.calculatorUrl,spec.sources.pricing.pageUrl,spec.sources.minima.url])assert.ok(sourceLinks.includes(url));
    const currentRate=doc.querySelector('#usage-price-table [aria-current="true"]');
    assert.equal(currentRate.closest('tr').dataset.model,model);assert.equal(currentRate.textContent,E.fixed(spec.rates[task.res][task.video?1:0],2));
    h.click('#back-pricing-details');assert.equal(doc.getElementById('drawer-body').textContent,calculations);
    h.click('#close-drawer');
  }
});


test('pricing basis exposes one independent input and restores its model-specific draft', t => {
  const h=boot(t),doc=h.w.document;
  const visible=()=>['discount-control','margin-control','manual-m-control'].filter(id=>!doc.getElementById(id).hidden);
  assert.deepEqual(visible(),['discount-control']);h.input('discount','8');
  h.click('[data-pricing-basis="margin"]');h.input('target-margin','20');assert.deepEqual(visible(),['margin-control']);
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');assert.deepEqual(visible(),['manual-m-control']);
  assert.equal(doc.getElementById('target-settings'),null);assert.equal(doc.getElementById('discount-picks').hidden,true);
  equal(h.api.pricing().usedM,'1.65');assert.equal(h.api.current().x.target,null);
  h.click('[data-pricing-basis="discount"]');assert.deepEqual(visible(),['discount-control']);assert.equal(doc.getElementById('discount').value,'8');
  equal(h.api.current().x.rawCash,h.api.current().x.target);
  h.click('[data-pricing-basis="margin"]');assert.equal(doc.getElementById('target-margin').value,'20');
  h.click('[data-pricing-basis="manual"]');equal(h.api.pricing().usedM,'1.65');
  assert.equal(doc.querySelectorAll('[data-pricing-basis][aria-pressed="true"]').length,1);
});


test('manual pricing has no hidden target or variance, including after reload and export', async t => {
  const h=boot(t),doc=h.w.document;
  h.input('discount','');assert.equal(doc.getElementById('platformError').hidden,false);
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');h.input('discount','n/a');h.input('target-margin','100');
  assert.equal(doc.getElementById('platformError').hidden,true);
  const expected=h.api.current().x;assert.equal(expected.target,null);assert.equal(expected.gap,null);equal(expected.raw,E.mul(expected.C,'16.5'));
  h.click('#details');const text=doc.getElementById('drawer-body').textContent;
  assert.match(text,/采用指定倍率 M = 1\.65/);assert.doesNotMatch(text,/参考目标|与目标差额如何拆分|理想 M/);
  h.click('#close-drawer');h.click('#open-actual');assert.ok(doc.querySelectorAll('#actual-table tbody tr').length);h.click('#back-theory');
  h.click('[data-tab="recharges"]');assert.equal(doc.getElementById('recharge-mode').value,'fixed');assert.ok(doc.querySelectorAll('#table tbody tr').length);
  h.input('recharge-mode','reprice','change');assert.equal(doc.querySelectorAll('#table tbody tr').length,0);
  h.input('recharge-mode','fixed','change');
  h.click('#export');h.click('#export-json');const exported=JSON.parse(await h.downloads.at(-1).blob.text());
  assert.equal(exported.state.plan.discount,'n/a');assert.equal(exported.state.plan.manualM,'1.65');
  const restored=boot(t,[['reelay_pricing_v9_official',JSON.stringify(exported.state)]]);
  equal(restored.api.current().x.N,expected.N);assert.equal(restored.api.current().x.target,null);
  h.click('#close-drawer');h.click('[data-pricing-basis="margin"]');assert.equal(doc.getElementById('platformError').hidden,false);
  h.input('target-margin','20');assert.equal(doc.getElementById('platformError').hidden,true);equal(h.api.current().x.rawCash,h.api.current().x.target);
});


test('unrounded policy loss remains visible even when point rounding makes the current task profitable',t=>{
  const h=boot(t),doc=h.w.document;
  h.input('purchase-discount','1');h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.53');
  const x=h.api.current().x;
  assert.ok(E.cmp(x.unroundedCashProfit,0)<0);assert.ok(E.cmp(x.profit,0)>0);equal(x.N,'3');
  const policy=doc.getElementById('plan-principle');assert.equal(policy.closest('details'),null);
  assert.match(policy.textContent,/−0\.5229%/);assert.ok(policy.querySelector('.loss'));
  assert.equal(doc.getElementById('policy-notice').hidden,false);assert.match(doc.getElementById('policy-notice').textContent,/取整前亏损/);
  assert.equal(doc.getElementById('pricing-loss').hidden,true);assert.equal(doc.getElementById('model-profit').classList.contains('loss'),false);
});

test('negative profit and margin remain readable in complete calculation details',t=>{
  const h=boot(t),doc=h.w.document;h.input('purchase-discount','10');h.setVideo(false);h.input('seconds','9');
  assert.ok(E.cmp(h.api.current().x.profit,0)<0);h.click('#details');
  assert.equal(doc.getElementById('drawer-title').textContent,'计算明细');
  assert.equal(doc.querySelectorAll('.pricing-details > .detail-section').length,4);
  assert.match(doc.getElementById('cash-equation').textContent,/−\d/);assert.doesNotMatch(doc.getElementById('drawer-body').textContent,/NaN|undefined|Infinity/);
  const before=JSON.stringify(h.api.getState()),original=h.api.current().x;
  h.input('unit-p','10');assert.match(doc.getElementById('unit-result').textContent,/假设采购成本/);
  h.input('unit-p','');assert.match(doc.getElementById('unit-result').textContent,/正数金额/);
  assert.equal(JSON.stringify(h.api.getState()),before);equal(h.api.current().x.N,original.N);
});

test('a task input error leaves a valid policy outcome visible while clearing only its task result',t=>{
  const h=boot(t),doc=h.w.document;h.input('discount','8');const outcome=doc.getElementById('plan-principle').textContent;
  const vin=doc.getElementById('vin');vin.value='';vin.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(doc.getElementById('globalError').hidden,false);assert.equal(doc.getElementById('plan-principle').textContent,outcome);
  for(const id of ['integer-points','actual-cash','cost-c','model-profit','model-margin'])assert.equal(doc.getElementById(id).textContent,'—');
  h.input('vin','2');assert.equal(doc.getElementById('globalError').hidden,true);
});

test('model overview compares each model policy and switches only the selected context',t=>{
  const h=boot(t),doc=h.w.document;
  h.input('discount','8');h.input('model','seedance-2.5','change');h.click('[data-pricing-basis="margin"]');h.input('target-margin','20');
  h.input('model','seedance-2.0-fast','change');h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');
  const before=plain(h.api.getState()),profiles=plain(before.plan.modelPricing);
  h.click('#model-pricing-overview');assert.equal(doc.getElementById('modal').classList.contains('centered'),true);
  const rows=[...doc.querySelectorAll('.pricing-overview-table tbody tr')];assert.equal(rows.length,3);
  for(const row of rows){const model=row.querySelector('[data-pricing-model]').dataset.pricingModel,p=h.api.pricingForModel(model);assert.ok(row.textContent.includes(E.trim(p.usedM,10)));}
  assert.deepEqual(plain(h.api.getState()),before,'opening comparison is read-only');
  h.click('[data-pricing-model="seedance-2.0"]');assert.equal(h.api.getState().task.model,'seedance-2.0');
  assert.equal(doc.getElementById('discount').value,'8');assert.equal(doc.getElementById('modal').hidden,true);assert.equal(doc.activeElement.id,'plan-title');
  assert.deepEqual(plain(h.api.getState().plan.modelPricing),profiles);
});

test('recharge comparison holds the current model multiplier live rather than a stale captured value',t=>{
  const h=boot(t),doc=h.w.document;
  assert.equal(h.api.getState().rechargeMode,'fixed');h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');h.click('[data-tab="recharges"]');
  const verify=M=>{const rows=h.api.getTheoryRows();assert.equal(rows.length,3);for(const row of rows)equal(row.M,M);assert.equal(new Set(rows.map(row=>row.N)).size,1,'gift points change cash equivalence, not the fixed points charge');return rows;};
  const rows=verify('1.65');assert.ok(E.cmp(rows[0].cash,rows[2].cash)>0,'more gift points reduce cash-equivalent price');
  h.input('manual-m','1.8');verify('1.8');
  h.input('model','seedance-2.5','change');verify('1.538');
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','2');verify('2');
  h.input('model','seedance-2.0','change');verify('1.8');
  assert.equal(doc.getElementById('recharge-mode').value,'fixed');
  const old=plain(h.api.getState());old.frozenM={n:'999',d:'1'};
  const restored=boot(t,[['reelay_pricing_v9_official',JSON.stringify(old)]]);
  assert.equal(restored.api.getState().frozenM,null);for(const row of restored.api.getTheoryRows())equal(row.M,'1.8');
});

test('explicit recharge repricing preserves the chosen target and its saved multiplier precision',t=>{
  const h=boot(t),doc=h.w.document;h.input('discount','8');h.click('#plan-settings');h.click('#plan-limit-precision');h.input('plan-digits','2','change');h.input('plan-round','truncate','change');h.click('#save-plan');
  h.click('[data-tab="recharges"]');h.input('recharge-mode','reprice','change');
  const rows=h.api.getTheoryRows();assert.equal(rows.length,3);assert.ok(new Set(rows.map(row=>row.M)).size>1);
  for(const row of rows){const p=E.plan({pay:row.pay,total:row.total,q:'0.735',discount:'8'});equal(row.M,E.decimalString(p.M,2,'truncate'));equal(row.target,E.mul(row.P,'0.8'));}
  h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');
  assert.equal(doc.querySelectorAll('#table tbody tr').length,0,'manual rules do not silently borrow an inactive target');
  assert.match(doc.getElementById('table').textContent,/指定倍率/);
  h.input('recharge-mode','fixed','change');assert.equal(h.api.getTheoryRows().length,3);
});

test('automatic precision survives a manual basis round-trip and remains model-specific',t=>{
  const h=boot(t),doc=h.w.document;h.input('discount','8');h.click('#plan-settings');h.click('#plan-limit-precision');h.input('plan-digits','3','change');h.input('plan-round','truncate','change');h.click('#save-plan');
  equal(h.api.pricing().usedM,'1.674');h.click('[data-pricing-basis="manual"]');h.input('manual-m','1.65');
  h.input('model','seedance-2.5','change');assert.equal(h.api.getState().plan.mode,'ideal');
  h.input('model','seedance-2.0','change');equal(h.api.pricing().usedM,'1.65');
  h.click('[data-pricing-basis="discount"]');assert.equal(h.api.getState().plan.mode,'saved');equal(h.api.pricing().usedM,'1.674');
  h.click('#plan-settings');assert.equal(doc.getElementById('plan-limit-precision').checked,true);assert.equal(doc.getElementById('plan-digits').value,'3');assert.equal(doc.getElementById('plan-round').value,'truncate');
});


test('applying a discount comparison row produces its displayed charge under the chosen precision',t=>{
  const h=boot(t),doc=h.w.document;
  h.click('#plan-settings');h.click('#plan-limit-precision');h.input('plan-digits','2','change');h.input('plan-round','truncate','change');h.click('#save-plan');
  h.click('[data-tab="discounts"]');const row=h.api.getTheoryRows().find(row=>row.scenario==='8折');assert.ok(row);
  const expected=E.plan({pay:'100',total:'1538',q:'0.735',discount:'8'});equal(row.M,E.decimalString(expected.M,2,'truncate'));
  h.click('#table [data-discount="8"]');equal(h.api.current().x.N,row.N);assert.equal(E.decimalString(h.api.current().x.cash,20),row.cash);equal(h.api.pricing().usedM,row.M);
  assert.equal(doc.getElementById('discount').value,'8');assert.equal(h.api.getState().plan.mode,'saved');
});
