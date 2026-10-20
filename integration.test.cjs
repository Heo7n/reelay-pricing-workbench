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
  for (const file of ['engine.js', 'generated-minima.js', 'data.js', 'app.js']) w.eval(read(file));
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
  good();
  return {w,api,downloads,good,update,input,click};
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
  h.input('target-mode','margin','change');
  h.input('target-margin','30');
  equal(h.api.pricing().d,E.div('0.6','0.7'));
  h.input('purchase-discount','7.35');
  equal(h.api.pricing().d,'1.05');
  equal(h.api.current().x.target,E.mul(h.api.current().x.P,'1.05'));
  assert.match(h.w.document.getElementById('plan-principle').textContent,/高于刊例/);
  h.api.openDetails('theory');
  const detail=h.w.document.getElementById('drawer-body').textContent;
  assert.match(detail,/采购成本 ÷ \(1 − 目标毛利率\)/);
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
  old.plan.mode='manual';old.plan.manualM='1.65';old.plan.q='1';old.plan.discount='10';
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
  h.input('pricing-mode','manual','change');
  h.input('manual-m','1.8');
  equal(h.api.pricing().usedM,'1.8');
  h.input('purchase-discount','7.35');
  h.input('pay','200');
  equal(h.api.pricing().usedM,'1.8','manual mode survives changes to procurement and recharge');
  h.input('purchase-discount','10');
  h.input('pay','100');
  h.input('pricing-mode','manual','change');
  h.input('manual-m','1.65');
  assert.equal(h.api.getState().plan.mode,'manual');
  equal(h.api.pricing().usedM,'1.65');
  assert.equal(h.w.document.getElementById('manual-m').value,'1.65');
  equal(h.api.pricing().q,'1');
  equal(h.api.pricing().d,'1');
  const p=h.api.pricing(), x=h.api.current().x;
  equal(E.div(x.rawCash,x.P),E.div('16.5','15.38'));
  equal(E.mul(E.div(E.sub(x.rawCash,x.C),x.rawCash),100),E.div('1120','165'));
  equal(x.raw,E.mul(x.C,'16.5'));
  equal(x.N,E.ceil(x.raw));
  assert.match(h.w.document.getElementById('target-context').textContent,/对照目标/);
  const principle=h.w.document.getElementById('plan-principle').textContent;
  assert.match(principle,/10\.7282/,'manual mode reports its actual unrounded list-price equivalent');
  assert.match(principle,/6\.787[89]/,'manual mode reports its actual unrounded margin rather than the 0% target');
  h.input('pricing-mode','ideal','change');
  equal(h.api.pricing().usedM,'1.538');
  equal(h.api.current().x.rawCash,h.api.current().x.target);
  assert.doesNotMatch(h.w.document.getElementById('target-context').textContent,/对照目标/);
});

test('typing a multiplier in the advanced drawer selects manual mode before saving', t => {
  const h=boot(t);
  h.input('purchase-discount','10');
  h.input('discount','10');
  h.click('#plan-settings');
  assert.equal(h.w.document.getElementById('plan-mode').value,'ideal');
  h.input('plan-manual','1.65');
  assert.equal(h.w.document.getElementById('plan-mode').value,'manual');
  assert.match(h.w.document.getElementById('plan-preview').textContent,/1\.65/);
  h.click('#save-plan');
  assert.equal(h.api.getState().plan.mode,'manual');
  equal(h.api.pricing().usedM,'1.65');
  assert.equal(h.w.document.getElementById('pricing-mode').value,'manual');
});

test('manual mode and multiplier survive local storage reload and exported JSON round-trip', async t => {
  const h=boot(t);
  h.input('purchase-discount','10');
  h.input('discount','10');
  h.input('pricing-mode','manual','change');
  h.input('manual-m','1.65');
  const entries=Array.from({length:h.w.localStorage.length},(_,i)=>{
    const key=h.w.localStorage.key(i); return [key,h.w.localStorage.getItem(key)];
  });
  assert.ok(entries.length,'the edited plan is persisted');
  const reloaded=boot(t,entries);
  assert.equal(reloaded.api.getState().plan.mode,'manual');
  equal(reloaded.api.pricing().usedM,'1.65');
  assert.equal(reloaded.w.document.getElementById('pricing-mode').value,'manual');
  h.click('#export'); h.click('#export-json');
  const payload=JSON.parse(await h.downloads[0].blob.text());
  assert.equal(payload.state.plan.mode,'manual');
  assert.equal(payload.state.plan.manualM,'1.65');
  const roundtrip=h.api.migrate(payload).value;
  reloaded.api.setState(roundtrip); reloaded.good();
  equal(reloaded.api.pricing().usedM,'1.65');
  equal(reloaded.api.pricing().q,'1');
  equal(reloaded.api.pricing().d,'1');
  reloaded.input('pricing-mode','ideal','change');
  equal(reloaded.api.pricing().usedM,'1.538');
});

