(()=>{'use strict';
const E=window.ReelayMath,R=window.ReelayRules,M=window.ReelayModels,{$}={$:id=>document.getElementById(id)};
const {Q,dec,add,sub,mul,div,cmp,ceil,fixed,trim,decimalString}=E;
const clone=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,d=8)=>trim(x,d),cash=(x,d=6)=>'¥'+fixed(x,d),decimal=(x,d=20)=>decimalString(x,d),pack=x=>({n:x.n.toString(),d:x.d.toString()}),unpack=x=>Q(x.n,x.d),uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
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
function procurementMigrationNotice(input){return input?.plan&&input.plan.procurementByModel===undefined?'采购折扣已按模型保存：旧值保留给 2.0，2.5 与 Fast 按刊例价。':'';}
function procurementInfo(model=state.task.model,q=state.plan.procurementByModel[model]){
 const spec=PROCUREMENT_MODELS[model],simulated=!spec.supplierAvailable&&cmp(q,1)!==0;
 return{model,procurementRatio:decimal(q),supplierAvailable:spec.supplierAvailable,procurementSimulated:simulated,procurementStatus:spec.supplierAvailable?'已有折扣供应商':simulated?'模拟折扣 · 暂无供应商':'暂无折扣供应商 · 按刊例价'};
}
function activateProcurement(){
 const model=state.task.model||'seedance-2.0';
 if(state.plan.procurementModel!==model){state.plan.procurementModel=model;state.plan.q=state.plan.procurementByModel[model];setInput('purchase-discount',num(mul(state.plan.q,10),6));}
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
function defaults(){return{schema:'reelay.pricing.v9',plan:{company:'积分定价方案',pay:'100',total:'1538',discount:'7.35',q:'0.735',procurementModel:'seedance-2.0',procurementByModel:defaultProcurement(),targetMode:'discount',margin:'8.125',giftMode:false,mode:'ideal',digits:12,round:'nearest',manualM:'1.538',basis:'本次充值含全部赠分；历史余额的现金价值须另行确认'},task:task('480p','1:1','4',true,'2'),rules:{version:R.VERSION,minima:R.buildMinima(),legacyMinima:{}},workspace:'theory',tab:'discounts',tasks:[],observations:clone(OBS),references:clone(REFS),recharges:[{pay:'100',total:'1500'},{pay:'100',total:'1538'},{pay:'100',total:'1600'}],rechargeMode:'reprice',frozenM:null,matrixAxis:'specs',matrixMetric:'N'};}
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
 const storedProcurement=n.plan.procurementByModel,storedProcurementModel=n.plan.procurementModel;
 n.plan={...defaults().plan,...n.plan,procurementByModel:storedProcurement,procurementModel:storedProcurementModel};if(['企业 A · 定价方案','企业 A · 讨论方案'].includes(n.plan.company))n.plan.company='积分定价方案';n.task=fixedTask(n.task);normalizeProcurement(n.plan,n.task.model);n.tasks=n.tasks.map(r=>({...r,params:normalizeTask(r.params)}));n.observations=n.observations.map(o=>({...o,params:normalizeTask(o.params,false),usage:o.usage||''}));
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
 if(!validState(n))throw Error('方案参数无效');return n;
}
function validState(s){if(!(s&&s.schema==='reelay.pricing.v9'&&validPlan(s.plan)&&validTask(s.task,false)&&s.rules&&s.rules.version===R.VERSION&&s.rules.minima&&typeof s.rules.minima==='object'&&!Array.isArray(s.rules.minima)&&['theory','actual'].includes(s.workspace)&&['discounts','tasks','matrix','recharges'].includes(s.tab)&&Array.isArray(s.tasks)&&s.tasks.length<=100&&Array.isArray(s.observations)&&s.observations.length<=200&&Array.isArray(s.references)&&s.references.length<=200&&Array.isArray(s.recharges)&&s.recharges.length<=50&&['reprice','fixed'].includes(s.rechargeMode)&&['specs','ratios'].includes(s.matrixAxis)&&['N','raw','P','C','cash'].includes(s.matrixMetric)))return false;
if(!validProcurementMap(s.plan.procurementByModel)||!PROCUREMENT_MODELS[s.plan.procurementModel]||!s.tasks.every(t=>t&&txt(t.id,100)&&txt(t.title,100)&&validTask(t.params,false)&&/^\d+$/.test(String(t.qty))&&+t.qty>=1&&+t.qty<=100000)||!s.observations.every(validObservation)||!s.references.every(validReference)||!s.recharges.every(r=>positive(r.pay,false,2)&&positive(r.total,false,4)))return false;
if(Object.keys(s.rules.minima).length>2000)return false;for(const [k,r] of Object.entries(s.rules.minima)){if(!txt(k,120)||!r||!positive(r.tokens,false,12)||!txt(r.note,500)||!r.note.trim())return false;}
return s.frozenM===null||s.frozenM&&/^\d{1,80}$/.test(s.frozenM.n)&&/^\d{1,80}$/.test(s.frozenM.d)&&BigInt(s.frozenM.d)>0n;}
let migrationNotice='',taskMigrationNotice='';
try{const raw=localStorage.getItem(KEY)||localStorage.getItem('reelay_pricing_v81_dual_breakdown')||localStorage.getItem('reelay_pricing_v8_theory_isolated');if(raw){const saved=JSON.parse(raw);state=upgradeState(saved);taskMigrationNotice=fixedTaskNotice(saved.task);if(saved.schema!=='reelay.pricing.v9')migrationNotice='已升级至官方规则；旧人工门槛保留在导入档案，未覆盖官方估算。';migrationNotice+=procurementMigrationNotice(saved);}}catch(err){migrationNotice='旧草稿未导入：'+err.message+'。原草稿仍保留。';}

let lastValidPlan=clone(state.plan);
function idealPricing(p=state.plan){return E.plan({pay:p.pay,total:p.total,discount:p.discount,q:p.q,k:'10',targetMode:p.targetMode,margin:p.margin});}
function pricing(over={}){const p={...state.plan,...over};let applied='';if(p.mode==='saved')applied=decimalString(idealPricing(p).M,p.digits,p.round);if(p.mode==='manual')applied=p.manualM;return E.plan({pay:p.pay,total:p.total,discount:p.discount,q:p.q,k:'10',targetMode:p.targetMode,margin:p.margin,appliedM:applied,targetAvailable:validTarget(p)});}
function pricingForModel(model=state.task.model,over={}){return pricing({q:state.plan.procurementByModel[model||'seedance-2.0'],...over});}
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
 const saved={...state,plan:clone(lastValidPlan)};
 saved.plan.procurementModel=state.task.model;saved.plan.q=saved.plan.procurementByModel[state.task.model];
 try{localStorage.setItem(KEY,JSON.stringify(saved));$('storage-status').innerHTML='<i class="live-dot"></i>'+ (platformValid?'本地草稿已保存':'模型草稿已保存 · 平台保留上次有效方案');}catch(_){$('storage-status').textContent='浏览器未保存草稿，请导出方案留存。';}
}
function openDrawer(name,title,subtitle,html,wide=false){lastFocus=document.activeElement;drawerName=name;$('drawer-title').textContent=title;$('drawer-sub').textContent=subtitle;$('drawer-body').innerHTML=html;$('drawer-footer').hidden=true;$('drawer').classList.toggle('wide',wide);$('modal').classList.toggle('centered',name==='usage');$('modal').hidden=false;document.body.classList.add('modal-open');$('close-drawer').focus();}
function closeDrawer(){if($('modal').hidden)return;$('modal').hidden=true;document.body.classList.remove('modal-open');drawerName='';if(lastFocus?.isConnected)lastFocus.focus();}
function table(headers,rows,cls=''){return'<table class="'+cls+'"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';}
const td=(s,cls='number')=>'<td class="'+cls+'">'+s+'</td>',minus=(a,b)=>{const d=sub(a,b);return(cmp(d,0)>0?'+':'')+num(d,10);};
function renderPricingMode(manual){
 const target=$('target-settings'),body=target.parentElement,mode=manual?'manual':'auto';
 $('manual-m-control').hidden=!manual;$('multiplier').hidden=manual;
 $('discount-control').hidden=state.plan.targetMode==='margin';$('margin-control').hidden=state.plan.targetMode!=='margin';
 $('target-validation').hidden=validTarget(state.plan);$('target-validation').textContent=manual?'参考目标无效，暂不计算目标差额。':'请输入有效的定价目标。';
 const field=$(state.plan.targetMode==='margin'?'target-margin':'discount');field.setAttribute('aria-invalid',String(!validTarget(state.plan)));
 $('target-summary').hidden=!manual;
 $('target-context').textContent=manual?'参考目标':'定价目标';
 $('target-mode').setAttribute('aria-label',manual?'参考目标模式':'定价目标模式');
 $('pricing-target').classList.toggle('is-comparison',manual);
 target.closest('.client-pricing').classList.toggle('is-manual',manual);
 if(target.dataset.mode!==mode){
  target.open=!manual;
  if(manual)body.append(target);else body.prepend(target);
  target.dataset.mode=mode;
 }else if(!manual)target.open=true;
}
function renderPlan(){
 const p=pricing(),gift=sub(p.T,mul(p.A,10)),manual=state.plan.mode==='manual';
 const effectiveDiscount=mul(div(mul(mul(p.q,p.usedM),p.K),p.S),10);
 const actualMargin=mul(sub(1,div(p.S,mul(p.usedM,p.K))),100);
 setInput('pay',state.plan.pay);
 setInput('total',state.plan.giftMode?num(gift,4):state.plan.total);
 setInput('discount',state.plan.discount);setInput('target-margin',state.plan.margin);
 setInput('purchase-discount',num(mul(p.q,10),6));setInput('target-mode',state.plan.targetMode);
 setInput('pricing-mode',manual?'manual':'ideal');setInput('manual-m',state.plan.manualM);
 $('discount-control').hidden=p.targetMode==='margin';$('margin-control').hidden=p.targetMode!=='margin';
 $('manual-m-control').hidden=!manual;$('multiplier').hidden=manual;
 setInput('total-mode',state.plan.giftMode?'gift':'total');
 $('total').setAttribute('aria-label',state.plan.giftMode?'附赠积分':'到账总积分');
 const perYuan=num(p.S,8);$('per-yuan').textContent=perYuan;$('recharge-sign').textContent=cmp(p.S,perYuan)===0?'=':'≈';
 const perPoint=fixed(p.U,8);$('per-point').textContent=perPoint;$('point-price-sign').textContent=cmp(p.U,perPoint)===0?'=':'≈';
 $('point-price').title='实际支付 ÷ 到账总积分；每积分约 '+num(p.U,20)+' 元';$('break-even-m').textContent=num(p.breakEvenM,8);
 $('multiplier').innerHTML=num(p.usedM,12)+'<small>倍</small>';
 $('m-state').hidden=state.plan.mode!=='saved';$('m-state').textContent=state.plan.mode==='saved'?state.plan.digits+'位 · '+(state.plan.round==='truncate'?'截断':'四舍五入'):'';

 const targetPicks=$('discount-picks');targetPicks.dataset.mode=p.targetMode;targetPicks.setAttribute('aria-label',p.targetMode==='margin'?'模型毛利率快捷值（%）':'客户折扣快捷值（折）');
 targetPicks.innerHTML=(p.targetMode==='margin'?['0','5','8.125','10','20'].map(g=>`<button data-margin="${g}" aria-label="${g}%" aria-pressed="${validTarget(state.plan)&&cmp(g,state.plan.margin)===0}" class="${validTarget(state.plan)&&cmp(g,state.plan.margin)===0?'active':''}">${g}</button>`):['7.35','7.8','8','10'].map(d=>`<button data-discount="${d}" aria-label="${d==='10'?'无折扣，客户目标为火山刊例价':d+'折'}" aria-pressed="${validTarget(state.plan)&&cmp(d,state.plan.discount)===0}" class="${validTarget(state.plan)&&cmp(d,state.plan.discount)===0?'active':''}">${d==='10'?'无折扣':d+'折'}</button>`)).join('');
 $('rule-status').textContent='规则核验：'+R.VERIFIED_AT;
 $('plan-principle').innerHTML=`<span>折合客户折扣 <b>${num(effectiveDiscount,4)}折</b></span><span>模型毛利率 <b class="${cmp(actualMargin,0)<0?'loss':''}">${num(actualMargin,4)}%</b></span><span class="outcome-caption" title="上述折扣与毛利率未计入每次扣分向上取整的影响">（取整前）</span>${cmp(effectiveDiscount,10)>0?'<span class="outcome-note">高于刊例</span>':''}`;
 $('migration-note').hidden=!migrationNotice;$('migration-note').textContent=migrationNotice;
}

