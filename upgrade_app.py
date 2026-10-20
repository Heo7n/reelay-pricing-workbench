from pathlib import Path
import re
root=Path(__file__).parent
original=Path(r'D:\Win\download\reelay_pricing_workbench_v8_1.html').read_text(encoding='utf-8')
app=re.findall(r'<script>([\s\S]*?)</script>',original)[1]
template=re.sub(r'<script>[\s\S]*?</script>','<!--SCRIPT-->',original).replace('<!--SCRIPT-->','<!--ENGINE-->',1).replace('<!--SCRIPT-->','<!--APP-->',1)
def line(name,new):
    global app
    pattern=r'^function '+re.escape(name)+r'\([^\n]*$'
    app,n=re.subn(pattern,lambda m:new,app,count=1,flags=re.M)
    assert n==1,name
def span(start,end,new):
    global app
    a=app.index(start);b=app.index(end,a)
    app=app[:a]+new+'\n'+app[b:]
def rep(old,new):
    global app
    assert old in app,old[:100]
    app=app.replace(old,new)

rep('const E=window.ReelayMath,','const E=window.ReelayMath,R=window.ReelayRules,')
rep("const KEY='reelay_pricing_v81_dual_breakdown'","const KEY='reelay_pricing_v9_official' ")
line('defaults',"""function defaults(){return{schema:'reelay.pricing.v9',plan:{company:'企业 A · 定价方案',pay:'100',total:'1538',discount:'7.35',q:'0.735',targetMode:'discount',margin:'8.125',giftMode:false,mode:'ideal',digits:12,round:'nearest',manualM:'1.538',basis:'本次充值含全部赠分；历史余额的现金价值须另行确认'},task:task('480p','1:1','4',true,'2'),rules:{version:R.VERSION,minima:R.buildMinima(),legacyMinima:{}},workspace:'theory',tab:'discounts',tasks:[],observations:clone(OBS),references:clone(REFS),recharges:[{pay:'100',total:'1500'},{pay:'100',total:'1538'},{pay:'100',total:'1600'}],rechargeMode:'reprice',frozenM:null,matrixAxis:'specs',matrixMetric:'N'};}""")
line('validTask',"""function validTask(t,allowAuto=true){try{return !!(t&&RES.includes(t.res)&&[...RATIOS,...(allowAuto?['auto']:[])].includes(t.ratio)&&(allowAuto&&t.seconds==='auto'||E.normalizeSeconds(t.seconds))&&typeof t.video==='boolean'&&(!t.video||positive(t.vin,false,4)&&+t.vin>=2&&+t.vin<=15));}catch(_){return false;}}""")
line('validPlan',"""function validPlan(p){return !!(p&&txt(p.company,60)&&positive(p.pay,false,2)&&positive(p.total,false,4)&&positive(p.discount,false,4)&&+p.discount<=100&&positive(p.q,false,6)&&+p.q<=10&&['discount','margin'].includes(p.targetMode)&&positive(p.margin,true,4)&&+p.margin<100&&typeof p.giftMode==='boolean'&&['ideal','saved','manual'].includes(p.mode)&&Number.isInteger(p.digits)&&p.digits>=0&&p.digits<=20&&['nearest','truncate'].includes(p.round)&&positive(p.manualM,false,20)&&txt(p.basis,500));}""")
line('validObservation',"""function validObservation(o){return !!(o&&txt(o.id,100)&&txt(o.title,100)&&validTask(o.params,false)&&txt(o.note,1000)&&txt(o.date,100)&&(o.P===''||positive(o.P))&&(o.C===''||positive(o.C,true))&&(o.P!==''||o.C!=='')&&(o.N===''||/^\\d+$/.test(o.N)&&+o.N<1e12)&&(!o.usage||/^\\d+$/.test(o.usage)&&+o.usage>0&&+o.usage<1e12));}""")
line('key',"""function key(t){return[t.res,t.ratio,t.seconds==='auto'?'auto':E.normalizeSeconds(t.seconds),t.video?'video':'none',t.video?num(dec(t.vin),4):'0'].join('|');}""")
span('function minimumKey(', 'function validState(',"""function minimumKey(t,version=state.rules.version){return R.key(t,version);}
function normalizeTask(t){const n=clone(t);if(n.seconds!=='auto')n.seconds=E.normalizeSeconds(n.seconds);n.vin=n.video?num(dec(n.vin),4):'2';return n;}
function normalizeMinimumKeys(input){
 const n=clone(input),out={};
 for(const [oldKey,r] of Object.entries(n.rules.minima||{})){
  const a=oldKey.split('|');let k;
  if(a.length===5&&a[0]==='seedance-2.0'&&a[1]===n.rules.version&&RES.includes(a[2])&&RATIOS.includes(a[3]))k=minimumKey({res:a[2],ratio:a[3],seconds:a[4]},n.rules.version);
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
 n.plan={...defaults().plan,...n.plan};n.task=normalizeTask(n.task);n.tasks=n.tasks.map(r=>({...r,params:normalizeTask(r.params)}));n.observations=n.observations.map(o=>({...o,params:normalizeTask(o.params),usage:o.usage||''}));
 if(old){n.rules={version:R.VERSION,minima:R.buildMinima(),legacyMinima:clone(n.rules.minima||{})};n.schema='reelay.pricing.v9';}
 else{
  if(n.rules.version!==R.VERSION)throw Error('规则版本与本文件不符，请先核对来源');
  n=normalizeMinimumKeys(n);const official=R.buildMinima();
  for(const [k,v] of Object.entries(n.rules.minima)){
   if(!official[k]||!positive(v.tokens,false,12)||!txt(v.note,500)||!v.note.trim())throw Error('门槛数据或来源无效');
   official[k]=v.kind==='official'&&cmp(v.tokens,official[k].tokens)===0?official[k]:{tokens:v.tokens,note:v.note,kind:'manual'};
  }
  n.rules.minima=official;
 }
 if(!validState(n))throw Error('方案参数无效');return n;
}""")
rep("s.schema==='reelay.pricing.v8'","s.schema==='reelay.pricing.v9'")
rep("s.rules.version==='parameter-snapshot-v1'","s.rules.version===R.VERSION")
span("try{const raw=localStorage.getItem(KEY)", 'function idealPricing(',"""let migrationNotice='';
try{const raw=localStorage.getItem(KEY)||localStorage.getItem('reelay_pricing_v81_dual_breakdown')||localStorage.getItem('reelay_pricing_v8_theory_isolated');if(raw){const saved=JSON.parse(raw);state=upgradeState(saved);if(saved.schema!=='reelay.pricing.v9')migrationNotice='已升级至官方规则；旧人工门槛保留在导入档案，未覆盖官方估算。';}}catch(err){migrationNotice='旧草稿未导入：'+err.message+'。原草稿仍保留。';}
""")
line('idealPricing',"""function idealPricing(p=state.plan){return E.plan({pay:p.pay,total:p.total,discount:p.discount,q:p.q,k:'10',targetMode:p.targetMode,margin:p.margin});}""")
line('pricing',"""function pricing(over={}){const p={...state.plan,...over},ideal=idealPricing(p);let applied='';if(p.mode==='saved')applied=decimalString(ideal.M,p.digits,p.round);if(p.mode==='manual')applied=p.manualM;return E.plan({pay:p.pay,total:p.total,discount:p.discount,q:p.q,k:'10',targetMode:p.targetMode,margin:p.margin,appliedM:applied});}""")
line('coverage',"""function coverage(v){return v.partial?'规则缺项 · 仅基础演算':v.rule?.kind==='manual'?'人工门槛 · 待核验':'官方规则估算';}""")
line('renderPlan',"""function renderPlan(){const p=pricing(),gift=sub(p.T,mul(p.A,10));setInput('company',state.plan.company);setInput('pay',state.plan.pay);setInput('total',state.plan.giftMode?num(gift,4):state.plan.total);setInput('discount',state.plan.discount);setInput('target-margin',state.plan.margin);setInput('purchase-discount',num(mul(p.q,10),6));setInput('target-mode',state.plan.targetMode);$('discount-control').hidden=p.targetMode==='margin';$('margin-control').hidden=p.targetMode!=='margin';$('total-label').textContent=state.plan.giftMode?'附赠积分':'到账总积分';$('gift-toggle').textContent=state.plan.giftMode?'按总积分填写':'按附赠填写';$('per-yuan').textContent=num(p.S,8);$('per-point').textContent=fixed(p.U,8);$('multiplier').innerHTML=num(p.usedM,12)+'<small>倍</small>';$('m-state').textContent=state.plan.mode==='ideal'?'自动反算':state.plan.mode==='saved'?'保存精度模拟':'指定倍率';$('unit-target').textContent='/ 刊例 ¥1 → ¥'+num(p.d,4);$('discount-picks').innerHTML=(p.targetMode==='margin'?['0','5','8.125','10','20'].map(g=>`<button data-margin="${g}" class="${cmp(g,state.plan.margin)===0?'active':''}">${g}%</button>`):['7.35','7.8','8','8.5','9'].map(d=>`<button data-discount="${d}" class="${cmp(d,state.plan.discount)===0?'active':''}">${d}折</button>`)).join('');$('rule-status').textContent='官方规则已核验 · 2026-10-19 · 288种输出规格';$('plan-principle').innerHTML=`保本倍率 <b>${num(p.breakEvenM,8)}</b> · 取整前${p.targetMode==='margin'?'等效刊例 '+num(mul(p.d,10),6)+'折':'模型毛利率 '+num(mul(div(sub(p.d,p.q),p.d),100),4)+'%'} · 倍率已包含充值赠分${cmp(p.d,1)>0?' · 目标高于刊例':''}`;$('migration-note').hidden=!migrationNotice;$('migration-note').textContent=migrationNotice;}""")
rep("v.rule?'本规格应用了你录入的最低用量规则。规则来源尚需业务核实；并非根据实测金额反推。':''", "v.rule?(v.rule.kind==='manual'?'本规格使用人工门槛覆盖；来源见规则面板。':'已应用官方最低用量公式；结果为费用估算，最终以 API usage 和账单为准。'):''")
rep('理论刊例 × ${esc(state.plan.discount)}折','${targetLabel(p)}')
rep('<div class="result-note">本页每个结果均为公式计算。平台实测费用与实扣积分只在“实测对照”中出现，不参与本页计算。</div>', '<div class="economics-grid"><div><span>模型采购毛利</span><b class="${cmp(x.profit,0)<0?\'loss\':\'\'}">${cash(x.profit)}</b></div><div><span>销售毛利率</span><b>${x.margin===null?\'—\':num(x.margin,4)+\'%\'}</b></div><div><span>成本加成率</span><b>${cmp(x.C,0)>0?num(mul(div(x.profit,x.C),100),4)+\'%\':\'—\'}</b></div></div><div class="result-note">${cmp(x.profit,0)<0?\'<b class="loss">当前方案亏损。</b> \':cmp(x.rawCash,x.C)===0?\'取整前保本；零星取整收益不等于稳定利润空间。 \':\'\'}毛利仅扣模型采购成本，未扣税费、支付费、存储、失败重试等费用。<button class="link" id="economics-how">查看定价原理 ↗</button></div>')
rep("idealPricing({...state.plan,discount:d})","idealPricing({...state.plan,discount:d,targetMode:'discount'})")
rep("return{scope:'理论计算',scenario:title", "return{scope:'理论计算',targetMode:x.p.targetMode,targetMargin:x.p.targetMode==='margin'?decimal(x.p.targetMarginPct):'',procurementRatio:decimal(x.p.q),profit:decimal(x.profit),margin:x.margin===null?'':decimal(x.margin),scenario:title")
rep("state.plan.discount)===0?'selected'", "state.plan.discount)===0&&state.plan.targetMode==='discount'?'selected'")
rep("理论清单与实测记录是两份独立数据。", "理论清单与实测记录是两份独立数据；清单按每次取整再乘数量。")
rep("· 折合金额 <strong>${cash(sumCash)}</strong>", "· 折合金额 <strong>${cash(sumCash)}</strong> · 采购 <strong>${cash(sumC)}</strong> · 模型毛利 <strong>${cash(sub(sumCash,sumC))}</strong>")

