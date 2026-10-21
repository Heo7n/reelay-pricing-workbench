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
const OBS=[
{id:'s1',title:'平台实测 · 原表第1行',params:task('480p','1:1','4',false,'2'),P:'1.784800',C:'1.311828',N:'',date:'',note:'用户确认为平台实际数据。只保留原表成本列；历史实际扣分与适用定价口径尚未单独确认。'},
{id:'s2',title:'平台实测 · 原表第2行',params:task('1080p','21:9','15',false,'2'),P:'37.520955',C:'27.577902',N:'',date:'',note:'原表平台实测成本。理论工作台不读取此金额。'},
{id:'s3',title:'平台实测 · 原表第3行',params:task('480p','1:1','4',true,'2'),P:'1.892800',C:'1.391208',N:'',date:'',note:'平台实测值1.892800元。与转述的官方预估约1.88元是不同来源，分别保留。'},
{id:'s4',title:'平台实测 · 原表第4行',params:task(),P:'45.550532',C:'33.479641',N:'',date:'',note:'视频输入15秒，输出1080p、21:9、15秒。平台实际成本只用于对照，不替代公式输出。'}];
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
function defaults(){return{schema:'reelay.pricing.v9',plan:{company:'积分定价方案',pay:'100',total:'1538',discount:'7.35',q:'0.735',procurementModel:'seedance-2.0',procurementByModel:defaultProcurement(),modelPricing:F.defaults(),pricingModel:'seedance-2.0',limitPrecision:false,targetMode:'discount',margin:'8.125',giftMode:false,mode:'ideal',digits:12,round:'nearest',manualM:'1.538',basis:'本次充值含全部赠分；历史余额的现金价值须另行确认'},task:task('480p','1:1','4',true,'2'),rules:{version:R.VERSION,minima:R.buildMinima(),legacyMinima:{}},workspace:'theory',tab:'discounts',tasks:[],observations:clone(OBS),references:clone(REFS),recharges:[{pay:'100',total:'1500'},{pay:'100',total:'1538'},{pay:'100',total:'1600'}],rechargeMode:'fixed',frozenM:null,matrixAxis:'specs',matrixMetric:'N'};}
const KEY='reelay_pricing_v9_official' ;let state=defaults(),globalValid=true,modelValid=true,platformValid=true,tableRows=[],actualRows=[],drawerName='',lastFocus=null;
function positive(x,zero=false,maxdigits=20){let s=String(x);return s.length<48&&/^\d+(\.\d+)?$/.test(s)&&(!s.includes('.')||s.split('.')[1].length<=maxdigits)&&(zero?+s>=0:+s>0)&&+s<1e12;}
function validTask(t,allowAuto=true){try{
 const spec=M.get(t?.model),seconds=M.normalizeSeconds(t.seconds,t.model);
 return !!(spec.resolutions.includes(t.res)&&[...RATIOS,...(allowAuto?['auto']:[])].includes(t.ratio)&&(seconds!=='auto'||allowAuto&&t.seconds==='auto')&&typeof t.video==='boolean'&&(!t.video||positive(t.vin,false,4)&&+t.vin>=spec.inputSeconds.min&&+t.vin<=spec.inputSeconds.max));
}catch(_){return false;}}
function txt(s,n){return typeof s==='string'&&s.length<=n;}
function validObservation(o){return !!(o&&txt(o.id,100)&&txt(o.title,100)&&validTask(o.params,false)&&txt(o.note,1000)&&txt(o.date,100)&&(o.P===''||positive(o.P))&&(o.C===''||positive(o.C,true))&&(o.P!==''||o.C!=='')&&(o.N===''||/^\d+$/.test(o.N)&&+o.N<1e12)&&(!o.usage||/^\d+$/.test(o.usage)&&+o.usage>0&&+o.usage<1e12));}
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
function openDrawer(name,title,subtitle,html,wide=false){closeQuickOptions();if($('modal').hidden)lastFocus=document.activeElement;drawerName=name;$('drawer-title').textContent=title;$('drawer-sub').textContent=subtitle;$('drawer-sub').hidden=!subtitle;$('drawer-body').innerHTML=html;$('drawer-footer').hidden=true;$('drawer').classList.toggle('wide',wide);$('modal').dataset.panel=name;$('modal').classList.toggle('centered',['usage','calculation','profiles'].includes(name));$('modal').hidden=false;document.body.classList.add('modal-open');if(name==='usage'){usageJumpPosition=null;setUsageSection('usage-calculation');$('drawer-body').scrollTop=0;}$('close-drawer').focus();}
function closeDrawer(){if($('modal').hidden)return;$('modal').hidden=true;document.body.classList.remove('modal-open');drawerName='';if(lastFocus?.isConnected)lastFocus.focus();}
function table(headers,rows,cls=''){return'<table class="'+cls+'"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';}
const td=(s,cls='number')=>'<td class="'+cls+'">'+s+'</td>',minus=(a,b)=>{const d=sub(a,b);return(cmp(d,0)>0?'+':'')+num(d,10);};
function renderPricingMode(manual){
 const basis=manual?'manual':state.plan.targetMode;
 document.querySelectorAll('[data-pricing-basis]').forEach(button=>{const selected=button.dataset.pricingBasis===basis;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('active',selected);});
 $('discount-control').hidden=basis!=='discount';$('margin-control').hidden=basis!=='margin';$('manual-m-control').hidden=!manual;
 $('auto-multiplier').hidden=manual;$('auto-multiplier').closest('.pricing-multiplier').hidden=manual;$('manual-m-control').closest('.pricing-rule-fields').classList.toggle('is-manual',manual);$('plan-settings').hidden=manual;$('discount-picks').hidden=manual;
 const valid=manual?positive(state.plan.manualM,false,20):validTarget(state.plan);
 $('target-validation').hidden=valid;$('target-validation').textContent=manual?'倍率须大于0，最多20位小数。':'请输入有效的定价目标。';
 for(const [id,shown] of [['discount',basis==='discount'],['target-margin',basis==='margin'],['manual-m',manual]])$(id).setAttribute('aria-invalid',String(shown&&!valid));
 // Inputs remain editable even when a shared recharge condition is invalid.
 setInput('pay',state.plan.pay);setInput('discount',state.plan.discount);setInput('target-margin',state.plan.margin);setInput('manual-m',state.plan.manualM);
 if(positive(state.plan.q,false,6))setInput('purchase-discount',num(mul(state.plan.q,10),6));
 setInput('total-mode',state.plan.giftMode?'gift':'total');
 if(!state.plan.giftMode)setInput('total',state.plan.total);
 $('total').setAttribute('aria-label',state.plan.giftMode?'附赠积分':'到账总积分');
}
function policyOutcome(p){return{discount:mul(div(mul(mul(p.q,p.usedM),p.K),p.S),10),margin:mul(sub(1,div(p.S,mul(p.usedM,p.K))),100)};}
function renderPlan(){
 const p=pricing(),manual=state.plan.mode==='manual',outcome=policyOutcome(p);
 if(state.plan.giftMode)setInput('total',num(sub(p.T,mul(p.A,10)),4));
 const perPoint=fixed(p.U,6);$('per-point').textContent=perPoint;$('point-price-sign').textContent=cmp(p.U,perPoint)===0?'=':'≈';
 $('point-price').title='充值金额 ÷ 到账总积分；每积分约 '+num(p.U,20)+' 元';
 const multiplier=num(p.usedM,12);$('multiplier').textContent=(cmp(p.usedM,multiplier)===0?'':'≈ ')+multiplier;
 $('multiplier').title='采用倍率：'+num(p.usedM,20);
 $('m-state').hidden=manual||state.plan.mode!=='saved';$('m-state').textContent=state.plan.mode==='saved'?state.plan.digits+'位 · '+(state.plan.round==='truncate'?'截断':'四舍五入'):'';
 const picks=$('discount-picks');picks.dataset.mode=p.targetMode;picks.setAttribute('aria-label',p.targetMode==='margin'?'目标毛利率快捷值':'客户折扣快捷值');
 picks.innerHTML=(p.targetMode==='margin'?['0','5','8.125','10','20'].map(g=>`<button type="button" data-margin="${g}" aria-pressed="${validTarget(state.plan)&&cmp(g,state.plan.margin)===0}" class="${validTarget(state.plan)&&cmp(g,state.plan.margin)===0?'active':''}">${g}%</button>`):['7.35','7.8','8','10'].map(d=>`<button type="button" data-discount="${d}" aria-pressed="${validTarget(state.plan)&&cmp(d,state.plan.discount)===0}" class="${validTarget(state.plan)&&cmp(d,state.plan.discount)===0?'active':''}">${d==='10'?'10折':d+'折'}</button>`)).join('');
 $('plan-principle').innerHTML=`<span>客户折扣 <b class="num">${num(outcome.discount,4)}折</b></span><span>模型毛利率 <b class="num ${cmp(outcome.margin,0)<0?'loss':''}">${num(outcome.margin,4)}%</b></span>`;
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
 const show=(id,value)=>{const el=$(id),rounded=num(value,8);el.textContent=(cmp(rounded,value)!==0?'≈ ':'')+tokenText(value,8);el.title=tokenText(value)+' Token';el.style.setProperty('--token-chars',el.textContent.length);el.scrollLeft=0;};
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
 const accuracy=`${t.video?'估算 Token 用量与最低 Token 用量均':'Token 用量'}为估算值，实际以 API 返回的 <code>usage.completion_tokens</code> 为准。`;
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
function renderResult(){const v=current(),x=v.x;
 if(!x)throw Error('模型最低用量规则尚未补齐，暂不能测算平台收费。');
 $('add-task').disabled=false;$('details').disabled=false;
 const values={'cost-c':cash(x.C),'integer-points':num(x.N,0),'actual-cash':cash(x.cash),'model-profit':cash(x.profit),'model-margin':x.margin===null?'未定义':num(x.margin,4)+'%'};
 for(const [id,value] of Object.entries(values))$(id).textContent=value;
 $('model-profit').classList.toggle('loss',cmp(x.profit,0)<0);$('model-margin').classList.toggle('loss',x.margin!==null&&cmp(x.margin,0)<0);
 $('pricing-loss').hidden=cmp(x.profit,0)>=0;
}
function exportRow(title,v,x,qty=1){return{scope:'平台定价测算',model:v.model,modelRuleVersion:v.calc.ruleVersion,...procurementInfo(v.model,x.p.q),targetMode:x.p.pricingMode==='manual'?'manual':x.p.targetMode,targetMargin:x.p.targetMode==='margin'?optionalDecimal(x.p.targetMarginPct):'',profit:decimal(x.profit),margin:x.margin===null?'':decimal(x.margin),scenario:title,coverage:coverage(v),ruleVersion:state.rules.version,quantity:qty,pay:state.plan.pay,total:state.plan.total,discount:x.p.d===null?'':num(mul(x.p.d,10),4),M:decimal(x.p.usedM),P:decimal(x.P),C:decimal(x.C),raw:decimal(x.raw),N:num(x.N,0),target:optionalDecimal(x.target),cash:decimal(x.cash),gap:optionalDecimal(x.gap)};}
function renderTable(){const p=pricing(),v=current(),x=v.x;tableRows=[];$('task-count').textContent=state.tasks.length;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));let tools='',html='',end='';
if(state.tab==='discounts'){tools=`<span>同一任务与充值方案，按各档客户折扣自动计算倍率。</span><span>${esc(label(state.task))}</span>`;if(!x)html='<div class="empty">请先修正生成参数。</div>';else{html=table(['客户折扣','定价倍率','采购成本（元）','取整前积分','预计扣分','折合金额','与目标差额'],DISCOUNTS.map(d=>{const pp=pricing({discount:d,targetMode:'discount',mode:state.plan.limitPrecision?'saved':'ideal'}),vv=theory(state.task,state.rules,pp),xx=vv.x;tableRows.push(exportRow(d+'折',vv,xx));return`<tr class="${state.plan.targetMode==='discount'&&validTarget(state.plan)&&cmp(d,state.plan.discount)===0?'selected':''}">${td(`<button class="rowbutton" data-discount="${d}">${d==='10'?'无折扣':d+'折'}</button>`)}${td(num(pp.usedM,10))}${td(num(xx.C,8))}${td(num(xx.raw,8))}${td('<b>'+num(xx.N,0)+'</b>')}${td(cash(xx.cash))}${td((cmp(xx.gap,0)>=0?'+':'')+num(xx.gap,6))}</tr>`;}));}end=state.plan.mode!=='ideal'?'各档按客户折扣反算，采用当前倍率精度。':'';}
if(state.tab==='tasks'){tools='<span>按各模型当前定价重算；每次取整后按数量汇总。</span><button class="link" id="clear-tasks">清空任务清单</button>';let sumN=dec(0),sumCash=dec(0),sumC=dec(0),count=0,partial=false;html=state.tasks.length?table(['任务规格','采用倍率','数量','采购成本（元 / 次）','取整前积分 / 次','预计扣分 / 次','折合金额 / 次',''],state.tasks.map(r=>{const vv=theory(r.params,state.rules),xx=vv.x,n=dec(r.qty);sumN=add(sumN,mul(xx.N,n));sumCash=add(sumCash,mul(xx.cash,n));sumC=add(sumC,mul(xx.C,n));count+=+r.qty;partial=partial||vv.partial;tableRows.push(exportRow(r.title,vv,xx,r.qty));return`<tr>${td(`<button class="rowbutton" data-load-task="${esc(r.id)}">${esc(label(r.params))}</button><span class="second">${esc(vinLabel(r.params))} · 采购 ${num(mul(xx.p.q,10),4)}折${vv.procurement.procurementSimulated?' · 模拟':''}</span>`)}${td(`<span class="num">${num(xx.p.usedM,10)}</span>`)}${td(`<input class="qty" inputmode="numeric" data-qty="${esc(r.id)}" value="${r.qty}" aria-label="任务数量">`)}${td(num(xx.C,8))}${td(num(xx.raw,8))}${td('<b>'+num(xx.N,0)+'</b>')}${td(cash(xx.cash))}${td(`<button class="link danger-link" data-delete-task="${esc(r.id)}">删除</button>`)}</tr>`;})):'<div class="empty">配置一个任务，点击“加入任务清单”。这里只保存参数与数量，不保存平台实测金额。</div>';end=state.tasks.length?`<span>${state.tasks.length}种规格 / ${count}次 · 预计扣分 <strong>${num(sumN,0)}</strong> · 折合金额 <strong>${cash(sumCash)}</strong> · 采购 <strong>${cash(sumC)}</strong> · 模型毛利 <strong>${cash(sub(sumCash,sumC))}</strong></span><span>${partial?'包含未覆盖最低用量的基础理论场景；汇总也仅为理论演算。':'采购与扣分均为公式结果，不是实际结算汇总。'}</span>`:'任务清单与实测记录是两份独立数据；清单按每次取整再乘数量。';}
if(state.tab==='matrix'){tools=`<span>点击规格载入生成参数。</span><span><select id="matrix-axis" aria-label="矩阵维度"><option value="specs" ${state.matrixAxis==='specs'?'selected':''}>分辨率 × 时长</option><option value="ratios" ${state.matrixAxis==='ratios'?'selected':''}>画面比例</option></select> <select id="matrix-metric" aria-label="矩阵数值">${[['N','预计扣分'],['raw','取整前积分'],['P','刊例费用'],['C','采购成本'],['cash','折合金额']].map(([k,n])=>`<option value="${k}" ${state.matrixMetric===k?'selected':''}>${n}</option>`).join('')}</select></span>`;
const durations=M.get(state.task.model).seconds.max>15?['4','5','8','10','15','20','25','30']:['4','5','8','10','12','15'];
const metric=state.matrixMetric,base={...state.task},display=z=>['P','C','cash'].includes(metric)?cash(z[metric],4):num(z[metric],metric==='N'?0:4);
if(state.matrixAxis==='specs')html=table(['分辨率 / 输出时长',...durations.map(s=>s+'秒')],M.get(base.model).resolutions.map(res=>'<tr>'+td(res==='4k'?'4K':res)+durations.map(seconds=>{const t={...base,res,seconds},vv=theory(t,state.rules,p);tableRows.push(exportRow(label(t)+' / '+vinLabel(t),vv,vv.x));return td(`<button class="matrixbutton" data-matrix="${esc(JSON.stringify(t))}"><b>${display(vv.x)}</b>${vv.partial?'<span class="smallhint">规则待补齐</span>':''}</button>`);}).join('')+'</tr>'));
else html=table(['画面比例','映射像素','刊例费用','采购成本','取整前积分','预计扣分'],RATIOS.map(ratio=>{const t={...base,ratio},vv=theory(t,state.rules,p),xx=vv.x;tableRows.push(exportRow(label(t),vv,xx));return'<tr>'+td(`<button class="rowbutton" data-matrix="${esc(JSON.stringify(t))}">${ratio}</button>`)+td(M.get(t.model).dims[t.res][ratio].join(' × '))+td(cash(xx.P))+td(cash(xx.C))+td(num(xx.raw,8))+td(num(xx.N,0))+'</tr>';}));
end=`点击格子载入参数。当前${esc(vinLabel(base))}，${state.matrixAxis==='specs'?'比例 '+base.ratio:'分辨率 '+base.res+'，输出 '+base.seconds+'秒'}。`;}
if(state.tab==='recharges'){tools=`<span><select id="recharge-mode" aria-label="充值对比模式"><option value="reprice" ${state.rechargeMode==='reprice'?'selected':''}>调整倍率，保持目标</option><option value="fixed" ${state.rechargeMode==='fixed'?'selected':''}>保持当前倍率</option></select></span><button class="link" id="add-recharge">＋ 充值条件</button>`;if(!x)html='<div class="empty">请先修正生成参数。</div>';else if(state.rechargeMode==='reprice'&&p.targetAvailable===false)html='<div class="empty">当前采用指定倍率。选择客户折扣或目标毛利率后，可按目标调整倍率。</div>';else{const frozen=p.usedM;html=table(['充值实付','到账积分','每元积分','定价倍率','取整前积分','预计扣分','折合金额','折合客户折扣'],state.recharges.map(r=>{const pp=state.rechargeMode==='fixed'?pricing({...r,mode:'manual',manualM:frozen}):pricing({...r});const vv=theory(state.task,state.rules,pp),xx=vv.x;tableRows.push({...exportRow(r.pay+'元→'+r.total+'积分',vv,xx),pay:r.pay,total:r.total});return'<tr>'+td('¥'+r.pay)+td(r.total)+td(num(pp.S,6))+td(num(pp.usedM,10))+td(num(xx.raw,8))+td('<b>'+num(xx.N,0)+'</b>')+td(cash(xx.cash))+td(num(xx.effective,5)+'折')+'</tr>';}));}end='只改变充值与定价方案；刊例费用与采购成本保持不变。固定倍率不等于固定客户折扣。';}
$('table-tools').innerHTML=tools;$('table').innerHTML=html;$('table-end').innerHTML=end;}
function renderActual(){
 actualRows=[];
 $('actual-table').innerHTML=table(['实测记录 / 规格','刊例费用估算 P','平台记录 P','差额 ΔP','采购成本估算 C','平台记录 C','当前复算扣分','复算模型毛利','历史实扣积分',''],state.observations.map(o=>{
  const model=o.params.model||'seedance-2.0',p=pricingForModel(model),v=quote(o.params),P=v.partial?null:v.calc.P,C=P===null?null:mul(P,p.q),a=E.recalcRecord(o,p),profit=a.cash===null?null:sub(a.cash,a.C);
  actualRows.push({scope:'实测对照',model,modelRuleVersion:v.calc.ruleVersion,...procurementInfo(model,p.q),record:o.title,params:label(o.params)+' / '+vinLabel(o.params),coverage:coverage(v),theoryP:P===null?'':decimal(P),recordedP:o.P,deltaP:P!==null&&o.P!==''?decimal(sub(o.P,P)):'',theoryC:C===null?'':decimal(C),recordedC:o.C,deltaC:C!==null&&o.C!==''?decimal(sub(o.C,C)):'',recordedN:o.N,usage:o.usage||'',recalcN:a.N===null?'':num(a.N,0),recalcCash:a.cash===null?'':decimal(a.cash),recalcProfit:profit===null?'':decimal(profit),pay:state.plan.pay,total:state.plan.total,M:decimal(p.usedM),targetMode:p.pricingMode==='manual'?'manual':p.targetMode,note:o.note});
  return '<tr>'+td(`<b>${esc(o.title)}</b><span class="second">${esc(label(o.params))} / ${esc(vinLabel(o.params))}</span><span class="second">复算采购设置 ${num(mul(p.q,10),4)}折${procurementInfo(model,p.q).procurementSimulated?' · 模拟':''}</span>`)+td(P===null?'待补齐':num(P,8))+td(o.P!==''?esc(o.P):'—')+td(P!==null&&o.P!==''?minus(o.P,P):'—')+td(C===null?'—':num(C,8))+td(o.C!==''?esc(o.C):'—')+td(a.N===null?'—':`<b>${num(a.N,0)}</b>`)+td(profit===null?'—':cash(profit))+td(o.N!==''?esc(o.N):'未知')+td(`<button class="link" data-observation="${esc(o.id)}">计算展开</button><br><button class="link" data-edit-observation="${esc(o.id)}">编辑</button>`)+'</tr>';
 }));
 $('other-references').innerHTML=state.references.map(r=>`<p><b>${esc(r.title)}</b> · 刊例约 ¥${esc(r.P)}<br>${esc(r.note)}</p>`).join('');
}
function render(){
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
  for(const id of ['cost-c','integer-points','actual-cash','model-profit','model-margin']){$(id).textContent='—';$(id).classList.remove('loss');}
  $('pricing-loss').hidden=true;
  $('table').innerHTML='<div class="empty">平台参数待修正。</div>';$('actual-table').innerHTML='<div class="empty">请先修正平台定价参数后复算。</div>';
  if(!policyValid)$('policy-notice').hidden=true;
  $('table-end').textContent='';tableRows=[];actualRows=[];$('add-task').disabled=true;$('details').disabled=true;
  if(!policyValid)for(const id of ['multiplier','per-point','plan-principle'])$(id).textContent='—';
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
function detailPlan(p,model=state.task.model){return `<div class="detail-context"><strong>${esc(state.plan.company)}</strong><br>实付 ¥${esc(state.plan.pay)} → 到账 ${esc(state.plan.total)} 积分　·　${esc(targetSummary(p))}<br>采购 ${num(mul(p.q,10),4)}折 · ${esc(procurementInfo(model,p.q).procurementStatus)}<br>定价倍率 M = <strong class="num">${num(p.usedM,15)}</strong>　·　每积分 ¥${fixed(p.U,10)}</div>`;}
function detailBusinessMath(p){if(p.targetAvailable===false)return `<div class="formula">指定倍率 M = ${num(p.usedM,18)}<br>每元积分 S = ${num(p.S,14)}<br>每积分金额 U ≈ ${num(p.U,18)} 元</div>`;return `<details class="record-notes"><summary>充值方案、目标金额与倍率如何得到</summary><div class="formula">S = ${esc(state.plan.total)} ÷ ${esc(state.plan.pay)} = ${num(p.S,14)} 积分/元<br>U = 1 ÷ S ≈ ${num(p.U,18)} 元/积分<br>${p.targetMode==='margin'?`目标金额 R = C ÷ (1 − ${num(p.targetMarginRate,8)})<br>M = S ÷ [10 × (1 − ${num(p.targetMarginRate,8)})]`:`目标金额 R = P × ${num(p.d,8)}<br>M = ${num(p.d,8)} × S ÷ (${num(p.q,6)} × 10)`}<br>理想 M ≈ ${num(p.M,18)}；本次使用 M ≈ ${num(p.usedM,18)}<br>保本 M = S ÷ 10 = ${num(p.breakEvenM,12)}</div><p class="footnote">${esc(state.plan.basis)}。先用采购成本乘倍率得到积分，再按充值的实际现金价值换算收入。倍率不等于利润率；不再重复乘客户折扣。</p></details>`;}
function detailVariance(x,scope){if(x.target===null)return '';return `<details class="record-notes"><summary>与目标差额如何拆分</summary>${detailFact(scope==='actual'?'采购原值与约定采购比例的偏差影响':'采购比例差额（理论按约定比例）',cash(x.costGap,12))}${detailFact('倍率保存精度 / 指定倍率影响',cash(x.precisionGap,12))}${detailFact('逐任务向上取整影响',cash(x.roundGap,12))}${detailFact('合计：扣分折合金额 − 目标金额',cash(x.gap,12),true)}<p class="footnote">以上均按当前方案复算。成本差、倍率差和取整差分开，不把差额全部归因于取整或最低用量。</p></details>`;}
function displayed(value,d=12){const shown=num(value,d);return(cmp(value,decimalString(value,d))===0?'= ':'≈ ')+shown;}
function theoryBreakdown(t,p){
 const v=theory(t,state.rules,p),x=v.x,profile=F.forModel(state.plan,t.model);
 if(!x)return{html:'<p class="notice">最低用量待补齐，暂不能计算平台收费。</p>',text:'最低用量待补齐。'};
 const q=num(mul(p.q,10),6),Mval=num(p.usedM,16);
 const multiplier=p.pricingMode==='manual'?`<div class="formula">采用指定倍率 M = <strong>${Mval}</strong></div>`:`<div class="formula">${p.targetMode==='margin'?`倍率 = 每元积分 ÷［10 ×（1 − 目标毛利率）］<br>(${num(p.T,4)} ÷ ${num(p.A,2)}) ÷［10 ×（1 − ${num(p.targetMarginPct,4)}%）］`:`倍率 = 每元积分 × 客户折扣 ÷ 采购折扣 ÷ 10<br>(${num(p.T,4)} ÷ ${num(p.A,2)}) × ${num(mul(p.d,10),4)} ÷ ${q} ÷ 10`}<br>${displayed(p.M,16)}<br>采用倍率 ${displayed(p.usedM,16)}</div>${profile.mode==='saved'?`<p class="footnote">${profile.round==='nearest'?'四舍五入':'截断'}至 ${profile.digits} 位小数。</p>`:''}`;
 const html=`<div class="pricing-details">`
 +detailStep('01','采购成本',`<div class="formula" id="procurement-equation">采购成本 = 估算视频费用 × 采购折扣 ÷ 10<br>${num(x.P,16)} × ${q} ÷ 10<br>${displayed(x.C,16)} 元</div><p class="footnote">估算视频费用来自左侧生成任务。<button class="link" id="detail-usage">查看用量计算 →</button></p>`)
 +detailStep('02','定价倍率',multiplier)
 +detailStep('03','预计扣分',`<div class="formula" id="points-equation">取整前积分 = 采购成本 × 倍率 × 10<br>${num(x.C,16)} × ${Mval} × 10<br>${displayed(x.raw,16)} 积分<br>向上取整 → <strong>${num(x.N,0)} 积分</strong></div><p class="footnote">每次任务分别向上取整。</p>`)
 +detailStep('04','金额与毛利',`<div class="formula" id="cash-equation">扣分折合金额 = 预计扣分 × 充值金额 ÷ 到账积分<br>${num(x.N,0)} × ${num(p.A,2)} ÷ ${num(p.T,4)}<br>${displayed(x.cash,16)} 元<br>模型毛利 = 扣分折合金额 − 采购成本<br>${num(x.cash,16)} − ${num(x.C,16)}<br>${displayed(x.profit,16)} 元<br>模型毛利率 = 模型毛利 ÷ 扣分折合金额 × 100%<br>${displayed(x.margin,8)}%</div>${detailFact('本次客户折扣',num(x.effective,6)+'折')}${detailFact('取整增加金额',cash(x.roundGap,10))}${x.target!==null?detailFact('目标金额',cash(x.target,10))+detailVariance(x,'theory'):''}`)
 +`<p class="footnote">模型毛利仅扣除模型采购成本，未扣税费、支付、存储、运维及重试成本。折合金额按本次充值条件计算，不代表历史实际收入。</p>
 <details class="record-notes"><summary>金额校验</summary><label class="fieldlabel" for="unit-p">假设刊例费用（元）</label><input class="input num" id="unit-p" value="1" inputmode="decimal"><div id="unit-result"></div></details></div>`;
 const text=[`任务：${label(t)} / ${vinLabel(t)}`,`刊例费用 = ${decimal(x.P)}`,`采购成本 = ${decimal(x.P)} × ${q} ÷ 10 = ${decimal(x.C)}`,`采用倍率 = ${decimal(p.usedM)}`,`取整前积分 = ${decimal(x.C)} × ${decimal(p.usedM)} × 10 = ${decimal(x.raw)}`,`预计扣分 = ${num(x.N,0)}`,`扣分折合金额 = ${num(x.N,0)} × ${num(p.A,2)} ÷ ${num(p.T,4)} ≈ ${decimal(x.cash)}`,`模型毛利 = ${decimal(x.profit)}`,`毛利率 ≈ ${decimal(x.margin)}%`].join('\n');
 return{html,text};
}
function actualBreakdown(o,p){
 if(!o)return{html:'<div class="notice neutral"><b>这个规格没有平台实测记录。</b><br>不会使用其他规格的金额，也不会把理论计算写成实测记录。</div>',text:'无匹配实测记录。'};
 const a=E.recalcRecord(o,p),x=a.x;
 const original=detailStep('01','平台金额原值',`<div class="detail-readonly"><div><small>平台刊例金额 P</small><b>${o.P!==''?'¥'+esc(o.P):'未录入'}</b></div><div><small>平台采购金额 C</small><b>${o.C!==''?'¥'+esc(o.C):'未录入'}</b></div></div><p class="footnote">来源：${esc(o.title)}${o.date?' · '+esc(o.date):''}。${esc(o.note)}<br>采购金额已是 C，不再乘采购比例，不再追加最低用量。</p>`);
 let integral='';
 if(a.C===null)integral=detailStep('02','积分复算','<div class="notice neutral">缺少平台实际采购金额 C，无法复算扣分。不会按约定采购比例补造实测 C。</div>');
 else{
  const profit=sub(a.cash,a.C),margin=cmp(a.cash,0)>0?mul(div(profit,a.cash),100):null;
  integral=detailStep('02','按当前倍率复算积分',`<div class="formula">I = ${esc(o.C)} × ${num(p.usedM,18)} × 10<br>= <strong>${num(a.raw,20)} 积分</strong><br>N = ceil(I) = <strong>${num(a.N,0)} 积分</strong></div><p class="footnote">这是原始采购金额按当前企业方案的复算，不是历史实际扣分。</p>`)
  +detailStep('03','复算金额与模型毛利',`<div class="formula">折合金额 = ${num(a.N,0)} × (${esc(state.plan.pay)} ÷ ${esc(state.plan.total)})<br>≈ <strong>¥${num(a.cash,18)}</strong></div>${a.target!==null?detailFact(targetLabel(p),cash(a.target,12)):`<p class="footnote">${p.targetAvailable===false?'采用指定倍率，无目标金额。':'缺少平台刊例 P，无法计算折扣目标金额。'}</p>`}${detailFact('复算模型毛利（折合金额 − 原始采购）',cash(profit,12),true)}${detailFact('复算模型毛利率',margin===null?'未定义':num(margin,6)+'%')}${a.P!==null?detailFact('复算金额相对平台刊例',num(x.effective,8)+'折'):'<p class="footnote">未录入平台刊例 P，仅刊例折扣无法计算；采购成本、现金与毛利仍可核算。</p>'}${x?detailVariance(x,'actual'):''}`);
 }
 const usage=o.usage?detailStep('API','API实际用量的独立核对',`<div class="formula">completion_tokens = ${esc(o.usage)}<br>按当前官方刊例费率折算 = ${cash(M.fromUsage(o.params,o.usage),12)}</div><p class="footnote">此金额不回填平台P/C。completion_tokens已含最低用量；不与total_tokens相加，也不再次应用门槛。</p>`):'';
 const historical=detailStep('04','历史实际扣分',`${detailFact('平台原记录',o.N!==''?esc(o.N)+'积分':'未知，保持空白')}<p class="footnote">不把当前复算扣分回填历史；不把当前充值现金价值用于声称历史实际收入。需要当时的充值与定价口径才能判断错扣。</p>`);
 const html=`<div class="notice neutral">实测金额与理论公式独立；当前方案可用于复算，历史事实保持原样。</div>`+original+integral+usage+historical+`<div class="detail-scope"><span>平台金额复算 · 非历史实扣</span><button class="btn sm" data-edit-observation="${esc(o.id)}">编辑原记录</button></div>`;
 const text=[`记录：${o.title}`,`任务：${label(o.params)} / ${vinLabel(o.params)}`,`来源：${o.note}`,`平台P原值 = ${o.P||'未录入'}`,`平台C原值 = ${o.C!==''?o.C:'未录入'}`,`API completion_tokens = ${o.usage||'未录入'}`,'不重复乘采购比例或追加门槛。',`当前复算积分 = ${a.raw===null?'未知':decimal(a.raw)}`,`当前复算扣分 = ${a.N===null?'未知':num(a.N,0)}`,`当前复算金额 = ${a.cash===null?'未知':decimal(a.cash)}`,`当前目标金额 = ${a.target===null?'未知':decimal(a.target)}`,`当前复算模型毛利 = ${a.cash===null?'未知':decimal(sub(a.cash,a.C))}`,`历史实际扣分 = ${o.N!==''?o.N:'未知；不得由复算补填'}`].join('\n');
 return{html,text};
}
function openDetails(mode='theory',recordId='',contextTask=null){
 const targetRecord=state.observations.find(r=>r.id===recordId);
 if(!validPlan(state.plan)||mode!=='actual'&&!validTask(contextTask||targetRecord?.params||state.task,false)){toast('请先修正相关输入。');return;}
 const record=targetRecord,t=clone(contextTask||record?.params||(mode==='actual'&&!validTask(state.task,false)?state.observations[0]?.params||defaults().task:state.task)),p=pricingForModel(t.model||'seedance-2.0');
 const matches=state.observations.filter(r=>key(r.params)===key(t));
 const selected=matches.find(r=>r.id===recordId)||matches[0]||null;
 const chosen=mode==='actual'?'actual':'theory';
 detailContext={mode:chosen,task:t,recordId:selected?.id||'',text:''};
 const selector=chosen==='actual'&&matches.length?`<div class="detail-selector"><label class="fieldlabel" for="details-record">完全同规格的平台记录${matches.length>1?' · 可切换':''}</label><select class="input" id="details-record">${matches.map(r=>`<option value="${esc(r.id)}" ${r.id===selected.id?'selected':''}>${esc(r.title)} · P ${r.P?esc(r.P):'未知'} / C ${r.C!==''?esc(r.C):'未知'}</option>`).join('')}</select></div>`:'';
 const view=chosen==='actual'?actualBreakdown(selected,p):theoryBreakdown(t,p);

 const content=detailPlan(p,t.model||'seedance-2.0')+selector+view.html+(chosen==='actual'?detailBusinessMath(p):'')+`<div class="actions" style="margin-top:20px"><button class="btn" id="export-calculation">导出这份计算明细 ↓</button><button class="btn" id="close-only">关闭</button></div>`;
 detailContext.text=[`Reelay V9.6.0 · ${chosen==='actual'?'平台实测金额复算':'参数估算明细'}`,`企业：${state.plan.company}`,`模型：${M.get(t.model).label}；采购比例 ${num(p.q,6)}；${procurementInfo(t.model||'seedance-2.0',p.q).procurementStatus}`,`实付 ${state.plan.pay}元 / 到账 ${state.plan.total}积分 / ${targetSummary(p)}`,`定价倍率 = ${decimal(p.usedM)}（显示值；内部精确计算）`,`充值核算口径：${state.plan.basis}`,'',view.text].join('\n');
 openDrawer('calculation',chosen==='actual'?'实测复算':'计算明细',label(t)+' / '+vinLabel(t),content,true);if(chosen==='theory'&&$('unit-p'))unitPreview();
}
let ruleContext=null;
function openRules(ruleTask=state.task){
 ruleContext=clone(ruleTask);const t=ruleContext,v=quote(t),spec=M.get(t.model),m=v.rule;
 openDrawer('usage','用量说明',spec.label+' · 规则版本 '+spec.version,usageExplanation(v,t,true)+`<details class="record-notes"><summary>高级：人工门槛覆盖</summary><p>仅在有明确特殊规则时使用；不会改写官方来源。</p>${t.video?`<label class="fieldlabel" for="rule-min">最低 Token</label><input class="input" id="rule-min" value="${esc(m?.tokens||'')}"><label class="fieldlabel" for="rule-note">来源与适用范围</label><textarea class="input" id="rule-note">${esc(m?.kind==='manual'?m.note:'')}</textarea><div id="rule-error"></div><button class="btn" id="save-rule">保存人工覆盖</button><button class="btn" id="remove-rule">恢复官方规则</button>`:'无视频输入不应用最低用量。'}</details>`);
}
function openPlan(){
 if(state.plan.mode==='manual')return;
 openDrawer('plan','倍率精度',M.get(state.task.model).label,`<div class="multiplier-settings">
 <label class="precision-toggle"><input type="checkbox" id="plan-limit-precision" ${state.plan.mode==='saved'?'checked':''} aria-controls="plan-precision">限制小数位</label>
 <div id="plan-precision"><div class="grid2"><div><label class="fieldlabel" for="plan-digits">保留小数位</label><select class="input" id="plan-digits">${Array.from({length:21},(_,n)=>`<option value="${n}" ${n===state.plan.digits?'selected':''}>${n}位</option>`).join('')}</select></div><div><label class="fieldlabel" for="plan-round">处理方式</label><select class="input" id="plan-round"><option value="nearest" ${state.plan.round==='nearest'?'selected':''}>四舍五入</option><option value="truncate" ${state.plan.round==='truncate'?'selected':''}>截断</option></select></div></div></div>
 <div class="fact"><span>计算倍率</span><b class="num" id="plan-source-value"></b></div><div class="fact"><span>待采用倍率</span><b class="num" id="plan-used-value"></b></div>
 <div class="state-feedback" id="plan-result-note" aria-live="polite"></div><p class="footnote">关闭限制时按完整精度计算。限制小数位会改变实际采用的倍率。</p>
 <div id="plan-error" class="inline-error" role="alert"></div><div class="actions"><button class="btn primary" id="save-plan">应用设置</button></div></div>`);planPreview();
}
function planCandidate(){return{...state.plan,mode:$('plan-limit-precision').checked?'saved':'ideal',limitPrecision:$('plan-limit-precision').checked,digits:+$('plan-digits').value,round:$('plan-round').value};}
function planDraft(){
 const candidate=planCandidate();
 if(!validPlan(candidate))throw Error('请检查倍率精度设置。');
 if(candidate.mode==='saved'&&cmp(decimalString(idealPricing(candidate).M,candidate.digits,candidate.round),0)<=0)throw Error('处理后的倍率为0，请增加小数位或关闭限制。');
 return{candidate,p:pricing(candidate)};
}
function planPreview(){
 const saved=$('plan-limit-precision').checked;$('plan-precision').hidden=!saved;$('plan-digits').disabled=!saved;$('plan-round').disabled=!saved;
 try{
  const {p}=planDraft(),before=current().x,after=theory(state.task,state.rules,p).x,source=num(p.M,20),used=num(p.usedM,20);
  $('plan-source-value').textContent=(cmp(p.M,source)===0?'':'≈ ')+source;
  $('plan-used-value').textContent=(cmp(p.usedM,used)===0?'':'≈ ')+used;
  $('plan-result-note').textContent=after&&before?'本次任务：'+num(before.N,0)+' → '+num(after.N,0)+' 积分'+(cmp(before.N,after.N)===0?'，扣分不变。':'。'):'';
  $('plan-error').textContent='';$('save-plan').disabled=false;
 }catch(e){$('plan-used-value').textContent='—';$('plan-result-note').textContent='';$('plan-error').textContent=e.message;$('save-plan').disabled=true;}
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
function observationEditor(id=''){const old=state.observations.find(o=>o.id===id),o=old||{id:uid(),title:'新增平台实测',params:clone(validTask(state.task,false)?state.task:defaults().task),P:'',C:'',N:'',date:'',note:''};openDrawer('record-edit',old?'编辑平台实测':'录入平台实测','只保存记录，不采用为理论计算输入。',`<div class="record-inputs" data-edit-id="${esc(o.id)}"><input type="hidden" id="o-model" value="${esc(o.params.model||'seedance-2.0')}"><p>模型：${esc(M.get(o.params.model).label)}</p><label class="fieldlabel" for="o-title">记录名称</label><input class="input" id="o-title" maxlength="100" value="${esc(o.title)}"><div class="grid2"><div><label class="fieldlabel" for="o-res">分辨率</label><select id="o-res">${M.get(o.params.model).resolutions.map(r=>`<option value="${r}" ${r===o.params.res?'selected':''}>${r==='4k'?'4K':r}</option>`).join('')}</select></div><div><label class="fieldlabel" for="o-ratio">画面比例</label><select id="o-ratio">${RATIOS.map(r=>`<option value="${r}" ${r===o.params.ratio?'selected':''}>${r}</option>`).join('')}</select></div></div><div class="grid2"><div><label class="fieldlabel" for="o-seconds">输出时长（秒）</label><input class="input num" id="o-seconds" inputmode="numeric" value="${esc(o.params.seconds)}"></div><div><label class="fieldlabel" for="o-video">视频输入</label><select id="o-video"><option value="false" ${!o.params.video?'selected':''}>无视频输入</option><option value="true" ${o.params.video?'selected':''}>有视频输入</option></select></div></div><label class="fieldlabel" for="o-vin">输入视频总时长（有视频输入时生效）</label><input class="input num" id="o-vin" inputmode="decimal" value="${esc(o.params.vin)}"><div class="grid2"><div><label class="fieldlabel" for="o-p">平台记录刊例 P（元，可留空）</label><input class="input num" id="o-p" inputmode="decimal" value="${esc(o.P)}"></div><div><label class="fieldlabel" for="o-c">平台记录采购 C（元，可留空）</label><input class="input num" id="o-c" inputmode="decimal" value="${esc(o.C)}"></div></div><div class="grid2"><div><label class="fieldlabel" for="o-n">平台实际扣分（不知道则留空）</label><input class="input num" id="o-n" inputmode="numeric" value="${esc(o.N)}"></div><div><label class="fieldlabel" for="o-date">记录日期 / 批次</label><input class="input" id="o-date" maxlength="100" value="${esc(o.date)}"></div></div><label class="fieldlabel" for="o-usage">API completion_tokens（可选，整数；已含最低用量）</label><input class="input num" id="o-usage" value="${esc(o.usage||'')}" inputmode="numeric"><label class="fieldlabel" for="o-note">数据来源、历史定价口径与备注</label><textarea class="input" id="o-note" maxlength="1000">${esc(o.note)}</textarea><div id="record-error" class="inline-error"></div><div class="actions"><button class="btn primary" id="save-observation" data-id="${esc(o.id)}">保存实测记录</button>${old?`<button class="btn danger-link" data-delete-observation="${esc(o.id)}">删除这条实测</button>`:''}</div><p class="footnote">P或C缺失时按缺失保留，不互相反推成实测值。约1.88元等官方预估应保留在其他参考中，不标为平台实测。</p></div>`);}
function saveObservation(id){const o={...(state.observations.find(r=>r.id===id)||{}),id,title:$('o-title').value.trim(),params:{model:$('o-model').value,res:$('o-res').value,ratio:$('o-ratio').value,seconds:$('o-seconds').value.trim(),video:$('o-video').value==='true',vin:$('o-vin').value.trim()},P:$('o-p').value.trim(),C:$('o-c').value.trim(),N:$('o-n').value.trim(),usage:$('o-usage').value.trim(),date:$('o-date').value.trim(),note:$('o-note').value.trim()};if(!validObservation(o)||!o.title){$('record-error').textContent='请检查规格与金额：P/C至少填一项，未知实际扣分留空。时长须符合此记录的模型范围。';return;}o.params=normalizeTask(o.params,false);const i=state.observations.findIndex(x=>x.id===id);if(i<0){if(state.observations.length>=200)return toast('最多200条实测，请先导出清理。');state.observations.push(o);}else state.observations[i]=o;closeDrawer();render();toast('实测记录已保存；理论输入与结果不变。');}
function addTask(){const v=current();if(!v.x||!globalValid)return;if(state.tasks.length>=100)return toast('最多保存100种规格。');state.tasks.push({id:uid(),params:normalizeTask(state.task),qty:'1',title:label(state.task)+' / '+vinLabel(state.task)});state.tab='tasks';state.workspace='theory';$('platform-comparison').open=true;render();toast('只保存参数与数量；成本始终由当前规则计算。');}
function openNewRecharge(){openDrawer('recharge','添加充值方案','不改变实测数据，也不执行实际充值。',`<div class="grid2"><div><label class="fieldlabel" for="r-pay">实付金额</label><input class="input" id="r-pay" inputmode="decimal" value="100"></div><div><label class="fieldlabel" for="r-total">到账总积分</label><input class="input" id="r-total" inputmode="decimal" value="1500"></div></div><div class="inline-error" id="r-error"></div><button class="btn primary" id="save-recharge">加入对比</button>`);}
function download(name,text,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const filename=()=>state.plan.company.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,50)||'Reelay方案';
function summary(){const p=pricing(),v=current(),x=v.x;return ['Reelay V9.6.0 · 视频成本与定价','',state.plan.company,`规则：${M.get(state.task.model).version}；核验日期${R.VERIFIED_AT}；模型 ${M.get(state.task.model).label}。`,`采购比例 ${num(p.q,6)}；${procurementInfo(state.task.model,p.q).procurementStatus}；积分换算常数10。`,`充值方案：${state.plan.basis}`,`实付 ${state.plan.pay} 元 / 到账 ${state.plan.total} 积分 / ${targetSummary(p)}`,`定价倍率 M = ${decimal(p.usedM)}`,`保本倍率 = ${decimal(p.breakEvenM)}`,`任务：${label(state.task)} / ${vinLabel(state.task)}`,`估算依据：${coverage(v)}`,...(x?[`刊例费用 P = ${decimal(x.P)}`,`采购成本 C = ${decimal(x.C)}`,`取整前积分 = ${decimal(x.raw)}`,`预计扣分 = ${num(x.N,0)}`,`折合金额 = ${decimal(x.cash)}`,`模型毛利 = ${decimal(x.profit)}`,`模型毛利率 = ${x.margin===null?'未定义':decimal(x.margin)+'%'}`]:['当前参数无法计算，请检查输入。']),'','费用为官方规则估算，API实际usage或账单可能有差异。毛利仅扣模型采购成本，不是净利润。','平台实测和历史扣分分别保存；不会用于替换理论公式。',`任务清单 ${state.tasks.length}种规格；实测记录 ${state.observations.length}条。`].join('\n');}
function exportJSON(){
 const procurementProfiles=Object.keys(PROCUREMENT_MODELS).map(model=>procurementInfo(model));
 const pricingProfiles=Object.keys(PROCUREMENT_MODELS).map(model=>{const p=pricingForModel(model),outcome=policyOutcome(p);return {model,...state.plan.modelPricing[model],adoptedMultiplier:decimal(p.usedM),customerDiscount:decimal(outcome.discount),unroundedMargin:decimal(outcome.margin)};});
 const taskEstimates=state.tasks.map(row=>{const v=theory(row.params);return v.x?exportRow(row.title,v,v.x,row.qty):{model:row.params.model,...procurementInfo(row.params.model),scope:'规则缺项，未生成收费估算'};});
 download(filename()+'_V9方案.json',JSON.stringify({format:'reelay.pricing.v9',appVersion:'9.6.0',exportedAt:new Date().toISOString(),ruleVersion:R.VERSION,scope:'theory and observations stored separately',procurementProfiles,pricingProfiles,taskEstimates,recordRecalculations:actualRows,state},null,2),'application/json');
}
function csvCell(x){let s=String(x??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCSV(actual=false){const rows=actual?actualRows:tableRows;if(!rows.length)return toast('没有可导出记录。');const titles=actual?{scope:'数据域',model:'模型',modelRuleVersion:'模型规则版本',procurementRatio:'当前复算采购比例',supplierAvailable:'有折扣供应商',procurementSimulated:'采购折扣为模拟',procurementStatus:'采购状态',record:'记录',params:'规格',coverage:'估算依据',theoryP:'刊例费用P',recordedP:'平台记录P',deltaP:'实测P减估算P',theoryC:'采购成本C',recordedC:'平台记录C',deltaC:'实测C减估算C',recordedN:'平台实际扣分_空白为未知',recalcN:'当前复算扣分_非历史',recalcCash:'当前复算金额',recalcProfit:'当前复算模型毛利',pay:'当前充值实付',total:'当前到账积分',M:'当前倍率',targetMode:'当前目标模式',usage:'API_completion_tokens_原记录',note:'备注'}:{scope:'数据域',model:'模型',modelRuleVersion:'模型规则版本',targetMode:'定价目标模式',targetMargin:'目标模型毛利率百分数_毛利模式',procurementRatio:'采购比例',supplierAvailable:'有折扣供应商',procurementSimulated:'采购折扣为模拟',procurementStatus:'采购状态',profit:'每笔模型毛利',margin:'取整后测算模型毛利率百分数',scenario:'场景',coverage:'估算依据',ruleVersion:'规则版本',quantity:'数量_逐笔先取整',pay:'实付元',total:'到账积分',discount:'目标客户折扣',M:'定价倍率',P:'刊例费用P',C:'采购成本C',raw:'取整前积分',N:'每笔预计扣分_非实际',target:'目标金额',cash:'每笔折合金额',gap:'与目标差额'};const ks=Object.keys(titles),csv='\ufeff'+[ks.map(k=>csvCell(titles[k])).join(','),...rows.map(r=>ks.map(k=>csvCell(r[k])).join(','))].join('\r\n');download(filename()+(actual?'_实测对照':'_理论_'+state.tab)+'.csv',csv,'text/csv;charset=utf-8');}
function quoteSummary(){const v=quote(),c=v.calc,video=state.task.video;return [M.get(state.task.model).label+' · 模型估价',label(state.task)+' / '+vinLabel(state.task),`刊例单价：${num(c.rate)} 元 / 百万 Token`,`估算 Token 用量：${tokenText(c.tokens)}`,...(video?[`最低 Token 用量：${c.minimum?tokenText(c.minimum):'待补齐'}`]:[]),`刊例费用：${v.partial?'待补齐':cash(c.P,12)}`,`规则版本：${c.ruleVersion}`,'用量为估算；实际以 API usage.completion_tokens 为准。'].join('\n');}
function openExport(){if(!modelValid)return toast('请先修正生成参数。');openDrawer('export','导出','选择要保留的内容。',`<button class="choice" id="export-quote"><div class="choice-title"><b>模型估价摘要</b><span>↓</span></div><p>当前模型、参数、单价、Token 与刊例费用。</p></button><button class="choice" id="export-json" ${globalValid?'':'disabled'}><div class="choice-title"><b>完整方案 JSON</b><span>↓</span></div><p>包含平台方案、任务与实测，可重新导入。${globalValid?'':'平台参数修正后可导出。'}</p></button><button class="choice" id="export-summary" ${globalValid?'':'disabled'}><div class="choice-title"><b>平台定价摘要</b><span>↓</span></div><p>当前采购、充值、收费与毛利。</p></button><button class="choice" id="export-theory" ${globalValid?'':'disabled'}><div class="choice-title"><b>对比测算 CSV</b><span>↓</span></div></button><button class="choice" id="export-actual" ${globalValid?'':'disabled'}><div class="choice-title"><b>实测对账 CSV</b><span>↓</span></div></button>`);}
function migrate(payload){if(['reelay.pricing.v9','reelay.pricing.v8'].includes(payload?.format)){return{value:upgradeState(payload.state),note:'已导入方案。'+fixedTaskNotice(payload.state?.task)};}
if(payload?.format==='reelay.pricing.v7'&&payload.state){const old=payload.state,n=defaults();n.plan={...n.plan,...old.plan,q:old.plan?.q||'0.735',targetMode:'discount',margin:'8.125',frozen:undefined};delete n.plan.frozen;delete n.plan.modelPricing;delete n.plan.pricingModel;delete n.plan.procurementByModel;delete n.plan.procurementModel;if(validTask(old.task))n.task=fixedTask(old.task);if(Array.isArray(old.recharges)&&old.recharges.every(r=>positive(r.pay,false,2)&&positive(r.total,false,4)))n.recharges=clone(old.recharges);const candidates=[...(old.custom||[]),old.cost?.evidence,...(old.tasks||[]).map(r=>r.cost?.evidence)].filter(Boolean);for(const e of candidates){if(['screenshot','bill'].includes(e.kind)&&validTask(e.params,false)){const o={id:String(e.id||uid()),title:String(e.title||'旧版实测'),params:clone(e.params),P:String(e.P??''),C:String(e.C??''),N:'',date:'',note:String(e.note||'从旧版金额记录导入，未确认实际扣分。')};if(validObservation(o)&&!n.observations.some(x=>x.id===o.id))n.observations.push(o);}else{const r={id:String(e.id||uid()),title:String(e.title||'旧版其他参考'),params:e.params||null,P:String(e.P??''),C:String(e.C??''),note:String(e.note||'从旧版迁移，仅作参考，不进入理论计算。')};if(validReference(r)&&!n.references.some(x=>x.id===r.id))n.references.push(r);}}
for(const r of old.tasks||[]){if(validTask(r.task,false))n.tasks.push({id:String(r.id||uid()),params:clone(r.task),qty:String(r.qty||1),title:label(r.task)+' / '+vinLabel(r.task)});}return{value:upgradeState(n),note:'已导入方案。'+fixedTaskNotice(old.task)};}
throw Error('仅支持本工具V9、V8或V7导出的方案JSON。');}
function openReset(){openDrawer('reset','重置V9本地草稿？','不会删除旧版V7文件或旧版草稿，不影响真实后台。',`<p>将恢复默认企业条件、理论任务参数和原表4条独立实测记录。当前未导出的修改会丢失。</p><div class="actions"><button class="btn primary" id="confirm-reset">确认重置V9</button><button class="btn" id="close-only">取消</button></div>`);}
document.addEventListener('click',async e=>{
 if(quickIsOpen()&&!$('quick-drawer').contains(e.target)&&!$('quick-toggle').contains(e.target))closeQuickOptions();
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset,id=b.id;
if(d.pricingBasis){if(d.pricingBasis==='manual')state.plan.mode='manual';else{state.plan.targetMode=d.pricingBasis;if(state.plan.mode==='manual')state.plan.mode=state.plan.limitPrecision?'saved':'ideal';}render();return;}
if(d.pricingModel){closeDrawer();changeModel(d.pricingModel);$('plan-title').focus();return;}
if(d.usageSection){goToUsageSection(d.usageSection);return;}
if(d.workspace){showWorkspace(d.workspace);return;}if(d.tab){state.tab=d.tab;render();return;}if(d.example){if(!quickIsOpen())return;const preset=quickTasks(state.task.model)[d.example];if(preset){closeQuickOptions(true);changeTask(clone(preset));}return;}if(d.video){const video=d.video==='true';if(video!==state.task.video)changeTask({video});return;}if(d.res){changeTask({res:d.res});return;}if(d.ratio){changeTask({ratio:d.ratio});return;}if(d.seconds){changeTask({seconds:d.seconds});return;}if(d.discount){state.plan.discount=d.discount;state.plan.targetMode='discount';if(state.plan.mode==='manual')state.plan.mode=state.plan.limitPrecision?'saved':'ideal';render();return;}if(d.margin){state.plan.margin=d.margin;state.plan.targetMode='margin';if(state.plan.mode==='manual')state.plan.mode=state.plan.limitPrecision?'saved':'ideal';render();return;}if(d.matrix){try{const t=JSON.parse(d.matrix);if(validTask(t)){state.task=t;showWorkspace('theory','model');document.querySelector('.work').scrollIntoView({behavior:'smooth',block:'start'});}}catch(_){}return;}if(d.observation){observationDetail(d.observation);return;}if(d.editObservation){observationEditor(d.editObservation);return;}if(d.deleteObservation){state.observations=state.observations.filter(o=>o.id!==d.deleteObservation);closeDrawer();render();toast('已删除实测记录，理论结果未变。');return;}if(d.loadTask){const r=state.tasks.find(t=>t.id===d.loadTask);if(r){state.task=clone(r.params);showWorkspace('theory','model');document.querySelector('.work').scrollIntoView({behavior:'smooth',block:'start'});}return;}if(d.deleteTask){state.tasks=state.tasks.filter(t=>t.id!==d.deleteTask);render();return;}
if(!globalValid&&!(['actual-export','add-observation','plan-settings'].includes(id)&&validPlan(state.plan))&&['details','show-formula','plan-settings','task-rule','open-rules','add-observation','table-export','actual-export','add-task'].includes(id)){toast('请先修正顶部定价或任务输入。');return;}
switch(id){
case'quick-toggle':if(quickIsOpen())closeQuickOptions(true);else openQuickOptions();break;
case'export-rules':download('Reelay_V9_规则来源.json',JSON.stringify({version:R.VERSION,sources:R.sources,rules:state.rules},null,2),'application/json');break;
case'close-drawer':case'close-only':closeDrawer();break;
case'open-rules':case'task-rule':case'open-rule-from-formula':openRules();break;
case'show-formula':formulaDetails();break;
case'usage-help':openUsage();break;
case'details':openDetails('theory');break;
case'detail-usage':{const t=detailContext.task;openDrawer('usage','用量说明',label(t),'<button class="link" id="back-pricing-details">← 返回计算明细</button>'+usageExplanation(quote(t),t,true));break;}
case'back-pricing-details':openDetails(detailContext.mode,detailContext.recordId,detailContext.task);break;
case'model-pricing-overview':if(platformValid)openModelPricing();else toast('请先修正定价输入。');break;
case'export-calculation':download(filename()+'_计算展开_'+(detailContext.mode==='actual'?'实测复算':'理论')+'.txt',detailContext.text);break;
case'detail-open-rule':openRules(detailContext.task||state.task);break;
case'detail-add-observation':observationEditor();break;
case'view-actual':showWorkspace('actual');break;
case'back-theory':showWorkspace('theory');break;
case'plan-settings':openPlan();break;
case'add-task':addTask();break;
case'clear-tasks':if(!state.tasks.length)return;openDrawer('clear-tasks','清空任务清单？','只删除参数场景，不删除实测记录。','<button class="btn primary" id="confirm-clear-tasks">确认清空任务清单</button>');break;
case'confirm-clear-tasks':state.tasks=[];closeDrawer();render();break;
case'add-observation':observationEditor();break;
case'save-observation':saveObservation(d.id);break;
case'save-rule':{const tokens=$('rule-min').value.trim(),note=$('rule-note').value.trim();if(!positive(tokens,false,12)||!note){$('rule-error').textContent='请输入正数Token门槛并注明规则来源；未知保持空白，不填0。';return;}state.rules.minima[minimumKey(ruleContext||state.task)]={tokens,note,kind:'manual'};closeDrawer();render();toast('本输出规格人工门槛已保存。不同视频输入时长共用此门槛；实测原值不变。');break;}
case'remove-rule':state.rules.minima[minimumKey(ruleContext||state.task)]=clone(M.officialMinimum(ruleContext||state.task));closeDrawer();render();toast('已恢复官方规则；实测记录不变。');break;
case'save-plan':{try{const {candidate}=planDraft();state.plan=candidate;closeDrawer();render();}catch(e){$('plan-error').textContent=e.message;$('save-plan').disabled=true;}break;}
case'add-recharge':openNewRecharge();break;
case'save-recharge':{const r={pay:$('r-pay').value.trim(),total:$('r-total').value.trim()};if(!positive(r.pay,false,2)||!positive(r.total,false,4)){$('r-error').textContent='请输入有效实付金额与到账积分。';return;}if(state.recharges.length>=50)return toast('最多50组充值条件。');state.recharges.push(r);closeDrawer();render();break;}
case'export':openExport();break;
case'export-quote':if(modelValid)download('Reelay_模型估价.txt',quoteSummary());break;
case'export-json':if(globalValid)exportJSON();break;
case'export-summary':if(globalValid)download(filename()+'_理论方案说明.txt',summary());break;
case'table-export':case'export-theory':if(globalValid)exportCSV(false);break;
case'actual-export':case'export-actual':if(validPlan(state.plan))exportCSV(true);break;
case'import':$('file').click();break;
case'reset':openReset();break;
case'confirm-reset':state=defaults();closeDrawer();render();toast('已恢复默认方案。');break;
}
});
document.addEventListener('input',e=>{const el=e.target,id=el.id;if(['pay','total','discount','target-margin','purchase-discount'].includes(id)){if(id==='target-margin')state.plan.margin=el.value;else if(id==='purchase-discount'){state.plan.q=positive(el.value,false,4)?num(div(el.value,10),6):'';}else if(id==='pay'){const gift=$('total').value;state.plan.pay=el.value;if(state.plan.giftMode&&positive(el.value,false,2)&&positive(gift,true,4))state.plan.total=num(add(mul(el.value,10),gift),4);}else if(id==='total'){if(state.plan.giftMode){if(positive(el.value,true,4)&&positive(state.plan.pay,false,2))state.plan.total=num(add(mul(state.plan.pay,10),el.value),4);else state.plan.total='';}else state.plan.total=el.value;}else state.plan.discount=el.value;render();return;}
if(id==='vin-slider'){if(state.task.video)changeTask({vin:el.value});return;}if(id==='manual-m'){state.plan.mode='manual';state.plan.manualM=el.value.trim();render();return;}if(id==='vin'){
 const entered=el.value;
 try{state.task.vin=wholeInputSeconds(entered);el.value=state.task.vin;if(cmp(entered,state.task.vin)!==0)toast('已向上取整：'+entered+' → '+state.task.vin+' 秒。');}
 catch(_){state.task.vin=entered;}
 render();return;
}if(id==='seconds'){state.task.seconds=el.value;render();return;}if(id==='unit-p'){unitPreview();return;}});
document.addEventListener('change',e=>{const el=e.target,id=el.id;if(id==='model'){changeModel(el.value);return;}if(id==='total-mode'){if(!globalValid){el.value=state.plan.giftMode?'gift':'total';toast('请先修正定价或任务输入。');return;}const giftMode=el.value==='gift';if(giftMode&&cmp(sub(state.plan.total,mul(state.plan.pay,10)),0)<0){el.value=state.plan.giftMode?'gift':'total';toast('总积分小于基础积分，不能按附赠模式填写。');return;}state.plan.giftMode=giftMode;render();return;}if(id==='seconds'&&validTask(state.task)){state.task=normalizeTask(state.task);render();return;}if(id==='details-record'){openDetails('actual',el.value,detailContext.task);return;}if(['plan-limit-precision','plan-digits','plan-round'].includes(id)){planPreview();return;}if(id==='matrix-axis'){state.matrixAxis=el.value;render();return;}if(id==='matrix-metric'){state.matrixMetric=el.value;render();return;}if(id==='recharge-mode'){state.rechargeMode=el.value;state.frozenM=null;render();return;}if(el.dataset.qty){const t=state.tasks.find(r=>r.id===el.dataset.qty),v=el.value.trim();if(t&&/^\d+$/.test(v)&&+v>=1&&+v<=100000)t.qty=v;else toast('任务数量须为1～100000的整数。');render();}});
$('fee-digits').addEventListener('click',e=>{
 feeDisplayDigits=feeDisplayDigits===2?6:2;
 const button=e.currentTarget,next=feeDisplayDigits===2?6:2;
 button.textContent=feeDisplayDigits+' 位';button.title='切换为 '+next+' 位小数';
 button.setAttribute('aria-label','费用显示 '+feeDisplayDigits+' 位小数，点击切换为 '+next+' 位');
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
document.addEventListener('pointerdown',e=>{if(quickIsOpen()&&!$('quick-drawer').contains(e.target)&&!$('quick-toggle').contains(e.target))closeQuickOptions();});
document.addEventListener('focusin',e=>{if(quickIsOpen()&&!$('quick-drawer').contains(e.target)&&!$('quick-toggle').contains(e.target))closeQuickOptions();});
$('quick-content').addEventListener('transitionend',e=>{if(e.target!==$('quick-content')||e.propertyName!=='transform')return;if(quickIsOpen())revealQuickOption();else finishQuickClose();});
$('video-input-control').addEventListener('transitionend',e=>{if(e.target===$('video-input-control')&&e.propertyName==='grid-template-columns')finishVideoClose();});
window.addEventListener('resize',positionQuickOptions,{passive:true});
window.addEventListener('scroll',e=>{if(e.target instanceof Element&&$('quick-drawer').contains(e.target))return;positionQuickOptions();},{capture:true,passive:true});
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeDrawer();});
document.addEventListener('keydown',e=>{
 if(e.target===$('quick-toggle')&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();openQuickOptions();return;}
 if(quickIsOpen()&&e.key==='Escape'){e.preventDefault();closeQuickOptions(true);return;}
 if($('modal').hidden)return;if(e.key==='Escape'){e.preventDefault();closeDrawer();}if(e.key==='Tab'){const els=[...$('drawer').querySelectorAll('button,input,select,textarea,a[href],summary')].filter(x=>!x.disabled&&x.getClientRects().length);if(!els.length)return;const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3e6)throw Error('文件超过3MB，请检查是否为方案JSON。');const loaded=migrate(JSON.parse(await f.text()));state=loaded.value;closeDrawer();render();toast(loaded.note);}catch(err){toast('导入失败：'+err.message);}finally{e.target.value='';}});

function targetLabel(p){if(p.targetAvailable===false)return '指定倍率';return p.targetMode==='margin'?'采购成本 ÷ (1 − 目标毛利率)':'刊例费用 × '+num(mul(p.d,10),6)+'折';}
function targetSummary(p){if(p.targetAvailable===false)return '指定倍率 '+num(p.usedM,12);return p.targetMode==='margin'?'目标毛利率 '+num(p.targetMarginPct,4)+'%':'客户折扣 '+num(mul(p.d,10),6)+'折';}


// Exposed for transparent regression tests. Theory takes no observations argument.
window.ReelayApp={getState:()=>clone(state),setState:s=>{const draft=clone(s);if(draft.plan.modelPricing){if(draft.plan.mode!=='manual')draft.plan.limitPrecision=draft.plan.mode==='saved';captureProfile(draft.plan);}state=upgradeState(draft);render();},defaults,validState,upgradeState,normalizeTask,reset:()=>{state=defaults();render();},pricing,pricingForModel,procurementInfo,quote,theory,theoryOne,current,summary,key,minimumKey,normalizeMinimumKeys,openDetails,recalcRecord:(record,p=pricingForModel(record.params?.model||'seedance-2.0'))=>E.recalcRecord(record,p),migrate,OBS,REFS,getTheoryRows:()=>clone(tableRows),getActualRows:()=>clone(actualRows)};
render();
if(taskMigrationNotice)toast(taskMigrationNotice);
})();
