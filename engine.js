
/* Reelay V9 · Exact decimal/rational accounting engine.
 * Monetary inputs are decimal strings. No Number arithmetic is used for settlement.
 * Rates/dimensions verified against official Seedance 2.0 documentation on 2026-10-19.
 * Versioned minimum-usage formula and provenance are supplied by data.js.
 * Profit is the recharge-equivalent charge less model procurement cost only.
 */
(function(root){
'use strict';
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a||1n;}
function Q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('除数不能为零');if(d<0n){n=-n;d=-d;}let g=gcd(n,d);return {n:n/g,d:d/g};}
function dec(v){if(v&&typeof v.n==='bigint')return v;let s=String(v).trim();if(s.length>80||!/^[-+]?\d+(\.\d+)?$/.test(s))throw Error('请输入普通十进制数');let neg=s[0]==='-';s=s.replace(/^[-+]/,'');let[a,b='']=s.split('.');return Q(BigInt(a+b)*(neg?-1n:1n),10n**BigInt(b.length));}
const add=(a,b)=>{a=dec(a);b=dec(b);return Q(a.n*b.d+b.n*a.d,a.d*b.d)},sub=(a,b)=>{a=dec(a);b=dec(b);return Q(a.n*b.d-b.n*a.d,a.d*b.d)},mul=(a,b)=>{a=dec(a);b=dec(b);return Q(a.n*b.n,a.d*b.d)},div=(a,b)=>{a=dec(a);b=dec(b);return Q(a.n*b.d,a.d*b.n)},cmp=(a,b)=>{a=dec(a);b=dec(b);return a.n*b.d>b.n*a.d?1:a.n*b.d<b.n*a.d?-1:0},abs=a=>{a=dec(a);return Q(a.n<0n?-a.n:a.n,a.d)};
function ceil(a){a=dec(a);return Q(a.n>=0n?(a.n+a.d-1n)/a.d:a.n/a.d);}
function fixed(a,d=6,mode='nearest'){a=dec(a);if(!Number.isInteger(d)||d<0||d>30)throw Error('显示精度无效');let n=a.n<0n?-a.n:a.n,k=10n**BigInt(d),v=n*k/a.d;if(mode==='nearest'&&((n*k%a.d)*2n>=a.d))v++;let s=v.toString().padStart(d+1,'0');return(a.n<0n&&v?'−':'')+(d?s.slice(0,-d)+'.'+s.slice(-d):s);}
function decimalString(a,d=12,mode='nearest'){return fixed(a,d,mode).replace('−','-');}
const trim=(a,d=8)=>fixed(a,d).replace(/(\.\d*?[1-9])0+$|\.0+$/,'$1');
const DIMS={
'480p':{'16:9':[864,496],'9:16':[496,864],'1:1':[640,640],'4:3':[752,560],'3:4':[560,752],'21:9':[992,432]},
'720p':{'16:9':[1280,720],'9:16':[720,1280],'1:1':[960,960],'4:3':[1112,834],'3:4':[834,1112],'21:9':[1470,630]},
'1080p':{'16:9':[1920,1080],'9:16':[1080,1920],'1:1':[1440,1440],'4:3':[1664,1248],'3:4':[1248,1664],'21:9':[2206,946]},
'4k':{'16:9':[3840,2160],'9:16':[2160,3840],'1:1':[2880,2880],'4:3':[3326,2494],'3:4':[2494,3326],'21:9':[4398,1886]}};
const RATES={'480p':['46','28'],'720p':['46','28'],'1080p':['51','31'],'4k':['26','16']};
function plan({pay,total,discount='7.35',q='0.735',k='10',appliedM='',targetMode='discount',margin='0',targetAvailable=true}){
 const A=dec(pay),T=dec(total),proc=dec(q),K=dec(k);
 if(cmp(A,0)<=0||cmp(T,0)<=0||cmp(proc,0)<=0||cmp(K,'10')!==0)throw Error('充值或采购规则无效；业务换算常数须为10');
 if(!['discount','margin'].includes(targetMode))throw Error('定价目标模式无效');
 if(typeof targetAvailable!=='boolean')throw Error('定价目标状态无效');
 const hasAppliedM=appliedM!==''&&appliedM!=null;
 if(!targetAvailable&&!hasAppliedM)throw Error('缺少定价目标时须指定有效倍率');
 let d=null,targetMarginRate=null;
 if(targetAvailable&&targetMode==='margin'){
  targetMarginRate=div(margin,'100');
  if(cmp(targetMarginRate,0)<0||cmp(targetMarginRate,1)>=0)throw Error('目标模型毛利率须大于等于0且小于100%');
  d=div(proc,sub('1',targetMarginRate));
 }else if(targetAvailable){
  d=div(discount,'10');
  if(cmp(d,0)<=0||cmp(d,'10')>0)throw Error('客户折扣须大于0且不超过100折');
  targetMarginRate=div(sub(d,proc),d);
 }
 const S=div(T,A),U=div(A,T),M=targetAvailable?div(mul(d,S),mul(proc,K)):null,usedM=hasAppliedM?dec(appliedM):M;
 if(cmp(usedM,0)<=0)throw Error('倍率须大于零');
 return {A,T,d,q:proc,K,S,U,M,usedM,targetMode,targetAvailable,targetMarginRate,targetMarginPct:targetAvailable?mul(targetMarginRate,'100'):null,breakEvenM:div(S,K),roundingUpBound:U};
}
// A margin target follows the supplied procurement cost, including recorded C.
// A discount target follows list price P; neither path invents a missing cost.
function targetCash(P,C,p){if(p.targetAvailable===false)return null;return p.targetMode==='margin'?(C===null?null:div(C,sub('1',p.targetMarginRate))):(P===null?null:mul(P,p.d));}
function settle(P,C,p){P=dec(P);C=dec(C);if(cmp(P,0)<=0||cmp(C,0)<0)throw Error('刊例须大于零，采购不能为负');
 // Per request: 0 <= roundGap < roundingUpBound (the value of one point).
 const target=targetCash(P,C,p),idealPoints=target===null?null:mul(target,p.S),raw=mul(mul(C,p.usedM),p.K),N=ceil(raw),cash=mul(N,p.U),rawCash=mul(raw,p.U),gap=target===null?null:sub(cash,target),costGap=target===null?null:sub(mul(mul(mul(C,p.M),p.K),p.U),target),precisionGap=target===null?null:mul(mul(mul(C,sub(p.usedM,p.M)),p.K),p.U),roundGap=sub(cash,rawCash),profit=sub(cash,C),targetProfit=target===null?null:sub(target,C),margin=cmp(cash,0)?mul(div(profit,cash),100):null;
 return {P,C,target,idealPoints,raw,N,cash,rawCash,gap,costGap,precisionGap,roundGap,profit,targetProfit,margin,cashProfit:profit,salesMarginPct:margin,costMarkupPct:cmp(C,0)?mul(div(profit,C),'100'):null,targetCashProfit:targetProfit,unroundedCashProfit:sub(rawCash,C),breakEvenM:p.breakEvenM||div(p.S,p.K),roundingUpBound:p.U,effective:mul(div(cash,P),10),actualQ:div(C,P),oldRaw:mul(mul(C,'1.65'),p.K),oldN:ceil(mul(mul(C,'1.65'),p.K)),p};
}
function normalizeSeconds(value){
 const sec=dec(value);
 if(cmp(sec,4)<0||cmp(sec,15)>0||sec.d!==1n)throw Error('输出时长须为4～15秒整数');
 return sec.n.toString();
}
function normalizeVideo(value){
 if(value===true||typeof value==='string'&&value.trim().toLowerCase()==='true')return true;
 if(value===false||value==null||typeof value==='string'&&value.trim().toLowerCase()==='false')return false;
 throw Error('视频输入标识须为true或false');
}
function estimate(t,minimum=''){
 const seconds=String(t.seconds).trim()==='auto'?'auto':normalizeSeconds(t.seconds),video=normalizeVideo(t.video);
 if(t.ratio==='auto'||seconds==='auto')return {status:'unresolved',P:null,base:null,reason:'自动规格尚未确定'};
 const wh=DIMS[t.res]?.[t.ratio];if(!wh)throw Error('不支持的比例或分辨率');
 const sec=dec(seconds),vin=dec(video?t.vin:'0');
 if(video&&(cmp(vin,2)<0||cmp(vin,15)>0))throw Error('参考视频总时长须为2～15秒');
 const tokens=div(mul(mul(add(sec,vin),String(wh[0]*wh[1])),'24'),'1024'),rate=dec(RATES[t.res][video?1:0]),base=div(mul(tokens,rate),'1000000');
 const hasMinimum=video&&minimum!==''&&minimum!==null&&minimum!==undefined;
 if(video&&!hasMinimum)return {status:'base-theory',P:base,base,tokens,rate,wh,billedTokens:tokens,partial:true,normalizedSeconds:seconds,minimum:null};
 const floor=hasMinimum?dec(minimum):dec('0');if(cmp(floor,0)<0)throw Error('最低用量不能为负');
 const billedTokens=cmp(tokens,floor)<0?floor:tokens,P=div(mul(billedTokens,rate),'1000000');
 return {status:hasMinimum?'manual-minimum':'rule-estimate',partial:false,P,base,tokens,rate,wh,billedTokens,minimum:hasMinimum?floor:null,normalizedSeconds:seconds};
}
function fromUsage(t,usage){let tok=dec(usage);if(cmp(tok,0)<=0||tok.d!==1n)throw Error('计费用量须为正整数');if(!RATES[t.res])throw Error('不支持的分辨率');return div(mul(tok,RATES[t.res][normalizeVideo(t.video)?1:0]),'1000000');}
function sumTasks(rows,p){let count=0,N=dec(0),cash=dec(0),C=dec(0),target=p.targetAvailable===false?null:dec(0);for(let r of rows){let n=dec(r.qty??1);if(n.d!==1n||cmp(n,1)<0)throw Error('数量须为正整数');let x=settle(r.P,r.C,p);count+=Number(r.qty??1);N=add(N,mul(x.N,n));cash=add(cash,mul(x.cash,n));C=add(C,mul(x.C,n));target=target===null||x.target===null?null:add(target,mul(x.target,n));}const cashProfit=sub(cash,C);return{count,N,cash,C,target,gap:target===null?null:sub(cash,target),cashProfit,salesMarginPct:cmp(cash,0)?mul(div(cashProfit,cash),'100'):null,costMarkupPct:cmp(C,0)?mul(div(cashProfit,C),'100'):null};}