test('task controls and compact input duration update live without changing pricing', t => {
  const h=boot(t), doc=h.w.document;
  const fields=[...doc.querySelectorAll('.fields-layout > .field')];
  assert.deepEqual(fields.map(field=>field.dataset.field),['video','resolution','ratio','seconds']);
  const videoDetail=doc.getElementById('video-detail');
  assert.ok(fields[0].contains(videoDetail),'reference duration belongs inside the video-input field');
  assert.equal(doc.getElementById('video-options').nextElementSibling,videoDetail,'reference duration appears immediately after the video-input choices');
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
  assert.equal(slider.nextElementSibling.contains(vin),true);
  assert.equal(doc.getElementById('vin-scrubber'),null);
  assert.equal(doc.getElementById('vin-editor'),null);
  h.input('pricing-mode','manual','change');
  h.input('manual-m','1.65');
  h.click('[data-video="true"]');
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
  h.click('[data-video="false"]');
  assert.equal(doc.getElementById('video-detail').hidden,true);
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

test('compact reference slider and number stay synchronized across edits, presets and saved state', t => {
  const h=boot(t),doc=h.w.document,slider=doc.getElementById('vin-slider'),input=doc.getElementById('vin');
  const key=key=>{input.dispatchEvent(new h.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));h.good();};
  const value=expected=>{
    assert.equal(h.api.getState().task.vin,String(expected));
    assert.equal(input.value,String(expected));assert.equal(slider.value,String(expected));
    assert.equal(slider.getAttribute('aria-valuetext'),expected+' 秒');
    const task=h.api.getState().task;
    equal(h.api.current().x.P,E.estimate(task,task.video?R.officialMinimum(task).tokens:'').P);
    equal(h.api.pricing().usedM,'1.65');
  };
  h.input('pricing-mode','manual','change');
  h.input('manual-m','1.65');
  for(const seconds of [2,8,15,3]){h.input('vin-slider',String(seconds));value(seconds);}
  assert.equal(doc.getElementById('coverage-note').hidden,true,'3-second input exactly reaches the 4-second output threshold');
  h.input('vin-slider','2');value(2);
  assert.equal(doc.getElementById('coverage-note').hidden,false);
  input.focus();h.input('vin','7.2');value(8);key('Escape');value(2);
  input.focus();h.input('vin','9.2');value(10);key('Enter');value(10);
  input.focus();input.value='';input.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(doc.getElementById('globalError').hidden,false);
  input.blur();h.good();value(10);
  h.click('[data-example="video-max"]');value(15);
  assert.equal(slider.style.getPropertyValue('--range-progress'),'100%');
  h.click('[data-example="video-min"]');value(2);
  assert.equal(slider.style.getPropertyValue('--range-progress'),'0%');
  h.click('[data-video="false"]');
  assert.equal(doc.getElementById('video-detail').hidden,true);
  assert.equal(slider.disabled,true);assert.equal(input.disabled,true);
  h.click('[data-video="true"]');
  assert.equal(doc.getElementById('video-detail').hidden,false);
  assert.equal(slider.disabled,false);assert.equal(input.disabled,false);value(2);
  h.input('vin-slider','13');value(13);
  const saved=h.w.localStorage.getItem('reelay_pricing_v9_official');
  const reloaded=boot(t,[['reelay_pricing_v9_official',saved]]);
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
  original.plan.mode='manual';original.plan.manualM='1.65';
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
      assert.deepEqual(plain(imported.value.plan),original.plan);
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

test('minimum-usage notice appears only when a fixed task actually triggers its threshold', t => {
  const h=boot(t), doc=h.w.document, note=doc.getElementById('coverage-note');
  equal(h.api.current().calc.tokens,'57600');
  equal(h.api.current().calc.billedTokens,'67200');
  assert.equal(note.hidden,false);
  assert.match(note.textContent,/触发最低用量/);
  assert.equal(doc.getElementById('token-estimate').textContent,'57,600');
  assert.equal(doc.getElementById('token-minimum').textContent,'67,200');
  assert.equal(doc.getElementById('token-minimum-adopted').hidden,false);
  h.input('vin','3');
  equal(h.api.current().calc.tokens,'67200');
  assert.equal(note.hidden,true,'equality with the threshold adds no billable usage');
  h.input('vin','4');
  equal(h.api.current().calc.tokens,'76800');
  assert.equal(note.hidden,true,'usage above the threshold needs no minimum-usage notice');
  h.click('[data-video="false"]');
  assert.equal(note.hidden,true);
  h.update(s=>{
    s.task={res:'480p',ratio:'1:1',seconds:'4',video:true,vin:'4'};
    s.rules.minima[R.key(s.task)]={tokens:'100000',note:'人工门槛边界测试',kind:'manual'};
  });
  equal(h.api.current().calc.tokens,'76800');
  equal(h.api.current().calc.billedTokens,'100000');
  assert.equal(note.hidden,false);
  assert.match(note.textContent,/触发最低用量/);
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
    if(expected)assert.equal(chosen[0].id,'token-'+expected+'-metric');
    return chosen[0].querySelector('dd').textContent;
  };
  assert.equal(doc.getElementById('token-applied'),null);
  assert.equal(doc.querySelectorAll('.usage-token').length,2);
  const explanation=()=>doc.getElementById('usage-explanation');
  assert.equal(doc.getElementById('usage-details'),null,'the inline disclosure is replaced by a dialog');
  assert.equal(doc.getElementById('modal').hidden,true);
  h.click('#usage-help');
  assert.equal(doc.getElementById('usage-method').open,false,'formula provenance is secondary to the official explanation');
  assert.equal(shown('token-rate'),'28');
  assert.equal(shown('token-estimate'),'57,600');
  assert.equal(shown('token-minimum'),'67,200');
  assert.equal(adopted('minimum'),'67,200');
  assert.match(explanation().textContent,/usage.completion_tokens/);
  assert.match(explanation().textContent,/不再补一次门槛/);
  assert.match(explanation().textContent,/不相加/);
  doc.getElementById('usage-method').open=true;
  h.update(s=>{s.task={res:'1080p',ratio:'16:9',seconds:'5',video:true,vin:'2'};});
  assert.equal(doc.getElementById('usage-method').open,true,'updates retain the formula disclosure state');
  assert.equal(shown('token-rate'),'31');
  assert.equal(shown('token-estimate'),'340,200');
  assert.equal(shown('token-minimum'),'437,400');
  assert.equal(adopted('minimum'),'437,400');
  equal(h.api.current().x.P,'13.5594');
  assert.equal(shown('cost-p'),'¥13.559400');
  assert.match(explanation().textContent,/13.5594/);
  h.input('purchase-discount','10');
  assert.equal(shown('token-rate'),'31');assert.equal(adopted('minimum'),'437,400');
  equal(h.api.current().x.C,'13.5594');
  h.input('vin-slider','4');
  assert.equal(shown('token-estimate'),shown('token-minimum'));
  assert.equal(adopted('estimate'),'437,400','equal values keep the base estimate, without suggesting extra usage');
  assert.equal(doc.getElementById('coverage-note').hidden,true);
  h.input('vin-slider','5');
  assert.equal(shown('token-estimate'),'486,000');assert.equal(adopted('estimate'),'486,000');
  assert.equal(doc.getElementById('coverage-note').hidden,true);
  h.click('[data-video="false"]');
  assert.equal(shown('token-rate'),'51');assert.equal(shown('token-minimum'),'不适用');
  assert.equal(shown('token-estimate'),'243,000');assert.equal(adopted('estimate'),'243,000');
  assert.match(explanation().textContent,/无视频输入，不应用最低用量/);
  let fractional;
  for(const res of Object.keys(E.DIMS))for(const ratio of Object.keys(E.DIMS[res])){
    const task={res,ratio,seconds:'5',video:true,vin:'2'};
    if(E.estimate(task,R.officialMinimum(task).tokens).tokens.d!==1n){fractional=task;break;}
  }
  assert.ok(fractional,'there are official mappings with fractional token estimates');
  h.update(s=>{s.task=fractional;});
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
  assert.equal(doc.getElementById('coverage-note').hidden,false,'exact rule comparison is not rounded for display');
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
  for(const id of ['token-rate','token-estimate','token-minimum'])assert.equal(shown(id),'—');
  assert.equal(explanation(),null);
  assert.match(doc.getElementById('drawer-body').textContent,/当前输入无效/);
  assert.equal(doc.querySelectorAll('.usage-token.is-adopted').length,0);
  assert.equal(doc.querySelectorAll('.usage-adopted:not([hidden])').length,0);
  input.blur();h.good();assert.equal(doc.getElementById('usage-summary').hidden,false);adopted('estimate');
});

test('usage explanation opens as a centered, sourced dialog and restores focus when dismissed', t => {
  const h=boot(t),doc=h.w.document,help=doc.getElementById('usage-help'),modal=doc.getElementById('modal');
  assert.equal(doc.getElementById('cost-badge').textContent,'参数预估');
  assert.equal(doc.getElementById('token-minimum-label').textContent,'最低 Token 估算');
  assert.equal(help.closest('.usage-rate-line').contains(doc.getElementById('token-rate')),true);
  assert.equal(help.getAttribute('aria-haspopup'),'dialog');
  const before=JSON.stringify(h.api.getState());
  help.focus();h.click('#usage-help');
  assert.equal(modal.hidden,false);assert.equal(modal.classList.contains('centered'),true);
  const dialog=doc.getElementById('drawer');
  assert.equal(dialog.getAttribute('role'),'dialog');assert.equal(dialog.getAttribute('aria-modal'),'true');
  assert.equal(doc.getElementById(dialog.getAttribute('aria-labelledby')).textContent,'用量与计价说明');
  assert.ok(doc.getElementById(dialog.getAttribute('aria-describedby')));
  assert.equal(doc.activeElement.id,'close-drawer');
  const body=doc.getElementById('drawer-body');
  assert.match(body.textContent,/最低 Token 用量也是估算值/);
  assert.match(body.textContent,/官方如何说明最低用量/);
  assert.match(body.textContent,/不是模型价格正文直接列出的公式/);
  assert.match(body.textContent,/2026-10-20/);assert.match(body.textContent,/原式、四个视图的复制数据和官方计算器查表公式已保存/);
  assert.doesNotMatch(body.textContent,/本次未重新取得|沿用.*快照/);
  assert.ok(body.querySelector('a[href="'+R.sources.minima.calculatorUrl+'"]'));
  assert.ok(body.querySelector('a[href="'+R.sources.pricing.url+'"]'));
  assert.ok(body.querySelector('a[href="'+R.sources.usage.url+'"]'));
  assert.match(body.querySelector('.source-formula').textContent,/MAX\(ROUNDUP/);
  assert.equal(doc.getElementById('usage-method').open,false);
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
  h.click('#show-formula');assert.equal(modal.classList.contains('centered'),false,'other calculation views retain their drawer layout');
  h.click('#close-drawer');
  const vin=doc.getElementById('vin');vin.focus();vin.value='';vin.dispatchEvent(new h.w.Event('input',{bubbles:true}));
  assert.equal(help.disabled,true);vin.blur();h.good();assert.equal(help.disabled,false);
});

test('four quick configurations are true official token extrema over all supported specifications', t => {
  const h=boot(t), selectors=['none-min','none-max','video-min','video-max'];
  assert.deepEqual([...h.w.document.querySelectorAll('[data-example]')].map(button=>button.dataset.example),selectors);
  h.input('pricing-mode','manual','change');
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
    h.click('[data-example="'+name+'"]');
    const task=h.api.getState().task, expected=extrema(video,vin);
    assert.equal(task.video,video,name+' sets input mode');
    if(video)equal(task.vin,String(vin),name+' uses the endpoint reference duration');
    equal(h.api.current().calc.billedTokens,highest?expected.maximum:expected.minimum,name+' reaches the global official token extreme');
    equal(h.api.pricing().usedM,'1.65',name+' does not mutate the pricing multiplier');
    assert.equal(h.api.getState().plan.mode,'manual');
  }
});
