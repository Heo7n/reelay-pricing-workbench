'use strict';

// Reconstruct the Seedance 2.5 lookup only from its independently captured table.
// The expression parser is shared; neither Seedance 2.0 values nor its domains are.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const P = require('./source-rules.cjs');
const MODEL = 'seedance-2.5';
const VERSION = 'volc-seedance25-2026-10-20';
const DATE = '2026-10-20';
const DIR = `evidence/${DATE}/models`;
const TABLE = 'tblheIYDXXwYM43b';
const CALCULATOR_TABLE = 'tblybhvNR0ukb7qp';
const FORMULA_FIELD = 'fld0p1bMiB';
const CALCULATOR_URL = 'https://bytedance.larkoffice.com/share/base/form/shrcnhVCMxKxcwW1QML5r9u8nvh';
const CREATE_URL = 'https://ark.volcengine.com/region:cn-beijing/docs/create-video-generation-task-api.md';
const VIEWS = Object.freeze({'480p':'vew2CR2JYM','720p':'vewVBehIlq','1080p':'vewdDcyFjS'});
const CAPTURE = Object.freeze({
  html: '944cf465b833f63aee5b5833258d26005fff269b89f3c6d61d896ce892d83168',
  formula: 'f8d5a553af3196c22d8727d891644f99b13c28c67d662b1e922b90dcddfbefb9',
  create: 'b397daf9a72c5c93de6dcf66610dea543c4bbdd3a500a00a234135898abaee24',
});
const ROWS = Object.freeze({'480p':123,'720p':108,'1080p':108});
const FIELDS = Object.freeze({model:'fldMgWWXcK',seconds:'fldcNvCwvx',tokens:FORMULA_FIELD,ratio:'fldJ4QUegW',long:'fld7gTzIBX',short:'fldGXb46uO'});
const RATIOS = Object.freeze(['21:9','16:9','4:3','1:1','3:4','9:16']);
const range = (a,b) => Array.from({length:b-a+1},(_,i)=>String(a+i));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const ensure = (value,message) => {if(!value)throw Error(message);};
const equal = (a,b,label) => {try{assert.deepStrictEqual(a,b);}catch{throw Error(`${label}: mismatch`);}};
const json = (text,label) => {try{return JSON.parse(text);}catch{throw Error(`${label}: invalid JSON`);}};
const normalizeFormula = text => typeof text==='string'?text.replace(/\\u([0-9a-f]{4})/gi,(_,s)=>String.fromCharCode(parseInt(s,16))):null;

function readEvidence(root=__dirname) {
  const read = name => fs.readFileSync(path.join(root,DIR,name),'utf8').replace(/^\uFEFF/,'');
  return {
    html:read('seedance-2.5-calculator-public.html'),
    calculatorText:read('seedance-2.5-calculator-fields.json'),
    createDocument:read('create-video-generation-task-api.md'),
    documentManifest:read('documents-manifest.json'),
    clipboards:Object.fromEntries(Object.keys(VIEWS).map(res=>[res,read(`minimum-${res}.clipboard.json`)])),
  };
}

