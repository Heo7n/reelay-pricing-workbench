'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const P=require('./pricing-profiles.js');
const E=require('./engine.js');
const clone=value=>JSON.parse(JSON.stringify(value));
const equal=(left,right)=>assert.equal(E.cmp(left,right),0);
const common=()=>({company:'定价',pay:'100',total:'1538',giftMode:false,basis:'充值含赠分'});
const fresh=model=>P.normalize({...common(),modelPricing:P.defaults()},model||'seedance-2.0');
const legacy=()=>({...common(),q:'0.735',targetMode:'discount',discount:'8',margin:'12.5',mode:'saved',digits:3,round:'truncate',manualM:'1.65'});
function finance(plan){
 const ideal=E.plan(plan),appliedM=plan.mode==='manual'?plan.manualM:plan.mode==='saved'?E.decimalString(ideal.M,plan.digits,plan.round):'';
 return E.plan({...plan,appliedM});
}

test('fresh profiles reflect current procurement and do not share mutable settings',()=>{
 const first=P.defaults(),second=P.defaults();
 assert.equal(P.valid({modelPricing:first}),true);
 assert.equal(first['seedance-2.0'].q,'0.735');
 assert.equal(first['seedance-2.0'].discount,'7.35');
 for(const model of ['seedance-2.5','seedance-2.0-fast']){
  assert.equal(first[model].q,'1');assert.equal(first[model].discount,'10');
 }
 first['seedance-2.0'].manualM='2';
 assert.equal(first['seedance-2.5'].manualM,'1.538');
 assert.equal(second['seedance-2.0'].manualM,'1.538');
});

test('legacy global target and execution settings preserve results for all models',()=>{
 for(const mode of ['ideal','saved','manual'])for(const targetMode of ['discount','margin']){
  const before={...legacy(),mode,targetMode,procurementByModel:{'seedance-2.0':'0.61','seedance-2.5':'0.9','seedance-2.0-fast':'1'},procurementModel:'seedance-2.0-fast',q:'0.95'};
  const expectedQ={'seedance-2.0':'0.61','seedance-2.5':'0.9','seedance-2.0-fast':'0.95'};
  const normalized=P.normalize(clone(before),'seedance-2.5');
  for(const model of P.MODELS){
   const previous=finance({...before,q:expectedQ[model]}),current=finance(P.forModel(normalized,model));
   equal(current.usedM,previous.usedM);equal(current.q,previous.q);
   for(const listPrice of ['0.3','1.8928','45.550532']){
    const cost=E.mul(listPrice,previous.q),a=E.settle(listPrice,cost,previous),b=E.settle(listPrice,cost,current);
    for(const field of ['N','raw','cash','profit','margin'])equal(a[field],b[field]);
   }
   assert.equal(normalized.modelPricing[model].discount,before.discount);
   assert.equal(normalized.modelPricing[model].margin,before.margin);
   assert.equal(normalized.modelPricing[model].digits,before.digits);
   assert.equal(normalized.modelPricing[model].limitPrecision,mode==='saved');
  }
 }
});

test('legacy single procurement value remains owned by standard 2.0 irrespective of active task',()=>{
 const plan=P.normalize({...legacy(),q:'0.61'},'seedance-2.5');
 assert.deepEqual(plan.procurementByModel,{'seedance-2.0':'0.61','seedance-2.5':'1','seedance-2.0-fast':'1'});
 assert.equal(plan.q,'1');assert.equal(plan.discount,'8');
 assert.equal(plan.pricingModel,'seedance-2.5');assert.equal(plan.procurementModel,'seedance-2.5');
});

test('each model restores its complete independently edited policy',()=>{
 const plan=fresh();
 Object.assign(plan,{q:'0.6',targetMode:'margin',margin:'20',mode:'saved',digits:2,round:'truncate'});
 assert.equal(P.capture(plan),true);
 P.activate(plan,'seedance-2.5');
 assert.equal(plan.discount,'10');assert.equal(plan.mode,'ideal');
 Object.assign(plan,{q:'1',mode:'manual',manualM:'1.65',digits:5,round:'nearest'});
 P.activate(plan,'seedance-2.0-fast');
 Object.assign(plan,{q:'0.8',targetMode:'discount',discount:'9',mode:'ideal',digits:8});
 P.activate(plan,'seedance-2.0');
 assert.deepEqual(Object.fromEntries(P.FIELDS.map(key=>[key,plan[key]])),{q:'0.6',targetMode:'margin',discount:'7.35',margin:'20',mode:'saved',digits:2,round:'truncate',manualM:'1.538',limitPrecision:true});
 P.activate(plan,'seedance-2.5');assert.equal(plan.mode,'manual');assert.equal(plan.manualM,'1.65');assert.equal(plan.digits,5);
 P.activate(plan,'seedance-2.0-fast');assert.equal(plan.q,'0.8');assert.equal(plan.discount,'9');assert.equal(plan.digits,8);
 assert.equal(plan.pay,'100');assert.equal(plan.total,'1538');
 assert.deepEqual(plan.procurementByModel,{'seedance-2.0':'0.6','seedance-2.5':'1','seedance-2.0-fast':'0.8'});
});