function renderSlider(id,value){
 const el=$(id),display=$(id+'-value');
 setInput(id,value);
 const label=num(dec(value),4)+' 秒';
 if(display)display.textContent=label;el.setAttribute('aria-valuetext',label);
 el.style.setProperty('--range-progress',((Number(value)-Number(el.min))/(Number(el.max)-Number(el.min))*100)+'%');
}
function renderComposer(){
 const t=state.task,spec=M.get(t.model);
 $('model').innerHTML=['seedance-2.5','seedance-2.0','seedance-2.0-fast'].map(id=>M.get(id)).map(m=>`<option value="${m.id}">${m.label}</option>`).join('');$('model').value=spec.id;
 $('res-options').innerHTML=spec.resolutions.map(r=>`<button data-res="${r}" class="${r===t.res?'active':''}" aria-pressed="${r===t.res}">${r==='4k'?'4K':r}</button>`).join('');
 $('seconds').max=String(spec.seconds.max);$('vin-slider').max=String(spec.inputSeconds.max);$('vin').max=String(spec.inputSeconds.max);$('seconds-max-label').textContent=spec.seconds.max+' 秒';
 $('ratio-options').innerHTML=RATIOS.map(r=>{const[a,b]=r.split(':').map(Number),h=a/b<1?19:13;return`<button data-ratio="${r}" class="${r===t.ratio?'active':''}" aria-pressed="${r===t.ratio}"><i class="frame" style="width:${h*a/b}px;height:${h}px"></i>${r}</button>`;}).join('');
 renderSlider('seconds',t.seconds);setInput('vin',t.vin);
 renderSlider('vin-slider',t.vin);$('vin-slider').disabled=!t.video;
 $('video-detail').hidden=!t.video;$('vin').disabled=!t.video;
 document.querySelectorAll('[data-video]').forEach(b=>{b.classList.toggle('active',(b.dataset.video==='true')===t.video);b.setAttribute('aria-pressed',String((b.dataset.video==='true')===t.video));});
 document.querySelectorAll('[data-example]').forEach(b=>{const preset=quickTasks(spec.id)[b.dataset.example];b.disabled=!preset;if(!preset){b.querySelector('small').textContent='规则待补齐';return;}const active=key(t)===key(preset);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.querySelector('small').textContent=label(preset)+(preset.video?' · 输入'+preset.vin+'秒':'');});
 $('pixels').textContent=spec.dims[t.res][t.ratio].join(' × ')+' 像素';
 const r=t.ratio.split(':').map(Number);
 $('preview-frame').style.width=(43*r[0]/r[1])+'px';$('preview-frame').textContent=t.ratio;
 $('preview-meta').innerHTML='<b>'+esc(t.res==='4k'?'4K':t.res)+' · '+esc(t.seconds+'秒')+'</b><br>'+esc(vinLabel(t));
}