# All math explanations use the configured purchase ratio, never a hidden fixed discount.
rep('P × 0.735','P × ${num(p.q,6)}')
rep('× 0.735<br>', '× ${num(p.q,6)}<br>')
rep('(0.735 × 10)', '(${num(p.q,6)} × 10)')
rep('采购原值与 P × ${num(p.q,6)} 的偏差影响', '采购原值与约定采购比例的偏差影响')
rep('像素映射与费率沿用上版快照，尚非对全部供应商规格的重新认证。', '像素与费率已核对官方文档（2026-10-19）；金额是参数估算，API 返回的实际用量可能有差异。')
rep("`目标 = P × ${num(p.d,8)}", "`目标 = P × ${num(p.d,8)}") if False else None
rep('目标 = P × ${num(p.d,8)} = ¥${num(x.target,18)}', '目标（${targetLabel(p)}）= ¥${num(x.target,18)}')
rep('来源：${esc(rule.note)}', '来源：${esc(rule.note)}<br>门槛保留公式精度，不将表格显示整数作为中间输入。')
rep('当前目标：平台刊例 P × 目标现金折扣', '${targetLabel(p)}')
# Fix the string-label interpolation introduced above in an ordinary single-quoted argument.
rep("detailFact('${targetLabel(p)}',", "detailFact(targetLabel(p),")
rep("目标现金 ${esc(state.plan.discount)} 折", "${esc(targetSummary(p))}")
rep("目标现金 ${state.plan.discount}折", "${targetSummary(p)}")
line('detailBusinessMath',"""function detailBusinessMath(p){return `<details class="record-notes"><summary>充值口径、现金目标与倍率如何得到</summary><div class="formula">S = ${esc(state.plan.total)} ÷ ${esc(state.plan.pay)} = ${num(p.S,14)} 积分/元<br>U = 1 ÷ S ≈ ${num(p.U,18)} 元/积分<br>${p.targetMode==='margin'?`目标现金 R = C ÷ (1 − ${num(div(state.plan.margin,100),8)})<br>M = S ÷ [10 × (1 − ${num(div(state.plan.margin,100),8)})]`:`目标现金 R = P × ${num(p.d,8)}<br>M = ${num(p.d,8)} × S ÷ (${num(p.q,6)} × 10)`}<br>理想 M ≈ ${num(p.M,18)}；本次使用 M ≈ ${num(p.usedM,18)}<br>保本 M = S ÷ 10 = ${num(p.breakEvenM,12)}</div><p class="footnote">${esc(state.plan.basis)}。先用采购成本乘倍率得到积分，再按充值的实际现金价值换算收入。倍率不等于利润率；不再重复乘客户折扣。</p></details>`;}""")

