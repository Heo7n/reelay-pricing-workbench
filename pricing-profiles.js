/* Model pricing policies. Recharge conditions remain on the enclosing plan. */
(function(root){
'use strict';
const MODELS=Object.freeze(['seedance-2.0','seedance-2.5','seedance-2.0-fast']);
const DEFAULTS_REVISION=1;
const FIELDS=Object.freeze(['q','targetMode','discount','margin','mode','digits','round','manualM','limitPrecision']);
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const known=model=>MODELS.includes(model);
const select=source=>Object.fromEntries(FIELDS.map(field=>[field,source[field]]));
const text=value=>typeof value==='string'&&value.length<=48;
function positive(value,zero=false,digits=20){
 if(typeof value!=='string'&&typeof value!=='number')return false;
 const s=String(value);
 return s.length<48&&/^\d+(\.\d+)?$/.test(s)&&(!s.includes('.')||s.split('.')[1].length<=digits)&&(zero?+s>=0:+s>0)&&+s<1e12;
}
function validProfile(profile){
 if(!record(profile)||Object.keys(profile).length!==FIELDS.length||!FIELDS.every(field=>own(profile,field)))return false;
 if(!positive(profile.q,false,6)||+profile.q>10||!['discount','margin'].includes(profile.targetMode)||!['ideal','saved','manual'].includes(profile.mode))return false;
 if(!text(profile.discount)||!text(profile.margin)||!text(profile.manualM)||typeof profile.limitPrecision!=='boolean'||!Number.isInteger(profile.digits)||profile.digits<0||profile.digits>20||!['nearest','truncate'].includes(profile.round))return false;
 if(profile.mode==='manual')return positive(profile.manualM,false,20);
 return profile.targetMode==='margin'?positive(profile.margin,true,4)&&+profile.margin<100:positive(profile.discount,false,4)&&+profile.discount<=100;
}
function validMap(map){
 return record(map)&&Object.keys(map).length===MODELS.length&&MODELS.every(model=>own(map,model)&&validProfile(map[model]));
}
function defaults(){
 return Object.fromEntries(MODELS.map(model=>{const discounted=model==='seedance-2.0';return[model,{q:discounted?'0.735':'1',targetMode:'discount',discount:discounted?'7.35':'10',margin:'8.125',mode:discounted?'ideal':'manual',digits:12,round:'nearest',manualM:discounted?'1.538':'1.65',limitPrecision:false}];}));
}
function upgradeDefaults(plan){
 requireMap(plan);requireModel(plan.pricingModel);
 if(plan.pricingDefaultsRevision>=DEFAULTS_REVISION)return [];
 // Only untouched placeholder policies in restored local drafts adopt the new
 // standard. Imported plans bypass this step and retain their exact policies.
 const previous={q:'1',targetMode:'discount',discount:'10',margin:'8.125',mode:'ideal',digits:12,round:'nearest',manualM:'1.538',limitPrecision:false};
 const current=defaults(),changed=[];
 for(const model of ['seedance-2.5','seedance-2.0-fast'])if(FIELDS.every(field=>plan.modelPricing[model][field]===previous[field])){
  plan.modelPricing[model]={...current[model]};changed.push(model);
 }
 plan.pricingDefaultsRevision=DEFAULTS_REVISION;
 if(changed.length)mirror(plan,plan.pricingModel);
 return changed;
}
function valid(plan){return record(plan)&&validMap(plan.modelPricing);}
function requireMap(plan){if(!valid(plan))throw Error('模型定价规则无效');}
function requireModel(model){if(!known(model))throw Error('模型定价规则不支持此模型');}
function syncAliases(plan){plan.procurementByModel=Object.fromEntries(MODELS.map(model=>[model,plan.modelPricing[model].q]));}
function mirror(plan,model){Object.assign(plan,select(plan.modelPricing[model]));plan.pricingModel=model;plan.procurementModel=model;syncAliases(plan);return plan;}
function legacyMap(plan){
 const result=defaults(),procurement=Object.fromEntries(MODELS.map(model=>[model,result[model].q]));
 if(plan.procurementByModel===undefined)procurement['seedance-2.0']=plan.q??procurement['seedance-2.0'];
 else{
  const old=plan.procurementByModel;
  if(!record(old)||Object.keys(old).some(model=>!known(model)))throw Error('模型采购方案无效');
  Object.assign(procurement,old);
  if(plan.procurementModel!==undefined){
   requireModel(plan.procurementModel);
   if(plan.q!==undefined)procurement[plan.procurementModel]=plan.q;
  }
 }
 // Previously, every model used the same target and multiplier settings.
 // Preserve that behavior when migrating; fresh defaults are intentionally different.
 const shared={...result['seedance-2.0'],...select(plan)};
 for(const field of FIELDS)if(shared[field]===undefined)shared[field]=result['seedance-2.0'][field];
 shared.limitPrecision=shared.mode==='saved'?true:shared.mode==='ideal'?false:shared.limitPrecision;
 for(const model of MODELS)result[model]={...shared,q:procurement[model]};
 return result;
}
function compatibleMap(map){
 if(!record(map))return map;
 // Initial per-model exports predate this preference. Add only the new field;
 // retain all other fields so strict validation still rejects malformed data.
 return Object.fromEntries(Object.entries(map).map(([model,profile])=>[model,record(profile)&&!own(profile,'limitPrecision')?{...profile,limitPrecision:profile.mode==='saved'}:profile]));
}
function normalize(plan,activeModel){
 if(!record(plan))throw Error('定价方案无效');
 requireModel(activeModel);
 const source=plan.modelPricing===undefined?legacyMap(plan):compatibleMap(plan.modelPricing);
 if(!validMap(source))throw Error('模型定价规则无效');
 // Import canonical profiles atomically. Stale compatibility mirrors are never
 // allowed to overwrite an explicit profile map.
 plan.modelPricing=Object.fromEntries(MODELS.map(model=>[model,select(source[model])]));
 return mirror(plan,activeModel);
}
function capture(plan){
 requireMap(plan);
 if(!known(plan.pricingModel))return false;
 const draft=select(plan);
 if(draft.mode!=='manual')draft.limitPrecision=draft.mode==='saved';
 // Invalid editing drafts remain in the active controls, while each model's
 // last valid policy remains available for persistence and model switching.
 if(!validProfile(draft))return false;
 plan.modelPricing[plan.pricingModel]=draft;
 plan.limitPrecision=draft.limitPrecision;
 plan.procurementModel=plan.pricingModel;
 syncAliases(plan);
 return true;
}
function activate(plan,model){
 requireModel(model);requireMap(plan);
 if(plan.pricingModel===model){capture(plan);return plan;}
 if(known(plan.pricingModel))capture(plan);
 return mirror(plan,model);
}
function forModel(plan,model){
 requireModel(model);requireMap(plan);
 const profile=model===plan.pricingModel?select(plan):select(plan.modelPricing[model]);
 return{...plan,...profile,pricingModel:model,procurementModel:model};
}
const api={MODELS,FIELDS,DEFAULTS_REVISION,defaults,upgradeDefaults,normalize,activate,capture,forModel,valid,validProfile};
root.ReelayProfiles=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
