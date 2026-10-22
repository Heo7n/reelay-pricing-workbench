(()=>{'use strict';
const E=window.ReelayMath,R=window.ReelayRules,M=window.ReelayModels,F=window.ReelayProfiles,{$}={$:id=>document.getElementById(id)};
const {dec,add,sub,mul,div,cmp,ceil,fixed,trim,decimalString}=E;
const clone=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,d=8)=>trim(x,d),cash=(x,d=6)=>'¥'+fixed(x,d),decimal=(x,d=20)=>decimalString(x,d),uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const RES=Object.keys(E.DIMS),RATIOS=['21:9','16:9','4:3','1:1','3:4','9:16'],DISCOUNTS=['7.35','7.5','7.8','8','8.2','8.5','8.8','9','10'];
const PROCUREMENT_MODELS=Object.freeze({
 'seedance-2.0':Object.freeze({defaultQ:'0.735',supplierAvailable:true}),
 'seedance-2.5':Object.freeze({defaultQ:'1',supplierAvailable:false}),
 'seedance-2.0-fast':Object.freeze({defaultQ:'1',supplierAvailable:false})
});
const defaultProcurement=()=>Object.fromEntries(Object.entries(PROCUREMENT_MODELS).map(([model,spec])=>[model,spec.defaultQ]));
function validProcurementMap(map){return !!(map&&typeof map==='object'&&!Array.isArray(map)&&Object.keys(map).length===Object.keys(PROCUREMENT_MODELS).length&&Object.entries(map).every(([model,q])=>PROCUREMENT_MODELS[model]&&positive(q,false,6)&&+q<=10));}
function normalizeProcurement(p,model){
 const existing=p.procurementByModel;
 if(existing===undefined)p.procurementByModel={...defaultProcurement(),'seedance-2.0':p.q??'0.735'};
 else{
  if(!existing||typeof existing!=='object'||Array.isArray(existing)||Object.keys(existing).some(id=>!PROCUREMENT_MODELS[id]))throw Error('模型采购方案无效');
  p.procurementByModel={...defaultProcurement(),...existing};
  // q is a compatibility mirror. Its owner prevents changing the selected task
  // from copying another model's procurement assumption.
  if(PROCUREMENT_MODELS[p.procurementModel]&&p.q!==undefined)p.procurementByModel[p.procurementModel]=p.q;
 }
 if(!validProcurementMap(p.procurementByModel)||!PROCUREMENT_MODELS[model])throw Error('模型采购折扣无效');
 p.procurementModel=model;p.q=p.procurementByModel[model];
}
function procurementInfo(model=state.task.model,q=state.plan.procurementByModel[model]){
 const spec=PROCUREMENT_MODELS[model],simulated=!spec.supplierAvailable&&cmp(q,1)!==0;
 return{model,procurementRatio:decimal(q),supplierAvailable:spec.supplierAvailable,procurementSimulated:simulated,procurementStatus:spec.supplierAvailable?'已有折扣供应商':simulated?'模拟折扣 · 暂无供应商':'暂无折扣供应商 · 按刊例价'};
}
function activateProcurement(){
 const model=state.task.model||'seedance-2.0';
 if(state.plan.pricingModel!==model){captureProfile(state.plan);F.normalize(state.plan,model);}
 else captureProfile(state.plan);
}
const task=(res='1080p',ratio='21:9',seconds='15',video=true,vin='15',model='seedance-2.0')=>({model,res,ratio,seconds,video,vin});
const LEGACY_OBS=[
{id:'s1',title:'平台实测 · 原表第1行',params:task('480p','1:1','4',false,'2'),P:'1.784800',C:'1.311828',N:'',date:'',note:'用户确认为平台实际数据。只保留原表成本列；历史实际扣分与适用定价口径尚未单独确认。'},
{id:'s2',title:'平台实测 · 原表第2行',params:task('1080p','21:9','15',false,'2'),P:'37.520955',C:'27.577902',N:'',date:'',note:'原表平台实测成本。理论工作台不读取此金额。'},
{id:'s3',title:'平台实测 · 原表第3行',params:task('480p','1:1','4',true,'2'),P:'1.892800',C:'1.391208',N:'',date:'',note:'平台实测值1.892800元。与转述的官方预估约1.88元是不同来源，分别保留。'},
{id:'s4',title:'平台实测 · 原表第4行',params:task(),P:'45.550532',C:'33.479641',N:'',date:'',note:'视频输入15秒，输出1080p、21:9、15秒。平台实际成本只用于对照，不替代公式输出。'}];
// The supplier column in the user's source table is a calculation, not a paid bill.
const OBS=LEGACY_OBS.map((o,i)=>({...o,title:'立画实测 · 第'+(i+1)+'组',provider:'立画',C:'',N:['30','620','32','752'][i],costBasis:'platform-list',supplierReference:{q:'0.735',C:o.C},note:'用户提供的立画测试表。平台成本与实际积分为实测；新供应商成本列按平台成本 × 7.35折计算，仅作原表参考。'}));
function upgradePlatformRecords(records){return records.map(o=>{
 const index=LEGACY_OBS.findIndex(old=>!o.costBasis&&o.id===old.id&&o.title===old.title&&o.note===old.note&&o.date===old.date&&o.P===old.P&&o.C===old.C&&o.N===''&&key(o.params)===key(old.params));
 return index<0?o:{...o,...clone(OBS[index])};
});}
const REFS=[{id:'reference-188',title:'转述的官方预估约值',params:task('480p','1:1','4',true,'2'),P:'1.88',C:'',note:'用户转述约1.88元，不是精确官方结果，也不是平台实测记录。不进入任何理论计算或实测汇总。'}];
// Presets compare official billed Token usage across every supported output spec.
// Fractional pixel mappings matter: 4K 4:3 has slightly more pixels than 21:9.
const QUICK_TASKS={};
function quickTasks(model='seedance-2.0'){
if(QUICK_TASKS[model])return QUICK_TASKS[model];
const presets={},spec=M.get(model);
for(const video of [false,true])for(const extreme of ['min','max']){
 let best=null,bestTokens=null;
 for(const res of spec.resolutions)for(const ratio of RATIOS)for(let s=spec.seconds.min;s<=spec.seconds.max;s++){
  const t=task(res,ratio,String(s),video,String(extreme==='min'?spec.inputSeconds.min:spec.inputSeconds.max),model);
  const calc=M.estimate(t);if(calc.partial)continue;const tokens=calc.billedTokens;
  if(best===null||(extreme==='min'?cmp(tokens,bestTokens)<0:cmp(tokens,bestTokens)>0)){best=t;bestTokens=tokens;}
 }
 presets[(video?'video':'none')+'-'+extreme]=best;
}
QUICK_TASKS[model]=presets;return presets;
}
function defaults(){return{schema:'reelay.pricing.v9',plan:{company:'积分定价方案',pay:'100',total:'1538',discount:'7.35',q:'0.735',procurementModel:'seedance-2.0',procurementByModel:defaultProcurement(),modelPricing:F.defaults(),pricingModel:'seedance-2.0',limitPrecision:false,targetMode:'discount',margin:'8.125',giftMode:false,mode:'ideal',digits:12,round:'nearest',manualM:'1.538',basis:'本次充值含全部赠分；历史余额的现金价值须另行确认'},task:task('480p','1:1','4',true,'2'),rules:{version:R.VERSION,minima:R.buildMinima(),legacyMinima:{}},workspace:'theory',tab:'discounts',taskCostInput:null,tasks:[],observations:clone(OBS),references:clone(REFS),recharges:[{pay:'100',total:'1500'},{pay:'100',total:'1538'},{pay:'100',total:'1600'}],rechargeMode:'fixed',frozenM:null,matrixAxis:'specs',matrixMetric:'N'};}
const KEY='reelay_pricing_v9_official' ;let state=defaults(),globalValid=true,modelValid=true,platformValid=true,tableRows=[],actualRows=[],drawerName='',lastFocus=null;
function positive(x,zero=false,maxdigits=20){let s=String(x);return s.length<48&&/^\d+(\.\d+)?$/.test(s)&&(!s.includes('.')||s.split('.')[1].length<=maxdigits)&&(zero?+s>=0:+s>0)&&+s<1e12;}
function validTask(t,allowAuto=true){try{
 const spec=M.get(t?.model),seconds=M.normalizeSeconds(t.seconds,t.model);
 return !!(spec.resolutions.includes(t.res)&&[...RATIOS,...(allowAuto?['auto']:[])].includes(t.ratio)&&(seconds!=='auto'||allowAuto&&t.seconds==='auto')&&typeof t.video==='boolean'&&(!t.video||positive(t.vin,false,4)&&+t.vin>=spec.inputSeconds.min&&+t.vin<=spec.inputSeconds.max));
}catch(_){return false;}}
function txt(s,n){return typeof s==='string'&&s.length<=n;}
function validObservation(o){return !!(o&&txt(o.id,100)&&txt(o.title,100)&&validTask(o.params,false)&&txt(o.note,1000)&&txt(o.date,100)&&(o.P===''||positive(o.P))&&(o.C===''||positive(o.C,true))&&(o.P!==''||o.C!=='')&&(o.N===''||/^\d+$/.test(o.N)&&+o.N<1e12)&&(!o.usage||/^\d+$/.test(o.usage)&&+o.usage>0&&+o.usage<1e12)&&(o.costBasis===undefined||['recorded','platform-list'].includes(o.costBasis))&&(o.costBasis!=='platform-list'||o.P!==''&&o.C==='')&&(o.provider===undefined||txt(o.provider,60))&&(o.supplierReference===undefined||o.supplierReference&&positive(o.supplierReference.q,false,6)&&+o.supplierReference.q<=10&&positive(o.supplierReference.C,true)));}
function validReference(r){return !!(r&&txt(r.id,100)&&txt(r.title,100)&&(r.params===null||validTask(r.params))&&txt(r.note,1000)&&(r.P===''||positive(r.P))&&(r.C===''||positive(r.C,true)));}
function validTarget(p){return p.targetMode==='margin'?positive(p.margin,true,4)&&+p.margin<100:positive(p.discount,false,4)&&+p.discount<=100;}
function validPlan(p){return !!(p&&txt(p.company,60)&&positive(p.pay,false,2)&&positive(p.total,false,4)&&txt(p.discount,48)&&txt(p.margin,48)&&(p.mode==='manual'||validTarget(p))&&positive(p.q,false,6)&&+p.q<=10&&['discount','margin'].includes(p.targetMode)&&typeof p.giftMode==='boolean'&&['ideal','saved','manual'].includes(p.mode)&&Number.isInteger(p.digits)&&p.digits>=0&&p.digits<=20&&['nearest','truncate'].includes(p.round)&&txt(p.manualM,48)&&(p.mode!=='manual'||positive(p.manualM,false,20))&&txt(p.basis,500));}
function key(t){return[t.model||'seedance-2.0',t.res,t.ratio,t.seconds==='auto'?'auto':M.normalizeSeconds(t.seconds,t.model),t.video?'video':'none',t.video?num(dec(t.vin),4):'0'].join('|');}

function minimumKey(t,version=state.rules.version){return !t.model||t.model==='seedance-2.0'?R.key(t,version):M.key(t);}
function wholeInputSeconds(value,model=state.task.model){
 const limits=M.get(model).inputSeconds;
 if(!positive(value,false,4)||cmp(value,limits.min)<0||cmp(value,limits.max)>0)throw Error('输入视频总时长须为'+limits.min+'～'+limits.max+'秒。');
 return num(ceil(value),0);
}
function normalizeTask(t,roundInput=true){const n={model:'seedance-2.0',...clone(t)};if(n.seconds!=='auto')n.seconds=M.normalizeSeconds(n.seconds,n.model);n.vin=n.video?(roundInput?wholeInputSeconds(n.vin,n.model):num(dec(n.vin),4)):'2';return n;}
// Legacy range drafts become editable fixed tasks; explicit choices stay intact.
function fixedTask(t){return normalizeTask({...t,ratio:t.ratio==='auto'?'16:9':t.ratio,seconds:t.seconds==='auto'?'15':t.seconds});}
function fixedTaskNotice(t){const changed=[];if(t?.ratio==='auto')changed.push('比例 16:9');if(t?.seconds==='auto')changed.push('输出 15 秒');return changed.length?'旧范围参数已设为'+changed.join('、')+'，可直接调整。':'';}
function normalizeMinimumKeys(input){
 const n=clone(input),out={};
 for(const [oldKey,r] of Object.entries(n.rules.minima||{})){
  const a=oldKey.split('|');let k;
  if(a.length===5&&a[0]==='seedance-2.0'&&a[1]===n.rules.version&&RES.includes(a[2])&&RATIOS.includes(a[3]))k=minimumKey({res:a[2],ratio:a[3],seconds:a[4]},n.rules.version);
  else if(a.length===5&&M.MODELS[a[0]]&&a[1]===M.get(a[0]).version)k=M.key({model:a[0],res:a[2],ratio:a[3],seconds:a[4]});
  else if(a.length===5&&RES.includes(a[0])&&RATIOS.includes(a[1])&&a[3]==='video')k=minimumKey({res:a[0],ratio:a[1],seconds:a[2]},n.rules.version);
  else throw Error('最低用量规则键无效，请核对模型、规则版本与输出规格。');
  if(!k||out[k]&&cmp(out[k].tokens,r.tokens)!==0)throw Error('同一输出规格存在冲突门槛，请先核对来源。');
  out[k]=clone(r);
 }
 n.rules.minima=out;return n;
}
function upgradeState(input){
 let n=clone(input);const old=n.schema==='reelay.pricing.v8';
 if(!old&&n.schema!=='reelay.pricing.v9')throw Error('不支持的方案版本');
 if(!n.plan||!n.rules||!Array.isArray(n.tasks)||!Array.isArray(n.observations))throw Error('方案字段不完整');
 const storedProcurement=n.plan.procurementByModel,storedProcurementModel=n.plan.procurementModel,storedProfiles=n.plan.modelPricing,storedPricingModel=n.plan.pricingModel;
 n.plan={...defaults().plan,...n.plan,procurementByModel:storedProcurement,procurementModel:storedProcurementModel,modelPricing:storedProfiles,pricingModel:storedPricingModel};if(['企业 A · 定价方案','企业 A · 讨论方案'].includes(n.plan.company))n.plan.company='积分定价方案';n.task=fixedTask(n.task);if(storedProfiles===undefined)normalizeProcurement(n.plan,n.task.model);F.normalize(n.plan,n.task.model);n.frozenM=null;n.tasks=n.tasks.map(r=>({...r,params:normalizeTask(r.params)}));n.observations=n.observations.map(o=>({...o,params:normalizeTask(o.params,false),usage:o.usage||''}));
 // Legacy gift entry stored the computed total already; retain that total unchanged.
 n.plan.giftMode=false;
 n.observations=upgradePlatformRecords(n.observations);
 if(old){n.rules={version:R.VERSION,minima:R.buildMinima(),legacyMinima:clone(n.rules.minima||{})};n.schema='reelay.pricing.v9';}
 else{
  if(n.rules.version!==R.VERSION){
   if(!R.PREVIOUS_VERSIONS.includes(n.rules.version))throw Error('规则版本与本文件不符，请先核对来源');
   n=normalizeMinimumKeys(n);
   const previous=n.rules.version,updated=R.buildMinima(),archived=clone(n.rules.legacyMinima||{});
   for(const [k,v] of Object.entries(n.rules.minima)){
    if(!positive(v.tokens,false,12)||!txt(v.note,500)||!v.note.trim())throw Error('门槛数据或来源无效');
    const a=k.split('|');if(a[0]!=='seedance-2.0'){updated[k]=v;continue;}const nextKey=minimumKey({res:a[2],ratio:a[3],seconds:a[4]},R.VERSION);
    if(v.kind==='manual')updated[nextKey]=v;
    else if(v.kind!=='official'||cmp(v.tokens,updated[nextKey].tokens)!==0)archived[k]=v;
   }
   n.rules={...n.rules,version:R.VERSION,minima:updated,legacyMinima:archived,previousVersion:previous};
  }
  n=normalizeMinimumKeys(n);const official=R.buildMinima();
  for(const [k,v] of Object.entries(n.rules.minima)){
   const parts=k.split('|'),known=official[k]||M.officialMinimum({model:parts[0],res:parts[2],ratio:parts[3],seconds:parts[4]});
   if(!known||!positive(v.tokens,false,12)||!txt(v.note,500)||!v.note.trim())throw Error('门槛数据或来源无效');
   official[k]=v.kind==='official'&&cmp(v.tokens,known.tokens)===0?known:{tokens:v.tokens,note:v.note,kind:'manual'};
  }
  n.rules.minima=official;
 }
 if(n.workspace==='platform')n.workspace='theory';
 if(!validState(n))throw Error('方案参数无效');validateModelPricing(n.plan);return n;
}
function validState(s){if(!(s&&s.schema==='reelay.pricing.v9'&&validPlan(s.plan)&&validTask(s.task,false)&&s.rules&&s.rules.version===R.VERSION&&s.rules.minima&&typeof s.rules.minima==='object'&&!Array.isArray(s.rules.minima)&&['theory','actual'].includes(s.workspace)&&['discounts','tasks','matrix','recharges'].includes(s.tab)&&Array.isArray(s.tasks)&&s.tasks.length<=100&&Array.isArray(s.observations)&&s.observations.length<=200&&Array.isArray(s.references)&&s.references.length<=200&&Array.isArray(s.recharges)&&s.recharges.length<=50&&['reprice','fixed'].includes(s.rechargeMode)&&['specs','ratios'].includes(s.matrixAxis)&&['N','raw','P','C','cash'].includes(s.matrixMetric)))return false;
if(s.taskCostInput!=null&&!(s.taskCostInput&&txt(s.taskCostInput.taskKey,160)&&txt(s.taskCostInput.recordId,100)&&txt(s.taskCostInput.value,48)&&(s.taskCostInput.value===''||positive(s.taskCostInput.value,true,20))))return false;
if(!F.valid(s.plan)||!validProcurementMap(s.plan.procurementByModel)||!PROCUREMENT_MODELS[s.plan.procurementModel]||!s.tasks.every(t=>t&&txt(t.id,100)&&txt(t.title,100)&&validTask(t.params,false)&&/^\d+$/.test(String(t.qty))&&+t.qty>=1&&+t.qty<=100000)||!s.observations.every(validObservation)||!s.references.every(validReference)||!s.recharges.every(r=>positive(r.pay,false,2)&&positive(r.total,false,4)))return false;
if(Object.keys(s.rules.minima).length>2000)return false;for(const [k,r] of Object.entries(s.rules.minima)){if(!txt(k,120)||!r||!positive(r.tokens,false,12)||!txt(r.note,500)||!r.note.trim())return false;}
return s.frozenM===null||s.frozenM&&/^\d{1,80}$/.test(s.frozenM.n)&&/^\d{1,80}$/.test(s.frozenM.d)&&BigInt(s.frozenM.d)>0n;}
let migrationNotice='',taskMigrationNotice='';
try{const raw=localStorage.getItem(KEY)||localStorage.getItem('reelay_pricing_v81_dual_breakdown')||localStorage.getItem('reelay_pricing_v8_theory_isolated');if(raw){const saved=JSON.parse(raw);state=upgradeState(saved);taskMigrationNotice=fixedTaskNotice(saved.task);}}catch(err){migrationNotice='旧草稿未导入：'+err.message+'。原草稿仍保留。';}

let lastValidPlan=clone(state.plan);
function idealPricing(p=state.plan){return E.plan({pay:p.pay,total:p.total,discount:p.discount,q:p.q,k:'10',targetMode:p.targetMode,margin:p.margin});}
function calculatePricing(p){let applied='';if(p.mode==='saved')applied=decimalString(idealPricing(p).M,p.digits,p.round);if(p.mode==='manual')applied=p.manualM;return {...E.plan({pay:p.pay,total:p.total,discount:p.discount,q:p.q,k:'10',targetMode:p.targetMode,margin:p.margin,appliedM:applied,targetAvailable:p.mode!=='manual'&&validTarget(p)}),pricingMode:p.mode};}
function pricing(over={}){return calculatePricing({...F.forModel(state.plan,state.task.model),...over});}
function captureProfile(p){
 const mirror=Object.fromEntries(F.FIELDS.map(field=>[field,p[field]]));
 if(!F.validProfile(mirror))return false;
 const common=positive(p.pay,false,2)&&positive(p.total,false,4)?p:lastValidPlan;
 try{calculatePricing({...p,pay:common.pay,total:common.total});}catch(_){return false;}
 return F.capture(p);
}
function validateModelPricing(p){
 for(const model of Object.keys(PROCUREMENT_MODELS)){
  try{calculatePricing(F.forModel(p,model));}catch(e){throw Error(M.get(model).label+'：'+e.message+'，请检查定价目标与倍率精度。');}
 }
}
function pricingForModel(model=state.task.model,over={}){return pricing({...F.forModel(state.plan,model||'seedance-2.0'),...over});}
// Model quotes have no dependency on procurement, recharge, points or observations.
function quote(t=state.task,rules=state.rules){
 const model=t.model||'seedance-2.0',lookup=minimumKey(t,rules.version);
 const m=t.video?(Object.prototype.hasOwnProperty.call(rules.minima,lookup)?rules.minima[lookup]:model==='seedance-2.0'?null:M.officialMinimum(t)):null;
 const calc=M.estimate(t,m);
 return{range:false,calc,rule:m,partial:!!calc.partial,source:'official-calculator-lookup',scope:'model-estimate',model};
}
function theoryOne(t,rules,p=pricingForModel(t.model||'seedance-2.0')){const v=quote(t,rules);if(!v.calc.P||v.partial)return{...v,x:null};return{...v,x:E.settle(v.calc.P,mul(v.calc.P,p.q),p),scope:'theory',procurement:procurementInfo(v.model,p.q)};}
function theory(t=state.task,rules=state.rules,p=pricingForModel(t.model||'seedance-2.0')){return theoryOne(t,rules,p);}
function current(){return theory();}
function label(t){return`${M.get(t.model).label} · ${t.res==='4k'?'4K':t.res} · ${t.ratio==='auto'?'全部比例':t.ratio} · ${t.seconds==='auto'?'未确定':t.seconds+'秒'}`;}
function vinLabel(t){return t.video?'视频输入 '+t.vin+'秒':'无视频输入';}
function coverage(v){return v.partial?'规则缺项 · 仅基础演算':v.rule?.kind==='manual'?'人工门槛 · 待核验':'参数预估';}
function setInput(id,value){const el=$(id);if(el&&document.activeElement!==el)el.value=value;}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),3800);}
function persist(){
 if(!modelValid){$('storage-status').textContent='生成参数待修正，尚未保存';return;}
 if(platformValid)lastValidPlan=clone(state.plan);
 const saved={...state,plan:{...clone(lastValidPlan),modelPricing:clone(state.plan.modelPricing)}};
 F.normalize(saved.plan,state.task.model);
 try{localStorage.setItem(KEY,JSON.stringify(saved));$('storage-status').innerHTML='<i class="live-dot"></i>'+ (platformValid?'本地草稿已保存':'输入待修正 · 已保存有效设置');}catch(_){$('storage-status').textContent='浏览器未保存草稿，请导出方案留存。';}
}
function openDrawer(name,title,subtitle,html,wide=false){closePlan();closeQuickOptions();if($('modal').hidden)lastFocus=document.activeElement;drawerName=name;$('drawer-title').textContent=title;$('drawer-sub').textContent=subtitle;$('drawer-sub').hidden=!subtitle;$('drawer-body').innerHTML=html;$('drawer-footer').replaceChildren();$('drawer-footer').hidden=true;$('drawer').classList.toggle('wide',wide);$('modal').dataset.panel=name;$('modal').classList.toggle('centered',['usage','calculation','profiles','plan'].includes(name));$('modal').hidden=false;document.body.classList.add('modal-open');if(name==='usage'){usageJumpPosition=null;setUsageSection('usage-calculation');$('drawer-body').scrollTop=0;}$('close-drawer').focus();}
function closeDrawer(){if($('modal').hidden)return;$('modal').hidden=true;document.body.classList.remove('modal-open');drawerName='';if(lastFocus?.isConnected)lastFocus.focus();}
function table(headers,rows,cls=''){return'<table class="'+cls+'"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';}
const td=(s,cls='number')=>'<td class="'+cls+'">'+s+'</td>',minus=(a,b)=>{const d=sub(a,b);return(cmp(d,0)>0?'+':'')+num(d,10);};
let multiplierEdit=null;
function renderMultiplierEditor(){
 const editing=!!multiplierEdit;
 $('manual-m-control').hidden=!editing;$('auto-multiplier').hidden=editing;
 $('edit-multiplier').setAttribute('aria-expanded',String(editing));
 $('restore-auto-multiplier').hidden=state.plan.mode!=='manual';
 if(!editing){$('multiplier-edit-error').hidden=true;$('manual-m').setAttribute('aria-invalid','false');}
}
function validateMultiplierEdit(){
 const valid=positive($('manual-m').value.trim(),false,20);
 $('multiplier-edit-error').hidden=valid;$('multiplier-edit-error').textContent=valid?'':'倍率须大于0，最多20位小数。';
 $('manual-m').setAttribute('aria-invalid',String(!valid));$('save-multiplier').disabled=!valid;
 return valid;
}
function beginMultiplierEdit(){
 closePlan();

 let value=state.plan.manualM,preserveUnchanged=true;
 if(state.plan.mode!=='manual')try{value=decimal(pricing().usedM,12);if(!positive(value,false,20))value=decimal(pricing().usedM,20);}catch(_){preserveUnchanged=false;if(!positive(value,false,20))value='1.538';}
 multiplierEdit={model:state.task.model,initial:value,preserveUnchanged};$('manual-m').value=value;
 renderMultiplierEditor();validateMultiplierEdit();$('manual-m').focus();$('manual-m').select();
}
function cancelMultiplierEdit(focus=false){multiplierEdit=null;renderMultiplierEditor();if(focus)$('edit-multiplier').focus();}
function saveMultiplierEdit(){
 if(!multiplierEdit||!validateMultiplierEdit())return;
 const value=$('manual-m').value.trim(),unchanged=multiplierEdit.preserveUnchanged&&positive(multiplierEdit.initial,false,20)&&cmp(value,multiplierEdit.initial)===0;
 // Opening an approximate display and saving it unchanged must not quantize the rule.
 if(!unchanged){state.plan.manualM=value;state.plan.mode='manual';}
 multiplierEdit=null;render();$('edit-multiplier').focus();
}
function useAutomaticPricing(basis=state.plan.targetMode){
 cancelMultiplierEdit();state.plan.targetMode=basis;state.plan.mode=state.plan.limitPrecision?'saved':'ideal';
}
function renderPricingMode(manual){
 if(multiplierEdit&&multiplierEdit.model!==state.task.model)cancelMultiplierEdit();
 const basis=state.plan.targetMode;$('pricing-basis').value=basis;
 $('discount-control').hidden=basis!=='discount';$('margin-control').hidden=basis!=='margin';
 $('plan-settings').hidden=manual;$('discount-picks').hidden=false;renderMultiplierEditor();
 const valid=manual?positive(state.plan.manualM,false,20):validTarget(state.plan);
 $('target-validation').hidden=valid;$('target-validation').textContent=manual?'倍率须大于0，最多20位小数。':'请输入有效的定价目标。';
 for(const [id,shown] of [['discount',basis==='discount'],['target-margin',basis==='margin']])$(id).setAttribute('aria-invalid',String(!manual&&shown&&!valid));
 setInput('pay',state.plan.pay);setInput('total',state.plan.total);
 if(manual){
  let outcome=null;try{outcome=policyOutcome(pricing());}catch(_){}
  setInput('discount',outcome?num(outcome.discount,4):'');setInput('target-margin',outcome?decimal(outcome.margin,4):'');
 }else{setInput('discount',state.plan.discount);setInput('target-margin',state.plan.margin);}
 $('discount').title=manual?'由当前倍率计算；修改折扣将恢复自动计算倍率。':'以刊例价为基准的取整前折扣；10折表示无折扣。';
 $('target-margin').title=manual?'由当前倍率计算；修改毛利率将恢复自动计算倍率。':'未计逐任务扣分取整的模型毛利率目标。';
 document.querySelector('label[for="target-margin"]').textContent=manual?'模型毛利率':'目标模型毛利率';
 if(positive(state.plan.q,false,6))setInput('purchase-discount',num(mul(state.plan.q,10),6));
 const purchaseValues=PROCUREMENT_MODELS[state.task.model].supplierAvailable?['10','7.35']:['10'];
 $('purchase-picks').innerHTML=purchaseValues.map(d=>{const selected=positive(state.plan.q,false,6)&&cmp(mul(state.plan.q,10),d)===0;return `<button type="button" data-purchase="${d}" aria-pressed="${selected}" class="${selected?'active':''}">${d==='10'?'无折扣':d+'折'}</button>`;}).join('');
}
function policyOutcome(p){return{discount:mul(div(mul(mul(p.q,p.usedM),p.K),p.S),10),margin:mul(sub(1,div(p.S,mul(p.usedM,p.K))),100)};}
function renderPlan(){
 const p=pricing(),manual=state.plan.mode==='manual',outcome=policyOutcome(p);
 const perPoint=num(p.U,6);$('per-point').textContent=perPoint;$('point-price-sign').textContent='';
 $('point-price').title='实际支付 ÷ 到账总积分；每积分约 '+num(p.U,20)+' 元';
 $('per-yuan').textContent=num(p.S,4);$('points-per-yuan').firstChild.textContent='每元 ';$('points-per-yuan').title='到账总积分 ÷ 实际支付 = '+num(p.S,20)+' 积分/元';
 const multiplier=num(p.usedM,12);$('multiplier').textContent=multiplier;
 $('multiplier').title='采用倍率：'+num(p.usedM,20);
 $('m-state').hidden=manual||state.plan.mode!=='saved';$('m-state').textContent=state.plan.mode==='saved'?'最多 '+state.plan.digits+' 位小数 · '+(state.plan.round==='truncate'?'截断':'四舍五入'):'';
 const picks=$('discount-picks');picks.dataset.mode=p.targetMode;picks.setAttribute('aria-label',p.targetMode==='margin'?'目标毛利率快捷值':'客户折扣快捷值');
 picks.innerHTML=(p.targetMode==='margin'?['0','10','20'].map(g=>`<button type="button" data-margin="${g}" aria-pressed="${!manual&&validTarget(state.plan)&&cmp(g,state.plan.margin)===0}" class="${!manual&&validTarget(state.plan)&&cmp(g,state.plan.margin)===0?'active':''}">${g}%</button>`):['10','7.35','7.8','8'].map(d=>`<button type="button" data-discount="${d}" aria-pressed="${!manual&&validTarget(state.plan)&&cmp(d,state.plan.discount)===0}" class="${!manual&&validTarget(state.plan)&&cmp(d,state.plan.discount)===0?'active':''}">${d==='10'?'无折扣':d+'折'}</button>`)).join('');
 $('plan-principle').innerHTML=p.targetMode==='margin'?`<span>折合客户折扣 <b class="num">${num(outcome.discount,4)}折</b></span>`:`<span>模型毛利率 <b class="num ${cmp(outcome.margin,0)<0?'loss':''}">${num(outcome.margin,4)}%</b></span>`;
 const messages=[];
 if(cmp(outcome.margin,0)<0)messages.push('取整前亏损；保本倍率为 '+num(p.breakEvenM,12)+'。');
 if(cmp(outcome.discount,10)>0)messages.push('客户价格高于刊例价 '+num(mul(sub(div(outcome.discount,10),1),100),2)+'%。');
 $('policy-notice').hidden=!messages.length;$('policy-notice').textContent=messages.join(' ');$('policy-notice').classList.toggle('loss',cmp(outcome.margin,0)<0);
 $('migration-note').hidden=!migrationNotice;$('migration-note').textContent=migrationNotice;
}