test('invalid drafts remain editable, never overwrite a valid profile, and reset safely on model switch',()=>{
 const plan=fresh(),canonical=clone(plan.modelPricing);
 plan.discount='';plan.q='';
 assert.equal(P.capture(plan),false);
 assert.equal(plan.discount,'');assert.equal(plan.q,'');
 assert.deepEqual(plan.modelPricing,canonical);
 assert.equal(P.valid(plan),true,'valid checks stored policies, not uncommitted controls');
 assert.equal(P.forModel(plan,'seedance-2.0').discount,'','the current draft remains visible to validation');
 assert.equal(P.forModel(plan,'seedance-2.5').discount,'10');
 P.activate(plan,'seedance-2.0');assert.equal(plan.discount,'','rendering the same model must not erase the draft');
 P.activate(plan,'seedance-2.5');assert.equal(plan.discount,'10');assert.equal(plan.q,'1');
 P.activate(plan,'seedance-2.0');assert.equal(plan.discount,'7.35');assert.equal(plan.q,'0.735');
 assert.deepEqual(plan.modelPricing,canonical);
});

test('a valid profile is captured even when common recharge inputs are incomplete',()=>{
 const plan=fresh();plan.pay='';plan.total='';plan.discount='8.2';
 assert.equal(P.capture(plan),true);assert.equal(plan.modelPricing['seedance-2.0'].discount,'8.2');
 P.activate(plan,'seedance-2.5');P.activate(plan,'seedance-2.0');
 assert.equal(plan.discount,'8.2');assert.equal(plan.pay,'');assert.equal(plan.total,'');
});

test('canonical import outranks stale global mirrors and stale procurement aliases',()=>{
 const profiles=P.defaults();profiles['seedance-2.5']={...profiles['seedance-2.5'],mode:'manual',manualM:'2.25',q:'0.95'};
 const plan={...legacy(),modelPricing:profiles,pricingModel:'seedance-2.0',q:'0.4',manualM:'99',discount:'2',procurementModel:'seedance-2.5',procurementByModel:{'seedance-2.5':'0.4'}};
 P.normalize(plan,'seedance-2.5');
 assert.equal(plan.q,'0.95');assert.equal(plan.manualM,'2.25');assert.equal(plan.discount,'10');
 assert.equal(plan.procurementByModel['seedance-2.0'],'0.735');assert.equal(plan.procurementByModel['seedance-2.5'],'0.95');
 plan.modelPricing['seedance-2.5'].manualM='3';assert.equal(profiles['seedance-2.5'].manualM,'2.25','normalization detaches imported profile objects');
});

test('forModel returns the chosen complete profile without changing the active model',()=>{
 const plan=fresh();plan.discount='8.8';plan.modelPricing['seedance-2.5'].manualM='2';plan.modelPricing['seedance-2.5'].mode='manual';
 const before=JSON.stringify(plan),active=P.forModel(plan,'seedance-2.0'),other=P.forModel(plan,'seedance-2.5');
 assert.equal(active.discount,'8.8');assert.equal(other.discount,'10');assert.equal(other.manualM,'2');
 assert.equal(other.pay,'100');assert.equal(other.pricingModel,'seedance-2.5');assert.equal(other.procurementModel,'seedance-2.5');
 assert.equal(JSON.stringify(plan),before);
});

test('canonical profile maps reject missing, extra, malformed and invalid entries atomically',()=>{
 const variants=[
  map=>{delete map['seedance-2.5'];},
  map=>{map.unknown={...map['seedance-2.0']};},
  map=>{map['seedance-2.5']=null;},
  map=>{delete map['seedance-2.5'].margin;},
  map=>{map['seedance-2.5'].unexpected=true;},
  map=>{map['seedance-2.5'].q='0';},
  map=>{map['seedance-2.5'].discount='';},
  map=>{map['seedance-2.5'].targetMode='unknown';},
  map=>{map['seedance-2.5'].mode='unknown';},
  map=>{map['seedance-2.5'].digits=2.5;},
  map=>{map['seedance-2.5'].round='floor';}
 ];
 for(const mutate of variants){
  const plan=fresh();mutate(plan.modelPricing);const before=JSON.stringify(plan);
  assert.equal(P.valid(plan),false);assert.throws(()=>P.normalize(plan,'seedance-2.0'),/模型定价规则无效/);assert.equal(JSON.stringify(plan),before);
 }
 for(const modelPricing of [null,[],{},'invalid'])assert.throws(()=>P.normalize({...legacy(),modelPricing},'seedance-2.0'));
 const plan=fresh(),before=JSON.stringify(plan);assert.throws(()=>P.activate(plan,'unknown'));assert.equal(JSON.stringify(plan),before);
 assert.throws(()=>P.normalize({...legacy(),procurementByModel:{unknown:'0.5'}},'seedance-2.0'));
});

