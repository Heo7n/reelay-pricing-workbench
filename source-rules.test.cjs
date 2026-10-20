'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const R=require('./source-rules.cjs');
const E=require('./engine.js');
const evidence=R.readEvidence();
const snapshot=R.validateEvidence(evidence);
const clone=()=>structuredClone(evidence);
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const result=(formula,fields={})=>R.exactDecimal(R.compileFormula(formula).evaluate(fields));
function changeClipboard(data,res,change) {
  const outer=JSON.parse(data.clipboards[res]);
  const payload=outer[0].entries.find(e=>e.mimeType==='text/bitable');
  const table=R.parseClipboard(data.clipboards[res]);change(table);
  payload.text=JSON.stringify(table).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  data.clipboards[res]=JSON.stringify(outer);
}
function changeCalculator(data,change) {const c=JSON.parse(data.calculatorText);change(c);data.calculatorText=JSON.stringify(c);}
const field=(table,id)=>table.header.find(x=>x.id===id);
const cell=(table,index,id)=>table.body[index][table.header.findIndex(x=>x.id===id)];

test('capture produces 192 source rows, 288 complete specifications and 4032 formula evaluations',()=>{
  assert.equal(snapshot.model,'seedance-2.0');
  assert.equal(snapshot.sourceRows,192);assert.equal(snapshot.specificationCount,288);assert.equal(snapshot.formulaEvaluationCount,4032);
  assert.equal(Object.keys(snapshot.entries).length,288);
  assert.deepEqual(snapshot.inputSeconds,Array.from({length:14},(_,i)=>String(i+2)));
  assert.deepEqual(snapshot.rowsByResolution,{'480p':48,'720p':48,'1080p':48,'4k':48});
  for(const entry of Object.values(snapshot.entries)) {
    assert.equal(E.fixed(E.dec(entry.tokens),0),entry.displayedTokens);
    assert.ok(entry.sourceFile.startsWith('evidence/2026-10-20/minimum-'));
    assert.equal(entry.sourceTable,'tblmNCuMjADrXtDf');assert.equal(entry.sourceField,'fld0p1bMiB');
  }
});

test('independent precision anchors retain fractions hidden by zero-decimal source display',()=>{
  assert.equal(snapshot.entries['480p|1:1|4'].tokens,'67200');
  assert.equal(snapshot.entries['720p|4:3|4'].tokens,'152152.875');
  assert.equal(snapshot.entries['720p|4:3|4'].displayedTokens,'152153');
  assert.equal(snapshot.entries['1080p|21:9|15'].tokens,'1222778.90625');
  assert.equal(snapshot.entries['1080p|21:9|15'].displayedTokens,'1222779');
  assert.equal(snapshot.entries['4k|16:9|4'].tokens,snapshot.entries['4k|9:16|4'].tokens);
  assert.deepEqual(snapshot.entries['480p|1:1|4'].minimizingInputSeconds,['2','3']);
  assert.deepEqual(snapshot.entries['1080p|21:9|15'].minimizingInputSeconds,Array.from({length:9},(_,i)=>String(i+2)));
});

test('captured full formula obeys its positive-input conditional and exact breakpoint',()=>{
  const formula=R.compileFormula(snapshot.sourceFormula);
  const context={'时长-输出视频（秒）':'4','长边（像素）':'640','短边（像素）':'640','帧率':'24'};
  for(const [input,expected] of [['0','38400'],['2','67200'],['3','67200'],['3.0001','67200.96'],['4','76800']]) {
    assert.equal(R.exactDecimal(formula.evaluate({...context,'时长-输入视频（秒）':input})),expected);
  }
});

test('restricted expression parser uses exact arithmetic, precedence and lazy IF',()=>{
  assert.equal(result('0.1+0.2'),'0.3');
  assert.equal(result('1+2*3'),'7');assert.equal(result('(1+2)*3'),'9');assert.equal(result('10-3-2'),'5');
  assert.equal(result('IF(2>=2,MAX(1,3,2),1/0)'),'3');assert.equal(result('IF(2<>2,1/0,VALUE(7.5))'),'7.5');
  assert.equal(result('IF(2<=2,1,0)'),'1');assert.equal(result('IF(2!=2,1,0)'),'0');
  assert.equal(result('ROUNDUP(1.0001,0)'),'2');assert.equal(result('ROUNDUP(-1.0001,0)'),'-2');
  assert.equal(result('ROUNDUP(1.001,2)'),'1.01');assert.equal(result('ROUNDUP(-129,-1)'),'-130');
  assert.equal(R.exactDecimal(E.Q(1n,1024n)),'0.0009765625');
  assert.throws(()=>R.exactDecimal(E.Q(1n,3n)),/Non-terminating/);
});