function renderSlider(id,value){
 const el=$(id),display=$(id+'-value');
 setInput(id,value);
 const label=num(dec(value),4)+' 秒';
 if(display)display.textContent=label;el.setAttribute('aria-valuetext',label);
 el.style.setProperty('--range-progress',((Number(value)-Number(el.min))/(Number(el.max)-Number(el.min))*100)+'%');
}
let videoModeRendered=null,videoCloseTimer=null;
function finishVideoClose(){
 if(videoModeRendered!==false)return;
 clearTimeout(videoCloseTimer);videoCloseTimer=null;
 $('video-detail').hidden=true;$('video-input-control').classList.remove('is-closing');
}
function renderVideoControl(video){
 const control=$('video-input-control'),detail=$('video-detail'),previous=videoModeRendered;
 $('video-options').querySelectorAll('[data-video]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.video==='true')===video)));
 detail.setAttribute('aria-hidden',String(!video));detail.toggleAttribute('inert',!video);
 if(previous===video)return;
 videoModeRendered=video;clearTimeout(videoCloseTimer);videoCloseTimer=null;
 if(video){
  detail.hidden=false;control.classList.remove('is-closing');control.classList.add('is-video');
 }else{
  if(detail.contains(document.activeElement))$('video-options').querySelector('[data-video="false"]').focus();
  control.classList.remove('is-video');
  if(previous===true&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   control.classList.add('is-closing');videoCloseTimer=setTimeout(finishVideoClose,260);
  }else finishVideoClose();
 }
}
function renderComposer(){
 const t=state.task,spec=M.get(t.model);
 $('model').innerHTML=['seedance-2.5','seedance-2.0','seedance-2.0-fast'].map(id=>M.get(id)).map(m=>`<option value="${m.id}">${m.label}</option>`).join('');$('model').value=spec.id;
 $('res-options').innerHTML=spec.resolutions.map(r=>`<button data-res="${r}" class="${r===t.res?'active':''}" aria-pressed="${r===t.res}">${r==='4k'?'4K':r}</button>`).join('');
 $('seconds').max=String(spec.seconds.max);$('vin-slider').max=String(spec.inputSeconds.max);$('vin').max=String(spec.inputSeconds.max);$('seconds-max-label').textContent=spec.seconds.max+' 秒';
 $('ratio-options').innerHTML=RATIOS.map(r=>{const[a,b]=r.split(':').map(Number),h=a/b<1?19:13;return`<button data-ratio="${r}" class="${r===t.ratio?'active':''}" aria-pressed="${r===t.ratio}"><i class="frame" style="width:${h*a/b}px;height:${h}px"></i>${r}</button>`;}).join('');
 renderSlider('seconds',t.seconds);setInput('vin',t.vin);
 renderSlider('vin-slider',t.vin);$('vin-slider').disabled=!t.video;
 $('vin').disabled=!t.video;renderVideoControl(t.video);
 document.querySelectorAll('[data-example]').forEach(b=>{
  const preset=quickTasks(spec.id)[b.dataset.example];b.disabled=!preset;
  if(!preset){b.classList.remove('active');b.setAttribute('aria-pressed','false');b.querySelector('span').textContent='—';b.querySelector('small').textContent='规则待补齐';return;}
  const active=key(t)===key(preset);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  b.querySelector('span').textContent=`${preset.res==='4k'?'4K':preset.res} · ${preset.ratio}`;
  b.querySelector('small').innerHTML=`<span>输出 ${preset.seconds} 秒</span>${preset.video?'<span>输入 '+preset.vin+' 秒</span>':''}`;
  b.setAttribute('aria-label',`${preset.video?'有':'无'}视频输入，${b.dataset.example.endsWith('min')?'最低':'最高'}用量，${label(preset)}${preset.video?'，输入 '+preset.vin+' 秒':''}`);
 });
 $('pixels').textContent=spec.dims[t.res][t.ratio].join(' × ')+' 像素';
}

let quickCloseTimer=null;
const quickIsOpen=()=>$('quick-toggle').getAttribute('aria-expanded')==='true';
function finishQuickClose(){
 if(quickIsOpen())return;
 $('quick-drawer').hidden=true;$('quick-drawer').style.height='0px';$('quick-toggle').closest('.quick-config').classList.remove('is-visible');
 clearTimeout(quickCloseTimer);quickCloseTimer=null;
}
function closeQuickOptions(restoreFocus=false){
 const panel=$('quick-drawer'),toggle=$('quick-toggle');if(!quickIsOpen())return;
 toggle.setAttribute('aria-expanded','false');
 if(restoreFocus||panel.contains(document.activeElement))toggle.focus({preventScroll:true});
 panel.setAttribute('inert','');panel.setAttribute('aria-hidden','true');
 toggle.closest('.quick-config').classList.remove('is-open');
 clearTimeout(quickCloseTimer);
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)finishQuickClose();
 else quickCloseTimer=setTimeout(finishQuickClose,260);
}
function revealQuickOption(option=document.activeElement){
 const content=$('quick-content');if(!quickIsOpen()||!content.contains(option)||!content.clientHeight)return;
 const bounds=content.getBoundingClientRect(),item=option.getBoundingClientRect();if(!item.height)return;
 if(item.top<bounds.top+6)content.scrollTop+=item.top-bounds.top-6;
 else if(item.bottom>bounds.bottom-6)content.scrollTop+=item.bottom-bounds.bottom+6;
}
function positionQuickOptions(){
 if(!quickIsOpen())return;
 const panel=$('quick-drawer'),content=$('quick-content'),toggle=$('quick-toggle');
 const anchor=toggle.getBoundingClientRect(),gutter=8,viewportHeight=window.innerHeight;
 if(anchor.height>0&&(anchor.bottom<=0||anchor.top>=viewportHeight)){closeQuickOptions();return;}
 // Match the Token block's top while keeping the drawer joined to the trigger by 1px.
 const metrics=$('usage-metrics').getBoundingClientRect();
 const aligned=metrics.height>0&&metrics.top>=0&&metrics.top<anchor.top;
 const preferred=aligned?anchor.top+1-metrics.top:content.scrollHeight?content.scrollHeight+1:160;
 const above=Math.max(0,anchor.top-gutter),below=Math.max(0,viewportHeight-anchor.bottom-gutter);
 const upward=aligned||above>=preferred||above>=below,available=upward?above:below;
 if(!available){closeQuickOptions();return;}
 const height=aligned?preferred:Math.min(preferred,240,available);
 content.style.maxHeight=height+'px';panel.style.height=height+'px';
 panel.dataset.placement=upward?'above':'below';toggle.closest('.quick-config').classList.toggle('is-below',!upward);
 revealQuickOption();
}
function openQuickOptions(){
 const panel=$('quick-drawer'),toggle=$('quick-toggle');
 clearTimeout(quickCloseTimer);quickCloseTimer=null;
 panel.hidden=false;panel.removeAttribute('inert');panel.setAttribute('aria-hidden','false');
 // Clip the full-height tray while its content slides out from the trigger edge.
 toggle.setAttribute('aria-expanded','true');positionQuickOptions();
 if(!quickIsOpen())return;
 void panel.offsetHeight;
 toggle.closest('.quick-config').classList.add('is-visible','is-open');
 if(quickIsOpen()){
  const option=panel.querySelector('[data-example].active:not(:disabled)')||panel.querySelector('[data-example]:not(:disabled)')||toggle;
  option.focus({preventScroll:true});revealQuickOption(option);
 }
}
function tokenText(value,digits=12){return num(value,digits).split('.').map((part,i)=>i?part:part.replace(/\B(?=(\d{3})+(?!\d))/g,',')).join('.');}
function renderUsage(v,t){
 const c=v.calc,rule=v.rule,manual=rule?.kind==='manual',hasMinimum=t.video&&!!rule;
 $('usage-summary').hidden=false;$('usage-help').disabled=false;
 $('usage-metrics').setAttribute('aria-label',t.video?'估算与最低 Token 用量':'估算 Token 用量');
 $('usage-metrics').classList.toggle('is-single',!t.video);
 $('token-minimum-metric').hidden=!t.video;
 const show=(id,value)=>{const el=$(id);el.textContent=tokenText(value,8);el.title=tokenText(value)+' Token';el.style.setProperty('--token-chars',el.textContent.length);el.scrollLeft=0;};
 show('token-estimate',c.tokens);
 $('token-minimum').removeAttribute('title');
 if(hasMinimum)show('token-minimum',rule.tokens);else $('token-minimum').textContent=t.video?'待补齐':'不适用';
 $('token-minimum-label').textContent='最低 Token 用量';
 $('token-minimum-kind').hidden=!manual;$('token-minimum-kind').textContent=manual?'人工':'';
 const useMinimum=!v.partial&&hasMinimum&&cmp(c.tokens,rule.tokens)<0;
 const useBase=t.video&&!v.partial&&!useMinimum;
 for(const [name,adopted] of [['estimate',useBase],['minimum',useMinimum]]){
  $('token-'+name+'-metric').classList.toggle('is-adopted',adopted);
  $('token-'+name+'-adopted').hidden=!adopted;
 }
 const note=$('coverage-note');note.hidden=true;note.textContent='';
 if(v.partial){note.hidden=false;note.textContent='最低用量待补齐 · 仅基础估算';}
 if(drawerName==='usage'&&!$('modal').hidden)renderUsagePanel(v,t);
}
// Integrate the captured calculator descriptions with the current calculation.
// Preserve the output-dimension formula, video-only minimum and API usage caveat.
function usageCalculation(v,t){
 const c=v.calc,model=M.get(v.model||t.model);
 const context=`${model.label} · ${t.res==='4k'?'4K':t.res} · ${t.ratio} · 输出 ${t.seconds} 秒 · ${vinLabel(t)}`;
 const heading=`<div class="usage-section-heading"><h3>本次计算</h3></div><p class="usage-calculation-context" id="usage-calculation-context">${esc(context)}</p>`;
 if(!c.wh||c.tokens===null)return `<section class="usage-calculation" id="usage-calculation">${heading}<p>输出规格未确定，暂不能展开计算。</p></section>`;
 const value=n=>{const q=dec(n),shown=num(q,20);return cmp(q,shown)===0?tokenText(q,20):`${q.n} / ${q.d}`;};
 const step=(key,title,formula,substitution,note='')=>`<li data-step="${key}"><h4>${title}</h4><div><p class="usage-formula">${formula}</p><p class="usage-substitution">${substitution}</p>${note?`<p class="usage-calculation-note">${note}</p>`:''}</div></li>`;
 const estimate=step('estimate','估算 Token 用量',
  '(输入视频时长 + 输出视频时长) × 输出宽 × 输出高 × 输出帧率 ÷ 1,024',
  `(${value(t.video?t.vin:'0')} + ${value(t.seconds)}) × ${value(c.wh[0])} × ${value(c.wh[1])} × ${value(model.fps)} ÷ 1,024 = <strong id="usage-calc-estimate">${value(c.tokens)}</strong> Token`);
 let billed;
 if(v.partial){
  billed=step('billed','计费 Token 用量','max(估算 Token 用量, 最低 Token 用量)',
   '<strong id="usage-calc-billed">待补齐</strong>','当前规格的最低 Token 用量待补齐，暂不能确定计费 Token 用量。');
 }else if(t.video){
  const useMinimum=cmp(c.tokens,c.minimum)<0;
  billed=step('billed','计费 Token 用量','max(估算 Token 用量, 最低 Token 用量)',
   `max(${value(c.tokens)}, ${value(c.minimum)}) = <strong id="usage-calc-billed">${value(c.billedTokens)}</strong> Token <span class="usage-choice">采用${useMinimum?'最低':'估算'} Token 用量</span>`,
   v.rule?.kind==='manual'?`<span class="usage-override">最低 Token 用量由人工设置。<br>${esc(v.rule.note)}</span>`:'有视频输入时适用最低用量，按模型、分辨率、画面比例和输出时长查表。');
 }else{
  billed=step('billed','计费 Token 用量','无视频输入，不应用最低 Token 用量',
   `<strong id="usage-calc-billed">${value(c.billedTokens)}</strong> Token <span class="usage-choice">采用估算 Token 用量</span>`);
 }
 const feeFormula='计费 Token 用量 × 刊例单价（元 / 百万 Token）÷ 1,000,000';
 const fee=v.partial?step('fee','估算视频费用',feeFormula,'<strong id="usage-calc-fee">—</strong> 元/个'):
  step('fee','估算视频费用',feeFormula,
   `${value(c.billedTokens)} × ${value(c.rate)} ÷ 1,000,000 ${cmp(c.P,fixed(c.P,6))===0?'=':'≈'} <strong id="usage-calc-fee">${fixed(c.P,6)}</strong> 元/个`);
 const accuracy='估算 Token 用量、最低 Token 用量均为估算值，实际 Token 用量以 API 返回的 <code>usage.completion_tokens</code> 为准。';
 return `<section class="usage-calculation" id="usage-calculation">${heading}<ol class="usage-calculation-steps">${estimate}${billed}${fee}</ol><p class="usage-calculation-accuracy" id="usage-calculation-accuracy">${accuracy}</p></section>`;
}
function usageRateTable(t){
 const rows=[];
 for(const id of ['seedance-2.5','seedance-2.0','seedance-2.0-fast']){
  const model=M.get(id),groups=[];
  for(const res of model.resolutions){
   const rates=model.rates[res],last=groups.at(-1);
   if(last&&last.rates.join('|')===rates.join('|'))last.resolutions.push(res);
   else groups.push({rates,resolutions:[res]});
  }
  groups.forEach((group,index)=>{
   const selected=id===t.model&&group.resolutions.includes(t.res);
   rows.push(`<tr data-model="${esc(id)}" data-resolutions="${group.resolutions.join(',')}">${index===0?`<th scope="rowgroup" rowspan="${groups.length}">${esc(model.label)}</th>`:''}<td>${group.resolutions.map(res=>res==='4k'?'4K':res).join('、')}</td>${group.rates.map((rate,i)=>`<td class="num${selected&&i===(t.video?1:0)?' selected-rate':''}"${selected&&i===(t.video?1:0)?' id="token-rate" aria-current="true"':''}>${fixed(rate,2)}</td>`).join('')}</tr>`);
  });
 }
 return `<div class="usage-table-scroll"><table class="usage-price-table" id="usage-price-table"><thead><tr><th scope="col">模型</th><th scope="col">分辨率</th><th scope="col">无视频输入</th><th scope="col">有视频输入</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
let showDimensionPixels=false;
function usageDimensionTable(){
 const groups=['seedance-2.5','seedance-2.0','seedance-2.0-fast'].map(id=>{
  const model=M.get(id);
  const rows=model.resolutions.map((res,index)=>{
   const cells=M.RATIOS.map(ratio=>{
    const [width,height]=model.dims[res][ratio],pixels=width*height;
    return `<td data-ratio="${esc(ratio)}"><span class="dimension-size">${width} × ${height}</span><div class="dimension-total"${showDimensionPixels?'':' hidden'}><span class="dimension-pixels">${pixels.toLocaleString('en-US')} 像素</span></div></td>`;
   }).join('');
   return `<tr data-resolution="${esc(res)}">${index===0?`<th scope="rowgroup" rowspan="${model.resolutions.length}">${esc(model.label)}</th>`:''}<th scope="row">${res==='4k'?'4K':res}</th>${cells}</tr>`;
  }).join('');
  return `<tbody data-model="${esc(id)}">${rows}</tbody>`;
 }).join('');
 return `<div class="usage-table-scroll" tabindex="0" role="region" aria-labelledby="usage-dimensions-heading"><table class="usage-dimension-table" id="usage-dimension-table" aria-labelledby="usage-dimensions-heading"><colgroup><col class="dimension-model-column"><col class="dimension-resolution-column"><col span="6"></colgroup><thead><tr><th scope="col">模型</th><th scope="col">分辨率</th>${M.RATIOS.map(ratio=>`<th scope="col">${esc(ratio)}</th>`).join('')}</tr></thead>${groups}</table></div>`;
}
const USAGE_SECTIONS=Object.freeze([['usage-calculation','本次计算'],['usage-prices','模型刊例价'],['usage-dimensions','分辨率映射'],['usage-sources','相关资料']]);
let activeUsageSection='usage-calculation',usageJumpPosition=null;
function setUsageSection(id){
 if(!USAGE_SECTIONS.some(([key])=>key===id))return;
 activeUsageSection=id;
 document.querySelectorAll('[data-usage-section]').forEach(button=>{if(button.dataset.usageSection===id)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
 const nav=$('usage-toc'),selected=nav?.querySelector('[aria-current="location"]');
 if(nav&&selected&&nav.clientWidth&&getComputedStyle(nav).flexDirection==='row'){
  const bounds=nav.getBoundingClientRect(),item=selected.getBoundingClientRect();
  if(item.left<bounds.left)nav.scrollLeft+=item.left-bounds.left-8;
  else if(item.right>bounds.right)nav.scrollLeft+=item.right-bounds.right+8;
 }
}
function usageNavOffset(){const nav=$('usage-toc');return nav&&getComputedStyle(nav).flexDirection==='row'?nav.getBoundingClientRect().height+16:12;}
function goToUsageSection(id){
 const target=$(id),body=$('drawer-body');if(!target||!$('usage-toc'))return;
 setUsageSection(id);
 body.scrollTop=Math.max(0,body.scrollTop+target.getBoundingClientRect().top-body.getBoundingClientRect().top-usageNavOffset());
 usageJumpPosition={id,top:body.scrollTop};
}
function syncUsageSection(){
 const body=$('drawer-body');if($('modal').hidden||!$('usage-toc')||!body.clientHeight)return;
 // Keep the selected chapter when a jump is clamped by the end of the document.
 if(usageJumpPosition&&Math.abs(body.scrollTop-usageJumpPosition.top)<1){setUsageSection(usageJumpPosition.id);return;}
 usageJumpPosition=null;
 const top=body.getBoundingClientRect().top+usageNavOffset()+2;
 const sections=USAGE_SECTIONS.map(([id])=>$(id)).filter(Boolean);
 const last=body.scrollTop>0&&body.scrollTop+body.clientHeight>=body.scrollHeight-2;
 const current=last?sections.at(-1):sections.filter(section=>section.getBoundingClientRect().top<=top).at(-1)||sections[0];
 if(current)setUsageSection(current.id);
}
function usageExplanation(v,t,navigation=false){
 const source=M.get(t.model).sources;
 const minimum20=M.get('seedance-2.0').sources.minima,minimum25=M.get('seedance-2.5').sources.minima;
 const content=`<div class="usage-explanation" id="usage-explanation">
 ${usageCalculation(v,t)}
 <section class="usage-prices" id="usage-prices"><div class="usage-section-heading"><h3>Seedance 系列模型刊例价</h3><span>元 / 百万 Token</span></div>${usageRateTable(t)}</section>
 <section class="usage-dimensions" id="usage-dimensions"><div class="usage-section-heading"><h3 id="usage-dimensions-heading">画面比例与像素分辨率</h3><label class="dimension-display-toggle" for="usage-show-pixels"><span>显示总像素</span><input type="checkbox" role="switch" id="usage-show-pixels" aria-controls="usage-dimension-table"${showDimensionPixels?' checked':''}></label></div>${usageDimensionTable()}</section>
 <nav class="usage-source-links" id="usage-sources" aria-label="相关资料">
 <div><a href="${esc(source.pricing.pageUrl)}" target="_blank" rel="noopener">模型价格 ↗</a><a href="${esc(source.dimensions.pageUrl)}" target="_blank" rel="noopener">分辨率说明 ↗</a></div>
 <div><a href="${esc(minimum20.calculatorUrl)}" target="_blank" rel="noopener">Seedance 2.0 / Fast 计算器 ↗</a><a href="${esc(minimum25.calculatorUrl)}" target="_blank" rel="noopener">Seedance 2.5 计算器 ↗</a></div>
 <div><a href="${esc(minimum20.url)}" target="_blank" rel="noopener">Seedance 2.0 / Fast 最低用量表 ↗</a><a href="${esc(minimum25.url)}" target="_blank" rel="noopener">Seedance 2.5 最低用量表 ↗</a></div>
 </nav>
 </div>`;
 if(!navigation)return content;
 return `<div class="usage-layout"><nav class="usage-toc" id="usage-toc" aria-label="用量说明目录">${USAGE_SECTIONS.map(([id,title])=>`<button type="button" data-usage-section="${id}" aria-controls="${id}"${id===activeUsageSection?' aria-current="location"':''}>${title}</button>`).join('')}</nav>${content}</div>`;
}
function renderUsagePanel(v,t){
 const body=$('drawer-body'),position=body.scrollTop,navPosition=$('usage-toc')?.scrollLeft||0;
 const tablePositions=[...body.querySelectorAll('.usage-table-scroll')].map(table=>table.scrollLeft);
 body.innerHTML=usageExplanation(v,t,true);body.scrollTop=position;$('usage-toc').scrollLeft=navPosition;
 body.querySelectorAll('.usage-table-scroll').forEach((table,i)=>{table.scrollLeft=tablePositions[i]||0;});
}
function openUsage(){if(!modelValid)return;openDrawer('usage','用量说明','',usageExplanation(quote(),state.task,true));}
let feeDisplayDigits=2;
function renderQuote(){
 const v=quote(),c=v.calc;
 $('cost-badge').hidden=!v.partial&&v.rule?.kind!=='manual';$('cost-badge').textContent=coverage(v);$('cost-badge').className='badge '+(v.partial?'amber':'blue');renderUsage(v,state.task);
 $('cost-p').textContent=v.partial?'—':fixed(c.P,feeDisplayDigits);
 return v;
}
let selectedTaskRecordId='',selectedTaskRecordKey='',taskCostBasis='theory',costInputDraft=null,resumeInlineActual=false;
function matchingCostInput(t=state.task,recordId=selectedTaskRecordId){
 const input=state.taskCostInput;return input&&input.taskKey===key(t)&&input.recordId===recordId?input:null;
}
function renderCostInput(record){
 const context=key(state.task)+'|'+selectedTaskRecordId;
 if(costInputDraft&&costInputDraft.context!==context)costInputDraft=null;
 const saved=matchingCostInput(),overridden=!!costInputDraft||!!saved;
 const value=costInputDraft?costInputDraft.value:saved?saved.value:record?.C!=null?num(record.C,20):'';
 if($('record-cost').value!==value)$('record-cost').value=value;
 const invalid=value!==''&&!positive(value,true,20);
 $('record-cost').setAttribute('aria-invalid',String(invalid));$('record-cost-error').hidden=!invalid;
 $('record-cost-error').textContent=invalid?'请输入不小于 0 的金额，最多 20 位小数。':'';
 $('record-cost').title=overridden?'直接采用输入成本，不再乘采购折扣':record?.C!=null?'可直接修改；不改写原始记录':'';
 return {value,overridden,valid:value!==''&&!invalid};
}
let lastCostInputHint=0;
function hintMissingCost(){
 const tab=$('cost-tab-actual');
 if(tab.disabled||tab.getAttribute('aria-disabled')!=='true')return;
 $('record-cost').focus();
 const now=Date.now();if(now-lastCostInputHint<500)return;lastCostInputHint=now;
 toast('请先录入立画成本');
}
function renderCostTabs(available,enabled=true){
 for(const tab of document.querySelectorAll('[data-cost-basis]')){
  const selected=tab.dataset.costBasis===taskCostBasis;
  tab.disabled=!enabled;tab.setAttribute('aria-disabled',String(!enabled||tab.dataset.costBasis==='actual'&&!available));
  tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
 }
 $('task-basis-results').setAttribute('aria-labelledby','cost-tab-'+taskCostBasis);
}
function selectCostBasis(basis){
 const tab=$('cost-tab-'+basis);if(!tab||tab.disabled)return;
 if(tab.getAttribute('aria-disabled')==='true'){hintMissingCost();return;}
 resumeInlineActual=false;taskCostBasis=basis;render();
}
function taskAmount(id,value,digits=6){
 const el=$(id),currency=el.parentElement.querySelector('.currency-symbol');
 el.parentElement.dataset.empty=String(value===null);
 if(currency)currency.textContent='¥';
 el.textContent=value===null?'—':num(value,digits);
 if(value===null)el.removeAttribute('title');else el.title=num(value,20);
}
function renderTaskRecord(p){
 const taskKey=key(state.task),matches=state.observations.filter(o=>key(o.params)===taskKey);
 if(selectedTaskRecordKey!==taskKey){selectedTaskRecordId=state.taskCostInput?.taskKey===taskKey?state.taskCostInput.recordId:'';selectedTaskRecordKey=taskKey;if(taskCostBasis==='actual')taskCostBasis='theory';resumeInlineActual=false;}
 const record=matches.find(o=>o.id===selectedTaskRecordId)||matches[0]||null;
 selectedTaskRecordId=record?.id||'';
 const selector=$('task-record-select');
 selector.hidden=matches.length<2;
 selector.closest('.task-cost-strip').classList.toggle('has-multiple-records',matches.length>1);
 selector.innerHTML=matches.map(o=>`<option value="${esc(o.id)}" ${o.id===selectedTaskRecordId?'selected':''}>${esc(o.title)}${o.date?' · '+esc(o.date):''}</option>`).join('');
 selector.title=record?record.title+(record.date?' · '+record.date:''):'';
 return record?E.recalcRecord(record,p):null;
}
function renderResult(){const v=current(),x=v.x;
 if(!x)throw Error('模型最低用量规则尚未补齐，暂不能测算平台收费。');
 $('details').disabled=false;
 const record=renderTaskRecord(x.p),input=renderCostInput(record),available=input.overridden?input.valid:record!==null&&record.C!==null;
 const entered=input.overridden&&input.valid?{...E.settle(x.P,input.value,x.p),inline:true}:null;
 if(resumeInlineActual&&input.overridden&&available){taskCostBasis='actual';resumeInlineActual=false;}
 if(!available&&taskCostBasis==='actual'){taskCostBasis='theory';toast('立画成本不可用，已切换理论采购成本。');}
 renderCostTabs(available);
 const actual=taskCostBasis==='actual',active=actual?(entered||record):taskCostBasis==='list'?E.settle(x.P,x.P,x.p):x;
 const profit=active.cashProfit,margin=active.salesMarginPct;
 taskAmount('task-list-cost',x.P);taskAmount('cost-c',x.C);
 $('task-target-label').textContent='目标售价';
 taskAmount('task-target-amount',active.target);
 for(const [id,value,digits] of [['raw-points',active.raw,6],['integer-points',active.N,0],['actual-cash',active.cash,6]])taskAmount(id,value,digits);
 const gap=active.target===null?null:sub(active.cash,active.target),effective=active.P===null?null:mul(div(active.cash,active.P),10);
 $('task-gap').textContent=gap===null?'—':(cmp(gap,0)>0?'+':'')+num(gap,6)+' 元';
 $('task-effective').textContent=effective===null?'—':num(effective,4)+'折';
 $('task-gap').title=gap===null?'未设目标或缺少目标计算依据':num(gap,20)+' 元';
 $('task-effective').title=effective===null?'缺少对应刊例成本':(actual&&!entered?'按实测记录刊例成本折算':'按火山刊例成本折算');
 $('model-profit').textContent=profit===null?'—':cash(profit);$('model-margin').textContent=margin===null?'未定义':num(margin,4)+'%';
 $('model-profit').classList.toggle('loss',profit!==null&&cmp(profit,0)<0);$('model-margin').classList.toggle('loss',margin!==null&&cmp(margin,0)<0);
 $('pricing-loss').hidden=profit===null||cmp(profit,0)>=0;
}

function exportRow(title,v,x,qty=1){return{scope:'平台定价测算',model:v.model,modelRuleVersion:v.calc.ruleVersion,...procurementInfo(v.model,x.p.q),targetMode:x.p.pricingMode==='manual'?'manual':x.p.targetMode,targetMargin:x.p.targetMode==='margin'?optionalDecimal(x.p.targetMarginPct):'',profit:decimal(x.profit),margin:x.margin===null?'':decimal(x.margin),scenario:title,coverage:coverage(v),ruleVersion:state.rules.version,quantity:qty,pay:state.plan.pay,total:state.plan.total,discount:x.p.d===null?'':num(mul(x.p.d,10),4),M:decimal(x.p.usedM),P:decimal(x.P),C:decimal(x.C),raw:decimal(x.raw),N:num(x.N,0),target:optionalDecimal(x.target),cash:decimal(x.cash),gap:optionalDecimal(x.gap)};}
function renderTable(){const v=current(),x=v.x;tableRows=[];let tools='',html='',end='';
tools=`<p class="comparison-method">随上方设置更新，按各档客户折扣计算倍率。</p><p class="comparison-spec">${esc(label(state.task))} · ${esc(vinLabel(state.task))}</p>`;if(!x)html='<div class="empty">请先修正生成参数。</div>';else{html=table(['客户折扣','定价倍率','采购成本（元）','取整前积分','预计扣分','折合金额','与目标差额'],DISCOUNTS.map(d=>{const pp=pricing({discount:d,targetMode:'discount',mode:state.plan.limitPrecision?'saved':'ideal'}),vv=theory(state.task,state.rules,pp),xx=vv.x;tableRows.push(exportRow(d+'折',vv,xx));return`<tr class="${state.plan.targetMode==='discount'&&validTarget(state.plan)&&cmp(d,state.plan.discount)===0?'selected':''}">${td(`<button class="rowbutton" data-discount="${d}">${d==='10'?'无折扣':d+'折'}</button>`)}${td(num(pp.usedM,10))}${td(num(xx.C,8))}${td(num(xx.raw,8))}${td('<b>'+num(xx.N,0)+'</b>')}${td(cash(xx.cash))}${td((cmp(xx.gap,0)>=0?'+':'')+num(xx.gap,6))}</tr>`;}));}end=state.plan.mode!=='ideal'?'各档按客户折扣反算，采用当前倍率精度。':'';
$('table-tools').innerHTML=tools;$('table').innerHTML=html;$('table-end').innerHTML=end;}
function renderActual(){
 actualRows=[];
 $('actual-table').innerHTML=table(['实测记录 / 规格','刊例费用估算 P','平台成本基准 P','差额 ΔP','采购成本估算 C','复算采购成本 C','当前复算扣分','复算模型毛利','历史实扣积分',''],state.observations.map(o=>{
  const model=o.params.model||'seedance-2.0',p=pricingForModel(model),v=quote(o.params),P=v.partial?null:v.calc.P,C=P===null?null:mul(P,p.q),a=E.recalcRecord(o,p),profit=a.cash===null?null:sub(a.cash,a.C);
  actualRows.push({scope:'实测对照',model,modelRuleVersion:v.calc.ruleVersion,...procurementInfo(model,p.q),record:o.title,params:label(o.params)+' / '+vinLabel(o.params),coverage:coverage(v),theoryP:P===null?'':decimal(P),recordedP:o.P,deltaP:P!==null&&o.P!==''?decimal(sub(o.P,P)):'',theoryC:C===null?'':decimal(C),recordedC:o.C,costBasis:o.costBasis||'recorded',recalcC:a.C===null?'':decimal(a.C),supplierReferenceC:o.supplierReference?.C||'',supplierReferenceQ:o.supplierReference?.q||'',provider:o.provider||'',deltaC:C!==null&&o.C!==''?decimal(sub(o.C,C)):'',recordedN:o.N,usage:o.usage||'',recalcN:a.N===null?'':num(a.N,0),recalcCash:a.cash===null?'':decimal(a.cash),recalcProfit:profit===null?'':decimal(profit),pay:state.plan.pay,total:state.plan.total,M:decimal(p.usedM),targetMode:p.pricingMode==='manual'?'manual':p.targetMode,note:o.note});
  return '<tr>'+td(`<b>${esc(o.title)}</b><span class="second">${esc(label(o.params))} / ${esc(vinLabel(o.params))}</span><span class="second">复算采购设置 ${num(mul(p.q,10),4)}折${procurementInfo(model,p.q).procurementSimulated?' · 模拟':''}</span>`)+td(P===null?'待补齐':num(P,8))+td(o.P!==''?esc(o.P):'—')+td(P!==null&&o.P!==''?minus(o.P,P):'—')+td(C===null?'—':num(C,8))+td(a.C===null?'—':num(a.C,8)+(a.procurementDerived?'<span class="second">按当前折扣推算</span>':''))+td(a.N===null?'—':`<b>${num(a.N,0)}</b>`)+td(profit===null?'—':cash(profit))+td(o.N!==''?esc(o.N):'未知')+td(`<button class="link" data-observation="${esc(o.id)}">计算展开</button><br><button class="link" data-edit-observation="${esc(o.id)}">编辑</button>`)+'</tr>';
 }));
 $('other-references').innerHTML=state.references.map(r=>`<p><b>${esc(r.title)}</b> · 刊例约 ¥${esc(r.P)}<br>${esc(r.note)}</p>`).join('');
}
function render(keepPrecision=false){
 state.tab='discounts';
 if(!keepPrecision)closePlan();

 modelValid=false;platformValid=false;let policyValid=false;
 activateProcurement();
 if($('pricing-model'))$('pricing-model').textContent=M.get(state.task.model).label;
 const procurementStatus=$('procurement-status');
 if(procurementStatus){
  const validQ=positive(state.plan.q,false,6)&&+state.plan.q<=10,info=validQ?procurementInfo():null;
  procurementStatus.hidden=!info?.procurementSimulated;procurementStatus.textContent=info?.procurementSimulated?'模拟采购':'';procurementStatus.dataset.simulated=String(!!info?.procurementSimulated);procurementStatus.classList.toggle('is-simulation',!!info?.procurementSimulated);
 }
 renderPricingMode(state.plan.mode==='manual');
 $('globalError').hidden=true;$('platformError').hidden=true;
 $('open-actual').hidden=state.workspace==='actual';
 for(const name of ['theory','actual'])$(name+'-workspace').hidden=state.workspace!==name;
 try{
  if(!validTask(state.task,false))throw Error('请检查当前模型支持的分辨率、比例与时长。');
  renderComposer();renderQuote();modelValid=true;
  $('rule-status').textContent='规则核验：2026-10-20';
 }catch(e){
  $('globalError').hidden=false;$('globalError').textContent=e.message;$('cost-p').textContent='—';
  $('coverage-note').hidden=true;$('usage-summary').hidden=true;$('usage-help').disabled=true;
  for(const id of ['token-estimate','token-minimum']){$(id).textContent='—';$(id).removeAttribute('title');}
  for(const name of ['estimate','minimum']){$('token-'+name+'-metric').classList.remove('is-adopted');$('token-'+name+'-adopted').hidden=true;}
  if(drawerName==='usage')$('drawer-body').innerHTML='<p class="notice red">当前输入无效，请先修正生成参数。</p>';
 }
 try{
  if(!validPlan(state.plan))throw Error('请检查采购折扣、充值金额、到账积分和定价参数。');
  validateModelPricing(state.plan);renderPlan();policyValid=true;
  if(!modelValid)throw Error('请先在生成任务中修正参数。');
  renderResult();platformValid=true;
  try{renderTable();}catch(e){tableRows=[];$('table').innerHTML='<div class="empty">'+esc(e.message)+'，请检查对比条件与倍率精度。</div>';$('table-end').textContent='';}
 }catch(e){
  $('platformError').hidden=false;$('platformError').textContent=e.message;
  for(const id of ['task-list-cost','task-target-amount','cost-c','raw-points','integer-points','actual-cash','model-profit','model-margin']){taskAmount(id,null);$(id).classList.remove('loss');}
  renderCostTabs(false,false);$('task-gap').textContent='—';$('task-effective').textContent='—';$('task-record-select').hidden=true;$('task-record-select').closest('.task-cost-strip').classList.remove('has-multiple-records');
  $('pricing-loss').hidden=true;
  $('table').innerHTML='<div class="empty">平台参数待修正。</div>';$('actual-table').innerHTML='<div class="empty">请先修正平台定价参数后复算。</div>';
  if(!policyValid)$('policy-notice').hidden=true;
  $('table-tools').textContent='';$('table-end').textContent='';tableRows=[];actualRows=[];$('details').disabled=true;
  if(!policyValid)for(const id of ['multiplier','per-point','per-yuan','plan-principle']){$(id).textContent='—';$(id).removeAttribute('title');}
  if(!policyValid)for(const id of ['point-price','points-per-yuan'])$(id).removeAttribute('title');
 }
 if(validPlan(state.plan)){try{renderActual();}catch(e){$('actual-table').innerHTML='<div class="empty">'+esc(e.message)+'</div>';actualRows=[];}}
 globalValid=modelValid&&platformValid;positionQuickOptions();persist();
}
function changeTask(patch){state.task={...state.task,...patch};if(validTask(state.task))state.task=normalizeTask(state.task);render();}
function changeModel(model){
 const spec=M.get(model),previous=state.task,changes=[],discarded=!captureProfile(state.plan);
 const next={...previous,model};
 if(!spec.resolutions.includes(next.res)){next.res=spec.resolutions.at(-1);changes.push('分辨率 '+next.res);}
 for(const [field,limits,name] of [['seconds',spec.seconds,'输出'],['vin',spec.inputSeconds,'输入视频']]){
  const value=Math.min(limits.max,Math.max(limits.min,Math.ceil(Number(next[field])||limits.min)));
  if(String(value)!==String(next[field]))changes.push(name+' '+value+' 秒');next[field]=String(value);
 }
 state.task=normalizeTask(next);render();if(discarded)toast('未完成的定价输入未保存，已保留该模型上次有效设置。');if(changes.length)toast(spec.label+' 已调整：'+changes.join('、')+'。');
}
function showWorkspace(w,focusId='generation-title'){
 if(w==='platform')w='theory';
 if(!['theory','actual'].includes(w))return;
 state.workspace=w;closeDrawer();render();$(w==='actual'?'actual-title':focusId)?.focus();
}
const optionalCash=(v,d=6)=>v===null?'—':cash(v,d),optionalDecimal=v=>v===null?'':decimal(v);
function amount(v,d=12){return v===null||v===undefined?'—':num(v,d);}
function formulaDetails(){openDetails('theory');}
let detailContext={mode:'theory',task:null,recordId:'',text:''};
function detailStep(n,title,content){return `<section class="detail-section"><h3><span class="detail-index">${n}</span>${title}</h3>${content}</section>`;}
function detailFact(label,value,emphasis=false){return `<div class="fact${emphasis?' emph':''}"><span>${label}</span><b>${value}</b></div>`;}
function detailPlan(p,model=state.task.model){return `<div class="pricing-detail-context"><span>充值 ${num(p.A,2)} 元 → ${num(p.T,4)} 积分</span><span>采购 ${num(mul(p.q,10),4)}折 · ${esc(procurementInfo(model,p.q).procurementStatus)}</span><span>${esc(targetSummary(p))}</span></div>`;}
function detailMultiplier(p,model){
 const profile=F.forModel(state.plan,model),q=num(mul(p.q,10),6);
 const formula=p.pricingMode==='manual'?`<div class="formula">采用指定倍率 M = <strong>${num(p.usedM,16)}</strong></div>`:`<div class="formula">${p.targetMode==='margin'?`倍率 = 每元积分 ÷［10 ×（1 − 目标毛利率）］<br>(${num(p.T,4)} ÷ ${num(p.A,2)}) ÷［10 ×（1 − ${num(p.targetMarginPct,4)}%）］`:`倍率 = 每元积分 × 客户折扣 ÷ 采购折扣 ÷ 10<br>(${num(p.T,4)} ÷ ${num(p.A,2)}) × ${num(mul(p.d,10),4)} ÷ ${q} ÷ 10`}<br>${displayed(p.M,16)}<br>采用倍率 ${displayed(p.usedM,16)}</div>${profile.mode==='saved'?`<p class="footnote">${profile.round==='nearest'?'四舍五入':'截断'}至 ${profile.digits} 位小数。</p>`:''}`;
 return `<section class="pricing-detail-extra" id="detail-multiplier"><h3>成本定价倍率</h3>${formula}</section>`;
}
function detailVariance(x,scope,expanded=false){
 const heading='<h3>目标差额拆分</h3>';
 if(x.target===null)return expanded?`<section class="pricing-detail-extra" id="detail-variance">${heading}<p class="footnote">手动倍率未设目标售价，无目标差额。</p></section>`:'';
 const content=detailFact(expanded?'采购成本差额':scope==='actual'?'采购原值与约定采购比例的偏差影响':'采购比例差额（理论按约定比例）',cash(x.costGap,12))
 +detailFact(expanded?'倍率精度差额':'倍率保存精度 / 指定倍率影响',cash(x.precisionGap,12))
 +detailFact(expanded?'扣分取整差额':'逐任务向上取整影响',cash(x.roundGap,12))
 +detailFact(expanded?'合计差额':'合计：扣分折合金额 − 目标金额',cash(x.gap,12),true)
 +(expanded?'<p class="footnote">合计差额 = 折合金额 − 目标售价</p>':'<p class="footnote">以上均按当前方案复算。成本差、倍率差和取整差分开，不把差额全部归因于取整或最低用量。</p>');
 return expanded?`<section class="pricing-detail-extra" id="detail-variance">${heading}${content}</section>`:`<details class="record-notes"><summary>与目标差额如何拆分</summary>${content}</details>`;
}
function displayed(value,d=12){const shown=num(value,d);return(cmp(value,decimalString(value,d))===0?'= ':'≈ ')+shown;}
function pricingDetailRow(title,description,content,id=''){
 return `<li${id?' id="'+id+'"':''}><div><h3>${title}</h3><p class="detail-formula">${description}</p></div><div class="detail-value">${content}</div></li>`;
}
function detailEquation(expression,value,unit,operands=[]){
 if(value===null)return '—';
 const approximate=[value,...operands].some(v=>cmp(v,decimalString(v,8))!==0);
 return `<span class="detail-substitution">${expression}</span><span class="detail-equals">${approximate?'≈':'='}</span><strong class="num" title="${num(value,20)}">${num(value,8)}${unit?' '+unit:''}</strong>`;
}
function theoryBreakdown(t,p){
 const v=theory(t,state.rules,p),x=v.x;
 if(!x)return{html:'<p class="notice">最低用量待补齐，暂不能计算平台收费。</p>',text:'最低用量待补齐。'};
 const q=num(mul(p.q,10),6);
 const targetTitle=x.target===null?'取整前金额':'目标售价';
 const targetDescription=x.target===null?'按当前倍率计算的取整前金额':'考虑折扣/毛利的设定售价';
 const targetExpression=x.target===null?`${num(x.raw,8)} × ${num(p.A,2)} ÷ ${num(p.T,4)}`:p.targetMode==='margin'?`${num(x.C,8)} ÷ (1 − ${num(p.targetMarginPct,4)}%)`:`${num(x.P,8)} × ${num(mul(p.d,10),6)} ÷ 10`;
 const targetOperands=x.target===null?[x.raw,p.A,p.T]:p.targetMode==='margin'?[x.C,p.targetMarginPct]:[x.P,mul(p.d,10)];
 const html=`<div class="pricing-details"><ol class="pricing-detail-steps">`
 +pricingDetailRow('火山刊例成本','官方计算公式 + 生成参数估算',`<strong class="num" title="${num(x.P,20)}">${displayed(x.P,8).replace(/^= /,'')} 元</strong><button class="link" id="detail-usage">用量明细 →</button>`)
 +pricingDetailRow('计价成本','火山刊例成本 × 采购折扣',detailEquation(`${num(x.P,8)} × ${q} ÷ 10`,x.C,'元',[x.P,mul(p.q,10)]),'procurement-equation')
 +pricingDetailRow('取整前积分','计价成本 × 成本定价倍率 × 10',detailEquation(`${num(x.C,8)} × ${num(p.usedM,8)} × 10`,x.raw,'分',[x.C,p.usedM]),'points-equation')
 +pricingDetailRow('核算扣分','取整前积分向上取整',`<span class="detail-substitution">${displayed(x.raw,8).replace(/^= /,'')} →</span><strong class="num detail-deduction">${num(x.N,0)} 分</strong>`)
 +pricingDetailRow('折合金额','核算扣分 × 每积分金额',detailEquation(`${num(x.N,0)} × (${num(p.A,2)} ÷ ${num(p.T,4)})`,x.cash,'元',[x.N,p.A,p.T]),'cash-equation')
 +pricingDetailRow(targetTitle,targetDescription,detailEquation(targetExpression,x.target??x.rawCash,'元',targetOperands))
 +`</ol><div class="pricing-detail-extra-grid">
 ${detailMultiplier(p,t.model)}
 <section class="pricing-detail-extra" id="detail-profit"><h3>模型毛利</h3><div class="formula" id="profit-equation"><span class="pricing-detail-caption">折合金额 − 计价成本</span>${detailEquation(`${num(x.cash,8)} − ${num(x.C,8)}`,x.profit,'元',[x.cash,x.C])}</div>
 ${detailFact('模型毛利率',x.margin===null?'未定义':num(x.margin,8)+'%')}${detailFact('本次客户折扣',num(x.effective,6)+'折')}<p class="footnote">模型毛利率 = 模型毛利 ÷ 折合金额。仅扣除模型采购成本。</p></section>
 ${detailVariance(x,'theory',true)}
 <section class="pricing-detail-extra" id="detail-unit-check"><h3>金额校验</h3><div class="unit-check-input"><label class="fieldlabel" for="unit-p">假设刊例费用（元）</label><input class="input num" id="unit-p" value="1" inputmode="decimal"></div><div id="unit-result"></div></section>
 </div></div>`;
 const text=[`任务：${label(t)} / ${vinLabel(t)}`,`刊例费用 = ${decimal(x.P)}`,`计价成本 = ${decimal(x.P)} × ${q} ÷ 10 = ${decimal(x.C)}`,`采用倍率 = ${decimal(p.usedM)}`,`取整前积分 = ${decimal(x.C)} × ${decimal(p.usedM)} × 10 = ${decimal(x.raw)}`,`核算扣分 = ${num(x.N,0)}`,`折合金额 = ${num(x.N,0)} × ${num(p.A,2)} ÷ ${num(p.T,4)} ≈ ${decimal(x.cash)}`,`模型毛利 = ${decimal(x.profit)}`,`模型毛利率 ≈ ${decimal(x.margin)}%`].join('\n');
 return{html,text};
}
function actualBreakdown(o,p){
 if(!o)return{html:'<div class="notice neutral"><b>这个规格没有平台实测记录。</b><br>不会使用其他规格的金额，也不会把理论计算写成实测记录。</div>',text:'无匹配实测记录。'};
 const a=E.recalcRecord(o,p),x=a.x,derived=o.costBasis==='platform-list';
 const q=num(mul(p.q,10),6),rawCash=a.raw===null?null:mul(a.raw,p.U),manual=p.targetAvailable===false;
 const targetTitle=manual?'取整前金额':'目标售价';
 const targetDescription=manual?'取整前积分 × 每积分金额':p.targetMode==='margin'?'计价成本 ÷（1 − 设定模型毛利率）':'记录折前成本 × 设定客户折扣';
 const targetValue=manual?rawCash:a.target;
 const targetEquation=targetValue===null?'—':manual?detailEquation(`${num(a.raw,8)} × (${num(p.A,2)} ÷ ${num(p.T,4)})`,rawCash,'元',[a.raw,p.A,p.T]):p.targetMode==='margin'?detailEquation(`${num(a.C,8)} ÷ (1 − ${num(p.targetMarginPct,4)}%)`,a.target,'元',[a.C,p.targetMarginPct]):detailEquation(`${num(a.P,8)} × ${num(mul(p.d,10),6)} ÷ 10`,a.target,'元',[a.P,mul(p.d,10)]);
 const integral=`<ol class="pricing-detail-steps">`
 +pricingDetailRow('记录折前成本','平台原始记录；用于客户折扣对照',a.P===null?'未录入':`<strong class="num" title="${esc(o.P)}">${displayed(a.P,8).replace(/^= /,'')} 元</strong>`)
 +pricingDetailRow('计价成本',derived?'记录折前成本 × 当前采购折扣':'直接采用记录的实际成本，不再乘采购折扣',a.C===null?'未录入':derived?detailEquation(`${num(a.P,8)} × ${q} ÷ 10`,a.C,'元',[a.P,mul(p.q,10)]):`<strong class="num" title="${esc(o.C)}">${displayed(a.C,8).replace(/^= /,'')} 元</strong>`)
 +pricingDetailRow('取整前积分','计价成本 × 成本定价倍率 × 10',a.raw===null?'—':detailEquation(`${num(a.C,8)} × ${num(p.usedM,8)} × 10`,a.raw,'分',[a.C,p.usedM]))
 +pricingDetailRow('核算扣分','取整前积分向上取整',a.N===null?'—':`<span class="detail-substitution">${displayed(a.raw,8).replace(/^= /,'')} →</span><strong class="num detail-deduction">${num(a.N,0)} 分</strong>`)
 +pricingDetailRow('折合金额','核算扣分 × 当前每积分金额',a.cash===null?'—':detailEquation(`${num(a.N,0)} × (${num(p.A,2)} ÷ ${num(p.T,4)})`,a.cash,'元',[a.N,p.A,p.T]))
 +pricingDetailRow(targetTitle,targetDescription,targetEquation)+`</ol>`;
 const profit=`<section class="pricing-detail-extra" id="detail-profit"><h3>模型毛利</h3>${a.cash===null?'<p class="footnote">缺少计价成本，暂不能核算模型毛利。</p>':`<div class="formula" id="profit-equation"><span class="pricing-detail-caption">折合金额 − 计价成本</span>${detailEquation(`${num(a.cash,8)} − ${num(a.C,8)}`,a.cashProfit,'元',[a.cash,a.C])}</div>${detailFact('模型毛利率',a.salesMarginPct===null?'未定义':num(a.salesMarginPct,8)+'%')}`}${detailFact('本次客户折扣',x?num(x.effective,8)+'折':'—')}<p class="footnote">模型毛利率 = 模型毛利 ÷ 折合金额。客户折扣以记录折前成本为基准。</p></section>`;
 const variance=x?detailVariance(x,'actual',true):`<section class="pricing-detail-extra" id="detail-variance"><h3>目标对照</h3>${a.cash!==null&&a.target!==null?detailFact('与目标差额',cash(sub(a.cash,a.target),12))+'<p class="footnote">与目标差额 = 折合金额 − 目标售价。</p>':`<p class="footnote">${manual?'手动倍率未设目标售价，无目标差额。':a.C===null?'缺少计价成本，暂不能对照。':'未录入折前成本，暂不能计算客户折扣和折扣目标。'}</p>`}</section>`;
 const reference=o.supplierReference?`${detailFact('原表供应商测算（'+num(mul(o.supplierReference.q,10),4)+'折）','¥'+esc(o.supplierReference.C))}<p class="footnote">仅留存原表参考，不作为本次计价成本。</p>`:'';
 const source=`<section class="pricing-detail-extra" id="detail-record-source"><h3>实测来源</h3><p class="pricing-detail-source">${esc(o.title)}${o.provider?' · '+esc(o.provider):''}${o.date?' · '+esc(o.date):''}</p>${o.note?`<p class="footnote">${esc(o.note)}</p>`:''}${reference}</section>`;
 const historical=`<section class="pricing-detail-extra" id="detail-record-history"><h3>历史实际扣分</h3>${detailFact(esc(o.provider||'平台')+'原记录',o.N!==''?esc(o.N)+' 分':'未录入')}<p class="footnote">历史值保持原样。上方核算扣分采用当前方案；核对历史差异需使用当时的充值与定价设置。</p></section>`;
 const usage=o.usage?`<section class="pricing-detail-extra detail-section pricing-detail-api"><h3>API 用量核对</h3><div class="formula">completion_tokens = ${esc(o.usage)}<br>按当前官方刊例费率折算 = ${cash(M.fromUsage(o.params,o.usage),12)}</div><p class="footnote">仅作独立核对，不回填成本。completion_tokens 已含最低用量；不与 total_tokens 相加，也不再次应用门槛。</p></section>`:'';
 const html=`<div class="pricing-details">${integral}<div class="pricing-detail-extra-grid">${detailMultiplier(p,o.params.model||'seedance-2.0')}${profit}${variance}${historical}</div><div class="pricing-detail-evidence-grid">${source}${usage}</div></div>`;
 const text=[`记录：${o.title}`,`任务：${label(o.params)} / ${vinLabel(o.params)}`,`来源：${o.note}`,`记录折前成本P = ${o.P||'未录入'}`,`记录实际成本C = ${o.C!==''?o.C:'未录入'}`,`成本口径：${derived?'记录折前成本 × 当前采购折扣':'直接采用记录实际成本'}`,`计价成本 = ${a.C===null?'未知':decimal(a.C)}`,...(o.supplierReference?[`原表供应商参考：采购比例 ${o.supplierReference.q}；测算成本 ${o.supplierReference.C}`]:[]),`API completion_tokens = ${o.usage||'未录入'}`,`取整前积分 = ${a.raw===null?'未知':decimal(a.raw)}`,`核算扣分 = ${a.N===null?'未知':num(a.N,0)}`,`折合金额 = ${a.cash===null?'未知':decimal(a.cash)}`,`目标售价 = ${a.target===null?'未知':decimal(a.target)}`,`模型毛利 = ${a.cashProfit===null?'未知':decimal(a.cashProfit)}`,`模型毛利率 = ${a.salesMarginPct===null?'未定义':decimal(a.salesMarginPct)+'%'}`,`本次客户折扣 = ${x?decimal(x.effective)+'折':'未知'}`,`历史实际扣分 = ${o.N!==''?o.N:'未知；不得由复算补填'}`].join('\n');
 return{html,text};
}
function inlineCostBreakdown(t,p,recordId,costMode='inline'){
 const list=costMode==='list',input=list?null:matchingCostInput(t,recordId);
 if(!list&&(!input||!positive(input.value,true,20)))return {html:'<p class="notice neutral">请先填写有效的立画成本。</p>',text:'未填写有效成本。'};
 const base=theory(t,state.rules,p).x;
 if(!base)return {html:'<p class="notice neutral">当前任务的刊例成本尚不能估算。</p>',text:'刊例成本未确定。'};
 const cost=list?base.P:input.value,x=E.settle(base.P,cost,p),manual=p.targetAvailable===false;
 const targetTitle=manual?'取整前金额':'目标售价';
 const targetDescription=manual?'取整前积分 × 每积分金额':p.targetMode==='margin'?'计价成本 ÷（1 − 设定模型毛利率）':'火山刊例成本 × 设定客户折扣';
 const targetExpression=manual?`${num(x.raw,8)} × (${num(p.A,2)} ÷ ${num(p.T,4)})`:p.targetMode==='margin'?`${num(x.C,8)} ÷ (1 − ${num(p.targetMarginPct,4)}%)`:`${num(x.P,8)} × ${num(mul(p.d,10),6)} ÷ 10`;
 const targetOperands=manual?[x.raw,p.A,p.T]:p.targetMode==='margin'?[x.C,p.targetMarginPct]:[x.P,mul(p.d,10)];
 const html=`<div class="pricing-details"><ol class="pricing-detail-steps">`
 +pricingDetailRow('火山刊例成本','当前任务参数估算；用于客户折扣对照',`<strong class="num" title="${num(x.P,20)}">${displayed(x.P,8).replace(/^= /,'')} 元</strong><button class="link" id="detail-usage">用量明细 →</button>`)
 +pricingDetailRow('计价成本',list?'采用火山刊例成本，不应用采购折扣':'直接采用本次输入的立画实际成本',`<strong class="num" title="${num(x.C,20)}">${displayed(x.C,8).replace(/^= /,'')} 元</strong>`)
 +pricingDetailRow('取整前积分','计价成本 × 成本定价倍率 × 10',detailEquation(`${num(x.C,8)} × ${num(p.usedM,8)} × 10`,x.raw,'分',[x.C,p.usedM]))
 +pricingDetailRow('核算扣分','取整前积分向上取整',`<span class="detail-substitution">${displayed(x.raw,8).replace(/^= /,'')} →</span><strong class="num detail-deduction">${num(x.N,0)} 分</strong>`)
 +pricingDetailRow('折合金额','核算扣分 × 每积分金额',detailEquation(`${num(x.N,0)} × (${num(p.A,2)} ÷ ${num(p.T,4)})`,x.cash,'元',[x.N,p.A,p.T]))
 +pricingDetailRow(targetTitle,targetDescription,detailEquation(targetExpression,x.target??x.rawCash,'元',targetOperands))
 +`</ol><div class="pricing-detail-extra-grid"><section class="pricing-detail-extra" id="detail-profit"><h3>模型毛利</h3><div class="formula" id="profit-equation"><span class="pricing-detail-caption">折合金额 − 计价成本</span>${detailEquation(`${num(x.cash,8)} − ${num(x.C,8)}`,x.profit,'元',[x.cash,x.C])}</div>${detailFact('模型毛利率',x.margin===null?'未定义':num(x.margin,8)+'%')}${detailFact('本次客户折扣',num(x.effective,8)+'折')}<p class="footnote">模型毛利率 = 模型毛利 ÷ 折合金额。客户折扣以火山刊例成本为基准。</p></section>${detailVariance(x,'actual',true)}</div></div>`;
 const text=[`计价成本（${list?'采用火山刊例成本':'直接输入立画成本'}） = ${decimal(x.C)}`,`火山刊例成本（理论） = ${decimal(x.P)}`,`取整前积分 = ${decimal(x.raw)}`,`核算扣分 = ${num(x.N,0)}`,`折合金额 = ${decimal(x.cash)}`,`目标售价 = ${x.target===null?'未设置':decimal(x.target)}`,`与目标差额 = ${x.gap===null?'未设置':decimal(x.gap)}`,`本次客户折扣 = ${decimal(x.effective)}折`,`模型毛利 = ${decimal(x.profit)}`,`模型毛利率 = ${x.margin===null?'未定义':decimal(x.margin)+'%'}`].join('\n');
 return {html,text};
}
function recordDetailContext(t,record,mode){
 const recordId=record?.id||'',context=key(t)+'|'+recordId;
 const input=costInputDraft?.context===context?costInputDraft:matchingCostInput(t,recordId);
 const actions=[];
 if(record&&mode!=='actual')actions.push(`<button class="link" data-observation="${esc(record.id)}">${input?'查看原记录':'查看记录'}</button>`);
 if(record)actions.push(`<button class="link" data-edit-observation="${esc(record.id)}">编辑记录</button>`);
 if(record&&input)actions.push('<button class="link" id="restore-record-cost">恢复记录值</button>');
 if(!record||input)actions.push(`<button class="link" id="detail-add-observation">${input&&positive(input.value,true,20)?record?'另存为实测':'保存为实测':'录入实测'}</button>`);
 const buttons='<div class="pricing-record-actions">'+actions.join('')+'</div>';
 if(mode==='actual'&&record)return {html:'<div class="pricing-record-context pricing-record-actions pricing-record-actions-only" id="detail-record-context">'+actions.join('')+'</div>',text:''};
 const history=record?(record.N!==''?num(record.N,0)+' 积分':'未记录'):'';
 const metadata=record?`<div class="pricing-record-meta"><p id="detail-record-source">${esc(record.provider||'平台')} · ${esc(record.title)}${record.date?' · '+esc(record.date):''}</p><p id="detail-record-history">历史实扣：<span class="num">${history}</span></p></div>`:'<p class="footnote">暂无同规格实测记录。</p>';
 return {html:`<section class="pricing-record-context" id="detail-record-context"><div class="pricing-record-heading"><h3>同规格实测</h3>${buttons}</div>${metadata}</section>`,text:record?`同规格实测（独立记录）：${record.title}${record.provider?' / '+record.provider:''}\n历史实扣：${history}`:''};
}
function openDetails(mode='theory',recordId='',contextTask=null){
 const targetRecord=state.observations.find(r=>r.id===recordId);
 if(!validPlan(state.plan)||mode!=='actual'&&!validTask(contextTask||targetRecord?.params||state.task,false)){toast('请先修正相关输入。');return;}
 const record=targetRecord,t=clone(contextTask||record?.params||(mode==='actual'&&!validTask(state.task,false)?state.observations[0]?.params||defaults().task:state.task)),p=pricingForModel(t.model||'seedance-2.0');
 const matches=state.observations.filter(r=>key(r.params)===key(t));
 const selected=matches.find(r=>r.id===recordId)||matches[0]||null;
 const chosen=['list','inline','actual'].includes(mode)?mode:'theory';
 detailContext={mode:chosen,task:t,recordId:chosen==='inline'?recordId:selected?.id||'',text:''};
 const selector=chosen==='actual'&&matches.length>1?`<div class="detail-selector"><label class="fieldlabel" for="details-record">实测记录</label><select class="input" id="details-record">${matches.map(r=>`<option value="${esc(r.id)}" ${r.id===selected.id?'selected':''}>${esc(r.title)}${r.date?' · '+esc(r.date):''}</option>`).join('')}</select></div>`:'';
 const view=chosen==='list'||chosen==='inline'?inlineCostBreakdown(t,p,recordId,chosen):chosen==='actual'?actualBreakdown(selected,p):theoryBreakdown(t,p);
 const recordContext=recordDetailContext(t,selected,chosen);
 const content=(chosen==='actual'?detailPlan(p,t.model||'seedance-2.0'):'')+selector+view.html+recordContext.html+`<div class="pricing-detail-footer"><button class="link" id="export-calculation">导出计算明细 ↓</button></div>`;
 detailContext.text=[`Reelay V9.12.3 · ${chosen==='list'?'火山刊例成本测算':chosen==='inline'?'立画录入成本测算':chosen==='actual'?'平台实测金额复算':'理论采购成本测算'}`,`企业：${state.plan.company}`,`模型：${M.get(t.model).label}；采购比例 ${num(p.q,6)}；${procurementInfo(t.model||'seedance-2.0',p.q).procurementStatus}`,`实付 ${state.plan.pay}元 / 到账 ${state.plan.total}积分 / ${targetSummary(p)}`,`定价倍率 = ${decimal(p.usedM)}（显示值；内部精确计算）`,`充值核算口径：${state.plan.basis}`,'',view.text,...(recordContext.text?['',recordContext.text]:[])].join('\n');
 openDrawer('calculation',chosen==='actual'?'实测复算':'计算明细',label(t)+' / '+vinLabel(t)+' · '+(chosen==='list'?'火山刊例成本':chosen==='theory'?'理论采购成本':'立画成本'),content,true);if(chosen==='theory'&&$('unit-p'))unitPreview();
}
let ruleContext=null;
function openRules(ruleTask=state.task){
 ruleContext=clone(ruleTask);const t=ruleContext,v=quote(t),spec=M.get(t.model),m=v.rule;
 openDrawer('usage','用量说明',spec.label+' · 规则版本 '+spec.version,usageExplanation(v,t,true)+`<details class="record-notes"><summary>高级：人工门槛覆盖</summary><p>仅在有明确特殊规则时使用；不会改写官方来源。</p>${t.video?`<label class="fieldlabel" for="rule-min">最低 Token</label><input class="input" id="rule-min" value="${esc(m?.tokens||'')}"><label class="fieldlabel" for="rule-note">来源与适用范围</label><textarea class="input" id="rule-note">${esc(m?.kind==='manual'?m.note:'')}</textarea><div id="rule-error"></div><button class="btn" id="save-rule">保存人工覆盖</button><button class="btn" id="remove-rule">恢复官方规则</button>`:'无视频输入不应用最低用量。'}</details>`);
}
function closePlan(focus=false){
 const panel=$('precision-popover');if(panel.hidden)return;panel.hidden=true;panel.innerHTML='';$('plan-settings').setAttribute('aria-expanded','false');if(focus)$('plan-settings').focus();
}
function positionPlan(){
 const panel=$('precision-popover');if(panel.hidden)return;
 const box=$('plan-settings').getBoundingClientRect(),width=panel.offsetWidth||420,height=panel.offsetHeight||58;
 panel.style.left=Math.max(12,Math.min(box.left,window.innerWidth-width-12))+'px';
 panel.style.top=Math.max(12,Math.min(box.bottom+8+height<=window.innerHeight-12?box.bottom+8:box.top-height-8,window.innerHeight-height-12))+'px';
}
function openPlan(){
 if(state.plan.mode==='manual')return;
 if(!$('precision-popover').hidden){closePlan(true);return;}
 closeQuickOptions();const saved=state.plan.mode==='saved';
 $('precision-popover').innerHTML=`<div class="precision-fields"><div><label for="plan-digits">最大小数位</label><select id="plan-digits"><option value="full" ${!saved?'selected':''}>不限</option>${Array.from({length:21},(_,n)=>`<option value="${n}" ${saved&&n===state.plan.digits?'selected':''}>${n} 位</option>`).join('')}</select></div><div><label for="plan-round">舍入方式</label><select id="plan-round" ${!saved?'disabled':''}><option value="nearest" ${state.plan.round==='nearest'?'selected':''}>四舍五入</option><option value="truncate" ${state.plan.round==='truncate'?'selected':''}>截断</option></select></div></div><p id="plan-error" class="inline-error" role="alert"></p>`;
 $('precision-popover').hidden=false;$('plan-settings').setAttribute('aria-expanded','true');positionPlan();$('plan-digits').focus();
}
function applyPlanPrecision(){
 const saved=$('plan-digits').value!=='full';$('plan-round').disabled=!saved;
 try{
  const candidate={...state.plan,mode:saved?'saved':'ideal',limitPrecision:saved,digits:saved?Number($('plan-digits').value):state.plan.digits,round:$('plan-round').value};
  if(!validPlan(candidate))throw Error('请检查倍率精度设置。');
  if(saved&&cmp(decimalString(idealPricing(candidate).M,candidate.digits,candidate.round),0)<=0)throw Error('处理后的倍率为0，请增加小数位。');
  state.plan=candidate;$('plan-error').textContent='';$('plan-digits').removeAttribute('aria-invalid');render(true);
 }catch(e){$('plan-error').textContent=e.message;$('plan-digits').setAttribute('aria-invalid','true');}
 positionPlan();
}
function openModelPricing(){
 const rows=Object.keys(PROCUREMENT_MODELS).map(model=>{
  const p=pricingForModel(model),outcome=policyOutcome(p),info=procurementInfo(model,p.q);
  return `<tr class="${model===state.task.model?'selected':''}"><td><button class="rowbutton" data-pricing-model="${model}">${esc(M.get(model).label)}</button></td><td>${num(mul(p.q,10),4)}折${info.procurementSimulated?'<span class="second">模拟</span>':''}</td><td>${esc(targetSummary(p))}</td><td class="num" title="${num(p.usedM,20)}">${num(p.usedM,10)}</td><td>${num(outcome.discount,4)}折</td><td class="${cmp(outcome.margin,0)<0?'loss':''}">${num(outcome.margin,4)}%</td></tr>`;
 });
 openDrawer('profiles','模型定价',`充值 ${num(state.plan.pay,2)} 元 → ${num(state.plan.total,4)} 积分`,'<div class="table-scroll">'+table(['模型','采购折扣','定价依据','采用倍率','客户折扣','模型毛利率'],rows,'pricing-overview-table')+'</div>'+'<p class="footnote">折扣与毛利率未计每次扣分取整。点击模型名称配置该模型。</p>',true);
}
function unitPreview(){try{const P=$('unit-p').value.trim();if(!positive(P))throw Error('请输入正数金额');const p=drawerName==='calculation'?pricingForModel(detailContext.task.model):pricing(),x=E.settle(P,mul(P,p.q),p);$('unit-result').innerHTML=`<div class="fact"><span>假设采购成本</span><b>${cash(x.C,9)}</b></div>${x.target===null?'':`<div class="fact"><span>目标金额</span><b>${cash(x.target,9)}</b></div>`}<div class="fact"><span>取整前积分</span><b>${num(x.raw,12)}</b></div><div class="fact emph"><span>向上取整预计扣分</span><b>${num(x.N,0)} 积分</b></div><div class="fact"><span>折合金额</span><b>${cash(x.cash,9)}</b></div>`;}catch(e){$('unit-result').innerHTML='<div class="notice red">'+esc(e.message)+'</div>';}}
function observationDetail(id){openDetails('actual',id);}
let observationContext=null;
function observationEditor(id='',contextTask=null,contextRecordId=selectedTaskRecordId){
 const old=state.observations.find(o=>o.id===id);
 const editorTask=contextTask||state.task,editorValid=validTask(editorTask,false);
 const currentValid=editorValid&&validTask(state.task,false)&&key(editorTask)===key(state.task),context=currentValid?key(editorTask)+'|'+contextRecordId:null,saved=currentValid?matchingCostInput(editorTask,contextRecordId):null;
 const inline=costInputDraft?.context===context?costInputDraft:saved;
 const inlineOrigin=!old&&inline&&inline.value!==''&&positive(inline.value,true,20);
 const o=old||{id:uid(),provider:'立画',title:'',params:clone(editorValid?editorTask:defaults().task),costBasis:'recorded',P:'',C:inlineOrigin?inline.value:'',N:'',date:'',note:''};
 observationContext={id:o.id,inlineOrigin:!!inlineOrigin,taskKey:key(o.params)};
 const model=o.params.model||'seedance-2.0',spec=M.get(model),derived=o.costBasis==='platform-list',incompleteLegacy=!!old&&old.costBasis!=='platform-list'&&old.C==='';
 openDrawer('record-edit',old?'编辑平台实测':'录入平台实测','',`<div class="record-inputs record-editor" data-edit-id="${esc(o.id)}">
 <input type="hidden" id="o-model" value="${esc(model)}">
 <details class="record-spec-details"><summary><span>任务规格</span><span id="o-task-summary">${esc(label(o.params))} · ${esc(vinLabel(o.params))}</span></summary>
 <div class="record-spec-fields"><div class="grid2"><div><label class="fieldlabel" for="o-res">分辨率</label><select id="o-res">${spec.resolutions.map(r=>`<option value="${r}" ${r===o.params.res?'selected':''}>${r==='4k'?'4K':r}</option>`).join('')}</select></div><div><label class="fieldlabel" for="o-ratio">画面比例</label><select id="o-ratio">${RATIOS.map(r=>`<option value="${r}" ${r===o.params.ratio?'selected':''}>${r}</option>`).join('')}</select></div></div>
 <div class="grid2"><div><label class="fieldlabel" for="o-seconds">输出时长（秒）</label><input class="input num" id="o-seconds" inputmode="numeric" value="${esc(o.params.seconds)}"></div><div><label class="fieldlabel" for="o-video">视频输入</label><select id="o-video"><option value="false" ${!o.params.video?'selected':''}>无视频输入</option><option value="true" ${o.params.video?'selected':''}>有视频输入</option></select></div></div>
 <div id="o-vin-field" ${!o.params.video?'hidden':''}><label class="fieldlabel" for="o-vin">输入视频总时长（秒）</label><input class="input num" id="o-vin" inputmode="decimal" value="${esc(o.params.vin)}"></div></div></details>
 <section class="record-cost-section"><label class="fieldlabel" for="o-cost-basis">成本录入方式</label><select id="o-cost-basis" aria-describedby="o-cost-help"><option value="recorded" ${!derived?'selected':''}>立画实际成本（直接采用）</option><option value="platform-list" ${derived?'selected':''}>折前成本（按采购折扣换算）</option></select>
 <div class="record-money-fields"><div id="o-primary-cost"><div id="o-c-field"><label class="fieldlabel" for="o-c">立画实际成本（元）</label><input class="input num" id="o-c" inputmode="decimal" placeholder="填写本次实际成本" value="${esc(o.C)}"></div></div><div class="record-deduction-field"><label class="fieldlabel" for="o-n">历史实扣（积分）<span class="field-optional">可选</span></label><input class="input num" id="o-n" inputmode="numeric" placeholder="未记录可留空" value="${esc(o.N)}"></div></div>
 <p class="record-field-help" id="o-cost-help"></p>
 </section>
 <details class="record-optional-cost" id="o-optional-cost"><summary>折前成本<span class="field-optional">可选</span></summary><div id="o-secondary-cost"><div id="o-p-field"><label class="fieldlabel" id="o-p-label" for="o-p">折前成本（元）</label><input class="input num" id="o-p" inputmode="decimal" placeholder="填写记录中的折前金额" value="${esc(o.P)}"></div><p class="record-field-help">用于核对客户折扣与目标售价，不改变已录入的实际成本。</p></div></details>
 <details class="record-more-details"><summary>补充信息</summary><div class="record-more-fields"><div class="grid2"><div><label class="fieldlabel" for="o-title">记录名称</label><input class="input" id="o-title" maxlength="100" placeholder="自动按任务命名" value="${esc(o.title)}"></div><div><label class="fieldlabel" for="o-date">日期 / 批次</label><input class="input" id="o-date" maxlength="100" value="${esc(o.date)}"></div></div>
 <label class="fieldlabel" for="o-usage">API Token 用量</label><input class="input num" id="o-usage" value="${esc(o.usage||'')}" inputmode="numeric" placeholder="completion_tokens，可留空">
 <label class="fieldlabel record-note-label" for="o-note">来源 / 备注</label><textarea class="input" id="o-note" maxlength="1000">${esc(o.note)}</textarea></div></details>
 <div id="record-error" class="inline-error" role="alert"></div><div class="record-editor-actions">${old?`<button class="link danger-link" data-delete-observation="${esc(o.id)}">删除记录</button>`:''}<button class="btn" id="cancel-observation">取消</button><button class="btn primary" id="save-observation" data-id="${esc(o.id)}">保存记录</button></div></div>`);
 const sync=()=>{
  const derived=$('o-cost-basis').value==='platform-list';
  $('o-c-field').hidden=derived;
  const destination=$(derived?'o-primary-cost':'o-secondary-cost');
  if($('o-p-field').parentElement!==destination)destination.prepend($('o-p-field'));
  $('o-optional-cost').hidden=derived;
  $('o-p').required=derived;$('o-c').required=!derived&&!incompleteLegacy;
  $('o-cost-help').textContent=derived?`核算成本 = 折前成本 × 采购折扣（${num(mul(pricingForModel(model).q,10),4)} 折）。`:incompleteLegacy?'原记录未含实际成本；补录后可核算扣分。':'立画实际成本直接采用，不再乘采购折扣。';
  $('o-vin-field').hidden=$('o-video').value!=='true';
  const draft={model,res:$('o-res').value,ratio:$('o-ratio').value,seconds:$('o-seconds').value.trim(),video:$('o-video').value==='true',vin:$('o-vin').value.trim()};
  $('o-task-summary').textContent=label(draft)+' · '+vinLabel(draft);
 };
 const fields=document.querySelector('.record-editor');
 $('drawer-footer').append($('record-error'),fields.querySelector('.record-editor-actions'));$('drawer-footer').hidden=false;
 $('cancel-observation').addEventListener('click',closeDrawer);
 sync();
 fields.addEventListener('change',sync);
 fields.addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');$('record-error').textContent='';if(['o-seconds','o-vin'].includes(e.target.id))sync();});
}
function saveObservation(id){const old=state.observations.find(r=>r.id===id),o={...(old||{provider:'立画'}),id,title:$('o-title').value.trim(),params:{model:$('o-model').value,res:$('o-res').value,ratio:$('o-ratio').value,seconds:$('o-seconds').value.trim(),video:$('o-video').value==='true',vin:$('o-vin').value.trim()},costBasis:$('o-cost-basis').value,P:$('o-p').value.trim(),C:$('o-cost-basis').value==='platform-list'?'':$('o-c').value.trim(),N:$('o-n').value.trim(),usage:$('o-usage').value.trim(),date:$('o-date').value.trim(),note:$('o-note').value.trim()};
 if(validTask(o.params,false))o.params=normalizeTask(o.params,false);
 if(!o.title)o.title='立画实测 · '+label(o.params);
 const preserveIncomplete=old&&old.costBasis!=='platform-list'&&old.C==='';
 if(!validObservation(o)||(o.costBasis==='recorded'&&o.C===''&&!preserveIncomplete)){
 let field='o-c',message='请填写立画实际成本。';
 if(!validTask(o.params,false)){
  const spec=M.get(o.params.model);let secondsValid=false;try{secondsValid=M.normalizeSeconds(o.params.seconds,o.params.model)!=='auto';}catch(_){}
  if(!spec.resolutions.includes(o.params.res)){field='o-res';message='请选择当前模型支持的分辨率。';}
  else if(!RATIOS.includes(o.params.ratio)){field='o-ratio';message='请选择有效的画面比例。';}
  else if(!secondsValid){field='o-seconds';message=`输出时长须为 ${spec.seconds.min}–${spec.seconds.max} 秒的整数。`;}
  else {field='o-vin';message=`输入视频总时长须为 ${spec.inputSeconds.min}–${spec.inputSeconds.max} 秒。`;}
 }
 else if((o.costBasis==='platform-list'&&o.P==='')||(o.P!==''&&!positive(o.P))){field='o-p';message='请填写有效的折前成本金额。';}
 else if(o.C!==''&&!positive(o.C,true)){field='o-c';message='立画实际成本须为有效的非负金额。';}
 else if(o.N!==''&&(!/^\d+$/.test(o.N)||+o.N>=1e12)){field='o-n';message='历史实扣须为有效的非负整数。';}
 else if(o.usage&&(!/^\d+$/.test(o.usage)||+o.usage<=0||+o.usage>=1e12)){field='o-usage';message='API Token 用量须为有效的正整数。';}
 $('record-error').textContent=message;const input=$(field);input.setAttribute('aria-invalid','true');for(let parent=input.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;input.focus();return;
 }
 const i=state.observations.findIndex(x=>x.id===id);
 if(i<0){if(state.observations.length>=200)return toast('最多200条实测，请先导出清理。');state.observations.push(o);}else state.observations[i]=o;
 const sameTask=validTask(state.task,false)&&key(o.params)===key(state.task);
 if(old){
  if(state.taskCostInput?.recordId===id)state.taskCostInput=null;
  if(costInputDraft?.context===key(old.params)+'|'+id)costInputDraft=null;
 }
 if(sameTask){
  selectedTaskRecordKey=key(state.task);selectedTaskRecordId=o.id;
  // Keep an inline calculation's theoretical benchmark separate from historical evidence.
  if(!old&&observationContext?.id===id&&observationContext.inlineOrigin&&observationContext.taskKey===key(o.params)){
   state.taskCostInput=o.costBasis==='recorded'&&o.P===''?{taskKey:key(o.params),recordId:o.id,value:o.C}:null;costInputDraft=null;
  }
 }
 observationContext=null;closeDrawer();render();toast('实测记录已保存。');
}
function download(name,text,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const filename=()=>state.plan.company.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,50)||'Reelay方案';
function summary(){const p=pricing(),v=current(),x=v.x;return ['Reelay V9.12.3 · 视频成本与定价','',state.plan.company,`规则：${M.get(state.task.model).version}；核验日期${R.VERIFIED_AT}；模型 ${M.get(state.task.model).label}。`,`采购比例 ${num(p.q,6)}；${procurementInfo(state.task.model,p.q).procurementStatus}；积分换算常数10。`,`充值方案：${state.plan.basis}`,`实付 ${state.plan.pay} 元 / 到账 ${state.plan.total} 积分 / ${targetSummary(p)}`,`定价倍率 M = ${decimal(p.usedM)}`,`保本倍率 = ${decimal(p.breakEvenM)}`,`任务：${label(state.task)} / ${vinLabel(state.task)}`,`估算依据：${coverage(v)}`,...(x?[`刊例费用 P = ${decimal(x.P)}`,`采购成本 C = ${decimal(x.C)}`,`取整前积分 = ${decimal(x.raw)}`,`预计扣分 = ${num(x.N,0)}`,`折合金额 = ${decimal(x.cash)}`,`模型毛利 = ${decimal(x.profit)}`,`模型毛利率 = ${x.margin===null?'未定义':decimal(x.margin)+'%'}`]:['当前参数无法计算，请检查输入。']),'','费用为官方规则估算，API实际usage或账单可能有差异。毛利仅扣模型采购成本，不是净利润。','平台实测和历史扣分分别保存；不会用于替换理论公式。',`任务清单 ${state.tasks.length}种规格；实测记录 ${state.observations.length}条。`].join('\n');}
function exportJSON(){
 const procurementProfiles=Object.keys(PROCUREMENT_MODELS).map(model=>procurementInfo(model));
 const pricingProfiles=Object.keys(PROCUREMENT_MODELS).map(model=>{const p=pricingForModel(model),outcome=policyOutcome(p);return {model,...state.plan.modelPricing[model],adoptedMultiplier:decimal(p.usedM),customerDiscount:decimal(outcome.discount),unroundedMargin:decimal(outcome.margin)};});
 const taskEstimates=state.tasks.map(row=>{const v=theory(row.params);return v.x?exportRow(row.title,v,v.x,row.qty):{model:row.params.model,...procurementInfo(row.params.model),scope:'规则缺项，未生成收费估算'};});
 download(filename()+'_V9方案.json',JSON.stringify({format:'reelay.pricing.v9',appVersion:'9.12.3',exportedAt:new Date().toISOString(),ruleVersion:R.VERSION,scope:'theory and observations stored separately',procurementProfiles,pricingProfiles,taskEstimates,recordRecalculations:actualRows,state},null,2),'application/json');
}
function csvCell(x){let s=String(x??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportActualCSV(){const rows=actualRows;if(!rows.length)return toast('没有可导出记录。');const titles={scope:'数据域',model:'模型',modelRuleVersion:'模型规则版本',procurementRatio:'当前复算采购比例',supplierAvailable:'有折扣供应商',procurementSimulated:'采购折扣为模拟',procurementStatus:'采购状态',record:'记录',params:'规格',coverage:'估算依据',theoryP:'刊例费用P',recordedP:'平台记录P',deltaP:'实测P减估算P',theoryC:'采购成本C',recordedC:'已记录采购C_推算记录为空',costBasis:'成本口径',recalcC:'当前复算采购C',supplierReferenceC:'原表供应商测算C_非实付',supplierReferenceQ:'原表供应商测算比例',provider:'实测平台',deltaC:'实测C减估算C',recordedN:'平台实际扣分_空白为未知',recalcN:'当前复算扣分_非历史',recalcCash:'当前复算金额',recalcProfit:'当前复算模型毛利',pay:'当前充值实付',total:'当前到账积分',M:'当前倍率',targetMode:'当前目标模式',usage:'API_completion_tokens_原记录',note:'备注'};const ks=Object.keys(titles),csv='\ufeff'+[ks.map(k=>csvCell(titles[k])).join(','),...rows.map(r=>ks.map(k=>csvCell(r[k])).join(','))].join('\r\n');download(filename()+'_实测对照'+'.csv',csv,'text/csv;charset=utf-8');}
function quoteSummary(){const v=quote(),c=v.calc,video=state.task.video;return [M.get(state.task.model).label+' · 模型估价',label(state.task)+' / '+vinLabel(state.task),`刊例单价：${num(c.rate)} 元 / 百万 Token`,`估算 Token 用量：${tokenText(c.tokens)}`,...(video?[`最低 Token 用量：${c.minimum?tokenText(c.minimum):'待补齐'}`]:[]),`刊例费用：${v.partial?'待补齐':cash(c.P,12)}`,`规则版本：${c.ruleVersion}`,'用量为估算；实际以 API usage.completion_tokens 为准。'].join('\n');}
function openExport(){if(!modelValid)return toast('请先修正生成参数。');openDrawer('export','导出','选择要保留的内容。',`<button class="choice" id="export-quote"><div class="choice-title"><b>模型估价摘要</b><span>↓</span></div><p>当前模型、参数、单价、Token 与刊例费用。</p></button><button class="choice" id="export-json" ${globalValid?'':'disabled'}><div class="choice-title"><b>完整方案 JSON</b><span>↓</span></div><p>包含平台方案、任务与实测，可重新导入。${globalValid?'':'平台参数修正后可导出。'}</p></button><button class="choice" id="export-summary" ${globalValid?'':'disabled'}><div class="choice-title"><b>平台定价摘要</b><span>↓</span></div><p>当前采购、充值、收费与毛利。</p></button><button class="choice" id="export-actual" ${globalValid?'':'disabled'}><div class="choice-title"><b>实测对账 CSV</b><span>↓</span></div></button>`);}
function migrate(payload){if(['reelay.pricing.v9','reelay.pricing.v8'].includes(payload?.format)){return{value:upgradeState(payload.state),note:'已导入方案。'+fixedTaskNotice(payload.state?.task)};}
if(payload?.format==='reelay.pricing.v7'&&payload.state){const old=payload.state,n=defaults();n.plan={...n.plan,...old.plan,q:old.plan?.q||'0.735',targetMode:'discount',margin:'8.125',frozen:undefined};delete n.plan.frozen;delete n.plan.modelPricing;delete n.plan.pricingModel;delete n.plan.procurementByModel;delete n.plan.procurementModel;if(validTask(old.task))n.task=fixedTask(old.task);if(Array.isArray(old.recharges)&&old.recharges.every(r=>positive(r.pay,false,2)&&positive(r.total,false,4)))n.recharges=clone(old.recharges);const candidates=[...(old.custom||[]),old.cost?.evidence,...(old.tasks||[]).map(r=>r.cost?.evidence)].filter(Boolean);for(const e of candidates){if(['screenshot','bill'].includes(e.kind)&&validTask(e.params,false)){const o={id:String(e.id||uid()),title:String(e.title||'旧版实测'),params:clone(e.params),P:String(e.P??''),C:String(e.C??''),N:'',date:'',note:String(e.note||'从旧版金额记录导入，未确认实际扣分。')};if(validObservation(o)&&!n.observations.some(x=>x.id===o.id))n.observations.push(o);}else{const r={id:String(e.id||uid()),title:String(e.title||'旧版其他参考'),params:e.params||null,P:String(e.P??''),C:String(e.C??''),note:String(e.note||'从旧版迁移，仅作参考，不进入理论计算。')};if(validReference(r)&&!n.references.some(x=>x.id===r.id))n.references.push(r);}}
for(const r of old.tasks||[]){if(validTask(r.task,false))n.tasks.push({id:String(r.id||uid()),params:clone(r.task),qty:String(r.qty||1),title:label(r.task)+' / '+vinLabel(r.task)});}return{value:upgradeState(n),note:'已导入方案。'+fixedTaskNotice(old.task)};}
throw Error('仅支持本工具V9、V8或V7导出的方案JSON。');}
function openReset(){openDrawer('reset','重置V9本地草稿？','不会删除旧版V7文件或旧版草稿，不影响真实后台。',`<p>将恢复默认企业条件、理论任务参数和原表4条独立实测记录。当前未导出的修改会丢失。</p><div class="actions"><button class="btn primary" id="confirm-reset">确认重置V9</button><button class="btn" id="close-only">取消</button></div>`);}
document.addEventListener('click',async e=>{
 if(!$('precision-popover').hidden&&!$('precision-popover').contains(e.target)&&!$('plan-settings').contains(e.target))closePlan();
 if(quickIsOpen()&&!$('quick-drawer').contains(e.target)&&!$('quick-toggle').contains(e.target))closeQuickOptions();
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset,id=b.id;
if(d.costBasis){selectCostBasis(d.costBasis);return;}
if(d.purchase){state.plan.q=num(div(d.purchase,10),6);render();return;}
if(d.pricingModel){closeDrawer();changeModel(d.pricingModel);$('plan-title').focus();return;}
if(d.usageSection){goToUsageSection(d.usageSection);return;}
if(d.workspace){showWorkspace(d.workspace);return;}if(d.example){if(!quickIsOpen())return;const preset=quickTasks(state.task.model)[d.example];if(preset){closeQuickOptions(true);changeTask(clone(preset));}return;}if(d.video){const video=d.video==='true';if(video!==state.task.video)changeTask({video});return;}if(d.res){changeTask({res:d.res});return;}if(d.ratio){changeTask({ratio:d.ratio});return;}if(d.seconds){changeTask({seconds:d.seconds});return;}if(d.discount){useAutomaticPricing('discount');state.plan.discount=d.discount;render();return;}if(d.margin){useAutomaticPricing('margin');state.plan.margin=d.margin;render();return;}if(d.observation){observationDetail(d.observation);return;}if(d.editObservation){observationEditor(d.editObservation);return;}if(d.deleteObservation){state.observations=state.observations.filter(o=>o.id!==d.deleteObservation);closeDrawer();render();toast('已删除实测记录，理论结果未变。');return;}
if(!globalValid&&!(['actual-export','add-observation','plan-settings'].includes(id)&&validPlan(state.plan))&&['details','show-formula','plan-settings','task-rule','open-rules','add-observation','actual-export'].includes(id)){toast('请先修正顶部定价或任务输入。');return;}
switch(id){
case'edit-multiplier':beginMultiplierEdit();break;
case'save-multiplier':saveMultiplierEdit();break;
case'cancel-multiplier':cancelMultiplierEdit(true);break;
case'restore-auto-multiplier':useAutomaticPricing();render();$('edit-multiplier').focus();break;
case'quick-toggle':if(quickIsOpen())closeQuickOptions(true);else openQuickOptions();break;
case'export-rules':download('Reelay_V9_规则来源.json',JSON.stringify({version:R.VERSION,sources:R.sources,rules:state.rules},null,2),'application/json');break;
case'close-drawer':case'close-only':closeDrawer();break;
case'open-rules':case'task-rule':case'open-rule-from-formula':openRules();break;
case'show-formula':formulaDetails();break;
case'usage-help':openUsage();break;
case'details':openDetails(taskCostBasis==='actual'?(matchingCostInput()?'inline':'actual'):taskCostBasis,selectedTaskRecordId);break;
case'detail-usage':{const t=detailContext.task;openDrawer('usage','用量说明',label(t),'<button class="link" id="back-pricing-details">← 返回计算明细</button>'+usageExplanation(quote(t),t,true));break;}
case'back-pricing-details':openDetails(detailContext.mode,detailContext.recordId,detailContext.task);break;
case'restore-record-cost':{const {mode,task:t,recordId}=detailContext,context=key(t)+'|'+recordId;if(matchingCostInput(t,recordId))state.taskCostInput=null;if(costInputDraft?.context===context)costInputDraft=null;resumeInlineActual=false;render();openDetails(mode==='inline'?'actual':mode,recordId,t);break;}
case'model-pricing-overview':if(platformValid)openModelPricing();else toast('请先修正定价输入。');break;
case'export-calculation':download(filename()+'_计算展开_'+({actual:'实测复算',inline:'立画成本',list:'刊例成本',theory:'理论采购'}[detailContext.mode])+'.txt',detailContext.text);break;
case'detail-open-rule':openRules(detailContext.task||state.task);break;
case'detail-add-observation':observationEditor('',detailContext.task,detailContext.recordId);break;
case'view-actual':showWorkspace('actual');break;
case'back-theory':showWorkspace('theory');break;
case'plan-settings':openPlan();break;
case'add-observation':observationEditor();break;
case'save-observation':saveObservation(d.id);break;
case'save-rule':{const tokens=$('rule-min').value.trim(),note=$('rule-note').value.trim();if(!positive(tokens,false,12)||!note){$('rule-error').textContent='请输入正数Token门槛并注明规则来源；未知保持空白，不填0。';return;}state.rules.minima[minimumKey(ruleContext||state.task)]={tokens,note,kind:'manual'};closeDrawer();render();toast('本输出规格人工门槛已保存。不同视频输入时长共用此门槛；实测原值不变。');break;}
case'remove-rule':state.rules.minima[minimumKey(ruleContext||state.task)]=clone(M.officialMinimum(ruleContext||state.task));closeDrawer();render();toast('已恢复官方规则；实测记录不变。');break;
case'export':openExport();break;
case'export-quote':if(modelValid)download('Reelay_模型估价.txt',quoteSummary());break;
case'export-json':if(globalValid)exportJSON();break;
case'export-summary':if(globalValid)download(filename()+'_理论方案说明.txt',summary());break;
case'actual-export':case'export-actual':if(validPlan(state.plan))exportActualCSV();break;
case'import':$('file').click();break;
case'reset':openReset();break;
case'confirm-reset':cancelMultiplierEdit();costInputDraft=null;resumeInlineActual=false;taskCostBasis='theory';state=defaults();closeDrawer();render();toast('已恢复默认方案。');break;
}
});
document.addEventListener('input',e=>{const el=e.target,id=el.id;if(id==='record-cost'){resumeInlineActual=resumeInlineActual||taskCostBasis==='actual';const value=el.value.trim();if(!validTask(state.task,false))return;costInputDraft={context:key(state.task)+'|'+selectedTaskRecordId,value};if(value===''||positive(value,true,20)){state.taskCostInput={taskKey:key(state.task),recordId:selectedTaskRecordId,value};costInputDraft=null;}render();return;}if(['pay','total','discount','target-margin','purchase-discount'].includes(id)){if(id==='discount'||id==='target-margin')useAutomaticPricing(id==='discount'?'discount':'margin');if(id==='target-margin')state.plan.margin=el.value;else if(id==='purchase-discount'){state.plan.q=positive(el.value,false,4)?num(div(el.value,10),6):'';}else if(id==='pay')state.plan.pay=el.value;else if(id==='total')state.plan.total=el.value;else state.plan.discount=el.value;render();return;}
if(id==='vin-slider'){if(state.task.video)changeTask({vin:el.value});return;}if(id==='manual-m'){if(multiplierEdit)validateMultiplierEdit();return;}if(id==='vin'){
 const entered=el.value;
 try{state.task.vin=wholeInputSeconds(entered);el.value=state.task.vin;if(cmp(entered,state.task.vin)!==0)toast('已向上取整：'+entered+' → '+state.task.vin+' 秒。');}
 catch(_){state.task.vin=entered;}
 render();return;
}if(id==='seconds'){state.task.seconds=el.value;render();return;}if(id==='unit-p'){unitPreview();return;}});
document.addEventListener('change',e=>{const el=e.target,id=el.id;if(id==='model'){changeModel(el.value);return;}if(id==='pricing-basis'){if(!['discount','margin'].includes(el.value))return;useAutomaticPricing(el.value);render();return;}if(id==='task-record-select'){resumeInlineActual=false;selectedTaskRecordId=el.value;render();return;}if(id==='seconds'&&validTask(state.task)){state.task=normalizeTask(state.task);render();return;}if(id==='details-record'){const context=detailContext.task,recordId=el.value;if(globalValid&&key(context)===key(state.task)){selectedTaskRecordId=recordId;renderResult();}openDetails('actual',recordId,context);return;}if(['plan-digits','plan-round'].includes(id)){applyPlanPrecision();return;}});
$('fee-digits').addEventListener('click',e=>{
 feeDisplayDigits=feeDisplayDigits===2?6:2;
 const hint='当前显示 '+feeDisplayDigits+' 位小数，点击切换为 '+(feeDisplayDigits===2?6:2)+' 位';
 e.currentTarget.title=hint;$('fee-digits-hint').textContent=hint;
 if($('cost-p').textContent!=='—')$('cost-p').textContent=fixed(quote().calc.P,feeDisplayDigits);
});
$('drawer-body').addEventListener('scroll',syncUsageSection,{passive:true});
window.addEventListener('resize',()=>{usageJumpPosition=null;syncUsageSection();},{passive:true});
$('drawer-body').addEventListener('change',e=>{
 if(e.target.id!=='usage-show-pixels')return;
 showDimensionPixels=e.target.checked;
 $('usage-dimension-table').querySelectorAll('.dimension-total').forEach(el=>{el.hidden=!showDimensionPixels;});
});
// The compact range and numeric value share one integer duration.
let vinEditStart='2';
$('vin').addEventListener('focus',()=>{vinEditStart=positive(state.task.vin,false,4)?state.task.vin:'2';});
$('vin').addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();state.task.vin=vinEditStart;$('vin').value=vinEditStart;$('vin').blur();render();}
 else if(e.key==='Enter'){e.preventDefault();$('vin').blur();}
});
$('vin').addEventListener('blur',()=>{
 if(!state.task.video){$('vin').value=state.task.vin;vinEditStart=state.task.vin;return;}
 try{state.task.vin=wholeInputSeconds($('vin').value);}catch(_){state.task.vin=vinEditStart;}
 $('vin').value=state.task.vin;render();
});
document.addEventListener('pointerdown',e=>{if(!$('precision-popover').hidden&&!$('precision-popover').contains(e.target)&&!$('plan-settings').contains(e.target))closePlan();if(quickIsOpen()&&!$('quick-drawer').contains(e.target)&&!$('quick-toggle').contains(e.target))closeQuickOptions();});
document.addEventListener('focusin',e=>{if(!$('precision-popover').hidden&&!$('precision-popover').contains(e.target)&&!$('plan-settings').contains(e.target))closePlan();if(quickIsOpen()&&!$('quick-drawer').contains(e.target)&&!$('quick-toggle').contains(e.target))closeQuickOptions();});
$('quick-content').addEventListener('transitionend',e=>{if(e.target!==$('quick-content')||e.propertyName!=='transform')return;if(quickIsOpen())revealQuickOption();else finishQuickClose();});
$('video-input-control').addEventListener('transitionend',e=>{if(e.target===$('video-input-control')&&e.propertyName==='grid-template-columns')finishVideoClose();});
window.addEventListener('resize',positionPlan,{passive:true});
window.addEventListener('scroll',positionPlan,{capture:true,passive:true});
window.addEventListener('resize',positionQuickOptions,{passive:true});
window.addEventListener('scroll',e=>{if(e.target instanceof Element&&$('quick-drawer').contains(e.target))return;positionQuickOptions();},{capture:true,passive:true});
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeDrawer();});
document.addEventListener('keydown',e=>{
 const costTab=e.target instanceof Element?e.target.closest('[data-cost-basis]'):null;
 if(costTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
  e.preventDefault();const tabs=[...document.querySelectorAll('[data-cost-basis]')].filter(tab=>!tab.disabled&&tab.getAttribute('aria-disabled')!=='true');
  if(!tabs.length)return;const index=tabs.indexOf(costTab),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[next].focus();selectCostBasis(tabs[next].dataset.costBasis);return;
 }
 if(!$('precision-popover').hidden&&e.key==='Escape'){e.preventDefault();closePlan(true);return;}
 if(multiplierEdit&&e.key==='Escape'){e.preventDefault();cancelMultiplierEdit(true);return;}
 if(multiplierEdit&&e.target===$('manual-m')&&e.key==='Enter'){e.preventDefault();saveMultiplierEdit();return;}
 if(e.target===$('quick-toggle')&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();openQuickOptions();return;}
 if(quickIsOpen()&&e.key==='Escape'){e.preventDefault();closeQuickOptions(true);return;}
 if($('modal').hidden)return;if(e.key==='Escape'){e.preventDefault();closeDrawer();}if(e.key==='Tab'){const els=[...$('drawer').querySelectorAll('button,input,select,textarea,a[href],summary')].filter(x=>!x.disabled&&x.getClientRects().length);if(!els.length)return;const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3e6)throw Error('文件超过3MB，请检查是否为方案JSON。');const loaded=migrate(JSON.parse(await f.text()));cancelMultiplierEdit();costInputDraft=null;resumeInlineActual=false;taskCostBasis='theory';state=loaded.value;closeDrawer();render();toast(loaded.note);}catch(err){toast('导入失败：'+err.message);}finally{e.target.value='';}});

function targetLabel(p){if(p.targetAvailable===false)return '指定倍率';return p.targetMode==='margin'?'采购成本 ÷ (1 − 目标毛利率)':'刊例费用 × '+num(mul(p.d,10),6)+'折';}
function targetSummary(p){if(p.targetAvailable===false)return '指定倍率 '+num(p.usedM,12);return p.targetMode==='margin'?'目标毛利率 '+num(p.targetMarginPct,4)+'%':'目标客户折扣 '+num(mul(p.d,10),6)+'折';}


// Exposed for transparent regression tests. Theory takes no observations argument.
window.ReelayApp={getState:()=>clone(state),setState:s=>{costInputDraft=null;resumeInlineActual=false;const draft=clone(s);if(draft.plan.modelPricing){if(draft.plan.mode!=='manual')draft.plan.limitPrecision=draft.plan.mode==='saved';captureProfile(draft.plan);}state=upgradeState(draft);render();},defaults,validState,upgradeState,normalizeTask,reset:()=>{costInputDraft=null;resumeInlineActual=false;taskCostBasis='theory';state=defaults();render();},pricing,pricingForModel,procurementInfo,quote,theory,theoryOne,current,summary,key,minimumKey,normalizeMinimumKeys,openDetails,recalcRecord:(record,p=pricingForModel(record.params?.model||'seedance-2.0'))=>E.recalcRecord(record,p),migrate,OBS,REFS,getTheoryRows:()=>clone(tableRows),getActualRows:()=>clone(actualRows)};
render();
if(taskMigrationNotice)toast(taskMigrationNotice);
})();
