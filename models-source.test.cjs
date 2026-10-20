'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const S=require('./models-source.cjs');
const P=require('./source-rules.cjs');
const E=require('./engine.js');
const evidence=S.readEvidence(),snapshot=S.validateEvidence(evidence);
const clone=()=>structuredClone(evidence);
function changeTable(data,res,change) {
  const table=P.parseClipboard(data.clipboards[res]),outer=JSON.parse(data.clipboards[res]);
  change(table);
  outer[0].entries.find(e=>e.mimeType==='text/bitable').text=JSON.stringify(table)
    .replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  data.clipboards[res]=JSON.stringify(outer);
}
function changeCalculator(data,change) {
  const c=JSON.parse(data.calculatorText);change(c);data.calculatorText=JSON.stringify(c);
}
const cell=(table,row,id)=>table.body[row][table.header.findIndex(f=>f.id===id)];

test('independent 2.5 source covers 486 specifications and audits all 339 source rows',()=>{
  assert.equal(snapshot.model,'seedance-2.5');
  assert.equal(snapshot.sourceTable,'tblheIYDXXwYM43b');
  assert.equal(snapshot.sourceRows,339);assert.equal(snapshot.uniqueSourceRows,324);
  assert.equal(snapshot.specificationCount,486);assert.equal(snapshot.formulaEvaluationCount,9831);
  assert.deepEqual(snapshot.rowsByResolution,{'480p':123,'720p':108,'1080p':108});
  assert.deepEqual(snapshot.uniqueRowsByResolution,{'480p':108,'720p':108,'1080p':108});
  assert.deepEqual(snapshot.inputSeconds,Array.from({length:29},(_,i)=>String(i+2)));
  assert.deepEqual(snapshot.outputSeconds,Array.from({length:27},(_,i)=>String(i+4)));
  for(const entry of Object.values(snapshot.entries)) {
    assert.equal(E.fixed(entry.tokens,0),entry.displayedTokens);
    assert.equal(entry.sourceTable,'tblheIYDXXwYM43b');
    assert.ok(entry.sourceFile.startsWith('evidence/2026-10-20/models/'));
  }
});

test('2.5 480p dimensions and fractional prices agree with independent official anchors',()=>{
  assert.deepEqual(snapshot.dimensions['480p']['16:9'],[854,480]);
  assert.deepEqual(snapshot.dimensions['480p']['9:16'],[480,854]);
  assert.notDeepEqual(snapshot.dimensions['480p']['16:9'],E.DIMS['480p']['16:9']);
  assert.equal(snapshot.entries['480p|16:9|4'].tokens,'67252.5');
  assert.equal(snapshot.entries['480p|16:9|4'].displayedTokens,'67253');
  assert.equal(snapshot.entries['480p|16:9|5'].tokens,'86467.5');
  assert.equal(P.exactDecimal(E.div(E.mul('86467.5','42'),'1000000')),'3.631635');
  assert.equal(E.fixed(E.div(E.mul('86467.5','42'),'1000000'),2),'3.63');
  assert.equal(snapshot.entries['720p|4:3|4'].tokens,'152152.875');
  assert.equal(snapshot.entries['1080p|21:9|30'].tokens,'2445557.8125');
  assert.equal(snapshot.entries['480p|21:9|30'].tokens,'502200');
  assert.equal(snapshot.entries['4k|16:9|4'],undefined);
});

test('15 repeated source rows are consistent, retained in provenance and counted only once',()=>{
  assert.equal(snapshot.duplicateRows.length,15);
  for(let s=16;s<=30;s++) {
    const entry=snapshot.entries[`480p|21:9|${s}`],dupe=snapshot.duplicateRows.find(x=>x.seconds===String(s));
    assert.equal(dupe.resolution,'480p');
    assert.equal(dupe.ratio,'21:9');
    assert.equal(dupe.tokens,entry.tokens);
    assert.deepEqual(entry.sourceRows,[dupe.firstRow,dupe.repeatedRow]);
    assert.equal(dupe.repeatedRow-dupe.firstRow,15);
  }
  assert.equal(snapshot.entries['480p|21:9|15'].sourceRows.length,1);
});

test('source formula evaluation matches lookup plus maximum for all 14094 supported video configurations',()=>{
  const f=P.compileFormula(snapshot.sourceFormula);
  let cases=0;
  for(const [res,ratios] of Object.entries(snapshot.dimensions))for(const [ratio,wh] of Object.entries(ratios)) {
    for(const seconds of snapshot.outputSeconds)for(const input of snapshot.inputSeconds) {
      const source=f.evaluate({'时长-输入视频（秒）':input,'时长-输出视频（秒）':seconds,'长边（像素）':String(Math.max(...wh)),'短边（像素）':String(Math.min(...wh)),'帧率':'24'});
      const base=E.div(E.mul(E.mul(E.add(seconds,input),String(wh[0]*wh[1])),'24'),'1024');
      const floor=E.dec(snapshot.entries[`${res}|${ratio}|${seconds}`].tokens),max=E.cmp(base,floor)>0?base:floor;
      assert.equal(E.cmp(source,max),0,`${res}/${ratio}/${seconds}/${input}`);cases++;
    }
  }
  assert.equal(cases,14094);
});