span('function openRules(', 'function openPlan(', """function openRules(ruleTask=state.task){
 ruleContext=clone(ruleTask);const t=ruleContext,p=pricing(),k=minimumKey(t),m=t.video&&k?state.rules.minima[k]:null,official=t.video?R.officialMinimum(t):null;
 const fixed=t.video&&t.ratio!=='auto'&&t.seconds!=='auto';
 openDrawer('rules','规则、来源与适用范围','Seedance 2.0 标准版 · 核验日期 2026-10-19',`<div class="statusbar">已内置4档分辨率 × 6种比例 × 12档时长，共288种输出规格。<br>采用官方表格公式的完整精度；仍属于估算，最终结算看 API usage 与平台账单。</div><h3>有视频输入：最低用量如何产生</h3><div class="formula">输出秒数 = s；输入视频总秒数 = v<br>最低参考秒数 = ceil(2 × s ÷ 3)<br>L = (s + ceil(2 × s ÷ 3)) × 宽 × 高 × 24 ÷ 1024<br>T = max((s + v) × 宽 × 高 × 24 ÷ 1024, L)<br>P = T × 刊例费率 ÷ 1,000,000<br>C = P × ${num(p.q,6)}</div><p class="footnote">最低参考秒数是计费用量规则，不是实际输入时长。无视频输入不应用这道门槛。不要对 API 已返回的 completion_tokens 再补一次门槛。</p><h3>本规格</h3><p>${esc(label(t))} / ${esc(vinLabel(t))}</p>${fixed?`<div class="fact"><span>官方最低用量 L（精确公式）</span><b>${esc(official.tokens)} Token</b></div><div class="fact"><span>当前采用</span><b>${esc(m?.tokens||'缺失')} Token · ${m?.kind==='manual'?'人工覆盖':'官方规则'}</b></div><details class="record-notes"><summary>为本规格设置人工门槛覆盖</summary><p>仅用于有明确依据的特殊采购规则。人工覆盖会在结果中单独标记。</p><label class="fieldlabel" for="rule-min">最低 Token</label><input class="input num" id="rule-min" inputmode="decimal" value="${esc(m?.tokens||'')}"><label class="fieldlabel" for="rule-note">规则来源与适用范围</label><textarea class="input" id="rule-note" maxlength="500">${esc(m?.kind==='manual'?m.note:'')}</textarea><div id="rule-error" class="inline-error"></div><div class="rule-tools"><button class="btn primary" id="save-rule">保存人工覆盖</button><button class="btn" id="remove-rule">恢复官方规则</button></div></details>`:'<div class="notice neutral">无视频输入不需要最低用量；自动规格会逐个组合计算。固定规格后可查看对应门槛。</div>'}<h3>当前刊例费率 · 元/百万 Token</h3>${table(['输出规格','无视频输入','有视频输入'],RES.map(r=>'<tr>'+td(r)+td(E.RATES[r][0])+td(E.RATES[r][1])+'</tr>'))}<details class="record-notes"><summary>像素映射</summary>${table(['规格',...RATIOS],RES.map(r=>'<tr>'+td(r)+RATIOS.map(k=>td(E.DIMS[r][k].join(' × '))).join('')+'</tr>'))}</details><h3>来源与版本</h3><p><a href="https://console.volcengine.com/ark/region:cn-beijing/docs/model-pricing" target="_blank" rel="noopener">官方模型价格 ↗</a><br><a href="https://console.volcengine.com/ark/region:cn-beijing/docs/create-video-generation-task-api" target="_blank" rel="noopener">官方像素、帧率与参数 ↗</a><br><a href="https://bytedance.larkoffice.com/wiki/FXaYwxzJ5i5Zdik32ipcWzt7nxd?table=tblmNCuMjADrXtDf&amp;view=vew2CR2JYM" target="_blank" rel="noopener">官方 Seedance 2.0 最低用量表 ↗</a></p><p class="footnote">版本 ${esc(R.VERSION)}。仅标准版2.0，不套用2.5、fast或mini费率。已结束的促销不自动延用。规则是固定日期快照，不会联网自动更新。</p>${Object.keys(state.rules.legacyMinima||{}).length?`<details class="record-notes"><summary>旧方案人工门槛档案（未覆盖官方规则）</summary><pre class="formula">${esc(JSON.stringify(state.rules.legacyMinima,null,2))}</pre></details>`:''}<button class="btn" id="export-rules">导出规则与来源 JSON ↓</button>`,true);
}""")
rep('使用倍率，不再同时展示成本加价率百分数。','倍率把采购成本转换为积分；实际利润还取决于充值现金价值。')
rep('仅改变理论核价的使用倍率，不修改历史实测记录。','改变理论与实测复算所用的当前倍率，不修改历史原记录。')
line('summary',"""function summary(){const p=pricing(),v=current(),x=v.x;return ['Reelay V9 · 官方规则与利润定价','',state.plan.company,`规则：${R.VERSION}；核验日期2026-10-19；仅Seedance2.0标准版。`,`采购比例 ${num(p.q,6)}；积分换算常数10。`,`充值口径：${state.plan.basis}`,`实付 ${state.plan.pay} 元 / 到账 ${state.plan.total} 积分 / ${targetSummary(p)}`,`成本定价倍率 M = ${decimal(p.usedM)}`,`保本倍率 = ${decimal(p.breakEvenM)}`,`任务：${label(state.task)} / ${vinLabel(state.task)}`,`理论计算口径：${coverage(v)}`,...(x?[`理论刊例 P = ${decimal(x.P)}`,`理论采购 C = ${decimal(x.C)}`,`理论积分 = ${decimal(x.raw)}`,`核算扣分 = ${num(x.N,0)}`,`现金金额 = ${decimal(x.cash)}`,`模型毛利 = ${decimal(x.profit)}`,`销售毛利率 = ${x.margin===null?'未定义':decimal(x.margin)+'%'}`]:['输出规格未固定，当前仅给出理论区间。']),'','费用为官方规则估算，API实际usage或账单可能有差异。毛利仅扣模型采购成本，不是净利润。','平台实测和历史扣分分别保存；不会用于替换理论公式。',`理论清单 ${state.tasks.length}种规格；实测记录 ${state.observations.length}条。`].join('\\n');}""")
line('exportJSON',"""function exportJSON(){download(filename()+'_V9方案.json',JSON.stringify({format:'reelay.pricing.v9',appVersion:'9.0',exportedAt:new Date().toISOString(),ruleVersion:R.VERSION,scope:'theory and observations stored separately',state},null,2),'application/json');}""")
rep("scope:'数据域',scenario:'场景'", "scope:'数据域',targetMode:'定价目标模式',targetMargin:'目标销售毛利率百分数_毛利模式',procurementRatio:'采购比例',profit:'每笔模型毛利',margin:'取整后测算销售毛利率百分数',scenario:'场景'")
# Existing V7 migration is retained; all imported versions are upgraded before becoming active.
rep("if(payload?.format==='reelay.pricing.v8'){if(!validState(payload.state))throw Error('V8方案字段不完整或数据无效。');return{value:normalizeMinimumKeys(payload.state),note:'已导入方案；门槛按输出规格匹配，理论与实测仍独立。'};}","if(['reelay.pricing.v9','reelay.pricing.v8'].includes(payload?.format)){return{value:upgradeState(payload.state),note:payload.format==='reelay.pricing.v8'?'已导入并升级官方规则；旧人工门槛留在规则档案。':'已导入V9方案；理论与实测独立。'};}")
rep("n.plan={...n.plan,...old.plan,frozen:undefined}","n.plan={...n.plan,...old.plan,q:old.plan?.q||'0.735',targetMode:'discount',margin:'8.125',frozen:undefined}")
rep("return{value:n,note:'旧版已迁移", "return{value:upgradeState(n),note:'旧版已迁移")
rep("仅支持本工具V8或V7导出的方案JSON。", "仅支持本工具V9、V8或V7导出的方案JSON。")
rep("if(d.discount){state.plan.discount=d.discount;render();return;}", "if(d.discount){state.plan.discount=d.discount;state.plan.targetMode='discount';render();return;}if(d.margin){state.plan.margin=d.margin;state.plan.targetMode='margin';render();return;}")
rep("switch(id){", "switch(id){\ncase'economics-how':openEconomics();break;\ncase'example-floor':changeTask(task('480p','1:1','4',true,'2'));break;\ncase'example-long':changeTask(task());break;\ncase'export-rules':download('Reelay_V9_规则来源.json',JSON.stringify({version:R.VERSION,sources:R.sources,rules:state.rules},null,2),'application/json');break;")
rep("{tokens,note};closeDrawer();render();toast('本输出规格门槛已保存。", "{tokens,note,kind:'manual'};closeDrawer();render();toast('本输出规格人工门槛已保存。")
rep("case'remove-rule':delete state.rules.minima[minimumKey(ruleContext||state.task)];closeDrawer();render();toast('已恢复基础理论口径，不使用实测费用。');break;", "case'remove-rule':state.rules.minima[minimumKey(ruleContext||state.task)]=clone(R.officialMinimum(ruleContext||state.task));closeDrawer();render();toast('已恢复官方规则；实测记录不变。');break;")
rep("if(['company','pay','total','discount'].includes(id))", "if(['company','pay','total','discount','target-margin','purchase-discount'].includes(id))")
rep("if(id==='company')state.plan.company=el.value;", "if(id==='company')state.plan.company=el.value;else if(id==='target-margin')state.plan.margin=el.value;else if(id==='purchase-discount'){state.plan.q=positive(el.value,false,4)?num(div(el.value,10),6):'';}")
rep("if(id==='details-record'){", "if(id==='target-mode'){state.plan.targetMode=el.value;render();return;}if(id==='seconds'&&validTask(state.task)){state.task=normalizeTask(state.task);render();return;}if(id==='details-record'){")
rep("function changeTask(patch){state.task={...state.task,...patch};render();}", "function changeTask(patch){state.task={...state.task,...patch};if(validTask(state.task))state.task=normalizeTask(state.task);render();}")
rep("seconds:$('o-seconds').value.trim()", "seconds:$('o-seconds').value.trim()") # normalized after validation below
rep("const i=state.observations.findIndex(x=>x.id===id);", "o.params=normalizeTask(o.params);const i=state.observations.findIndex(x=>x.id===id);")
rep("state.tasks.push({id:uid(),params:clone(state.task)","state.tasks.push({id:uid(),params:normalizeTask(state.task)")
rep("$('table').innerHTML='<div class=\"empty\">输入待修正。</div>';$('add-task').disabled=true;", "$('table').innerHTML='<div class=\"empty\">输入待修正。</div>';$('actual-table').innerHTML='<div class=\"empty\">请先修正定价参数，避免沿用上一组复算。</div>';$('plan-principle').textContent='定价输入待修正';$('multiplier').textContent='—';$('table-end').textContent='';$('coverage-note').hidden=true;$('add-task').disabled=true;$('details').disabled=true;")
rep("switch(id){", "if(!globalValid&&['details','actual-calculation','show-formula','plan-settings','copy-m','task-rule','open-rules','unit-check','economics-how','add-observation','export','table-export','actual-export','add-task'].includes(id)){toast('请先修正顶部定价或任务输入。');return;}\nswitch(id){")
rep("setState:s=>{if(!validState(s))throw Error('状态无效');state=clone(s);render();}","setState:s=>{state=upgradeState(s);render();}")
rep("defaults,validState,reset:","defaults,validState,upgradeState,normalizeTask,reset:")