function tokenText(value,digits=12){return num(value,digits).split('.').map((part,i)=>i?part:part.replace(/\B(?=(\d{3})+(?!\d))/g,',')).join('.');}
function renderUsage(v,t){
 const c=v.calc,rule=v.rule,manual=rule?.kind==='manual',hasMinimum=t.video&&!!rule;
 $('usage-summary').hidden=false;$('usage-help').disabled=false;
 const show=(id,value)=>{const el=$(id),rounded=num(value,8);el.textContent=(cmp(rounded,value)!==0?'≈ ':'')+tokenText(value,8);el.title=tokenText(value)+' Token';};
 $('token-rate').textContent=num(c.rate,6);
 show('token-estimate',c.tokens);
 $('token-minimum').removeAttribute('title');
 if(hasMinimum)show('token-minimum',rule.tokens);else $('token-minimum').textContent=t.video?'待补齐':'不适用';
 $('token-minimum-label').textContent=manual?'最低 Token 用量':'最低 Token 估算';
 $('token-minimum-kind').hidden=!manual;$('token-minimum-kind').textContent=manual?'人工':'';
 const useMinimum=!v.partial&&hasMinimum&&cmp(c.tokens,rule.tokens)<0;
 const useBase=!v.partial&&!useMinimum;
 for(const [name,adopted] of [['estimate',useBase],['minimum',useMinimum]]){
  $('token-'+name+'-metric').classList.toggle('is-adopted',adopted);
  $('token-'+name+'-adopted').hidden=!adopted;
 }
 const note=$('coverage-note');note.hidden=true;note.textContent='';
 if(v.partial){note.hidden=false;note.textContent='最低用量待补齐 · 仅基础估算';}
 else if(hasMinimum&&cmp(c.tokens,rule.tokens)<0){note.hidden=false;note.textContent='预计触发最低用量'+(manual?' · 人工门槛':'');}
 if(drawerName==='usage'&&!$('modal').hidden)renderUsagePanel(v,t);
}
function usageExplanation(v,t){
 const c=v.calc,rule=v.rule,manual=rule?.kind==='manual',hasMinimum=t.video&&!!rule;
 const source=M.get(t.model).sources.minima,tableUrl=source.views[t.res]||source.url;
 const base=`(${esc(t.seconds)} + ${t.video?esc(t.vin):'0'}) × ${c.wh[0]} × ${c.wh[1]} × 24 ÷ 1024`;
 const decision=v.partial?'最低用量规则尚未补齐，本次仅为基础试算，无法确定完整费用。':!t.video?`无视频输入，不应用最低用量，采用基础估算 ${tokenText(c.tokens)} Token。`:cmp(c.tokens,rule.tokens)<0?`基础估算 ${tokenText(c.tokens)} Token 低于${manual?'人工设置的':'最低用量估算'} ${tokenText(rule.tokens)} Token，本次采用后者。`:cmp(c.tokens,rule.tokens)===0?`两项同为 ${tokenText(c.tokens)} Token，采用基础估算，无需补足用量。`:`基础估算 ${tokenText(c.tokens)} Token 已高于最低值 ${tokenText(rule.tokens)} Token，本次采用基础估算。`;
 const applied=hasMinimum?`max(${tokenText(c.tokens)}, ${tokenText(rule.tokens)}) = ${tokenText(c.billedTokens)}`:tokenText(c.billedTokens);
 const minimumMethod=manual?`<p>本任务的最低值来自人工覆盖：${tokenText(rule.tokens)} Token。来源：${esc(rule.note)}。</p>`:!t.video?'<p>无视频输入，本次不使用最低用量估算。</p>':!rule?'<p>本规格最低用量待补齐，暂不提供完整估价。</p>':`<p>与官方 ${esc(M.get(t.model).label)} 计算器一致：按输出分辨率、画面比例和时长查最低用量，再与基础估算取较大值，两者不相加。</p><div class="formula">${esc(label(t))} → 最低 ${tokenText(rule.tokens)} Token</div><p class="footnote">表格显示 ${esc(rule.displayedTokens)} Token；本工具保留原始公式的小数精度，不提前取整。核验日期 ${esc(source.verifiedAt)}。</p><details class="record-notes"><summary>官方表格原式与核验方法</summary><pre class="formula source-formula">${esc(source.sourceFormula)}</pre><p>上面是当前官方表格“最低token用量”字段的原式，其中确有 ROUNDUP(输出时长 × 2 / 3, 0)。它不是模型价格正文直接列出的公式，也不是输入素材的最低时长要求。</p><p class="footnote">${esc(source.provenance||'')} ${esc(source.precision||'')} 原式和复制数据保存在项目 evidence 目录；运行时读取经过来源核验的表值。</p></details><div class="usage-source-links"><a href="${esc(source.calculatorUrl)}" target="_blank" rel="noopener">官方计算器 ↗</a><a href="${esc(tableUrl)}" target="_blank" rel="noopener">对应最低用量表 ↗</a></div>`;
 return `<div class="usage-explanation" id="usage-explanation"><p class="usage-lead">最低 Token 用量也是估算值，最终计费用量以 API 返回为准。</p><h3>官方如何说明最低用量</h3><p>含视频输入的任务存在最低 Token 用量限制。基础估算低于对应最低值时，按最低值估价；最低值与输出分辨率、宽高比和输出时长有关。官方表格的原文说明是：“估算值，实际以调用 API 后返回信息中的 usage 字段为准”。</p><p>查询任务返回的 <code>usage.completion_tokens</code> 已体现最低用量限制，可用于计费对账，不再补一次门槛。<code>total_tokens</code> 与它相等，不重复相加。</p><div class="usage-source-links"><a href="${esc(R.sources.pricing.url)}" target="_blank" rel="noopener">官方模型价格 · 最低用量说明 ↗</a><a href="${esc(R.sources.usage.url)}" target="_blank" rel="noopener">官方 API · usage 字段 ↗</a></div><h3>当前配置如何估价</h3><p>${esc(label(t))} · ${esc(vinLabel(t))}</p><div class="usage-current">${decision}<br>${manual?'本次最低值为人工覆盖。<br>':''}刊例费用 P = ${tokenText(c.billedTokens)} × ${num(c.rate,6)} ÷ 1,000,000 = ¥${num(c.P,18)}。</div><p>这里估算的是模型刊例价。按预计输出规格计算；编辑、延长等任务的实际输出规格确定后应重新估价。</p><details class="usage-method" id="usage-method"><summary>本工具的估算依据与公式</summary>${minimumMethod}<div class="formula">基础 Token 估算 = ${base} = ${tokenText(c.tokens)}<br>估价采用 Token${v.partial?'（仅基础）':''} = ${applied}</div><p class="footnote">“采用”标记只表示本次估价选用的数值；两者相等时标记基础估算。显示精度不参与计算，Token 不提前取整。生成任务中的输入秒数按本工具的整秒选项设置；原始实测时长不改写。</p></details></div>`;
}
function renderUsagePanel(v,t){
 const methodOpen=$('usage-method')?.open||false;
 $('drawer-body').innerHTML=usageExplanation(v,t);
 if(methodOpen)$('usage-method').open=true;
}
function openUsage(){if(!modelValid)return;openDrawer('usage','用量说明',M.get(state.task.model).label+' · 用量与计价说明',usageExplanation(quote(),state.task));}
function renderQuote(){
 const v=quote(),c=v.calc;
 $('cost-badge').hidden=!v.partial&&v.rule?.kind!=='manual';$('cost-badge').textContent=coverage(v);$('cost-badge').className='badge '+(v.partial?'amber':'blue');renderUsage(v,state.task);
 $('cost-p').innerHTML=v.partial?'—':'<small>¥</small>'+fixed(c.P,6);
 return v;
}
function renderResult(){const v=current(),p=pricing(),x=v.x,detailOpen=document.querySelector('.platform-calculation-detail')?.open||false;
 if(!x)throw Error('模型最低用量规则尚未补齐，暂不能测算平台收费。');
 $('add-task').disabled=false;$('details').disabled=false;
 $('cost-c').innerHTML='<small>¥</small>'+fixed(x.C,6);
 $('calculation').innerHTML=`<div class="platform-primary-metrics"><div class="points-box emphasis"><div class="points-label">预计扣分</div><div class="points-value num" id="integer-points">${num(x.N,0)}<small>积分</small></div></div><div class="cash-item"><span>折合金额</span><b class="num" id="actual-cash">${cash(x.cash)}</b></div><div class="cash-item"><span>模型毛利</span><b class="num ${cmp(x.profit,0)<0?'loss':''}">${cash(x.profit)}</b><small>毛利率 ${x.margin===null?'—':num(x.margin,4)+'%'}</small></div></div><div class="result-note">${cmp(x.profit,0)<0?'<b class="loss">当前方案亏损。</b> ':''}每次扣分向上取整；毛利仅扣模型采购成本。</div><details class="platform-calculation-detail"><summary>扣分与目标差额</summary><div class="equation"><span>取整前积分 =</span><span>采购成本</span><b>${num(x.C,10)}</b><span>×</span><b>${num(p.usedM,12)}</b><span>× 10 =</span><b id="raw-points">${num(x.raw,12)}</b><span>积分</span></div><div class="cash-row"><div class="cash-item"><span>${state.plan.mode==='manual'?'参考目标金额':'目标金额'}</span><b id="target-cash">${optionalCash(x.target)}</b><small>${targetLabel(p)}</small></div><div class="cash-item"><span>与目标差额</span><b id="cash-gap">${signedCash(x.gap)}</b></div><div class="cash-item"><span>折合客户折扣</span><b>${num(x.effective,4)}折</b></div></div><button class="link" id="economics-how">毛利计算口径 ↗</button></details>`;
 document.querySelector('.platform-calculation-detail').open=detailOpen;
}
function exportRow(title,v,x,qty=1){return{scope:'平台定价测算',model:v.model,modelRuleVersion:v.calc.ruleVersion,...procurementInfo(v.model,x.p.q),targetMode:x.p.targetMode,targetMargin:x.p.targetMode==='margin'?optionalDecimal(x.p.targetMarginPct):'',profit:decimal(x.profit),margin:x.margin===null?'':decimal(x.margin),scenario:title,coverage:coverage(v),ruleVersion:state.rules.version,quantity:qty,pay:state.plan.pay,total:state.plan.total,discount:x.p.d===null?'':num(mul(x.p.d,10),4),M:decimal(x.p.usedM),P:decimal(x.P),C:decimal(x.C),raw:decimal(x.raw),N:num(x.N,0),target:optionalDecimal(x.target),cash:decimal(x.cash),gap:optionalDecimal(x.gap)};}
function renderTable(){const p=pricing(),v=current(),x=v.x;tableRows=[];$('task-count').textContent=state.tasks.length;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));let tools='',html='',end='';
if(state.tab==='discounts'){tools=`<span>同一任务与充值方案，按各档客户折扣自动计算倍率。</span><span>${esc(label(state.task))}</span>`;if(!x)html='<div class="empty">请先修正生成参数。</div>';else{html=table(['客户折扣','定价倍率','采购成本（元）','取整前积分','预计扣分','折合金额','与目标差额'],DISCOUNTS.map(d=>{const pp=idealPricing({...state.plan,discount:d,targetMode:'discount'}),vv=theory(state.task,state.rules,pp),xx=vv.x;tableRows.push(exportRow(d+'折',vv,xx));return`<tr class="${state.plan.targetMode==='discount'&&validTarget(state.plan)&&cmp(d,state.plan.discount)===0?'selected':''}">${td(`<button class="rowbutton" data-discount="${d}">${d==='10'?'无折扣':d+'折'}</button>`)}${td(num(pp.M,10))}${td(num(xx.C,8))}${td(num(xx.raw,8))}${td('<b>'+num(xx.N,0)+'</b>')}${td(cash(xx.cash))}${td((cmp(xx.gap,0)>=0?'+':'')+num(xx.gap,6))}</tr>`;}));}end=state.plan.mode!=='ideal'?'各档独立反算倍率，不沿用指定倍率。':'';}
if(state.tab==='tasks'){tools='<span>统一按当前规则重算；每笔先向上取整，再按数量汇总。</span><button class="link" id="clear-tasks">清空任务清单</button>';let sumN=dec(0),sumCash=dec(0),sumC=dec(0),count=0,partial=false;html=state.tasks.length?table(['任务规格','计算口径','数量','采购成本（元 / 次）','取整前积分 / 次','预计扣分 / 次','折合金额 / 次',''],state.tasks.map(r=>{const vv=theory(r.params,state.rules),xx=vv.x,n=dec(r.qty);sumN=add(sumN,mul(xx.N,n));sumCash=add(sumCash,mul(xx.cash,n));sumC=add(sumC,mul(xx.C,n));count+=+r.qty;partial=partial||vv.partial;tableRows.push(exportRow(r.title,vv,xx,r.qty));return`<tr>${td(`<button class="rowbutton" data-load-task="${esc(r.id)}">${esc(label(r.params))}</button><span class="second">${esc(vinLabel(r.params))} · 采购 ${num(mul(xx.p.q,10),4)}折${vv.procurement.procurementSimulated?' · 模拟':''}</span>`)}${td(`<span class="badge ${vv.partial?'amber':''}">${esc(coverage(vv))}</span>`)}${td(`<input class="qty" inputmode="numeric" data-qty="${esc(r.id)}" value="${r.qty}" aria-label="任务数量">`)}${td(num(xx.C,8))}${td(num(xx.raw,8))}${td('<b>'+num(xx.N,0)+'</b>')}${td(cash(xx.cash))}${td(`<button class="link danger-link" data-delete-task="${esc(r.id)}">删除</button>`)}</tr>`;})):'<div class="empty">配置一个任务，点击“加入任务清单”。这里只保存参数与数量，不保存平台实测金额。</div>';end=state.tasks.length?`<span>${state.tasks.length}种规格 / ${count}次 · 预计扣分 <strong>${num(sumN,0)}</strong> · 折合金额 <strong>${cash(sumCash)}</strong> · 采购 <strong>${cash(sumC)}</strong> · 模型毛利 <strong>${cash(sub(sumCash,sumC))}</strong></span><span>${partial?'包含未覆盖最低用量的基础理论场景；汇总也仅为理论演算。':'采购与扣分均为公式结果，不是实际结算汇总。'}</span>`:'任务清单与实测记录是两份独立数据；清单按每次取整再乘数量。';}
if(state.tab==='matrix'){tools=`<span>点击规格载入生成参数。</span><span><select id="matrix-axis" aria-label="矩阵维度"><option value="specs" ${state.matrixAxis==='specs'?'selected':''}>分辨率 × 时长</option><option value="ratios" ${state.matrixAxis==='ratios'?'selected':''}>画面比例</option></select> <select id="matrix-metric" aria-label="矩阵数值">${[['N','预计扣分'],['raw','取整前积分'],['P','刊例费用'],['C','采购成本'],['cash','折合金额']].map(([k,n])=>`<option value="${k}" ${state.matrixMetric===k?'selected':''}>${n}</option>`).join('')}</select></span>`;
const durations=M.get(state.task.model).seconds.max>15?['4','5','8','10','15','20','25','30']:['4','5','8','10','12','15'];
const metric=state.matrixMetric,base={...state.task},display=z=>['P','C','cash'].includes(metric)?cash(z[metric],4):num(z[metric],metric==='N'?0:4);
if(state.matrixAxis==='specs')html=table(['分辨率 / 输出时长',...durations.map(s=>s+'秒')],M.get(base.model).resolutions.map(res=>'<tr>'+td(res==='4k'?'4K':res)+durations.map(seconds=>{const t={...base,res,seconds},vv=theory(t,state.rules,p);tableRows.push(exportRow(label(t)+' / '+vinLabel(t),vv,vv.x));return td(`<button class="matrixbutton" data-matrix="${esc(JSON.stringify(t))}"><b>${display(vv.x)}</b>${vv.partial?'<span class="smallhint">规则待补齐</span>':''}</button>`);}).join('')+'</tr>'));
else html=table(['画面比例','映射像素','刊例费用','采购成本','取整前积分','预计扣分'],RATIOS.map(ratio=>{const t={...base,ratio},vv=theory(t,state.rules,p),xx=vv.x;tableRows.push(exportRow(label(t),vv,xx));return'<tr>'+td(`<button class="rowbutton" data-matrix="${esc(JSON.stringify(t))}">${ratio}</button>`)+td(M.get(t.model).dims[t.res][ratio].join(' × '))+td(cash(xx.P))+td(cash(xx.C))+td(num(xx.raw,8))+td(num(xx.N,0))+'</tr>';}));
end=`点击格子载入参数。当前${esc(vinLabel(base))}，${state.matrixAxis==='specs'?'比例 '+base.ratio:'分辨率 '+base.res+'，输出 '+base.seconds+'秒'}。`;}
if(state.tab==='recharges'){tools=`<span><select id="recharge-mode" aria-label="充值对比模式"><option value="reprice" ${state.rechargeMode==='reprice'?'selected':''}>随充值重新反算倍率</option><option value="fixed" ${state.rechargeMode==='fixed'?'selected':''}>固定当前倍率，看影响</option></select></span><button class="link" id="add-recharge">＋ 充值条件</button>`;if(!x)html='<div class="empty">请先修正生成参数。</div>';else if(state.rechargeMode==='reprice'&&!validTarget(state.plan))html='<div class="empty">参考目标未设置或无效。可选择固定当前倍率进行对比。</div>';else{const frozen=state.frozenM?unpack(state.frozenM):p.usedM;html=table(['充值实付','到账积分','每元积分','定价倍率','取整前积分','预计扣分','折合金额','折合客户折扣'],state.recharges.map(r=>{const pp=state.rechargeMode==='fixed'?pricing({...state.plan,...r,mode:'manual',manualM:frozen}):idealPricing({...state.plan,...r});const vv=theory(state.task,state.rules,pp),xx=vv.x;tableRows.push({...exportRow(r.pay+'元→'+r.total+'积分',vv,xx),pay:r.pay,total:r.total});return'<tr>'+td('¥'+r.pay)+td(r.total)+td(num(pp.S,6))+td(num(pp.usedM,10))+td(num(xx.raw,8))+td('<b>'+num(xx.N,0)+'</b>')+td(cash(xx.cash))+td(num(xx.effective,5)+'折')+'</tr>';}));}end='只改变充值与定价方案；刊例费用与采购成本保持不变。固定倍率不等于固定客户折扣。';}
$('table-tools').innerHTML=tools;$('table').innerHTML=html;$('table-end').innerHTML=end;}
function renderActual(){
 actualRows=[];
 $('actual-table').innerHTML=table(['实测记录 / 规格','刊例费用估算 P','平台记录 P','差额 ΔP','采购成本估算 C','平台记录 C','当前复算扣分','复算模型毛利','历史实扣积分',''],state.observations.map(o=>{
  const model=o.params.model||'seedance-2.0',p=pricingForModel(model),v=quote(o.params),P=v.partial?null:v.calc.P,C=P===null?null:mul(P,p.q),a=E.recalcRecord(o,p),profit=a.cash===null?null:sub(a.cash,a.C);
  actualRows.push({scope:'实测对照',model,modelRuleVersion:v.calc.ruleVersion,...procurementInfo(model,p.q),record:o.title,params:label(o.params)+' / '+vinLabel(o.params),coverage:coverage(v),theoryP:P===null?'':decimal(P),recordedP:o.P,deltaP:P!==null&&o.P!==''?decimal(sub(o.P,P)):'',theoryC:C===null?'':decimal(C),recordedC:o.C,deltaC:C!==null&&o.C!==''?decimal(sub(o.C,C)):'',recordedN:o.N,usage:o.usage||'',recalcN:a.N===null?'':num(a.N,0),recalcCash:a.cash===null?'':decimal(a.cash),recalcProfit:profit===null?'':decimal(profit),pay:state.plan.pay,total:state.plan.total,M:decimal(p.usedM),targetMode:p.targetMode,note:o.note});
  return '<tr>'+td(`<b>${esc(o.title)}</b><span class="second">${esc(label(o.params))} / ${esc(vinLabel(o.params))}</span><span class="second">复算采购设置 ${num(mul(p.q,10),4)}折${procurementInfo(model,p.q).procurementSimulated?' · 模拟':''}</span>`)+td(P===null?'待补齐':num(P,8))+td(o.P!==''?esc(o.P):'—')+td(P!==null&&o.P!==''?minus(o.P,P):'—')+td(C===null?'—':num(C,8))+td(o.C!==''?esc(o.C):'—')+td(a.N===null?'—':`<b>${num(a.N,0)}</b>`)+td(profit===null?'—':cash(profit))+td(o.N!==''?esc(o.N):'未知')+td(`<button class="link" data-observation="${esc(o.id)}">计算展开</button><br><button class="link" data-edit-observation="${esc(o.id)}">编辑</button>`)+'</tr>';
 }));
 $('other-references').innerHTML=state.references.map(r=>`<p><b>${esc(r.title)}</b> · 刊例约 ¥${esc(r.P)}<br>${esc(r.note)}</p>`).join('');
}
function render(){
 modelValid=false;platformValid=false;
 activateProcurement();
 if($('pricing-model'))$('pricing-model').textContent=M.get(state.task.model).label;
 const procurementStatus=$('procurement-status');
 if(procurementStatus){
  const validQ=positive(state.plan.q,false,6)&&+state.plan.q<=10,info=validQ?procurementInfo():null;
  procurementStatus.textContent=info?info.procurementStatus:'采购折扣待修正';procurementStatus.dataset.simulated=String(!!info?.procurementSimulated);procurementStatus.classList.toggle('is-simulation',!!info?.procurementSimulated);
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
  for(const id of ['token-rate','token-estimate','token-minimum']){$(id).textContent='—';$(id).removeAttribute('title');}
  for(const name of ['estimate','minimum']){$('token-'+name+'-metric').classList.remove('is-adopted');$('token-'+name+'-adopted').hidden=true;}
  if(drawerName==='usage')$('drawer-body').innerHTML='<p class="notice red">当前输入无效，请先修正生成参数。</p>';
 }
 try{
  if(!validPlan(state.plan))throw Error('请检查采购折扣、充值金额、到账积分和定价参数。');
  renderPlan();
  if(!modelValid)throw Error('请先在生成任务中修正参数。');
  renderResult();renderTable();platformValid=true;
 }catch(e){
  $('platformError').hidden=false;$('platformError').textContent=e.message;
  $('cost-c').textContent='—';$('calculation').innerHTML='<div class="empty">平台结果待修正。</div>';$('table').innerHTML='<div class="empty">平台参数待修正。</div>';$('actual-table').innerHTML='<div class="empty">请先修正平台定价参数后复算。</div>';
  $('table-end').textContent='';tableRows=[];actualRows=[];$('add-task').disabled=true;$('details').disabled=true;
  if(!validPlan(state.plan))for(const id of ['multiplier','break-even-m','per-yuan','per-point','plan-principle'])$(id).textContent='—';
 }
 if(validPlan(state.plan)){try{renderActual();}catch(e){$('actual-table').innerHTML='<div class="empty">'+esc(e.message)+'</div>';actualRows=[];}}
 globalValid=modelValid&&platformValid;persist();
}
function changeTask(patch){state.task={...state.task,...patch};if(validTask(state.task))state.task=normalizeTask(state.task);render();}
function changeModel(model){
 const spec=M.get(model),previous=state.task,changes=[];
 const next={...previous,model};
 if(!spec.resolutions.includes(next.res)){next.res=spec.resolutions.at(-1);changes.push('分辨率 '+next.res);}
 for(const [field,limits,name] of [['seconds',spec.seconds,'输出'],['vin',spec.inputSeconds,'输入视频']]){
  const value=Math.min(limits.max,Math.max(limits.min,Math.ceil(Number(next[field])||limits.min)));
  if(String(value)!==String(next[field]))changes.push(name+' '+value+' 秒');next[field]=String(value);
 }
 state.task=normalizeTask(next);render();if(changes.length)toast(spec.label+' 已调整：'+changes.join('、')+'。');
}
function showWorkspace(w,focusId='generation-title'){
 if(w==='platform')w='theory';
 if(!['theory','actual'].includes(w))return;
 state.workspace=w;closeDrawer();render();$(w==='actual'?'actual-title':focusId)?.focus();
}
const optionalCash=(v,d=6)=>v===null?'—':cash(v,d),optionalDecimal=v=>v===null?'':decimal(v),signedCash=v=>v===null?'—':(cmp(v,0)>=0?'+':'')+cash(v);
function amount(v,d=12){return v===null||v===undefined?'—':num(v,d);}
function formulaDetails(){openDetails('theory');}
let detailContext={mode:'theory',task:null,recordId:'',text:''};
function detailStep(n,title,content){return `<section class="detail-section"><h3><span class="detail-index">${n}</span>${title}</h3>${content}</section>`;}
function detailFact(label,value,emphasis=false){return `<div class="fact${emphasis?' emph':''}"><span>${label}</span><b>${value}</b></div>`;}
function detailPlan(p,model=state.task.model){return `<div class="detail-context"><strong>${esc(state.plan.company)}</strong><br>实付 ¥${esc(state.plan.pay)} → 到账 ${esc(state.plan.total)} 积分　·　${esc(targetSummary(p))}<br>采购 ${num(mul(p.q,10),4)}折 · ${esc(procurementInfo(model,p.q).procurementStatus)}<br>定价倍率 M = <strong class="num">${num(p.usedM,15)}</strong>　·　每积分 ¥${fixed(p.U,10)}</div>`;}
function detailBusinessMath(p){if(p.targetAvailable===false)return `<div class="formula">指定倍率 M = ${num(p.usedM,18)}<br>每元积分 S = ${num(p.S,14)}<br>每积分金额 U ≈ ${num(p.U,18)} 元</div>`;return `<details class="record-notes"><summary>充值方案、目标金额与倍率如何得到</summary><div class="formula">S = ${esc(state.plan.total)} ÷ ${esc(state.plan.pay)} = ${num(p.S,14)} 积分/元<br>U = 1 ÷ S ≈ ${num(p.U,18)} 元/积分<br>${p.targetMode==='margin'?`目标金额 R = C ÷ (1 − ${num(div(state.plan.margin,100),8)})<br>M = S ÷ [10 × (1 − ${num(div(state.plan.margin,100),8)})]`:`目标金额 R = P × ${num(p.d,8)}<br>M = ${num(p.d,8)} × S ÷ (${num(p.q,6)} × 10)`}<br>理想 M ≈ ${num(p.M,18)}；本次使用 M ≈ ${num(p.usedM,18)}<br>保本 M = S ÷ 10 = ${num(p.breakEvenM,12)}</div><p class="footnote">${esc(state.plan.basis)}。先用采购成本乘倍率得到积分，再按充值的实际现金价值换算收入。倍率不等于利润率；不再重复乘客户折扣。</p></details>`;}
function detailVariance(x,scope){if(x.target===null)return '<p class="footnote">参考目标未设置或无效，暂不计算目标差额；指定倍率仍用于收费。</p>';return `<details class="record-notes"><summary>与目标差额如何拆分</summary>${detailFact(scope==='actual'?'采购原值与约定采购比例的偏差影响':'采购比例差额（理论按约定比例）',cash(x.costGap,12))}${detailFact('倍率保存精度 / 指定倍率影响',cash(x.precisionGap,12))}${detailFact('逐任务向上取整影响',cash(x.roundGap,12))}${detailFact('合计：扣分折合金额 − 目标金额',cash(x.gap,12),true)}<p class="footnote">以上均按当前方案复算。成本差、倍率差和取整差分开，不把差额全部归因于取整或最低用量。</p></details>`;}
function theoryBreakdown(t,p){
 const v=theory(t,state.rules,p),x=v.x;
 const c=v.calc,rule=v.rule,partial=v.partial;
 if(!x)return{html:usageExplanation(v,t),text:'最低用量待补齐，不能生成平台收费明细。'};
 const banner=partial?`<div class="notice detail-warning"><b>最低用量数据待补：下列金额只是基础试算，不是完整理论报价。</b><br>没有采用任何截图费用，也没有把未知门槛当作已确认的0。实测金额复算仍可独立查看。</div>`:`<div class="notice neutral">${rule?'本次估算已计入最低用量门槛；来源见下方。':'无视频输入，按基础用量计算。'}所有金额来自参数与规则，不读取平台金额。</div>`;
 const minSection=t.video?(rule?`<div class="formula">L = ${esc(rule.tokens)} Token<br>T<sub>估算</sub> = max(${num(c.tokens,14)}, ${esc(rule.tokens)})<br>= <strong>${num(c.billedTokens,14)} Token</strong></div><p class="footnote">${cmp(c.tokens,rule.tokens)<0?'本任务预计触发最低用量：按门槛估算。':'基础用量已达到门槛：按基础用量估算。'}<br>来源：${esc(rule.note)}<br>门槛保留公式精度，不将表格显示整数作为中间输入。<br>匹配范围：${esc(M.get(t.model).label)} · ${esc(M.get(t.model).version)} · ${esc(t.res)} · ${esc(t.ratio)} · 输出${esc(t.seconds)}秒。输入时长不参与门槛键。</p>`:`<div class="formula">L = <strong>尚未取得</strong><br>T<sub>估算</sub> = max(${num(c.tokens,14)}, L)<br>完整用量估算：<strong>待补规则值</strong></div><p class="footnote">不会用约1.88元、1.8928元或其他实测金额倒推 L。下面只展开基础用量的排查结果，未包含门槛。</p>`):'<p class="detail-help">无视频输入，不应用含视频输入的最低用量。T<sub>估算</sub> = T<sub>基础</sub>。</p>';
 const html=banner+detailStep('01','基础用量',`<div class="formula">T<sub>基础</sub> = (${esc(t.seconds)} + ${t.video?esc(t.vin):'0'}) × ${c.wh[0]} × ${c.wh[1]} × 24 ÷ 1024<br>= <strong>${num(c.tokens,14)} Token</strong></div><p class="footnote">依次为输出秒数、输入视频秒数、输出宽高像素及帧率。像素与费率已核对官方文档（2026-10-20）；金额是参数估算，API 返回的实际用量可能有差异。</p>`)
 +detailStep('02','最低用量估算',minSection)
 +detailStep('03',partial?'基础成本演算 · 尚未计门槛':'刊例费用与采购成本',`<div class="formula">P${partial?'<sub>基础</sub>':''} = ${num(c.billedTokens,14)} × ${num(c.rate,6)} ÷ 1,000,000<br>= <strong>¥${num(x.P,18)}</strong><br>C${partial?'<sub>基础</sub>':''} = ${num(x.P,18)} × ${num(p.q,6)}<br>= <strong>¥${num(x.C,20)}</strong></div>`)
 +detailStep('04',partial?'基础积分演算 · 非完整核价':'取整前积分与预计扣分',`<div class="formula">I = ${num(x.C,20)} × ${num(p.usedM,18)} × 10<br>= <strong>${num(x.raw,20)} 积分</strong><br>N = ceil(${num(x.raw,20)}) = <strong>${num(x.N,0)} 积分</strong></div><p class="footnote">${partial?'门槛补齐后，这里的成本、积分及矩阵统一重算；当前值不构成完整理论报价。':'各任务分别向上取整；预计扣分不等于平台实际扣分。'}</p>`)
 +detailStep('05',partial?'基础试算对应的折合金额':'目标金额与取整影响',`<div class="formula">目标（${targetLabel(p)}）= ${optionalCash(x.target,18)}<br>扣分折合金额 = ${num(x.N,0)} × (${esc(state.plan.pay)} ÷ ${esc(state.plan.total)})<br>≈ <strong>¥${num(x.cash,18)}</strong></div>${detailFact('折合客户折扣',num(x.effective,8)+'折')}${detailVariance(x,'theory')}`)
 +`<div class="detail-scope"><span>计算域：${partial?'基础理论（规则未齐）':'理论规则计算'} · 不采用实测金额</span><button class="btn sm" id="detail-open-rule">查看最低用量规则</button></div>`;
 const text=[`任务：${label(t)} / ${vinLabel(t)}`,`计算口径：${coverage(v)}`,`基础Token = ${decimal(c.tokens)}`,`最低Token = ${rule?rule.tokens:t.video?'未取得；不是0':'不适用'}`,`规则来源 = ${rule?rule.note:t.video?'未匹配门槛':'无视频输入，不适用最低用量'}`,`以下${partial?'为未计门槛的基础演算，不是完整理论费用':'为公式计算值'}：`,`P = ${decimal(x.P)}`,`C = P × ${num(p.q,6)} = ${decimal(x.C)}`,`取整前积分 = C × M × 10 = ${decimal(x.raw)}`,`预计扣分 = ${num(x.N,0)}`,`目标金额 = ${x.target===null?'未设置或无效':decimal(x.target)}`,`扣分折合金额 = ${decimal(x.cash)}`].join('\n');
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
  +detailStep('03','复算金额与模型毛利',`<div class="formula">折合金额 = ${num(a.N,0)} × (${esc(state.plan.pay)} ÷ ${esc(state.plan.total)})<br>≈ <strong>¥${num(a.cash,18)}</strong></div>${a.target!==null?detailFact(targetLabel(p),cash(a.target,12)):`<p class="footnote">${p.targetAvailable===false?'参考目标未设置或无效，暂不计算目标金额。':'缺少平台刊例 P，无法计算折扣目标金额。'}</p>`}${detailFact('复算模型毛利（折合金额 − 原始采购）',cash(profit,12),true)}${detailFact('复算模型毛利率',margin===null?'未定义':num(margin,6)+'%')}${a.P!==null?detailFact('复算金额相对平台刊例',num(x.effective,8)+'折'):'<p class="footnote">未录入平台刊例 P，仅刊例折扣无法计算；采购成本、现金与毛利仍可核算。</p>'}${x?detailVariance(x,'actual'):''}`);
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
 const tabs=`<div class="detail-switch" role="tablist" aria-label="计算展开口径"><button role="tab" aria-selected="${chosen==='theory'}" data-detail-mode="theory" class="${chosen==='theory'?'active':''}">参数估算明细</button><button role="tab" aria-selected="${chosen==='actual'}" data-detail-mode="actual" class="${chosen==='actual'?'active':''}">实测金额复算展开</button></div>`;
 const content=tabs+detailPlan(p,t.model||'seedance-2.0')+selector+view.html+detailBusinessMath(p)+`<div class="actions" style="margin-top:20px"><button class="btn" id="export-calculation">导出这份计算明细 ↓</button><button class="btn" id="close-only">关闭</button></div>`;
 detailContext.text=[`Reelay V9.5.0 · ${chosen==='actual'?'平台实测金额复算':'参数估算明细'}`,`企业：${state.plan.company}`,`模型：${M.get(t.model).label}；采购比例 ${num(p.q,6)}；${procurementInfo(t.model||'seedance-2.0',p.q).procurementStatus}`,`实付 ${state.plan.pay}元 / 到账 ${state.plan.total}积分 / ${targetSummary(p)}`,`定价倍率 = ${decimal(p.usedM)}（显示值；内部精确计算）`,`充值核算口径：${state.plan.basis}`,'',view.text].join('\n');
 openDrawer('calculation','定价明细',label(t)+' / '+vinLabel(t)+' · 不改变主表输入',content,true);
}
let ruleContext=null;
function openRules(ruleTask=state.task){
 ruleContext=clone(ruleTask);const t=ruleContext,v=quote(t),spec=M.get(t.model),m=v.rule;
 openDrawer('usage','用量说明',spec.label+' · 规则版本 '+spec.version,usageExplanation(v,t)+`<details class="record-notes"><summary>高级：人工门槛覆盖</summary><p>仅在有明确特殊规则时使用；不会改写官方来源。</p>${t.video?`<label class="fieldlabel" for="rule-min">最低 Token</label><input class="input" id="rule-min" value="${esc(m?.tokens||'')}"><label class="fieldlabel" for="rule-note">来源与适用范围</label><textarea class="input" id="rule-note">${esc(m?.kind==='manual'?m.note:'')}</textarea><div id="rule-error"></div><button class="btn" id="save-rule">保存人工覆盖</button><button class="btn" id="remove-rule">恢复官方规则</button>`:'无视频输入不应用最低用量。'}</details>`);
}
function openPlan(){openDrawer('plan','定价倍率','由充值方案与定价目标反算，也可手动指定。',`<div class="multiplier-settings">
<div class="multiplier-method"><label for="plan-mode">计算方式</label><select class="input" id="plan-mode"><option value="ideal" ${state.plan.mode!=='manual'?'selected':''}>自动计算</option><option value="manual" ${state.plan.mode==='manual'?'selected':''}>手动指定</option></select></div>
<div id="plan-auto-options"><label class="precision-toggle"><input type="checkbox" id="plan-limit-precision" ${state.plan.mode==='saved'?'checked':''} aria-controls="plan-precision">限制小数位<span>可选</span></label><div id="plan-precision" hidden><div class="grid2"><div><label class="fieldlabel" for="plan-digits">保留小数位</label><select class="input" id="plan-digits">${Array.from({length:21},(_,n)=>n).map(n=>`<option value="${n}" ${n===state.plan.digits?'selected':''}>${n}位</option>`).join('')}</select></div><div><label class="fieldlabel" for="plan-round">处理方式</label><select class="input" id="plan-round"><option value="nearest" ${state.plan.round==='nearest'?'selected':''}>四舍五入</option><option value="truncate" ${state.plan.round==='truncate'?'selected':''}>截断</option></select></div></div><p class="precision-note">处理后的倍率参与计价，可能改变扣分。</p></div></div>
<div id="plan-manual-field" hidden><label class="fieldlabel" for="plan-manual">指定倍率</label><input class="input num" id="plan-manual" inputmode="decimal" value="${esc(state.plan.manualM)}" aria-describedby="plan-error"></div>
<section class="multiplier-derivation" aria-labelledby="plan-derivation-title"><div class="derivation-head"><h3 id="plan-derivation-title">倍率的由来</h3><span class="badge" id="plan-comparison" hidden>自动推算 · 仅作对照</span></div><div id="plan-derivation"></div></section>
<div class="readout multiplier-result" id="plan-preview" aria-live="polite"><div class="small sub">待应用倍率</div><div class="big num" id="plan-used-value"></div><div class="state-feedback" id="plan-result-note"></div></div><div id="plan-error" class="inline-error" role="alert"></div><div class="actions"><button class="btn primary" id="save-plan">应用设置</button></div>
<details class="record-notes plan-basis-note"><summary>方案备注</summary><label class="fieldlabel" for="plan-basis">充值核算说明（可选）</label><textarea class="input" id="plan-basis" maxlength="500">${esc(state.plan.basis)}</textarea></details></div>`);planPreview();}
function planCandidate(){
 const manual=$('plan-mode').value==='manual',manualM=$('plan-manual').value.trim();
 return{...state.plan,mode:manual?'manual':$('plan-limit-precision').checked?'saved':'ideal',digits:+$('plan-digits').value,round:$('plan-round').value,manualM:manual||positive(manualM,false,20)?manualM:state.plan.manualM,basis:$('plan-basis').value};
}
function planDraft(){
 const candidate=planCandidate();
 if(!validPlan(candidate))throw Error(candidate.mode==='manual'&&!positive(candidate.manualM,false,20)?'请输入大于0的倍率，最多20位小数。':'请检查倍率参数与备注。');
 if(candidate.mode==='saved'&&cmp(decimalString(idealPricing(candidate).M,candidate.digits,candidate.round),0)<=0)throw Error('精度处理后的倍率为0，请增加小数位或关闭限制。');
 return{candidate,p:pricing(candidate)};
}
function multiplierDerivation(c){
 if(!validTarget(c))return '<p class="derivation-note">参考目标未设置或无效，无法推算自动倍率；指定倍率可直接用于收费。</p>';
 const p=idealPricing(c),margin=c.targetMode==='margin',shown=(x,d=12)=>{const value=num(x,d);return(cmp(x,value)===0?'= ':'≈ ')+value;},q=num(mul(p.q,10),6),d=num(c.discount,4);
 const target=margin?'模型毛利率 '+num(c.margin,4)+'%':cmp(c.discount,10)===0?'客户无折扣（10折）':'客户 '+d+'折';
 const formula=margin?'倍率 = 每元积分 ÷［（1 − 目标毛利率）× 10］':'倍率 = 每元积分 ×（客户折扣 ÷ 采购折扣）÷ 10';
 const substitution=margin?`（${num(p.T,4)} ÷ ${num(p.A,2)}）÷［（1 − ${num(c.margin,4)}%）× 10］`:`（${num(p.T,4)} ÷ ${num(p.A,2)}）×（${d} ÷ ${q}）÷ 10`;
 return `<dl class="derivation-known"><div class="known-recharge"><dt>充值</dt><dd>${cash(p.A,2)} → ${num(p.T,4)} 积分</dd></div><div><dt>采购</dt><dd>${cmp(p.q,1)===0?'刊例价（10折）':q+'折'}</dd></div><div><dt>${c.mode==='manual'?'参考目标':'定价目标'}</dt><dd>${target}</dd></div></dl>
<ol class="derivation-steps"><li><div class="derivation-formula">每元积分 = 到账总积分 ÷ 充值金额</div><div class="derivation-substitution num" id="plan-recharge-calculation">${num(p.T,4)} ÷ ${num(p.A,2)} ${shown(p.S)} <small>积分/元</small></div></li><li><div class="derivation-formula" id="plan-multiplier-formula">${formula}</div><div class="derivation-substitution num" id="plan-multiplier-substitution">${substitution}<br><strong id="plan-ideal-value">${shown(p.M)}</strong></div></li></ol>
${margin?'<p class="derivation-note">毛利率目标固定时，采购成本在推导中约掉；采购折扣改变现金价，不改变自动倍率。</p>':''}
<details class="derivation-basis"><summary>推导依据</summary><p>取整前现金价 = 采购成本 × 倍率 × 10 ÷ 每元积分。</p><p>${margin?'目标金额 = 采购成本 ÷（1 − 目标毛利率），联立后约去采购成本。':'目标金额 = 刊例价 × 客户折扣 ÷ 10；采购成本 = 刊例价 × 采购折扣 ÷ 10。联立后约去刊例价。'}</p><p>公式中的10是固定积分换算系数；折扣均按“折”代入。先反算倍率，再将每笔积分向上取整。</p></details>`;
}
function planPreview(){
 const manual=$('plan-mode').value==='manual',saved=!manual&&$('plan-limit-precision').checked;
 $('plan-auto-options').hidden=manual;$('plan-limit-precision').disabled=manual;$('plan-precision').hidden=!saved;$('plan-digits').disabled=!saved;$('plan-round').disabled=!saved;
 $('plan-manual-field').hidden=!manual;$('plan-manual').disabled=!manual;$('plan-comparison').hidden=!manual;
 $('plan-derivation').innerHTML=multiplierDerivation(planCandidate());
 try{
  const {candidate:c,p}=planDraft(),v=theory(state.task,state.rules,p),value=num(p.usedM,20);
  $('plan-used-value').textContent=(cmp(p.usedM,value)===0?'':'≈ ')+value;
  const note=c.mode==='manual'?(validTarget(c)?'采用手动值；上方自动推算仅作对照。':'采用手动值；参考目标不参与收费。'):c.mode==='saved'?`自动倍率${c.round==='nearest'?'四舍五入':'截断'}至${c.digits}位小数后采用。`:'按完整精度计算；显示近似值不影响结果。';
  $('plan-result-note').textContent=note+(v.x?' 当前任务 '+num(v.x.N,0)+' 积分。':'');
  $('plan-error').textContent='';$('plan-manual').removeAttribute('aria-invalid');$('save-plan').disabled=false;
 }catch(e){
  $('plan-used-value').textContent='—';$('plan-result-note').textContent='';$('plan-error').textContent=e.message;$('save-plan').disabled=true;
  if(manual)$('plan-manual').setAttribute('aria-invalid','true');
 }
}
function openUnit(){openDrawer('unit','独立金额演算','这是理论基准校验，不对应某条实际任务，也不写入主工作台。',`<label class="fieldlabel" for="unit-p">假设火山刊例费用 P（元）</label><input class="input num" id="unit-p" value="1" inputmode="decimal"><div class="unit-sandbox" id="unit-result"></div><p class="footnote">采用当前企业充值与倍率。改变这里的假设金额不会改变参数试算或实测记录。</p>`);unitPreview();}
function unitPreview(){try{const P=$('unit-p').value.trim();if(!positive(P))throw Error('请输入正数金额');const p=pricing(),x=E.settle(P,mul(P,p.q),p);$('unit-result').innerHTML=`<div class="fact"><span>假设采购成本</span><b>${cash(x.C,9)}</b></div><div class="fact"><span>目标金额</span><b>${optionalCash(x.target,9)}</b></div><div class="fact"><span>取整前积分</span><b>${num(x.raw,12)}</b></div><div class="fact emph"><span>向上取整预计扣分</span><b>${num(x.N,0)} 积分</b></div><div class="fact"><span>折合金额</span><b>${cash(x.cash,9)}</b></div>`;}catch(e){$('unit-result').innerHTML='<div class="notice red">'+esc(e.message)+'</div>';}}
function observationDetail(id){openDetails('actual',id);}
function observationEditor(id=''){const old=state.observations.find(o=>o.id===id),o=old||{id:uid(),title:'新增平台实测',params:clone(validTask(state.task,false)?state.task:defaults().task),P:'',C:'',N:'',date:'',note:''};openDrawer('record-edit',old?'编辑平台实测':'录入平台实测','只保存记录，不采用为理论计算输入。',`<div class="record-inputs" data-edit-id="${esc(o.id)}"><input type="hidden" id="o-model" value="${esc(o.params.model||'seedance-2.0')}"><p>模型：${esc(M.get(o.params.model).label)}</p><label class="fieldlabel" for="o-title">记录名称</label><input class="input" id="o-title" maxlength="100" value="${esc(o.title)}"><div class="grid2"><div><label class="fieldlabel" for="o-res">分辨率</label><select id="o-res">${M.get(o.params.model).resolutions.map(r=>`<option value="${r}" ${r===o.params.res?'selected':''}>${r==='4k'?'4K':r}</option>`).join('')}</select></div><div><label class="fieldlabel" for="o-ratio">画面比例</label><select id="o-ratio">${RATIOS.map(r=>`<option value="${r}" ${r===o.params.ratio?'selected':''}>${r}</option>`).join('')}</select></div></div><div class="grid2"><div><label class="fieldlabel" for="o-seconds">输出时长（秒）</label><input class="input num" id="o-seconds" inputmode="numeric" value="${esc(o.params.seconds)}"></div><div><label class="fieldlabel" for="o-video">视频输入</label><select id="o-video"><option value="false" ${!o.params.video?'selected':''}>无视频输入</option><option value="true" ${o.params.video?'selected':''}>有视频输入</option></select></div></div><label class="fieldlabel" for="o-vin">输入视频总时长（有视频输入时生效）</label><input class="input num" id="o-vin" inputmode="decimal" value="${esc(o.params.vin)}"><div class="grid2"><div><label class="fieldlabel" for="o-p">平台记录刊例 P（元，可留空）</label><input class="input num" id="o-p" inputmode="decimal" value="${esc(o.P)}"></div><div><label class="fieldlabel" for="o-c">平台记录采购 C（元，可留空）</label><input class="input num" id="o-c" inputmode="decimal" value="${esc(o.C)}"></div></div><div class="grid2"><div><label class="fieldlabel" for="o-n">平台实际扣分（不知道则留空）</label><input class="input num" id="o-n" inputmode="numeric" value="${esc(o.N)}"></div><div><label class="fieldlabel" for="o-date">记录日期 / 批次</label><input class="input" id="o-date" maxlength="100" value="${esc(o.date)}"></div></div><label class="fieldlabel" for="o-usage">API completion_tokens（可选，整数；已含最低用量）</label><input class="input num" id="o-usage" value="${esc(o.usage||'')}" inputmode="numeric"><label class="fieldlabel" for="o-note">数据来源、历史定价口径与备注</label><textarea class="input" id="o-note" maxlength="1000">${esc(o.note)}</textarea><div id="record-error" class="inline-error"></div><div class="actions"><button class="btn primary" id="save-observation" data-id="${esc(o.id)}">保存实测记录</button>${old?`<button class="btn danger-link" data-delete-observation="${esc(o.id)}">删除这条实测</button>`:''}</div><p class="footnote">P或C缺失时按缺失保留，不互相反推成实测值。约1.88元等官方预估应保留在其他参考中，不标为平台实测。</p></div>`);}
function saveObservation(id){const o={...(state.observations.find(r=>r.id===id)||{}),id,title:$('o-title').value.trim(),params:{model:$('o-model').value,res:$('o-res').value,ratio:$('o-ratio').value,seconds:$('o-seconds').value.trim(),video:$('o-video').value==='true',vin:$('o-vin').value.trim()},P:$('o-p').value.trim(),C:$('o-c').value.trim(),N:$('o-n').value.trim(),usage:$('o-usage').value.trim(),date:$('o-date').value.trim(),note:$('o-note').value.trim()};if(!validObservation(o)||!o.title){$('record-error').textContent='请检查规格与金额：P/C至少填一项，未知实际扣分留空。时长须符合此记录的模型范围。';return;}o.params=normalizeTask(o.params,false);const i=state.observations.findIndex(x=>x.id===id);if(i<0){if(state.observations.length>=200)return toast('最多200条实测，请先导出清理。');state.observations.push(o);}else state.observations[i]=o;closeDrawer();render();toast('实测记录已保存；理论输入与结果不变。');}
function addTask(){const v=current();if(!v.x||!globalValid)return;if(state.tasks.length>=100)return toast('最多保存100种规格。');state.tasks.push({id:uid(),params:normalizeTask(state.task),qty:'1',title:label(state.task)+' / '+vinLabel(state.task)});state.tab='tasks';state.workspace='theory';$('platform-comparison').open=true;render();toast('只保存参数与数量；成本始终由当前规则计算。');}
function openNewRecharge(){openDrawer('recharge','添加充值方案','不改变实测数据，也不执行实际充值。',`<div class="grid2"><div><label class="fieldlabel" for="r-pay">实付金额</label><input class="input" id="r-pay" inputmode="decimal" value="100"></div><div><label class="fieldlabel" for="r-total">到账总积分</label><input class="input" id="r-total" inputmode="decimal" value="1500"></div></div><div class="inline-error" id="r-error"></div><button class="btn primary" id="save-recharge">加入对比</button>`);}
function download(name,text,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const filename=()=>state.plan.company.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,50)||'Reelay方案';
function summary(){const p=pricing(),v=current(),x=v.x;return ['Reelay V9.5.0 · 视频成本与定价','',state.plan.company,`规则：${M.get(state.task.model).version}；核验日期${R.VERIFIED_AT}；模型 ${M.get(state.task.model).label}。`,`采购比例 ${num(p.q,6)}；${procurementInfo(state.task.model,p.q).procurementStatus}；积分换算常数10。`,`充值方案：${state.plan.basis}`,`实付 ${state.plan.pay} 元 / 到账 ${state.plan.total} 积分 / ${targetSummary(p)}`,`定价倍率 M = ${decimal(p.usedM)}`,`保本倍率 = ${decimal(p.breakEvenM)}`,`任务：${label(state.task)} / ${vinLabel(state.task)}`,`估算依据：${coverage(v)}`,...(x?[`刊例费用 P = ${decimal(x.P)}`,`采购成本 C = ${decimal(x.C)}`,`取整前积分 = ${decimal(x.raw)}`,`预计扣分 = ${num(x.N,0)}`,`折合金额 = ${decimal(x.cash)}`,`模型毛利 = ${decimal(x.profit)}`,`模型毛利率 = ${x.margin===null?'未定义':decimal(x.margin)+'%'}`]:['当前参数无法计算，请检查输入。']),'','费用为官方规则估算，API实际usage或账单可能有差异。毛利仅扣模型采购成本，不是净利润。','平台实测和历史扣分分别保存；不会用于替换理论公式。',`任务清单 ${state.tasks.length}种规格；实测记录 ${state.observations.length}条。`].join('\n');}
function exportJSON(){
 const procurementProfiles=Object.keys(PROCUREMENT_MODELS).map(model=>procurementInfo(model));
 const taskEstimates=state.tasks.map(row=>{const v=theory(row.params);return v.x?exportRow(row.title,v,v.x,row.qty):{model:row.params.model,...procurementInfo(row.params.model),scope:'规则缺项，未生成收费估算'};});
 download(filename()+'_V9方案.json',JSON.stringify({format:'reelay.pricing.v9',appVersion:'9.5.0',exportedAt:new Date().toISOString(),ruleVersion:R.VERSION,scope:'theory and observations stored separately',procurementProfiles,taskEstimates,recordRecalculations:actualRows,state},null,2),'application/json');
}
function csvCell(x){let s=String(x??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCSV(actual=false){const rows=actual?actualRows:tableRows;if(!rows.length)return toast('没有可导出记录。');const titles=actual?{scope:'数据域',model:'模型',modelRuleVersion:'模型规则版本',procurementRatio:'当前复算采购比例',supplierAvailable:'有折扣供应商',procurementSimulated:'采购折扣为模拟',procurementStatus:'采购状态',record:'记录',params:'规格',coverage:'估算依据',theoryP:'刊例费用P',recordedP:'平台记录P',deltaP:'实测P减估算P',theoryC:'采购成本C',recordedC:'平台记录C',deltaC:'实测C减估算C',recordedN:'平台实际扣分_空白为未知',recalcN:'当前复算扣分_非历史',recalcCash:'当前复算金额',recalcProfit:'当前复算模型毛利',pay:'当前充值实付',total:'当前到账积分',M:'当前倍率',targetMode:'当前目标模式',usage:'API_completion_tokens_原记录',note:'备注'}:{scope:'数据域',model:'模型',modelRuleVersion:'模型规则版本',targetMode:'定价目标模式',targetMargin:'目标模型毛利率百分数_毛利模式',procurementRatio:'采购比例',supplierAvailable:'有折扣供应商',procurementSimulated:'采购折扣为模拟',procurementStatus:'采购状态',profit:'每笔模型毛利',margin:'取整后测算模型毛利率百分数',scenario:'场景',coverage:'估算依据',ruleVersion:'规则版本',quantity:'数量_逐笔先取整',pay:'实付元',total:'到账积分',discount:'目标客户折扣',M:'定价倍率',P:'刊例费用P',C:'采购成本C',raw:'取整前积分',N:'每笔预计扣分_非实际',target:'目标金额',cash:'每笔折合金额',gap:'与目标差额'};const ks=Object.keys(titles),csv='\ufeff'+[ks.map(k=>csvCell(titles[k])).join(','),...rows.map(r=>ks.map(k=>csvCell(r[k])).join(','))].join('\r\n');download(filename()+(actual?'_实测对照':'_理论_'+state.tab)+'.csv',csv,'text/csv;charset=utf-8');}
function quoteSummary(){const v=quote(),c=v.calc;return [M.get(state.task.model).label+' · 模型估价',label(state.task)+' / '+vinLabel(state.task),`刊例单价：${num(c.rate)} 元 / 百万 Token`,`基础 Token 估算：${tokenText(c.tokens)}`,`最低 Token 估算：${c.minimum?tokenText(c.minimum):state.task.video?'待补齐':'不适用'}`,`刊例费用：${v.partial?'待补齐':cash(c.P,12)}`,`规则版本：${c.ruleVersion}`,'最低用量为估算；实际以 API usage.completion_tokens 为准。'].join('\n');}
function openExport(){if(!modelValid)return toast('请先修正生成参数。');openDrawer('export','导出','选择要保留的内容。',`<button class="choice" id="export-quote"><div class="choice-title"><b>模型估价摘要</b><span>↓</span></div><p>当前模型、参数、单价、Token 与刊例费用。</p></button><button class="choice" id="export-json" ${globalValid?'':'disabled'}><div class="choice-title"><b>完整方案 JSON</b><span>↓</span></div><p>包含平台方案、任务与实测，可重新导入。${globalValid?'':'平台参数修正后可导出。'}</p></button><button class="choice" id="export-summary" ${globalValid?'':'disabled'}><div class="choice-title"><b>平台定价摘要</b><span>↓</span></div><p>当前采购、充值、收费与毛利。</p></button><button class="choice" id="export-theory" ${globalValid?'':'disabled'}><div class="choice-title"><b>方案对比 CSV</b><span>↓</span></div></button><button class="choice" id="export-actual" ${globalValid?'':'disabled'}><div class="choice-title"><b>实测对账 CSV</b><span>↓</span></div></button>`);}
function migrate(payload){if(['reelay.pricing.v9','reelay.pricing.v8'].includes(payload?.format)){return{value:upgradeState(payload.state),note:(payload.format==='reelay.pricing.v8'?'已导入并升级官方规则；旧人工门槛留在规则档案。':'已导入V9方案；理论与实测独立。')+fixedTaskNotice(payload.state?.task)+procurementMigrationNotice(payload.state)};}
if(payload?.format==='reelay.pricing.v7'&&payload.state){const old=payload.state,n=defaults();n.plan={...n.plan,...old.plan,q:old.plan?.q||'0.735',targetMode:'discount',margin:'8.125',frozen:undefined};delete n.plan.frozen;if(validTask(old.task))n.task=fixedTask(old.task);if(Array.isArray(old.recharges)&&old.recharges.every(r=>positive(r.pay,false,2)&&positive(r.total,false,4)))n.recharges=clone(old.recharges);const candidates=[...(old.custom||[]),old.cost?.evidence,...(old.tasks||[]).map(r=>r.cost?.evidence)].filter(Boolean);for(const e of candidates){if(['screenshot','bill'].includes(e.kind)&&validTask(e.params,false)){const o={id:String(e.id||uid()),title:String(e.title||'旧版实测'),params:clone(e.params),P:String(e.P??''),C:String(e.C??''),N:'',date:'',note:String(e.note||'从旧版金额记录导入，未确认实际扣分。')};if(validObservation(o)&&!n.observations.some(x=>x.id===o.id))n.observations.push(o);}else{const r={id:String(e.id||uid()),title:String(e.title||'旧版其他参考'),params:e.params||null,P:String(e.P??''),C:String(e.C??''),note:String(e.note||'从旧版迁移，仅作参考，不进入理论计算。')};if(validReference(r)&&!n.references.some(x=>x.id===r.id))n.references.push(r);}}
for(const r of old.tasks||[]){if(validTask(r.task,false))n.tasks.push({id:String(r.id||uid()),params:clone(r.task),qty:String(r.qty||1),title:label(r.task)+' / '+vinLabel(r.task)});}if(!validState(n))throw Error('旧版方案含无法安全迁移的参数。请保留原文件，并手动录入充值条件。');return{value:upgradeState(n),note:'旧版已迁移：只保留任务规格与数量，理论成本重新计算；旧费用进入实测或其他参考，不再作为主结果输入。'+fixedTaskNotice(old.task)+procurementMigrationNotice(old)};}
throw Error('仅支持本工具V9、V8或V7导出的方案JSON。');}
function openReset(){openDrawer('reset','重置V9本地草稿？','不会删除旧版V7文件或旧版草稿，不影响真实后台。',`<p>将恢复默认企业条件、理论任务参数和原表4条独立实测记录。当前未导出的修改会丢失。</p><div class="actions"><button class="btn primary" id="confirm-reset">确认重置V9</button><button class="btn" id="close-only">取消</button></div>`);}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset,id=b.id;
if(d.detailMode){openDetails(d.detailMode,detailContext.recordId,detailContext.task);return;}if(d.workspace){showWorkspace(d.workspace);return;}if(d.tab){state.tab=d.tab;render();return;}if(d.example){const preset=quickTasks(state.task.model)[d.example];if(preset)changeTask(clone(preset));return;}if(d.res){changeTask({res:d.res});return;}if(d.ratio){changeTask({ratio:d.ratio});return;}if(d.seconds){changeTask({seconds:d.seconds});return;}if(d.video){changeTask({video:d.video==='true'});return;}if(d.discount){state.plan.discount=d.discount;state.plan.targetMode='discount';render();return;}if(d.margin){state.plan.margin=d.margin;state.plan.targetMode='margin';render();return;}if(d.matrix){try{const t=JSON.parse(d.matrix);if(validTask(t)){state.task=t;showWorkspace('theory','model');document.querySelector('.work').scrollIntoView({behavior:'smooth',block:'start'});}}catch(_){}return;}if(d.observation){observationDetail(d.observation);return;}if(d.editObservation){observationEditor(d.editObservation);return;}if(d.deleteObservation){state.observations=state.observations.filter(o=>o.id!==d.deleteObservation);closeDrawer();render();toast('已删除实测记录，理论结果未变。');return;}if(d.loadTask){const r=state.tasks.find(t=>t.id===d.loadTask);if(r){state.task=clone(r.params);showWorkspace('theory','model');document.querySelector('.work').scrollIntoView({behavior:'smooth',block:'start'});}return;}if(d.deleteTask){state.tasks=state.tasks.filter(t=>t.id!==d.deleteTask);render();return;}
if(!globalValid&&!(['actual-export','add-observation'].includes(id)&&validPlan(state.plan))&&['details','actual-calculation','show-formula','plan-settings','task-rule','open-rules','unit-check','economics-how','add-observation','table-export','actual-export','add-task'].includes(id)){toast('请先修正顶部定价或任务输入。');return;}
switch(id){
case'economics-how':openEconomics();break;
case'export-rules':download('Reelay_V9_规则来源.json',JSON.stringify({version:R.VERSION,sources:R.sources,rules:state.rules},null,2),'application/json');break;
case'close-drawer':case'close-only':closeDrawer();break;
case'open-rules':case'task-rule':case'open-rule-from-formula':openRules();break;
case'show-formula':formulaDetails();break;
case'usage-help':openUsage();break;
case'details':openDetails('theory');break;
case'actual-calculation':openDetails('actual');break;
case'export-calculation':download(filename()+'_计算展开_'+(detailContext.mode==='actual'?'实测复算':'理论')+'.txt',detailContext.text);break;
case'detail-open-rule':openRules(detailContext.task||state.task);break;
case'detail-add-observation':observationEditor();break;
case'view-actual':showWorkspace('actual');break;
case'back-theory':showWorkspace('theory');break;
case'plan-settings':openPlan();break;
case'unit-check':openUnit();break;
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
document.addEventListener('input',e=>{const el=e.target,id=el.id;if(['pay','total','discount','target-margin','purchase-discount'].includes(id)){if(id==='target-margin')state.plan.margin=el.value;else if(id==='purchase-discount'){state.plan.q=positive(el.value,false,4)?num(div(el.value,10),6):'';if(positive(state.plan.q,false,6)&&+state.plan.q<=10)state.plan.procurementByModel[state.task.model]=state.plan.q;}else if(id==='pay'){const gift=$('total').value;state.plan.pay=el.value;if(state.plan.giftMode&&positive(el.value,false,2)&&positive(gift,true,4))state.plan.total=num(add(mul(el.value,10),gift),4);}else if(id==='total'){if(state.plan.giftMode){if(positive(el.value,true,4)&&positive(state.plan.pay,false,2))state.plan.total=num(add(mul(state.plan.pay,10),el.value),4);else state.plan.total='';}else state.plan.total=el.value;}else state.plan.discount=el.value;render();return;}
if(id==='vin-slider'){if(state.task.video)changeTask({vin:el.value});return;}if(id==='manual-m'){state.plan.mode='manual';state.plan.manualM=el.value.trim();render();return;}if(id==='vin'){
 const entered=el.value;
 try{state.task.vin=wholeInputSeconds(entered);el.value=state.task.vin;if(cmp(entered,state.task.vin)!==0)toast('已向上取整：'+entered+' → '+state.task.vin+' 秒。');}
 catch(_){state.task.vin=entered;}
 render();return;
}if(id==='seconds'){state.task.seconds=el.value;render();return;}if(id==='unit-p'){unitPreview();return;}if(id==='plan-manual'){ $('plan-mode').value='manual';planPreview();return;}if(id==='plan-basis'){planPreview();return;}});
document.addEventListener('change',e=>{const el=e.target,id=el.id;if(id==='model'){changeModel(el.value);return;}if(id==='total-mode'){if(!globalValid){el.value=state.plan.giftMode?'gift':'total';toast('请先修正定价或任务输入。');return;}const giftMode=el.value==='gift';if(giftMode&&cmp(sub(state.plan.total,mul(state.plan.pay,10)),0)<0){el.value=state.plan.giftMode?'gift':'total';toast('总积分小于基础积分，不能按附赠模式填写。');return;}state.plan.giftMode=giftMode;render();return;}if(id==='pricing-mode'){state.plan.mode=el.value;render();return;}if(id==='target-mode'){state.plan.targetMode=el.value;render();return;}if(id==='seconds'&&validTask(state.task)){state.task=normalizeTask(state.task);render();return;}if(id==='details-record'){openDetails('actual',el.value,detailContext.task);return;}if(['plan-mode','plan-limit-precision','plan-digits','plan-round'].includes(id)){planPreview();return;}if(id==='matrix-axis'){state.matrixAxis=el.value;render();return;}if(id==='matrix-metric'){state.matrixMetric=el.value;render();return;}if(id==='recharge-mode'){state.rechargeMode=el.value;if(el.value==='fixed')state.frozenM=pack(pricing().usedM);render();return;}if(el.dataset.qty){const t=state.tasks.find(r=>r.id===el.dataset.qty),v=el.value.trim();if(t&&/^\d+$/.test(v)&&+v>=1&&+v<=100000)t.qty=v;else toast('任务数量须为1～100000的整数。');render();}});
// The compact range and numeric value share one integer duration.
let vinEditStart='2';
$('vin').addEventListener('focus',()=>{vinEditStart=positive(state.task.vin,false,4)?state.task.vin:'2';});
$('vin').addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();state.task.vin=vinEditStart;$('vin').value=vinEditStart;$('vin').blur();render();}
 else if(e.key==='Enter'){e.preventDefault();$('vin').blur();}
});
$('vin').addEventListener('blur',()=>{
 try{state.task.vin=wholeInputSeconds($('vin').value);}catch(_){state.task.vin=vinEditStart;}
 $('vin').value=state.task.vin;render();
});
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeDrawer();});
document.addEventListener('keydown',e=>{if($('modal').hidden)return;if(e.key==='Escape'){e.preventDefault();closeDrawer();}if(e.key==='Tab'){const els=[...$('drawer').querySelectorAll('button,input,select,textarea,a[href],summary')].filter(x=>!x.disabled&&x.getClientRects().length);if(!els.length)return;const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>3e6)throw Error('文件超过3MB，请检查是否为方案JSON。');const loaded=migrate(JSON.parse(await f.text()));state=loaded.value;closeDrawer();render();toast(loaded.note);}catch(err){toast('导入失败：'+err.message);}finally{e.target.value='';}});

