'use strict';

// Offline, reproducible importer for the captured Seedance 2.0 evidence.
// Formula text is parsed as a small expression language. It is never JavaScript.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const E = require('./engine.js');

const VERSION = 'volc-seedance20-2026-10-20';
const MODEL = 'seedance-2.0';
const DATE = '2026-10-20';
const EVIDENCE_DIR = `evidence/${DATE}`;
const TABLE = 'tblmNCuMjADrXtDf';
const FORMULA_FIELD = 'fld0p1bMiB';
// Version-specific receipts: a new capture must receive a new version and review.
const CAPTURE_FORMULA_SHA256 = 'f8d5a553af3196c22d8727d891644f99b13c28c67d662b1e922b90dcddfbefb9';
const CAPTURE_HTML_SHA256 = '602cc6bb1fa4fd72ac168902003504f1f584a0bb8fe6267b436781ca666c18bf';
const VIEWS = Object.freeze({'480p':'vew2CR2JYM','720p':'vewVBehIlq','1080p':'vewQ2CK6dj','4k':'vewrMAE6IZ'});
const FIELDS = Object.freeze({model:'fldMgWWXcK',seconds:'fldcNvCwvx',tokens:FORMULA_FIELD,ratio:'fldJ4QUegW',long:'fld7gTzIBX',short:'fldGXb46uO'});
const VARIABLES = Object.freeze(['时长-输入视频（秒）','时长-输出视频（秒）','长边（像素）','短边（像素）','帧率']);
const RANGE = (lo, hi) => Array.from({length:hi-lo+1},(_,i)=>String(lo+i));
const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');
const fail = message => { throw Error(message); };
const ensure = (condition,message) => { if (!condition) fail(message); };
function parseJSON(text,label) { try { return JSON.parse(text); } catch { fail(`${label}: invalid JSON`); } }
function equivalent(a,b,label) { try { assert.deepStrictEqual(a,b); } catch { fail(`${label}: mismatch`); } }

function decodeEntities(text) {
  ensure(typeof text === 'string','Clipboard payload must be text');
  // Decode once. Replacement output is never interpreted as HTML or decoded again.
  const named = {quot:'"',amp:'&',lt:'<',gt:'>',apos:"'"};
  return text.replace(/&(#x[0-9a-f]+|#\d+|quot|amp|lt|gt|apos);/gi,(_,entity)=>{
    if(entity[0] !== '#') return named[entity.toLowerCase()];
    const cp = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : parseInt(entity.slice(1),10);
    ensure(cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff),'Invalid HTML numeric entity');
    return String.fromCodePoint(cp);
  });
}
function parseClipboard(raw) {
  const items = parseJSON(raw,'Clipboard container');
  ensure(Array.isArray(items) && items.length === 1 && Array.isArray(items[0].entries),'Invalid clipboard container');
  const candidates = items[0].entries.filter(x=>x.mimeType === 'text/bitable');
  ensure(candidates.length === 1,'Expected exactly one text/bitable payload');
  return parseJSON(decodeEntities(candidates[0].text),'Bitable payload');
}

function extractCalculatorSnapshot(html) {
  const marker = 'window.formMetaContent = Object(';
  const markerIndex = html.indexOf(marker);
  ensure(markerIndex >= 0 && html.indexOf(marker,markerIndex+1) < 0,'Missing or ambiguous calculator literal');
  const start = markerIndex+marker.length;
  ensure(html[start] === '{','Calculator literal must be a JSON object');
  let depth = 0, quoted = false, escaped = false, end = -1;
  for(let i=start;i<html.length;i++) {
    const ch=html[i];
    if(quoted) { if(escaped) escaped=false; else if(ch==='\\') escaped=true; else if(ch==='"') quoted=false; }
    else if(ch==='"') quoted=true;
    else if(ch==='{') depth++;
    else if(ch==='}' && --depth===0) { end=i+1; break; }
  }
  ensure(end > start && /^\s*\);/.test(html.slice(end,end+20)),'Unclosed calculator JSON literal');
  const meta = parseJSON(html.slice(start,end),'Calculator metadata');
  ensure(meta.BaseResp?.StatusCode === 0 && typeof meta.Snapshot === 'string','Calculator metadata unsuccessful');
  const snapshot = parseJSON(meta.Snapshot,'Calculator snapshot');
  ensure(snapshot.fieldMap && typeof snapshot.fieldMap === 'object','Calculator fields missing');
  return snapshot;
}