function parseDimensions(markdown) {
  const dims={};let resolution=null;
  const start=markdown.indexOf('| 分辨率 | 宽高比 | 宽高像素值 Seedance 2.5 |');
  ensure(start>=0,'Official Seedance 2.5 pixel table missing');
  for(const line of markdown.slice(start).split(/\r?\n/)) {
    if(!line.startsWith('|'))break;
    const c=line.split('|').map(x=>x.trim());
    if(c.length!==7 || !/^`(?:21:9|16:9|4:3|1:1|3:4|9:16)`$/.test(c[2]))continue;
    if(!c[1].startsWith('^^'))resolution=c[1].split('<br>')[0];
    if(c[3]==='—')continue;
    ensure(Object.hasOwn(VIEWS,resolution),'Unsupported resolution in 2.5 pixel table');
    ensure(/^\d+×\d+$/.test(c[3]),'Invalid official pixel dimensions');
    const ratio=c[2].replace(/`/g,'');
    dims[resolution]??={};ensure(!dims[resolution][ratio],'Duplicate official pixel row');
    dims[resolution][ratio]=c[3].split('×').map(Number);
  }
  equal(Object.keys(dims),Object.keys(VIEWS),'Official 2.5 pixel resolutions');
  for(const res of Object.keys(VIEWS))equal(Object.keys(dims[res]).sort(),[...RATIOS].sort(),`Official ${res} pixel ratios`);
  return dims;
}

function validateCalculator(evidence) {
  const c=json(evidence.calculatorText,'Extracted 2.5 calculator');
  ensure(c.sourceUrl===CALCULATOR_URL && c.httpStatus===200,'Wrong calculator source or unsuccessful HTTP capture');
  ensure(hash(evidence.html)===CAPTURE.html && c.htmlSha256===CAPTURE.html,'2.5 calculator HTML capture hash mismatch');
  const s=P.extractCalculatorSnapshot(evidence.html);
  ensure(s.name==='seedance2.5价格计算器' && c.calculatorName===s.name,'Calculator is not Seedance 2.5');
  ensure(Array.isArray(c.fields),'Calculator fields missing');
  const fields=Object.fromEntries(c.fields.map(f=>[f.id,f]));
  equal(Object.keys(fields).sort(),Object.keys(s.fieldMap).sort(),'Complete calculator field inventory');
  ensure(Object.keys(fields).length===c.fields.length,'Duplicate calculator fields');
  for(const [id,f] of Object.entries(fields)) {
    const original=s.fieldMap[id];
    equal({name:f.name,type:f.type,formula:f.formula,options:f.options},
      {name:original.name,type:original.type,formula:normalizeFormula(original.property?.formula),options:original.property?.options??null},
      `Captured calculator field ${id}`);
  }
  const options=id=>{ensure(Array.isArray(fields[id]?.options),`Missing calculator options: ${id}`);return fields[id].options.map(o=>o.name);};
  equal(options('fldxqQNUkO'),[MODEL],'Calculator model domain');
  const input=options('fldHsYwIgu'),output=options('fldcNvCwvx'),resolutions=options('fldMCNB6LD'),ratios=options('fldJ4QUegW'),fps=options('fld10eswv1');
  equal(input,range(2,30),'Official 2.5 input durations');
  equal(output,range(4,30),'Official 2.5 output durations');
  equal(resolutions,Object.keys(VIEWS),'Official 2.5 resolutions');
  equal([...ratios].sort(),[...RATIOS].sort(),'Official 2.5 fixed ratios');
  equal(fps,['24'],'Official 2.5 FPS');
  const ref=id=>`bitable::$table[${CALCULATOR_TABLE}].$field[${id}]`;
  const expectedLookup=`bitable::$table[${TABLE}].FILTER(CurrentValue.$column[fldHsYwIgu]!=""&&CurrentValue.$column[fldMCNB6LD]=${ref('fldMCNB6LD')}&&CurrentValue.$column[fldJ4QUegW].CONTAIN(${ref('fldJ4QUegW')})&&CurrentValue.$column[fldcNvCwvx]=${ref('fldcNvCwvx')}).$column[${FORMULA_FIELD}].LISTCOMBINE()`;
  const expectedBase=`(${ref('fldHsYwIgu')}+${ref('fldcNvCwvx')})*VALUE(REGEXEXTRACT(${ref('fld7gTzIBX')},"(\\d+)×"))*VALUE(REGEXEXTRACT(${ref('fld7gTzIBX')},"×(\\d+)"))*${ref('fld10eswv1')}/1024`;
  const expectedPrice=`IF(${ref('fldXiJ2g6j')}="输入包含视频",${ref('fldxTNE2R7')}*MAX(VALUE(${ref('fld0p1bMiB')}),VALUE(${ref('fldbHEcb1g')}))/1000000,${ref('fldxTNE2R7')}*VALUE(${ref('fld0p1bMiB')})/1000000)`;
  ensure(fields.fldbHEcb1g.formula===expectedLookup,'2.5 minimum lookup semantics/table changed');
  ensure(fields.fld0p1bMiB.formula===expectedBase,'2.5 base-token formula changed');
  ensure(fields.fld9gudF3m.formula===expectedPrice,'2.5 price/maximum formula changed');
  return {input,output,resolutions,ratios,fps:fps[0]};
}

function validateEvidence(evidence,{model=MODEL}={}) {
  ensure(model===MODEL,'This source capture is only Seedance 2.5');
  const domain=validateCalculator(evidence);
  const manifest=json(evidence.documentManifest,'Document capture manifest');
  const create=manifest.find(d=>d.file==='create-video-generation-task-api.md');
  ensure(create?.url===CREATE_URL && create.httpStatus===200 && create.sha256===CAPTURE.create && hash(evidence.createDocument)===CAPTURE.create,'Creation API source/hash mismatch');
  const dimensions=parseDimensions(evidence.createDocument);
  const entries={},sourceFiles={},duplicateRows=[],rowsByResolution={},uniqueRowsByResolution={};
  let sourceFormula,sourceDescription,compiled,sourceRows=0,uniqueSourceRows=0,evaluationCount=0;
  for(const res of domain.resolutions) {
    const raw=evidence.clipboards?.[res];ensure(typeof raw==='string',`Missing ${res} source capture`);
    const table=P.parseClipboard(raw),file=`${DIR}/minimum-${res}.clipboard.json`;
    ensure(table.tableId===TABLE && table.viewId===VIEWS[res],`Wrong 2.5 table/view: ${res}`);
    ensure(Array.isArray(table.header)&&Array.isArray(table.body),'Malformed source table');
    ensure(table.body.length===ROWS[res],`Captured ${res} row count changed`);
    const columns=Object.fromEntries(table.header.map((f,i)=>[f.id,i]));
    ensure(Object.keys(columns).length===table.header.length,'Duplicate source column');
    for(const id of Object.values(FIELDS))ensure(Object.hasOwn(columns,id),`Missing source column ${id}`);
    const header=table.header[columns[FORMULA_FIELD]],formula=header.property?.formula;
    ensure(header.name==='最低token用量'&&header.type===20&&header.property?.formatter==='0','Wrong source token field');
    const description=(header.description?.content??[]).map(x=>x.text??'').join('');
    ensure(description==='估算值，实际以调用 API 后返回信息中的 usage 字段为准','Source estimate disclaimer changed');
    ensure(typeof formula==='string' && hash(formula)===CAPTURE.formula,'2.5 captured source formula changed');
    if(!compiled){sourceFormula=formula;sourceDescription=description;compiled=P.compileFormula(formula);}
    else ensure(formula===sourceFormula,'Source formulas differ between views');
    sourceFiles[file]=hash(raw);sourceRows+=table.body.length;rowsByResolution[res]=table.body.length;
    const seenRows=new Map();
    for(const [index,row] of table.body.entries()) {
      ensure(Array.isArray(row)&&row.length===table.header.length,'Malformed source row');
      const cell=name=>{const value=row[columns[FIELDS[name]]]?.data;ensure(Array.isArray(value),`Missing source ${name}`);return value;};
      const scalar=name=>{const value=cell(name);ensure(value.length===1&&typeof value[0].text==='string',`Invalid scalar ${name}`);return value[0].text.trim();};
      const rowModel=cell('model').map(x=>x.text??'').join('').trim();
      ensure(!rowModel||rowModel===MODEL,'Source row belongs to another model');
      const seconds=scalar('seconds'),displayedTokens=scalar('tokens'),long=scalar('long'),short=scalar('short'),ratios=cell('ratio').map(x=>x.text);
      ensure(domain.output.includes(seconds),'Source output duration unsupported');
      ensure(/^\d+$/.test(displayedTokens)&&/^\d+$/.test(long)&&/^\d+$/.test(short),'Invalid numeric source row');
      ensure(ratios.length>=1&&ratios.length<=2&&new Set(ratios).size===ratios.length,'Invalid source ratio group');
      for(const ratio of ratios) {
        ensure(domain.ratios.includes(ratio),'Source ratio unsupported');
        const wh=dimensions[res][ratio];
        equal([long,short],[String(Math.max(...wh)),String(Math.min(...wh))],`2.5 official dimensions ${res}/${ratio}`);
      }
      let minimum=null;const minimizingInputs=[];
      for(const input of domain.input) {
        const value=compiled.evaluate({'时长-输入视频（秒）':input,'时长-输出视频（秒）':seconds,'长边（像素）':long,'短边（像素）':short,'帧率':domain.fps});
        evaluationCount++;ensure(E.cmp(value,0)>0,'Source produced non-positive usage');
        const comparison=minimum===null?-1:E.cmp(value,minimum);
        if(comparison<0){minimum=value;minimizingInputs.length=0;minimizingInputs.push(input);}
        else if(!comparison)minimizingInputs.push(input);
      }
      const tokens=P.exactDecimal(minimum);
      ensure(E.fixed(minimum,0)===displayedTokens,`Source display mismatch: ${res}/${ratios.join(',')}/${seconds}`);
      const groupKey=[...ratios].sort().join(',')+'|'+seconds;
      const record={seconds,ratios:[...ratios].sort(),displayedTokens,long,short,tokens};
      const earlier=seenRows.get(groupKey);
      if(earlier) {
        equal(record,earlier.record,`Conflicting duplicate source row ${res} #${index+1}`);
        // This capture contains exactly these 15 identical repeats, not arbitrary duplicates.
        ensure(res==='480p'&&ratios.length===1&&ratios[0]==='21:9'&&Number(seconds)>=16,'Unexpected duplicate source row');
        duplicateRows.push({resolution:res,ratio:ratios[0],seconds,firstRow:earlier.row,repeatedRow:index+1,displayedTokens,tokens,sourceFile:file});
        for(const ratio of ratios)entries[`${res}|${ratio}|${seconds}`].sourceRows.push(index+1);
        continue;
      }
      seenRows.set(groupKey,{record,row:index+1});uniqueSourceRows++;
      for(const ratio of ratios) {
        const key=`${res}|${ratio}|${seconds}`;ensure(!Object.hasOwn(entries,key),'Overlapping source ratio groups');
        entries[key]={tokens,displayedTokens,sourceFile:file,sourceTable:TABLE,sourceView:table.viewId,sourceField:FORMULA_FIELD,sourceRow:index+1,sourceRows:[index+1],minimizingInputSeconds:[...minimizingInputs]};
      }
    }
    uniqueRowsByResolution[res]=seenRows.size;
    ensure(seenRows.size===108,`Missing unique ${res} source records`);
  }
  ensure(sourceRows===339&&uniqueSourceRows===324&&duplicateRows.length===15,'Source row coverage changed');
  equal(duplicateRows.map(r=>r.seconds).sort((a,b)=>Number(a)-Number(b)),range(16,30),'Expected duplicate duration coverage');
  ensure(Object.keys(entries).length===486,'Incomplete 2.5 specification coverage');
  for(const res of domain.resolutions)for(const ratio of domain.ratios)for(const seconds of domain.output)ensure(Object.hasOwn(entries,`${res}|${ratio}|${seconds}`),'Missing supported 2.5 specification');
  for(const [name,text] of [['seedance-2.5-calculator-public.html',evidence.html],['seedance-2.5-calculator-fields.json',evidence.calculatorText],['create-video-generation-task-api.md',evidence.createDocument],['documents-manifest.json',evidence.documentManifest]])sourceFiles[`${DIR}/${name}`]=hash(text);
  return {
    version:VERSION,model:MODEL,verifiedAt:DATE,sourceFormula,sourceFormulaSha256:hash(sourceFormula),sourceDescription,
    sourceUrl:CALCULATOR_URL,sourceTable:TABLE,sourceField:FORMULA_FIELD,views:VIEWS,
    derivation:'Execute the independently captured Seedance 2.5 table formula over its official input-duration options; preserve exact minima and verify every displayed source row.',
    duplicatePolicy:'The 480p source repeats 21:9 durations 16–30. Each repeated row is independently validated and must agree exactly; identical values are represented once, with both source row numbers retained. This does not assert how the remote form coerces a duplicated lookup list.',
    inputSeconds:domain.input,outputSeconds:domain.output,fps:domain.fps,dimensions,
    sourceRows,uniqueSourceRows,specificationCount:Object.keys(entries).length,formulaEvaluationCount:evaluationCount,
    rowsByResolution,uniqueRowsByResolution,duplicateRows,sourceFiles,entries,
  };
}