# Add an optional API usage field; it never invents a recorded purchase amount.
rep('<label class="fieldlabel" for="o-n">平台实际扣分', '<label class="fieldlabel" for="o-n">平台实际扣分')
rep('<label class="fieldlabel" for="o-note">数据来源', '<label class="fieldlabel" for="o-usage">API completion_tokens（可选，整数；已含最低用量）</label><input class="input num" id="o-usage" value="${esc(o.usage||\'\')}" inputmode="numeric"><label class="fieldlabel" for="o-note">数据来源')
rep("N:$('o-n').value.trim(),date:", "N:$('o-n').value.trim(),usage:$('o-usage').value.trim(),date:")
rep("const html=`<div class=\"notice neutral\"><b>本页以平台金额为输入", "const usage=o.usage?detailStep('API','实际用量的独立核对',`<div class=\"formula\">API completion_tokens = ${esc(o.usage)}<br>按当前官方刊例费率折算 = ${cash(E.fromUsage(o.params,o.usage),12)}</div><p class=\"footnote\">这只是API用量按本文件费率的折算，不回填平台P/C。completion_tokens已含最低量；不与total_tokens相加，不再次应用门槛。</p>`):'';\n const html=`<div class=\"notice neutral\"><b>本页以平台金额为输入")
rep('+original+integral+historical+', '+original+integral+usage+historical+')
rep('`来源备注：${o.note}`', '`来源备注：${o.note}`,`API completion_tokens = ${o.usage||\'未录入\'}`')
rep("recordedN:o.N,note:o.note", "recordedN:o.N,usage:o.usage||'',note:o.note")
rep("recordedN:'平台实际扣分_空白为未知',note:", "recordedN:'平台实际扣分_空白为未知',usage:'API_completion_tokens_原记录',note:")