function targetLabel(p){if(p.targetAvailable===false)return '参考目标未设置或无效';return p.targetMode==='margin'?'采购成本 ÷ (1 − 目标毛利率)':'刊例费用 × '+num(mul(p.d,10),6)+'折';}
function targetSummary(p){if(p.targetAvailable===false)return '参考目标未设置或无效（不影响指定倍率收费）';return (state.plan.mode==='manual'?'参考目标 · ':'')+(p.targetMode==='margin'?'目标模型毛利率 '+state.plan.margin+'%':'目标客户折扣 '+num(mul(p.d,10),6)+'折');}
function openEconomics(){const p=pricing();openDrawer('economics','收费与毛利','按当前充值方案折算金额。',`<div class="principle-steps"><section><b>01 · 成本</b><p>官方用量规则得到刊例 P；采购合同确定采购比例 q；采购成本 C = P × q。平台实测 C 是独立证据。</p></section><section><b>02 · 目标金额</b><p>按折扣：R = P × d。按模型毛利率 g：R = C ÷ (1 − g)。后者不是 C × (1 + g)。</p></section><section><b>03 · 积分收费</b><p>每元到账 S = 总积分 ÷ 实付现金。每积分现金价值 U = 1 ÷ S。积分 I = C × M × 10；逐笔 N = ceil(I)。</p></section><section><b>04 · 模型毛利</b><p>折合金额 = N × U；模型毛利 = 折合金额 − C；模型毛利率 = 模型毛利 ÷ 折合金额；成本加成率 = 毛利 ÷ C。</p></section></div><div class="formula">当前每积分 ≈ ¥${num(p.U,12)}<br>当前保本倍率 = S ÷ 10 = ${num(p.breakEvenM,12)}<br>一次向上取整增加的现金：0 ≤ 差额 &lt; ¥${num(p.U,12)}</div><div class="notice">赠分会降低每积分的现金价值，因此倍率增大并不自动表示利润增加。保本方案的零星取整收入不构成稳定毛利。</div><p>这里计算的是模型毛利，不是净利润。税费、通道费、存储、运维和失败重试成本需在经营预算中另计。历史余额混合了不同充值批次时，当前 U 只代表所填批次。</p>`);}

// Exposed for transparent regression tests. Theory takes no observations argument.
window.ReelayApp={getState:()=>clone(state),setState:s=>{state=upgradeState(s);render();},defaults,validState,upgradeState,normalizeTask,reset:()=>{state=defaults();render();},pricing,pricingForModel,procurementInfo,quote,theory,theoryOne,current,summary,key,minimumKey,normalizeMinimumKeys,openDetails,recalcRecord:(record,p=pricingForModel(record.params?.model||'seedance-2.0'))=>E.recalcRecord(record,p),migrate,OBS,REFS,getTheoryRows:()=>clone(tableRows),getActualRows:()=>clone(actualRows)};
render();
if(taskMigrationNotice)toast(taskMigrationNotice);
})();