function renderSnapshot(snapshot) {
  return '/* Generated from independent Seedance 2.5 evidence by models-source.cjs. */\n(function(root){\n\'use strict\';\nconst snapshot = '+JSON.stringify(snapshot,null,2)+';\nroot.ReelayModelMinimumSnapshot=snapshot;\nif(typeof module!==\'undefined\')module.exports=snapshot;\n})(typeof window!==\'undefined\'?window:globalThis);\n';
}
function generate({root=__dirname,evidence,model=MODEL,check=false,write=true}={}) {
  const snapshot=validateEvidence(evidence??readEvidence(root),{model}),artifact=renderSnapshot(snapshot);
  const manifest={version:VERSION,model:MODEL,verifiedAt:DATE,sourceTable:TABLE,sourceField:FORMULA_FIELD,sourceFormulaSha256:snapshot.sourceFormulaSha256,sourceRows:snapshot.sourceRows,uniqueSourceRows:snapshot.uniqueSourceRows,duplicateRows:snapshot.duplicateRows,specificationCount:snapshot.specificationCount,formulaEvaluationCount:snapshot.formulaEvaluationCount,sourceFiles:snapshot.sourceFiles,generatedFile:'generated-model-minima.js',generatedSha256:hash(artifact)};
  const manifestText=JSON.stringify(manifest,null,2)+'\n';
  const outputs=[['generated-model-minima.js',artifact],[`${DIR}/minimum-manifest.json`,manifestText]];
  if(check)for(const [name,text] of outputs)ensure(fs.existsSync(path.join(root,name))&&fs.readFileSync(path.join(root,name),'utf8')===text,`Generated 2.5 artifact stale: ${name}`);
  else if(write)for(const [name,text] of outputs)fs.writeFileSync(path.join(root,name),text,'utf8');
  return {snapshot,manifest,artifact,manifestText};
}
module.exports={MODEL,VERSION,DATE,DIR,TABLE,VIEWS,CAPTURE,parseDimensions,readEvidence,validateCalculator,validateEvidence,renderSnapshot,generate};
if(require.main===module) {
  try {
    ensure(process.argv.slice(2).every(x=>x==='--check'),'Only --check is supported');
    const {snapshot}=generate({check:process.argv.includes('--check')});
    console.log(`${process.argv.includes('--check')?'Verified':'Generated'} ${snapshot.specificationCount} independent Seedance 2.5 specifications from ${snapshot.sourceRows} captured rows (${snapshot.uniqueSourceRows} unique, ${snapshot.duplicateRows.length} audited repeats).`);
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