span('function actualBreakdown(', 'function openDetails(', """function actualBreakdown(o,p){
 if(!o)return{html:'<div class="notice neutral"><b>这个规格没有平台实测记录。</b><br>不会使用其他规格的金额，也不会把理论计算写成实测记录。</div>',text:'无匹配实测记录。'};
 const a=E.recalcRecord(o,p),x=a.x;
 const original=detailStep('01','平台金额原值',`<div class="detail-readonly"><div><small>平台刊例金额 P</small><b>${o.P!==''?'¥'+esc(o.P):'未录入'}</b></div><div><small>平台采购金额 C</small><b>${o.C!==''?'¥'+esc(o.C):'未录入'}</b></div></div><p class="footnote">来源：${esc(o.title)}${o.date?' · '+esc(o.date):''}。${esc(o.note)}<br>采购金额已是 C，不再乘采购比例，不再追加最低用量。</p>`);
 let integral='';
 if(a.C===null)integral=detailStep('02','积分复算','<div class="notice neutral">缺少平台实际采购金额 C，无法复算扣分。不会按约定采购比例补造实测 C。</div>');
 else{
  const profit=sub(a.cash,a.C),margin=cmp(a.cash,0)>0?mul(div(profit,a.cash),100):null;
  integral=detailStep('02','按当前倍率复算积分',`<div class="formula">I = ${esc(o.C)} × ${num(p.usedM,18)} × 10<br>= <strong>${num(a.raw,20)} 积分</strong><br>N = ceil(I) = <strong>${num(a.N,0)} 积分</strong></div><p class="footnote">这是原始采购金额按当前企业方案的复算，不是历史实际扣分。</p>`)
  +detailStep('03','复算现金与模型毛利',`<div class="formula">现金 = ${num(a.N,0)} × (${esc(state.plan.pay)} ÷ ${esc(state.plan.total)})<br>≈ <strong>¥${num(a.cash,18)}</strong></div>${a.target!==null?detailFact(targetLabel(p),cash(a.target,12)):'<p class="footnote">缺少平台刊例 P，无法计算折扣目标金额。</p>'}${detailFact('复算模型毛利（现金 − 原始采购）',cash(profit,12),true)}${detailFact('复算销售毛利率',margin===null?'未定义':num(margin,6)+'%')}${a.P!==null?detailFact('复算现金相对平台刊例',num(x.effective,8)+'折'):'<p class="footnote">未录入平台刊例 P，仅刊例折扣无法计算；采购成本、现金与毛利仍可核算。</p>'}${x?detailVariance(x,'actual'):''}`);
 }
 const usage=o.usage?detailStep('API','API实际用量的独立核对',`<div class="formula">completion_tokens = ${esc(o.usage)}<br>按当前官方刊例费率折算 = ${cash(E.fromUsage(o.params,o.usage),12)}</div><p class="footnote">此金额不回填平台P/C。completion_tokens已含最低用量；不与total_tokens相加，也不再次应用门槛。</p>`):'';
 const historical=detailStep('04','历史实际扣分',`${detailFact('平台原记录',o.N!==''?esc(o.N)+'积分':'未知，保持空白')}<p class="footnote">不把当前复算扣分回填历史；不把当前充值现金价值用于声称历史实际收入。需要当时的充值与定价口径才能判断错扣。</p>`);
 const html=`<div class="notice neutral">实测金额与理论公式独立；当前方案可用于复算，历史事实保持原样。</div>`+original+integral+usage+historical+`<div class="detail-scope"><span>平台金额复算 · 非历史实扣</span><button class="btn sm" data-edit-observation="${esc(o.id)}">编辑原记录</button></div>`;
 const text=[`记录：${o.title}`,`任务：${label(o.params)} / ${vinLabel(o.params)}`,`来源：${o.note}`,`平台P原值 = ${o.P||'未录入'}`,`平台C原值 = ${o.C!==''?o.C:'未录入'}`,`API completion_tokens = ${o.usage||'未录入'}`,'不重复乘采购比例或追加门槛。',`当前复算积分 = ${a.raw===null?'未知':decimal(a.raw)}`,`当前复算扣分 = ${a.N===null?'未知':num(a.N,0)}`,`当前复算现金 = ${a.cash===null?'未知':decimal(a.cash)}`,`当前目标现金 = ${a.target===null?'未知':decimal(a.target)}`,`当前复算模型毛利 = ${a.cash===null?'未知':decimal(sub(a.cash,a.C))}`,`历史实际扣分 = ${o.N!==''?o.N:'未知；不得由复算补填'}`].join('\\n');
 return{html,text};
}""")
line('renderActual',"""function renderActual(){actualRows=[];const p=pricing();$('actual-table').innerHTML=table(['实测记录 / 规格','理论刊例 P','平台记录 P','差额 ΔP','理论采购 C','平台记录 C','当前复算扣分','复算模型毛利','历史实扣积分',''],state.observations.map(o=>{const v=theory(o.params,state.rules,p),x=v.x,a=E.recalcRecord(o,p),profit=a.cash===null?null:sub(a.cash,a.C);actualRows.push({scope:'实测对照',record:o.title,params:label(o.params)+' / '+vinLabel(o.params),coverage:coverage(v),theoryP:decimal(x.P),recordedP:o.P,deltaP:o.P!==''?decimal(sub(o.P,x.P)):'',theoryC:decimal(x.C),recordedC:o.C,deltaC:o.C!==''?decimal(sub(o.C,x.C)):'',recordedN:o.N,usage:o.usage||'',recalcN:a.N===null?'':num(a.N,0),recalcCash:a.cash===null?'':decimal(a.cash),recalcProfit:profit===null?'':decimal(profit),pay:state.plan.pay,total:state.plan.total,M:decimal(p.usedM),targetMode:p.targetMode,note:o.note});return'<tr>'+td(`<b>${esc(o.title)}</b><span class="second">${esc(label(o.params))} / ${esc(vinLabel(o.params))}</span><span class="badge">${esc(coverage(v))}</span>`)+td(num(x.P,8))+td(o.P!==''?esc(o.P):'—')+td(o.P!==''?minus(o.P,x.P):'—')+td(num(x.C,8))+td(o.C!==''?esc(o.C):'—')+td(a.N===null?'—':`<b>${num(a.N,0)}</b>`)+td(profit===null?'—':cash(profit))+td(o.N!==''?esc(o.N):'未知')+td(`<button class="link" data-observation="${esc(o.id)}">计算展开</button><br><button class="link" data-edit-observation="${esc(o.id)}">编辑</button>`)+'</tr>';}));$('other-references').innerHTML=state.references.map(r=>`<p><b>${esc(r.title)}</b> · 刊例约 ¥${esc(r.P)}<br>${esc(r.note)}</p>`).join('');}""")
rep("recordedN:'平台实际扣分_空白为未知',usage:","recordedN:'平台实际扣分_空白为未知',recalcN:'当前复算扣分_非历史',recalcCash:'当前复算现金',recalcProfit:'当前复算模型毛利',pay:'当前充值实付',total:'当前到账积分',M:'当前倍率',targetMode:'当前目标模式',usage:")
rep("rule?rule.note:'未内置完整官方门槛表'","rule?rule.note:t.video?'未匹配门槛':'无视频输入，不适用最低用量'")
helpers="""
function targetLabel(p){return p.targetMode==='margin'?'采购成本 ÷ (1 − 目标毛利率)':'刊例金额 × '+num(mul(p.d,10),6)+'折';}
function targetSummary(p){return p.targetMode==='margin'?'目标销售毛利率 '+state.plan.margin+'%':'目标现金 '+num(mul(p.d,10),6)+'折';}
function openEconomics(){const p=pricing();openDrawer('economics','从成本到现金，再到利润','同一金额链条，四个不同概念。',`<div class="principle-steps"><section><b>01 · 成本</b><p>官方用量规则得到刊例 P；采购合同确定采购比例 q；理论采购 C = P × q。平台实测 C 是独立证据。</p></section><section><b>02 · 现金目标</b><p>按折扣：R = P × d。按销售毛利率 g：R = C ÷ (1 − g)。后者不是 C × (1 + g)。</p></section><section><b>03 · 积分收费</b><p>每元到账 S = 总积分 ÷ 实付现金。每积分现金价值 U = 1 ÷ S。积分 I = C × M × 10；逐笔 N = ceil(I)。</p></section><section><b>04 · 利润</b><p>现金收入 = N × U；模型毛利 = 现金收入 − C；销售毛利率 = 毛利 ÷ 现金收入；成本加成率 = 毛利 ÷ C。</p></section></div><div class="formula">当前每积分 ≈ ¥${num(p.U,12)}<br>当前保本倍率 = S ÷ 10 = ${num(p.breakEvenM,12)}<br>一次向上取整增加的现金：0 ≤ 差额 &lt; ¥${num(p.U,12)}</div><div class="notice">赠分会降低每积分的现金价值，因此倍率增大并不自动表示利润增加。保本方案的零星取整收入不构成稳定毛利。</div><p>这里计算的是模型采购毛利，不是净利润。税费、通道费、存储、运维和失败重试成本需在经营预算中另计。历史余额混合了不同充值批次时，当前 U 只代表所填批次。</p>`);}
"""
rep('// Exposed for transparent regression tests.',helpers+'\n// Exposed for transparent regression tests.')
app=app.replace('V8.1','V9').replace('可重新导入V9','可重新导入V9').replace('Reelay V8 ·','Reelay V9 ·')
app=app.replace("采购比例0.735，无额外5%", "采购比例按当前方案")
template=template.replace('V8.1','V9').replace('V8','V9').replace('理论试算与实测对照','成本、积分与现金毛利')
template=template.replace('<div class="label">目标现金折扣 <span class="badge">相对刊例</span></div><div class="discountbox">', '<div class="label"><select id="target-mode" aria-label="定价目标模式"><option value="discount">按现金折扣定价</option><option value="margin">按销售毛利率定价</option></select></div><div id="discount-control" class="discountbox">')
template=template.replace('</span></div><div class="picks" id="discount-picks">','</span></div><div id="margin-control" class="discountbox" hidden><input id="target-margin" aria-label="目标销售毛利率" inputmode="decimal" value="8.125"><span>%</span></div><div class="picks" id="discount-picks">')
template=template.replace('<span><b>采购比例 0.735</b> · 无额外5%｜换算常数10｜逐任务向上取整</span>', '<div class="purchase-control"><label for="purchase-discount">采购折扣</label><input id="purchase-discount" aria-label="采购折扣" inputmode="decimal" value="7.35"><span>折</span><span class="muted">换算常数10 · 逐任务向上取整</span></div>')
template=template.replace('</div></section>\n<div id="globalError"', '</div><div class="plan-principle" id="plan-principle"></div></section>\n<div class="notice neutral" id="migration-note" hidden></div><div id="globalError"')
template=template.replace('<span class="tiny">P × 0.735</span>', '<span class="tiny">P × 采购比例</span>')
template=template.replace('<article class="card result"', '<article class="card result"')
template=template.replace('<div class="composer-bottom">', '<div class="quick-examples"><button class="btn sm" id="example-floor">最低用量示例</button><button class="btn sm" id="example-long">15秒输入示例</button></div><div class="composer-bottom">')
template=template.replace('仅 Seedance 2.0 · 沿用原版参数规则快照', 'Seedance 2.0 标准版 · 官方规则快照 2026-10-19')
template=template.replace('按公式试算，与实测对照。','看清每次生成的成本与利润。').replace('理论计算不读取实测金额；实测记录不反向修正公式。','官方计费规则 → 采购成本 → 积分收费 → 现金毛利。理论与实测独立核算。').replace('V9 / 双口径展开','V9 / 官方规则与利润定价')
template=template.replace('<main class="wrap">','<main class="wrap"><div class="rule-status" id="rule-status"></div>')
# Ensure status exists even when the retained markup uses a different class.
if 'id="rule-status"' not in template:
    template=template.replace('<section class="card plan"','<div class="rule-status" id="rule-status"></div><section class="card plan"',1)