function compileFormula(source, allowedFields = VARIABLES) {
  ensure(typeof source==='string' && source.length > 0 && source.length <= 12000,'Invalid formula length');
  const allowed = new Set(allowedFields), tokens=[];
  let pos=0;
  while(pos<source.length) {
    if(/\s/u.test(source[pos])) { pos++; continue; }
    if(source[pos]==='[') {
      const end=source.indexOf(']',pos+1); ensure(end>=0,'Unclosed field reference');
      const name=source.slice(pos+1,end); ensure(allowed.has(name),`Unsupported field: ${name}`);
      tokens.push({type:'field',value:name}); pos=end+1;
    } else {
      const tail=source.slice(pos), num=/^\d+(?:\.\d+)?/.exec(tail), word=/^[A-Za-z_][A-Za-z_0-9]*/.exec(tail), op=/^(?:>=|<=|!=|<>|==|[+\-*/(),><=])/.exec(tail);
      if(num) { ensure(num[0].length<=80,'Numeric literal too long');tokens.push({type:'number',value:num[0]});pos+=num[0].length; }
      else if(word) { ensure(['IF','VALUE','MAX','ROUNDUP'].includes(word[0]),`Unsupported function: ${word[0]}`);tokens.push({type:'function',value:word[0]});pos+=word[0].length; }
      else if(op) { tokens.push({type:op[0],value:op[0]});pos+=op[0].length; }
      else fail(`Unsupported formula character at ${pos}`);
    }
    ensure(tokens.length<=2000,'Formula too complex');
  }
  tokens.push({type:'end'});
  let cursor=0,depth=0;
  const peek=()=>tokens[cursor].type;
  const eat=type=>{ ensure(peek()===type,`Expected ${type}, found ${peek()}`);return tokens[cursor++]; };
  const precedence={'>':1,'<':1,'>=':1,'<=':1,'=':1,'==':1,'!=':1,'<>':1,'+':2,'-':2,'*':3,'/':3};
  function primary() {
    ensure(++depth<=80,'Formula nesting too deep');
    let node;
    if(peek()==='+' || peek()==='-') {const op=tokens[cursor++].type;node={type:'unary',op,operand:primary()};}
    else if(peek()==='number') node={type:'number',value:eat('number').value};
    else if(peek()==='field') node={type:'field',value:eat('field').value};
    else if(peek()==='(') {eat('(');node=expression(0);eat(')');}
    else if(peek()==='function') {
      const name=eat('function').value,args=[];eat('(');
      if(peek()!==')') {args.push(expression(0));while(peek()===','){eat(',');args.push(expression(0));}}
      eat(')');
      ensure(name==='MAX' ? args.length>=1 && args.length<=50 : args.length===({IF:3,VALUE:1,ROUNDUP:2}[name]),`Invalid ${name} argument count`);
      node={type:'call',name,args};
    } else fail(`Unexpected formula token: ${peek()}`);
    depth--;return node;
  }
  function expression(minPrec) {
    let left=primary();
    while(precedence[peek()] && precedence[peek()]>=minPrec) {
      const op=tokens[cursor++].type;left={type:'binary',op,left,right:expression(precedence[op]+1)};
    }
    return left;
  }
  const ast=expression(0);eat('end');
  function evaluate(context) {
    function run(node) {
      if(node.type==='number')return E.dec(node.value);
      if(node.type==='field') {ensure(Object.hasOwn(context,node.value),`Missing formula field: ${node.value}`);return E.dec(context[node.value]);}
      if(node.type==='unary'){const value=run(node.operand);return node.op==='-'?E.mul(value,'-1'):value;}
      if(node.type==='binary') {
        const a=run(node.left),b=run(node.right);
        if(node.op==='+')return E.add(a,b);if(node.op==='-')return E.sub(a,b);if(node.op==='*')return E.mul(a,b);if(node.op==='/')return E.div(a,b);
        const c=E.cmp(a,b);return E.dec(({'>':c>0,'<':c<0,'>=':c>=0,'<=':c<=0,'=':c===0,'==':c===0,'!=':c!==0,'<>':c!==0}[node.op])?'1':'0');
      }
      // IF evaluates only the selected branch, as the original expression requires.
      if(node.name==='IF')return run(E.cmp(run(node.args[0]),'0')!==0?node.args[1]:node.args[2]);
      if(node.name==='VALUE')return run(node.args[0]);
      const args=node.args.map(run);
      if(node.name==='MAX')return args.reduce((a,b)=>E.cmp(a,b)>=0?a:b);
      const [value,digits]=args;ensure(digits.d===1n && digits.n>=-30n && digits.n<=30n,'ROUNDUP precision must be an integer from -30 to 30');
      const k=E.Q(10n**(digits.n<0n?-digits.n:digits.n));
      const scaled=digits.n>=0n?E.mul(E.abs(value),k):E.div(E.abs(value),k);
      const rounded=E.ceil(scaled), result=digits.n>=0n?E.div(rounded,k):E.mul(rounded,k);
      return value.n<0n?E.mul(result,'-1'):result;
    }
    return run(ast);
  }
  return Object.freeze({source,ast,evaluate});
}
function exactDecimal(value) {
  const q=E.dec(value),sign=q.n<0n?'-':'',n=q.n<0n?-q.n:q.n;
  let remainder=n%q.d,result=sign+(n/q.d).toString();
  if(!remainder)return result;
  result+='.';const seen=new Set();
  while(remainder) {
    ensure(!seen.has(remainder.toString()) && seen.size<80,'Non-terminating or oversized decimal');seen.add(remainder.toString());
    remainder*=10n;result+=(remainder/q.d).toString();remainder%=q.d;
  }
  return result;
}
function normalizedFormula(formula) {
  // The public snapshot serializes some formula characters as literal escapes.
  return typeof formula==='string'?formula.replace(/\\u([0-9a-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))):null;
}
function readEvidence(root=__dirname) {
  const read = filename=>fs.readFileSync(path.join(root,EVIDENCE_DIR,filename),'utf8').replace(/^\uFEFF/,'');
  return {html:read('calculator-public.html'),calculatorText:read('calculator-fields.json'),clipboards:Object.fromEntries(Object.keys(VIEWS).map(res=>[res,read(`minimum-${res}.clipboard.json`)]))};
}
function validateEvidence(evidence, {model=MODEL}={}) {
  ensure(model===MODEL,`Unsupported model: ${model}; this capture is only ${MODEL}`);
  const calculator=parseJSON(evidence.calculatorText,'Extracted calculator fields');
  ensure(calculator.httpStatus===200,'Calculator HTTP evidence unsuccessful');
  ensure(calculator.sourceUrl==='https://bytedance.larkoffice.com/share/base/form/shrcnP1Bl0mqCP9OHCbjpe1oBkf','Unexpected calculator source');
  ensure(calculator.htmlSha256===sha256(evidence.html),'Calculator HTML hash mismatch');
  ensure(calculator.htmlSha256===CAPTURE_HTML_SHA256,'Calculator HTML differs from the versioned capture receipt');
  const snapshot=extractCalculatorSnapshot(evidence.html);
  ensure(snapshot.name==='seedance2.0价格计算器' && calculator.calculatorName===snapshot.name,'Calculator model/name mismatch');
  ensure(Array.isArray(calculator.fields),'Calculator field list missing');
  const calcFields=Object.fromEntries(calculator.fields.map(f=>[f.id,f]));
  ensure(Object.keys(calcFields).length===calculator.fields.length,'Duplicate calculator field');
  equivalent(Object.keys(calcFields).sort(),Object.keys(snapshot.fieldMap).sort(),'Calculator field coverage');
  for(const [id,field] of Object.entries(calcFields)) {
    const original=snapshot.fieldMap[id];ensure(original,`Calculator field missing in HTML: ${id}`);
    equivalent({name:field.name,type:field.type,formula:field.formula,options:field.options}, {name:original.name,type:original.type,formula:normalizedFormula(original.property?.formula),options:original.property?.options??null},`Calculator field ${id}`);
  }
  equivalent(calculator.modelOptions,calcFields.fldxqQNUkO?.options,'Model option metadata');
  equivalent(calculator.modelOptions.map(o=>o.name),[MODEL,`${MODEL}-fast`,`${MODEL}-mini`],'Supported calculator models');
  const options=id=>{const list=calcFields[id]?.options;ensure(Array.isArray(list),`Missing options: ${id}`);return list.map(x=>x.name);};
  const inputOptions=options('fldHsYwIgu'),secondsOptions=options('fldcNvCwvx'),resOptions=options('fldMCNB6LD'),ratioOptions=options('fldJ4QUegW'),fpsOptions=options('fld10eswv1');
  equivalent(inputOptions,RANGE(2,15),'Official input-duration domain');
  equivalent(secondsOptions,RANGE(4,15),'Official output-duration domain');
  equivalent(resOptions,Object.keys(VIEWS),'Official resolution domain');
  equivalent([...ratioOptions].sort(),Object.keys(E.DIMS['480p']).sort(),'Official aspect-ratio domain');
  equivalent(fpsOptions,['24'],'Official frame-rate domain');
  const lookup=calcFields.fldbHEcb1g?.formula;
  const expectedLookup='bitable::$table[tblmNCuMjADrXtDf].FILTER(CurrentValue.$column[fldHsYwIgu]!=""&&CurrentValue.$column[fldMCNB6LD]=bitable::$table[tblQUnjJVVCmE1m3].$field[fldMCNB6LD]&&CurrentValue.$column[fldJ4QUegW].CONTAIN(bitable::$table[tblQUnjJVVCmE1m3].$field[fldJ4QUegW])&&CurrentValue.$column[fldcNvCwvx]=bitable::$table[tblQUnjJVVCmE1m3].$field[fldcNvCwvx]).$column[fld0p1bMiB].LISTCOMBINE()';
  ensure(lookup===expectedLookup,'Calculator minimum lookup/table/field mismatch');
  const expectedPrice='IF(bitable::$table[tblQUnjJVVCmE1m3].$field[fldXiJ2g6j]="输入包含视频",bitable::$table[tblQUnjJVVCmE1m3].$field[fldxTNE2R7]*MAX(VALUE(bitable::$table[tblQUnjJVVCmE1m3].$field[fld0p1bMiB]),VALUE(bitable::$table[tblQUnjJVVCmE1m3].$field[fldbHEcb1g]))/1000000,bitable::$table[tblQUnjJVVCmE1m3].$field[fldxTNE2R7]*VALUE(bitable::$table[tblQUnjJVVCmE1m3].$field[fld0p1bMiB])/1000000)';
  ensure(calcFields.fld9gudF3m?.formula===expectedPrice,'Calculator price lookup/MAX relationship mismatch');
  const expectedBase='(bitable::$table[tblQUnjJVVCmE1m3].$field[fldHsYwIgu]+bitable::$table[tblQUnjJVVCmE1m3].$field[fldcNvCwvx])*VALUE(REGEXEXTRACT(bitable::$table[tblQUnjJVVCmE1m3].$field[fld7gTzIBX],"(\\d+)×"))*VALUE(REGEXEXTRACT(bitable::$table[tblQUnjJVVCmE1m3].$field[fld7gTzIBX],"×(\\d+)"))*bitable::$table[tblQUnjJVVCmE1m3].$field[fld10eswv1]/1024';
  ensure(calcFields.fld0p1bMiB?.formula===expectedBase,'Calculator base estimate relationship mismatch');
  const entries={},sourceFiles={},rowsByResolution={};
  let sourceFormula=null,sourceDescription=null,compiled=null,totalRows=0,evaluationCount=0;
  for(const res of resOptions) {
    ensure(typeof evidence.clipboards?.[res]==='string',`Missing clipboard evidence: ${res}`);
    const sourceFile=`${EVIDENCE_DIR}/minimum-${res}.clipboard.json`,table=parseClipboard(evidence.clipboards[res]);
    ensure(table.tableId===TABLE && table.viewId===VIEWS[res],`Source table/view mismatch: ${res}`);
    ensure(Array.isArray(table.header) && Array.isArray(table.body),`Invalid source table: ${res}`);
    const columns=Object.fromEntries(table.header.map((field,i)=>[field.id,i]));
    ensure(Object.keys(columns).length===table.header.length,'Duplicate source field');
    for(const id of Object.values(FIELDS))ensure(Object.hasOwn(columns,id),`Missing source field: ${id}`);
    const header=table.header[columns[FORMULA_FIELD]];
    ensure(header.name==='最低token用量' && header.type===20 && header.property?.formatter==='0','Unexpected minimum formula field/format');
    const description=(header.description?.content??[]).map(x=>x.text??'').join('');
    ensure(description==='估算值，实际以调用 API 后返回信息中的 usage 字段为准','Source estimate disclaimer changed');
    const formula=header.property?.formula;
    if(sourceFormula===null) {sourceFormula=formula;sourceDescription=description;compiled=compileFormula(formula);}
    else ensure(formula===sourceFormula && description===sourceDescription,'Source formula/description mismatch across views');
    ensure(table.body.length===48,`Missing or extra source rows: ${res}`);
    sourceFiles[sourceFile]=sha256(evidence.clipboards[res]);rowsByResolution[res]=table.body.length;totalRows+=table.body.length;
    for(const [index,row] of table.body.entries()) {
      ensure(Array.isArray(row) && row.length===table.header.length,`Malformed source row: ${res} #${index+1}`);
      const cell=name=>{const data=row[columns[FIELDS[name]]]?.data;ensure(Array.isArray(data),`Missing cell: ${name}`);return data;};
      const scalar=name=>{const values=cell(name);ensure(values.length===1 && typeof values[0].text==='string',`Expected scalar source cell: ${name}`);return values[0].text.trim();};
      const modelText=cell('model').map(x=>x.text??'').join('').trim();
      ensure(modelText==='' || modelText===MODEL,`Source row model mismatch: ${modelText}`);
      const seconds=scalar('seconds'),displayedTokens=scalar('tokens'),long=scalar('long'),short=scalar('short'),ratios=cell('ratio').map(x=>x.text);
      ensure(secondsOptions.includes(seconds),'Unsupported source output duration');
      ensure(/^\d+$/.test(displayedTokens),'Invalid displayed token value');
      ensure(/^\d+$/.test(long) && /^\d+$/.test(short),'Invalid source dimensions');
      ensure(ratios.length>=1 && ratios.length<=2 && new Set(ratios).size===ratios.length,'Invalid grouped aspect ratios');
      for(const ratio of ratios) {
        ensure(ratioOptions.includes(ratio),`Unsupported source aspect ratio: ${ratio}`);
        const dims=E.DIMS[res]?.[ratio];ensure(dims,'Engine is missing supported dimensions');
        equivalent([long,short],[String(Math.max(...dims)),String(Math.min(...dims))],`Dimensions ${res}/${ratio}`);
        const key=`${res}|${ratio}|${seconds}`;ensure(!Object.hasOwn(entries,key),`Duplicate source specification: ${key}`);
        let minimum=null;const minimizingInputs=[];
        for(const input of inputOptions) {
          const value=compiled.evaluate({'时长-输入视频（秒）':input,'时长-输出视频（秒）':seconds,'长边（像素）':long,'短边（像素）':short,'帧率':fpsOptions[0]});
          evaluationCount++;ensure(E.cmp(value,'0')>0,'Source formula produced non-positive usage');
          const comparison=minimum===null?-1:E.cmp(value,minimum);
          if(comparison<0) {minimum=value;minimizingInputs.length=0;minimizingInputs.push(input);}
          else if(comparison===0)minimizingInputs.push(input);
        }
        ensure(E.fixed(minimum,0)===displayedTokens,`Source display mismatch at ${key}: captured ${displayedTokens}, derived ${E.fixed(minimum,0)}`);
        entries[key]={tokens:exactDecimal(minimum),displayedTokens,sourceFile,sourceTable:TABLE,sourceView:table.viewId,sourceField:FORMULA_FIELD,sourceRow:index+1,minimizingInputSeconds:minimizingInputs};
      }
    }
  }
  ensure(totalRows===192 && Object.keys(entries).length===288,'Incomplete minimum specification coverage');
  ensure(sha256(sourceFormula)===CAPTURE_FORMULA_SHA256,'Source formula differs from the versioned capture receipt');
  for(const res of resOptions)for(const ratio of ratioOptions)for(const seconds of secondsOptions)ensure(Object.hasOwn(entries,`${res}|${ratio}|${seconds}`),'Missing supported specification');
  sourceFiles[`${EVIDENCE_DIR}/calculator-fields.json`]=sha256(evidence.calculatorText);
  sourceFiles[`${EVIDENCE_DIR}/calculator-public.html`]=sha256(evidence.html);
  return {version:VERSION,model:MODEL,verifiedAt:DATE,sourceFormula,sourceFormulaSha256:sha256(sourceFormula),sourceDescription,sourceUrl:calculator.sourceUrl,sourceTable:TABLE,sourceField:FORMULA_FIELD,derivation:'Evaluate the captured source formula for every official input-duration option and select the exact minimum; verify zero-decimal display against each copied row.',inputSeconds:inputOptions,outputSeconds:secondsOptions,fps:fpsOptions[0],sourceRows:totalRows,specificationCount:Object.keys(entries).length,formulaEvaluationCount:evaluationCount,rowsByResolution,sourceFiles,entries};
}
function renderSnapshot(snapshot) {
  return '/* Generated by source-rules.cjs from captured evidence. Do not edit by hand. */\n(function(root){\n\'use strict\';\nconst snapshot = '+JSON.stringify(snapshot,null,2)+';\nroot.ReelayMinimumSnapshot=snapshot;\nif(typeof module!==\'undefined\')module.exports=snapshot;\n})(typeof window!==\'undefined\'?window:globalThis);\n';
}
function generate({root=__dirname,evidence,model=MODEL,check=false,write=true}={}) {
  const snapshot=validateEvidence(evidence??readEvidence(root),{model}),artifact=renderSnapshot(snapshot);
  const manifest={version:VERSION,model:MODEL,verifiedAt:DATE,sourceTable:TABLE,sourceField:FORMULA_FIELD,sourceFormulaSha256:snapshot.sourceFormulaSha256,sourceRows:snapshot.sourceRows,specificationCount:snapshot.specificationCount,formulaEvaluationCount:snapshot.formulaEvaluationCount,sourceFiles:snapshot.sourceFiles,generatedFile:'generated-minima.js',generatedSha256:sha256(artifact)};
  const manifestText=JSON.stringify(manifest,null,2)+'\n';
  const outputs=[['generated-minima.js',artifact],[`${EVIDENCE_DIR}/manifest.json`,manifestText]];
  if(check)for(const [name,content] of outputs)ensure(fs.existsSync(path.join(root,name)) && fs.readFileSync(path.join(root,name),'utf8')===content,`Generated artifact is stale: ${name}; run node source-rules.cjs`);
  else if(write)for(const [name,content] of outputs)fs.writeFileSync(path.join(root,name),content,'utf8');
  return {snapshot,manifest,artifact,manifestText};
}
module.exports={VERSION,MODEL,VIEWS,VARIABLES,decodeEntities,parseClipboard,extractCalculatorSnapshot,compileFormula,exactDecimal,readEvidence,validateEvidence,renderSnapshot,generate};
if(require.main===module) {
  try {ensure(process.argv.slice(2).every(arg=>arg==='--check'),'Only --check is supported');const result=generate({check:process.argv.includes('--check')});console.log(`${process.argv.includes('--check')?'Verified':'Generated'} ${result.snapshot.specificationCount} specifications from ${result.snapshot.sourceRows} source rows (${result.snapshot.formulaEvaluationCount} exact formula evaluations).`);}
  catch(error) {console.error(error.message);process.exitCode=1;}
}