test('source formula keeps no-video separate and handles exact input breakpoints',()=>{
  const f=P.compileFormula(snapshot.sourceFormula);
  const context={'时长-输出视频（秒）':'5','长边（像素）':'854','短边（像素）':'480','帧率':'24'};
  for(const [input,expected] of [['0','48037.5'],['2','86467.5'],['4','86467.5'],['4.0001','86468.46075'],['30','336262.5']]) {
    assert.equal(P.exactDecimal(f.evaluate({...context,'时长-输入视频（秒）':input})),expected);
  }
});

test('2.0 table, incorrect view and unsupported model cannot enter the 2.5 source path',()=>{
  assert.throws(()=>S.validateEvidence(evidence,{model:'seedance-2.0'}),/only Seedance 2.5/);
  for(const [property,value] of [['tableId','tblmNCuMjADrXtDf'],['viewId','vewQ2CK6dj']]) {
    const data=clone();changeTable(data,'1080p',t=>{t[property]=value;});
    assert.throws(()=>S.validateEvidence(data),/Wrong 2.5 table\/view/);
  }
  const data=clone();changeTable(data,'720p',t=>{cell(t,0,'fldMgWWXcK').data=[{text:'seedance-2.0-fast'}];});
  assert.throws(()=>S.validateEvidence(data),/another model/);
});

test('missing rows, duplicate conflicts and unexpected extra records fail validation',()=>{
  let data=clone();changeTable(data,'480p',t=>t.body.pop());
  assert.throws(()=>S.validateEvidence(data),/row count/);
  data=clone();changeTable(data,'480p',t=>{cell(t,108,'fld0p1bMiB').data[0].text='271189';});
  assert.throws(()=>S.validateEvidence(data),/display mismatch|Conflicting duplicate/);
  data=clone();changeTable(data,'480p',t=>{t.body[108]=structuredClone(t.body[0]);});
  assert.throws(()=>S.validateEvidence(data),/Unexpected duplicate/);
  data=clone();changeTable(data,'720p',t=>{t.body[1]=structuredClone(t.body[0]);});
  assert.throws(()=>S.validateEvidence(data),/Unexpected duplicate/);
});

test('formula, precision, dimensions and supported-duration source corruption fail closed',()=>{
  let data=clone();changeTable(data,'480p',t=>{t.header.find(f=>f.id==='fld0p1bMiB').property.formula+=' + 0.0001';});
  assert.throws(()=>S.validateEvidence(data),/source formula changed/);
  data=clone();changeTable(data,'480p',t=>{cell(t,0,'fld7gTzIBX').data[0].text='864';cell(t,0,'fldGXb46uO').data[0].text='496';});
  assert.throws(()=>S.validateEvidence(data),/official dimensions/);
  data=clone();changeTable(data,'1080p',t=>{cell(t,0,'fldcNvCwvx').data[0].text='31';});
  assert.throws(()=>S.validateEvidence(data),/duration unsupported/);
  data=clone();changeTable(data,'720p',t=>{t.header.find(f=>f.id==='fld0p1bMiB').property.formatter='0.00';});
  assert.throws(()=>S.validateEvidence(data),/Wrong source token field/);
});

test('calculator fields must match pinned raw HTML and preserve model, lookup, base and max semantics',()=>{
  for(const id of ['fldxqQNUkO','fldHsYwIgu','fldcNvCwvx','fldbHEcb1g','fld0p1bMiB','fld9gudF3m']) {
    const data=clone();changeCalculator(data,c=>{
      const f=c.fields.find(x=>x.id===id);
      if(f.formula)f.formula=f.formula.replace('MAX','MIN')+'+1';
      else f.options[0].name='unsupported';
    });
    assert.throws(()=>S.validateEvidence(data),/Captured calculator field/);
  }
  const data=clone();data.html+='\n';
  assert.throws(()=>S.validateEvidence(data),/HTML capture hash mismatch/);
});

test('pixel mapping is linked to captured API document rather than a copied 2.0 map',()=>{
  const data=clone();data.createDocument=data.createDocument.replace('854×480','864×496');
  assert.throws(()=>S.validateEvidence(data),/Creation API source\/hash mismatch/);
  assert.deepEqual(S.parseDimensions(evidence.createDocument),snapshot.dimensions);
});

test('generation is deterministic, artifacts are current, and browser/CommonJS shapes agree',()=>{
  const a=S.generate({write:false}),b=S.generate({write:false});
  assert.equal(a.artifact,b.artifact);
  assert.equal(a.manifestText,b.manifestText);
  assert.doesNotThrow(()=>S.generate({check:true}));
  const context={window:{},module:{exports:{}}};vm.runInNewContext(a.artifact,context);
  assert.equal(context.window.ReelayModelMinimumSnapshot.model,'seedance-2.5');
  assert.equal(context.window.ReelayModelMinimumSnapshot,context.module.exports);
  assert.equal(Object.keys(context.module.exports.entries).length,486);
});