test('numeric limits match active pricing inputs while unused manual targets remain optional',()=>{
 const profile=P.defaults()['seedance-2.0'];
 for(const patch of [{q:'0.1234567'},{q:'10.000001'},{discount:'100.0001'},{discount:'7.12345'},{targetMode:'margin',margin:'100'},{targetMode:'margin',margin:'-1'},{targetMode:'margin',margin:'1.12345'},{mode:'manual',manualM:'0'},{mode:'manual',manualM:'1.123456789012345678901'},{digits:21},{digits:-1}])assert.equal(P.validProfile({...profile,...patch}),false,JSON.stringify(patch));
 for(const patch of [{q:'10'},{discount:'100'},{targetMode:'margin',margin:'0'},{targetMode:'margin',margin:'99.9999'},{mode:'manual',manualM:'1.12345678901234567890',discount:'',margin:''},{manualM:''},{mode:'manual',discount:'not a target',margin:'not a target'}])assert.equal(P.validProfile({...profile,...patch}),true,JSON.stringify(patch));
});

test('module exposes the same browser API without CommonJS',()=>{
 const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(__dirname,'pricing-profiles.js'),'utf8'),context);
 const browser=context.window.ReelayProfiles;assert.equal(typeof browser.normalize,'function');
 const plan=browser.normalize({modelPricing:browser.defaults()},'seedance-2.5');assert.equal(plan.discount,'10');assert.equal(browser.valid(plan),true);
});

test('precision preference survives manual pricing and independent model switching',()=>{
 const plan=fresh();Object.assign(plan,{mode:'saved',digits:2,round:'truncate'});
 assert.equal(P.capture(plan),true);assert.equal(plan.limitPrecision,true);
 plan.mode='manual';plan.manualM='1.65';assert.equal(P.capture(plan),true);
 assert.equal(plan.modelPricing['seedance-2.0'].limitPrecision,true);
 P.activate(plan,'seedance-2.5');assert.equal(plan.limitPrecision,false);
 plan.mode='manual';plan.manualM='1.8';P.capture(plan);
 P.activate(plan,'seedance-2.0');assert.equal(plan.mode,'manual');assert.equal(plan.limitPrecision,true);
 plan.mode=plan.limitPrecision?'saved':'ideal';P.capture(plan);
 assert.equal(plan.mode,'saved');assert.equal(plan.digits,2);assert.equal(plan.round,'truncate');
 plan.mode='ideal';P.capture(plan);assert.equal(plan.limitPrecision,false);
 plan.mode='manual';P.capture(plan);assert.equal(plan.limitPrecision,false);
});

test('early per-model maps gain only the missing precision preference during normalization',()=>{
 const modelPricing=P.defaults();
 for(const model of P.MODELS)delete modelPricing[model].limitPrecision;
 modelPricing['seedance-2.0'].mode='saved';modelPricing['seedance-2.0'].digits=3;
 modelPricing['seedance-2.5'].mode='manual';
 const plan=P.normalize({...common(),modelPricing},'seedance-2.0');
 assert.equal(plan.limitPrecision,true);assert.equal(plan.modelPricing['seedance-2.5'].limitPrecision,false);assert.equal(plan.modelPricing['seedance-2.0-fast'].limitPrecision,false);
 assert.equal('limitPrecision' in modelPricing['seedance-2.0'],false,'normalization does not mutate incoming profile objects');
 const malformed=clone(modelPricing);malformed['seedance-2.5'].unexpected=true;
 assert.throws(()=>P.normalize({modelPricing:malformed},'seedance-2.0'),/模型定价规则无效/);
 assert.equal(P.validProfile({...plan.modelPricing['seedance-2.0'],limitPrecision:'true'}),false);
 const incomplete=clone(plan.modelPricing['seedance-2.0']);delete incomplete.limitPrecision;
 assert.equal(P.validProfile(incomplete),false,'direct validity requires normalized profiles');
});