test('parser rejects executable syntax, unknown fields/functions and excessive syntax',()=>{
  for(const text of ['process.exit()','globalThis.x=1','IF(1,1,1);','Function(1)','[__proto__]','MAX.constructor(1)','1**2','1e9','"1"','{x:1}','1?2:3','1//2','MAX()','VALUE(1,2)','IF(1,2)','ROUNDUP(1)']) assert.throws(()=>R.compileFormula(text),undefined,text);
  assert.throws(()=>R.compileFormula('('.repeat(100)+'1'+')'.repeat(100)),/nesting too deep/);
  assert.throws(()=>result('ROUNDUP(1,1.5)'),/precision/);
  assert.throws(()=>result('ROUNDUP(1,31)'),/precision/);
  assert.throws(()=>R.compileFormula('[帧率]').evaluate({}),/Missing formula field/);
  assert.throws(()=>result('1/0'),/零/);
});

test('HTML importer parses only the JSON literal without executing surrounding script',()=>{
  const s=R.extractCalculatorSnapshot(evidence.html);
  assert.equal(s.name,'seedance2.0价格计算器');assert.equal(s.fieldMap.fldHsYwIgu.property.options.length,14);
  const literal='window.formMetaContent = Object('+JSON.stringify({Snapshot:JSON.stringify({name:'test',fieldMap:{}}),BaseResp:{StatusCode:0}})+');';
  delete globalThis.__sourceRuleInjected;
  assert.equal(R.extractCalculatorSnapshot('<script>globalThis.__sourceRuleInjected=1;'+literal+'</script>').name,'test');
  assert.equal(globalThis.__sourceRuleInjected,undefined);
  assert.throws(()=>R.extractCalculatorSnapshot(literal+literal),/ambiguous/);
  assert.throws(()=>R.extractCalculatorSnapshot('window.formMetaContent = Object({Snapshot: malicious()});'),/invalid JSON/);
});

test('HTML entities are decoded exactly once, with malformed payloads rejected',()=>{
  assert.equal(R.decodeEntities('&quot;&amp;quot;&gt;&lt;&#65;&#x42;'),'"&quot;><AB');
  assert.throws(()=>R.decodeEntities('&#x110000;'),/Invalid HTML/);
  assert.throws(()=>R.parseClipboard('[]'),/container/);
  assert.throws(()=>R.parseClipboard(JSON.stringify([{entries:[{mimeType:'text/bitable',text:'{&quot;x&quot;:oops}'}]}])),/invalid JSON/);
});

test('model gate rejects Seedance 2.5 and all unsupported target models',()=>{
  for(const model of ['seedance-2.5','seedance-2.0-fast','seedance-2.0-mini','SEEDANCE-2.0','other']) assert.throws(()=>R.validateEvidence(evidence,{model}),/Unsupported model/);
  const data=clone();changeClipboard(data,'480p',t=>{cell(t,0,'fldMgWWXcK').data=[{text:'seedance-2.5'}];});
  assert.throws(()=>R.validateEvidence(data),/model mismatch/);
  const renamed=clone();changeCalculator(renamed,c=>{c.calculatorName='seedance2.5价格计算器';});
  assert.throws(()=>R.validateEvidence(renamed),/model\/name mismatch/);
  const models=clone();changeCalculator(models,c=>{c.modelOptions[0].name='seedance-2.5';});
  assert.throws(()=>R.validateEvidence(models),/Model option metadata/);
});

test('raw HTML hash and independently extracted field metadata are checked',()=>{
  const data=clone();data.html+='tampered';assert.throws(()=>R.validateEvidence(data),/HTML hash mismatch/);
  changeCalculator(data,c=>{c.htmlSha256=hash(data.html);});
  assert.throws(()=>R.validateEvidence(data),/versioned capture receipt/);
  const options=clone();changeCalculator(options,c=>{c.fields.find(f=>f.id==='fldHsYwIgu').options.shift();});
  assert.throws(()=>R.validateEvidence(options),/Calculator field fldHsYwIgu/);
  const lookup=clone();changeCalculator(lookup,c=>{c.fields.find(f=>f.id==='fldbHEcb1g').formula=c.fields.find(f=>f.id==='fldbHEcb1g').formula.replace('tblmNCuMjADrXtDf','tblWrong');});
  assert.throws(()=>R.validateEvidence(lookup),/Calculator field fldbHEcb1g/);
  const missing=clone();changeCalculator(missing,c=>{c.fields.pop();});
  assert.throws(()=>R.validateEvidence(missing),/field coverage/);
});