function recalcRecord(record,p){
 const P=record.P!==''&&record.P!=null?dec(record.P):null;
 const C=record.C!==''&&record.C!=null?dec(record.C):null;
 if(P&&cmp(P,0)<=0)throw Error('实测刊例金额须大于零');
 if(C&&cmp(C,0)<0)throw Error('实测采购金额不能为负');
 const raw=C===null?null:mul(mul(C,p.usedM),p.K),N=raw===null?null:ceil(raw),cash=N===null?null:mul(N,p.U);
 const target=targetCash(P,C,p);
 const x=P!==null&&C!==null?settle(P,C,p):null;
 const cashProfit=C===null?null:sub(cash,C);
 return {P,C,raw,N,cash,target,x,cashProfit,salesMarginPct:cash!==null&&cmp(cash,0)?mul(div(cashProfit,cash),'100'):null,costMarkupPct:C!==null&&cmp(C,0)?mul(div(cashProfit,C),'100'):null,recordedN:record.N??'',scope:'recorded-cost-recalculation'};
}
root.ReelayMath={Q,dec,add,sub,mul,div,cmp,abs,ceil,fixed,decimalString,trim,DIMS,RATES,plan,settle,estimate,fromUsage,sumTasks,recalcRecord,normalizeSeconds,normalizeVideo};
if(typeof module!=='undefined')module.exports=root.ReelayMath;
})(typeof window!=='undefined'?window:globalThis);