css="""
.rule-status{font-size:11px;color:#246f60;margin:12px 0 8px}.plan-principle{border-top:1px solid var(--line);padding:10px 0;font-size:11px;color:var(--sub)}.purchase-control{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.purchase-control input{width:67px;border:1px solid var(--line);border-radius:5px;padding:3px 5px;font:inherit}.purchase-control label{color:var(--sub)}#target-mode{border:0;background:transparent;font:inherit;font-weight:600;padding:0;max-width:100%;color:var(--ink)}.economics-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px;padding:14px 0 2px;border-top:1px solid var(--line);margin-top:14px}.economics-grid span{display:block;font-size:11px;color:var(--sub)}.economics-grid b{font:600 20px/1.8 var(--font);color:var(--green)}.economics-grid b.loss,.loss{color:var(--red)}.quick-examples{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 13px}.principle-steps{display:grid;gap:12px;margin-bottom:20px}.principle-steps section{border:1px solid var(--line);border-radius:9px;padding:14px}.principle-steps b{display:block;color:var(--accent);margin-bottom:5px}#migration-note{margin-top:10px}.result-note .link{margin-left:5px}pre.formula{white-space:pre-wrap;font-size:11px}.plan-foot{flex-wrap:wrap}.badge.green{background:#eaf6ef;color:#246f60}@media(max-width:540px){.economics-grid{gap:7px}.economics-grid b{font-size:16px}.economics-grid span{font-size:10px}.purchase-control .muted{font-size:9px}.plan-principle{font-size:10px}}
"""
template=template.replace('</style>',css+'</style>')
(root/'app.js').write_text(app,encoding='utf-8')
(root/'template.html').write_text(template,encoding='utf-8')
print('Upgraded app and template')