test('source table/view/formula field identities and cross-view formula agreement are checked',()=>{
  const mutations=[
    [t=>{t.tableId='tblOther';},/table\/view/],
    [t=>{t.viewId='vewOther';},/table\/view/],
    [t=>{field(t,'fld0p1bMiB').id='wrong';},/Missing source field/],
    [t=>{field(t,'fld0p1bMiB').property.formatter='0.00';},/field\/format/],
    [t=>{field(t,'fld0p1bMiB').property.formula+=' + 0';},/formula\/description mismatch/]
  ];
  for(const [mutate,error] of mutations){const data=clone();changeClipboard(data,'720p',mutate);assert.throws(()=>R.validateEvidence(data),error);}
});

test('official lookup/MAX price and input-plus-output base semantics cannot silently change',()=>{
  for(const [id,modify] of [
    ['fld9gudF3m',text=>text.replace('MAX(','MIN(')],
    ['fld0p1bMiB',text=>text.replace(']/1024',']/512')]
  ]) {
    const data=clone();changeCalculator(data,c=>{const f=c.fields.find(x=>x.id===id);const before=f.formula;f.formula=modify(before);assert.notEqual(before,f.formula);});
    assert.throws(()=>R.validateEvidence(data),new RegExp('Calculator field '+id));
  }
});

test('changing captured ROUNDUP behavior or an invisible fraction cannot pass source verification',()=>{
  const changed=clone();
  for(const res of Object.keys(R.VIEWS))changeClipboard(changed,res,t=>{field(t,'fld0p1bMiB').property.formula=field(t,'fld0p1bMiB').property.formula.replace('*2/3,0)','*2/3,1)');});
  assert.throws(()=>R.validateEvidence(changed),/Source display mismatch/);
  const fraction=clone();
  for(const res of Object.keys(R.VIEWS))changeClipboard(fraction,res,t=>{field(t,'fld0p1bMiB').property.formula+=' + 0.00000001';});
  assert.throws(()=>R.validateEvidence(fraction),/versioned capture receipt/);
});

test('missing, duplicate, dimension-tampered and display-tampered rows fail closed',()=>{
  const mutations=[
    [t=>{t.body.pop();},/Missing or extra source rows/],
    [t=>{t.body[1]=structuredClone(t.body[0]);},/Duplicate source specification/],
    [t=>{cell(t,0,'fld7gTzIBX').data[0].text='865';},/Dimensions/],
    [t=>{cell(t,0,'fld0p1bMiB').data[0].text='70309';},/Source display mismatch/],
    [t=>{cell(t,0,'fldJ4QUegW').data.pop();},/Incomplete minimum specification coverage/],
    [t=>{cell(t,0,'fldcNvCwvx').data[0].text='16';},/Unsupported source output duration/]
  ];
  for(const [mutate,error] of mutations){const data=clone();changeClipboard(data,'480p',mutate);assert.throws(()=>R.validateEvidence(data),error);}
  const missing=clone();delete missing.clipboards['4k'];assert.throws(()=>R.validateEvidence(missing),/Missing clipboard evidence/);
});

test('artifact and manifest generation is deterministic, fresh and excludes unrelated clipboard metadata',()=>{
  const generated=R.generate({write:false}),again=R.generate({write:false});
  assert.equal(generated.artifact,again.artifact);assert.equal(generated.manifestText,again.manifestText);
  assert.deepEqual(require('./generated-minima.js'),generated.snapshot);
  assert.doesNotThrow(()=>R.generate({check:true}));
  for(const key of ['userData','userId','userName','email','avatarUrl'])assert.equal(generated.artifact.includes('"'+key+'"'),false);
  assert.equal(generated.manifest.generatedSha256,hash(generated.artifact));
  const tempParent=path.resolve(os.tmpdir()),tempRoot=fs.mkdtempSync(path.join(tempParent,'reelay-source-rules-'));
  try {
    fs.mkdirSync(path.join(tempRoot,'evidence','2026-10-20'),{recursive:true});
    R.generate({root:tempRoot,evidence});assert.doesNotThrow(()=>R.generate({root:tempRoot,evidence,check:true}));
    fs.appendFileSync(path.join(tempRoot,'generated-minima.js'),'// stale\n');
    assert.throws(()=>R.generate({root:tempRoot,evidence,check:true}),/stale: generated-minima.js/);
    R.generate({root:tempRoot,evidence});fs.appendFileSync(path.join(tempRoot,'evidence','2026-10-20','manifest.json'),' ');
    assert.throws(()=>R.generate({root:tempRoot,evidence,check:true}),/stale: evidence/);
  } finally {
    const resolved=path.resolve(tempRoot);
    assert.equal(path.dirname(resolved),tempParent);assert.ok(path.basename(resolved).startsWith('reelay-source-rules-'));
    fs.rmSync(resolved,{recursive:true,force:true});
  }
});
