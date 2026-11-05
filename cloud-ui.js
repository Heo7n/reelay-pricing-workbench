(function(root){
'use strict';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=value=>JSON.parse(JSON.stringify(value));
root.ReelayCloudUI={mount(host,client){
 if(!client?.enabled)return null;
 const $=id=>document.getElementById(id),esc=escapeHtml;
 let rows=[],managed=[],memberList=[],identity={role:null,authenticated:false},status='正在读取公共实测…',view=0,scope='public',filter='all',pendingRecord=null,loginEmail='',authGeneration=0,sessionGeneration=0,readGeneration=0,activeUserId;
 const canWrite=()=>['editor','admin'].includes(identity.role);
 const dateLabel=value=>value?String(value).slice(0,10):'日期未记录';
 const money=value=>host.formatAmount(value);
 const current=token=>token===view&&host.isCloudDialog();
 function open(name,title,subtitle,html){view++;host.openDrawer(name,title,subtitle,html,true);return view;}
 function errorText(error){return error?.message||'操作未完成，请重试。';}
 function feedback(message){const el=$('cloud-error');if(el){el.textContent=message;el.focus();}else host.toast(message);}
 function lockForm(form,locked){form.dataset.saving=String(locked);form.setAttribute('aria-busy',String(locked));for(const el of form.querySelectorAll('input,select,textarea,button'))el.disabled=locked;}
 function updateIdentity(value){identity=value||{role:null,authenticated:false};if(!canWrite()){managed=[];memberList=[];scope='public';}host.onIdentity(identity);}
 async function refreshIdentity(){const generation=++authGeneration;try{const value=await client.identity();if(generation===authGeneration)updateIdentity(value);}catch(_){if(generation===authGeneration)updateIdentity(null);}}
 async function refreshPublic(){
  const generation=++readGeneration;
  try{const result=await client.publicRecords();if(generation!==readGeneration)return rows;const valid=result.filter(row=>host.validRecord({...row.record,id:'cloud:'+row.id}));if(valid.length!==result.length)throw Error('部分公共记录格式不兼容，请联系管理员更新计算器。');rows=valid;status=rows.length+' 条公共实测';host.onRecords(copy(rows));return rows;}
  catch(error){if(generation!==readGeneration)return rows;status='云端暂不可用，本地计算仍可使用';throw error;}
 }
 function recordCard(row){
  const r=row.record,own=scope==='manage'&&row.can_edit;
  return `<article class="cloud-record"><div class="cloud-record-head"><div><h3>${esc(r.title)}</h3><p>${esc(host.label(r.params))} · ${esc(host.videoLabel(r.params))}</p></div><div><span class="num">${esc(money(r.C))}</span><small>元</small></div></div><p>实测 ${esc(dateLabel(r.date))}${r.N!==''?' · 历史实扣 '+esc(r.N)+' 积分':''}${row.archived?' · 已撤回':''}</p>${r.note?`<p class="cloud-record-note">${esc(r.note)}</p>`:''}<div class="cloud-record-footer"><span>${esc(r.provider||'立画')}</span><div class="cloud-actions">${own?`<button class="link" data-cloud-action="history" data-cloud-id="${esc(row.id)}">版本记录</button><button class="link" data-cloud-action="edit" data-cloud-id="${esc(row.id)}" ${row.archived?'disabled':''}>编辑</button><button class="link" data-cloud-action="archive" data-cloud-id="${esc(row.id)}">${row.archived?'恢复公开':'撤回'}</button>`:''}${!row.archived?`<button class="btn" data-cloud-action="use" data-cloud-id="${esc(row.id)}">用于本次测算</button>`:''}</div></div></article>`;
 }
 function libraryHTML(){
  const available=(scope==='manage'?managed:rows).filter(r=>filter==='all'||r.record.params.model===filter);
  return `<div class="cloud-toolbar"><div class="cloud-filter"><select id="cloud-model-filter" aria-label="筛选生成模型"><option value="all">全部模型</option>${host.models().map(m=>`<option value="${esc(m.id)}" ${filter===m.id?'selected':''}>${esc(m.label)}</option>`).join('')}</select><span class="cloud-status" id="cloud-status">${esc(status)}</span></div><div class="cloud-actions"><button class="link" data-cloud-action="refresh">刷新</button>${pendingRecord?'<button class="link" data-cloud-action="resume">继续未保存的录入</button>':''}${canWrite()?`<button class="link" data-cloud-action="scope">${scope==='public'?'管理记录':'返回公开记录'}</button>${identity.role==='admin'?'<button class="link" data-cloud-action="members">录入成员</button>':''}<button class="link" data-cloud-action="logout">退出</button><button class="btn primary" data-cloud-action="new">录入实测</button>`:identity.authenticated?'<span class="cloud-status">当前账号无录入权限</span><button class="link" data-cloud-action="logout">退出</button>':'<button class="link" data-cloud-action="login">录入者登录</button>'}</div></div><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><div class="cloud-list">${available.map(recordCard).join('')||'<div class="cloud-empty">暂无'+(filter==='all'?'':'该模型的')+'公共实测记录。<br>现有本地记录仍可在「实测对账」中使用。</div>'}</div>`;
 }
 async function library(reload=false){
  const token=open('cloud-library',scope==='manage'?'管理公共实测':'公共实测','记录供所有访客查看，计算结果按各自当前方案复算。',libraryHTML());
  $('cloud-model-filter').addEventListener('change',e=>{filter=e.target.value;library();});
  if(reload){try{await Promise.all([refreshPublic(),refreshIdentity()]);if(scope==='manage'&&canWrite()){const generation=sessionGeneration,result=await client.manageRecords();if(generation===sessionGeneration)managed=result;}if(!canWrite())scope='public';if(current(token))library();}catch(error){if(current(token)){$('cloud-status').textContent=status;$('cloud-status').classList.add('is-error');feedback(errorText(error));}}}
 }
 function login(record=null){
  if(record)pendingRecord=copy(record);
  const token=open('cloud-login','录入者登录','',`<p class="cloud-login-copy">公共实测无需登录即可查看。获授权的成员登录后可以录入和维护记录。</p><form id="cloud-login-form" class="cloud-form"><label>邮箱<input class="input" id="cloud-email" type="email" autocomplete="email" required maxlength="254" value="${esc(loginEmail)}"></label><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><button class="btn primary" type="submit">获取登录验证码</button></form>`);
  $('cloud-login-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter||e.target.querySelector('button');button.disabled=true;loginEmail=$('cloud-email').value.trim();try{await client.sendCode(loginEmail);if(current(token))verify();}catch(error){if(current(token)){feedback(errorText(error));button.disabled=false;}}});
  $('cloud-email').focus();
 }
 function verify(){
  const token=open('cloud-login','输入验证码','',`<p class="cloud-login-copy">验证码已发送至 ${esc(loginEmail)}。请输入邮件中的验证码。</p><form id="cloud-verify-form" class="cloud-form"><label>验证码<input class="input num" id="cloud-code" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9]{6,10}" maxlength="10"></label><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><button class="btn primary" type="submit">登录</button><button class="link" type="button" data-cloud-action="login">更换邮箱或重新发送</button></form>`);
  $('cloud-verify-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter||e.target.querySelector('[type="submit"]');button.disabled=true;try{await client.verifyCode(loginEmail,$('cloud-code').value.trim());await refreshIdentity();if(!current(token))return;if(!canWrite()){feedback('该账号尚未获得录入权限，请联系管理员添加此邮箱。');button.disabled=false;return;}const draft=pendingRecord;pendingRecord=null;if(draft)editor(draft);else library(true);}catch(error){if(current(token)){feedback(errorText(error));button.disabled=false;}}});
  $('cloud-code').focus();
 }
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 function taskFields(p){
  const model=host.models().find(m=>m.id===p.model)||host.models()[0];
  return `<details class="cloud-spec"><summary>任务规格</summary><div class="cloud-form-grid"><label>生成模型<select id="cloud-task-model">${host.models().map(m=>`<option value="${esc(m.id)}" ${m.id===p.model?'selected':''}>${esc(m.label)}</option>`).join('')}</select></label><label>分辨率<select id="cloud-task-res">${model.resolutions.map(res=>`<option value="${res}" ${res===p.res?'selected':''}>${res==='4k'?'4K':res}</option>`).join('')}</select></label><label>画面比例<select id="cloud-task-ratio">${['21:9','16:9','4:3','1:1','3:4','9:16'].map(r=>`<option value="${r}" ${r===p.ratio?'selected':''}>${r}</option>`).join('')}</select></label><label>输出时长（秒）<input class="input num" id="cloud-task-seconds" type="number" min="${model.seconds.min}" max="${model.seconds.max}" step="1" value="${esc(p.seconds)}" required></label><label>视频输入<select id="cloud-task-video"><option value="false" ${!p.video?'selected':''}>无视频输入</option><option value="true" ${p.video?'selected':''}>有视频输入</option></select></label><label id="cloud-task-vin-field" ${p.video?'':'hidden'}>输入视频总时长（秒）<input class="input num" id="cloud-task-vin" inputmode="decimal" value="${esc(p.vin)}"></label></div></details>`;
 }
 function currentTask(){return {model:$('cloud-task-model').value,res:$('cloud-task-res').value,ratio:$('cloud-task-ratio').value,seconds:$('cloud-task-seconds').value.trim(),video:$('cloud-task-video').value==='true',vin:$('cloud-task-video').value==='true'?$('cloud-task-vin').value.trim():'2'};}
 function freshRecord(){return {id:crypto.randomUUID(),version:0,record:{title:'',params:copy(host.getTask()),provider:'立画',costBasis:'recorded',P:'',C:host.getCost()||'',N:'',usage:'',date:today(),note:''}};}
 function formDraft(row){
  const r=copy(row.record),p=currentTask();r.params=p;
  r.title=$('cloud-title').value.trim()||'立画实测 · '+host.label(p);r.C=$('cloud-cost').value.trim();r.N=$('cloud-points').value.trim();r.date=$('cloud-date').value;r.note=$('cloud-note').value.trim();r.P=$('cloud-list-cost').value.trim();r.usage=$('cloud-tokens').value.trim();
  const q=$('cloud-history-q').value.trim(),m=$('cloud-history-m').value.trim();delete r.historicalPricing;if(q&&m)r.historicalPricing={q:host.discountRatio(q),M:m};
  return {id:row.id,version:row.version,record:r};
 }
 function editor(row=freshRecord()){
  if(!canWrite()){login(row);return;}
  const r=row.record,editing=row.version>0;
  const token=open('cloud-edit',editing?'编辑公共实测':'录入公共实测','',`<form id="cloud-record-form" class="cloud-form"><div class="cloud-publish-note"><span class="cloud-scope">公开记录</span><p>${esc(host.label(r.params))} · ${esc(host.videoLabel(r.params))}</p>保存后所有访客可查看。请填写账单实测金额；当前测算方案不会回填为历史条件。</div><div class="cloud-form-grid"><label>立画实际成本（元）<input class="input num" id="cloud-cost" inputmode="decimal" required maxlength="47" value="${esc(r.C)}"></label><label>实测日期<input class="input" id="cloud-date" type="date" required value="${esc(r.date)}"></label></div><div class="cloud-form-grid"><label>历史实扣（积分，可选）<input class="input num" id="cloud-points" inputmode="numeric" maxlength="12" value="${esc(r.N)}"></label><label>记录名称<input class="input" id="cloud-title" maxlength="100" placeholder="按任务参数命名" value="${esc(r.title)}"></label></div><label>公开来源 / 备注<input class="input" id="cloud-note" maxlength="1000" placeholder="例如测试批次、账单核对情况" value="${esc(r.note)}"></label><details ${r.P||r.usage||r.historicalPricing?'open':''}><summary>补充账单信息</summary><div class="cloud-form-grid"><label>折前成本（元，可选）<input class="input num" id="cloud-list-cost" inputmode="decimal" maxlength="47" value="${esc(r.P)}"></label><label>实际 Token 用量（可选）<input class="input num" id="cloud-tokens" inputmode="numeric" maxlength="12" value="${esc(r.usage||'')}"></label><label>当时采购折扣（折，可选）<input class="input num" id="cloud-history-q" inputmode="decimal" value="${esc(r.historicalPricing?host.discountNumber(r.historicalPricing.q):'')}"></label><label>当时成本定价倍率（可选）<input class="input num" id="cloud-history-m" inputmode="decimal" value="${esc(r.historicalPricing?.M||'')}"></label></div></details><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><div class="cloud-actions"><button class="link" type="button" data-cloud-action="local-copy">另存本地</button><button class="btn" type="button" data-cloud-action="library">取消</button><button class="btn primary" type="submit">${editing?'保存公开修改':'保存并公开'}</button></div></form>`);
  const form=$('cloud-record-form');
  form.querySelector('.cloud-publish-note').insertAdjacentHTML('afterend',taskFields(r.params));
  form.addEventListener('invalid',e=>{for(let parent=e.target.parentElement;parent&&parent!==form;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;},true);
  form.addEventListener('change',e=>{
   if(e.target.id==='cloud-task-model'){
    const model=host.models().find(m=>m.id===e.target.value),res=$('cloud-task-res').value;
    $('cloud-task-res').innerHTML=model.resolutions.map(value=>`<option value="${value}" ${value===res?'selected':''}>${value==='4k'?'4K':value}</option>`).join('');
    $('cloud-task-seconds').min=model.seconds.min;$('cloud-task-seconds').max=model.seconds.max;
   }
   if(e.target.id.startsWith('cloud-task-')){
    const p=currentTask();$('cloud-task-vin-field').hidden=!p.video;
    form.querySelector('.cloud-publish-note p').textContent=host.label(p)+' · '+host.videoLabel(p);
    try{pendingRecord=formDraft(row);}catch(_){}
   }
  });
  form.addEventListener('input',()=>{if(form.dataset.saving==='true')return;try{pendingRecord=formDraft(row);}catch(_){}});
  form.querySelector('[data-cloud-action="local-copy"]').addEventListener('click',()=>{try{host.saveLocalCopy(formDraft(row).record);}catch(error){feedback(errorText(error));}});
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(form.dataset.saving==='true')return;lockForm(form,true);let draft;
   try{
    draft=formDraft(row);pendingRecord=draft;
    if(!host.validTask(draft.record.params)){form.querySelector('.cloud-spec').open=true;throw Error('请检查任务规格，分辨率和时长须在所选模型支持的范围内。');}
    if(!!$('cloud-history-q').value.trim()!==!!$('cloud-history-m').value.trim())throw Error('历史折扣与倍率请同时填写；未知时两项均留空。');
    if(!host.validRecord({...draft.record,id:'cloud:'+draft.id})||draft.record.C==='')throw Error('请检查金额、积分与历史定价：成本须为非负数，历史积分须为整数。');
    const generation=sessionGeneration,saved=await client.saveRecord(draft);readGeneration++;if(generation!==sessionGeneration)return;if(JSON.stringify(pendingRecord)===JSON.stringify(draft))pendingRecord=null;
    rows=[saved,...rows.filter(x=>x.id!==saved.id)];status=rows.length+' 条公共实测';managed=managed.map(x=>x.id===saved.id?{...saved,can_edit:true,archived:false}:x);host.onRecords(copy(rows));
    if(current(token)){host.toast('已保存到云端，所有访客可查看。');scope='public';library();}
   }catch(error){if(current(token)){feedback(errorText(error));lockForm(form,false);if((error.code==='CONFLICT'||error.code==='PT409')&&!form.querySelector('[data-cloud-action="new-from-draft"]'))form.querySelector('.cloud-actions').insertAdjacentHTML('afterbegin','<button class="link" type="button" data-cloud-action="new-from-draft">将填写内容另存为新记录</button>');}}
  });
 }
 async function members(){
  if(identity.role!=='admin')return;
  const token=open('cloud-members','录入成员','只有下列已启用成员拥有云端写入权限。','<p class="cloud-status">正在读取成员…</p><p id="cloud-error" class="cloud-form-error" role="status"></p>');
  const generation=sessionGeneration;
  try{const result=await client.members();if(!current(token)||generation!==sessionGeneration)return;memberList=result;$('drawer-body').innerHTML=`<div class="cloud-toolbar"><span class="cloud-status">邮箱仅管理员可见</span><button class="link" data-cloud-action="library">返回公共实测</button></div><div class="cloud-member-list">${result.map(m=>`<div class="cloud-member"><div><b>${esc(m.display_name||m.email)}</b><p>${esc(m.email)} · ${m.role==='admin'?'管理员':'录入成员'} · ${m.active?'已启用':'已停用'}</p></div><button class="link" data-cloud-action="toggle-member" data-cloud-id="${esc(m.id)}">${m.active?'停用':'启用'}</button></div>`).join('')}</div><form id="cloud-member-form" class="cloud-form"><div class="cloud-form-grid"><label>成员邮箱<input class="input" id="cloud-member-email" type="email" required maxlength="254"></label><label>称呼<input class="input" id="cloud-member-name" maxlength="60" required></label></div><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><div class="cloud-actions"><button class="btn primary" type="submit">添加录入成员</button></div></form>`;
   $('cloud-member-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter||e.target.querySelector('[type="submit"]');button.disabled=true;try{await client.setMember({id:null,email:$('cloud-member-email').value.trim(),display_name:$('cloud-member-name').value.trim(),role:'editor',active:true});if(current(token))members();}catch(error){if(current(token)){feedback(errorText(error));button.disabled=false;}}});
  }catch(error){if(current(token))feedback(errorText(error));}
 }
 async function history(row){
  const token=open('cloud-history','版本记录',row.record.title,'<p class="cloud-status">正在读取历史版本…</p><p id="cloud-error" class="cloud-form-error" role="status"></p>');
  const generation=sessionGeneration;
  try{const versions=await client.history(row.id);if(!current(token)||generation!==sessionGeneration)return;$('drawer-body').innerHTML=`<div class="cloud-toolbar"><span class="cloud-status">历史版本仅供核对，不会改写当前记录。</span><button class="link" data-cloud-action="library">返回</button></div><div class="cloud-history">${versions.map(v=>`<article><h3>v${v.version} · ${esc(dateLabel(v.changed_at))} · ${v.archived?'已撤回':'公开'}</h3><p>${esc(host.label(v.record.params))} · ${esc(host.videoLabel(v.record.params))}</p><p>立画实际成本 ${esc(money(v.record.C))} 元 · 实测 ${esc(v.record.date)}${v.record.N!==''?' · 历史实扣 '+esc(v.record.N)+' 积分':''}</p>${v.record.P?`<p>折前成本 ${esc(v.record.P)} 元</p>`:''}${v.record.historicalPricing?`<p>当时采购 ${esc(host.discountNumber(v.record.historicalPricing.q))} 折 · 倍率 ${esc(v.record.historicalPricing.M)}</p>`:''}${v.record.note?`<p class="cloud-record-note">${esc(v.record.note)}</p>`:''}</article>`).join('')}</div>`;}catch(error){if(current(token))feedback(errorText(error));}
 }
 document.addEventListener('click',async e=>{
  const button=e.target.closest('button[data-cloud-action]');if(!button||button.disabled)return;
  const action=button.dataset.cloudAction,id=button.dataset.cloudId,row=(scope==='manage'?managed:rows).find(r=>r.id===id),token=view;
  try{
   if(action==='library'){await library();return;}
   if(action==='login'){login();return;}
   if(action==='refresh'){button.disabled=true;await library(true);return;}
   if(action==='new'){editor(freshRecord());return;}
   if(action==='resume'&&pendingRecord){editor(copy(pendingRecord));return;}
   if(action==='new-from-draft'&&pendingRecord){editor({...pendingRecord,id:crypto.randomUUID(),version:0});return;}
   if(action==='logout'){authGeneration++;sessionGeneration++;button.disabled=true;await client.signOut();managed=[];memberList=[];pendingRecord=null;updateIdentity(null);scope='public';await library();return;}
   if(action==='scope'){button.disabled=true;if(scope==='public'){const generation=sessionGeneration,result=await client.manageRecords();if(generation!==sessionGeneration||!current(token))return;managed=result;scope='manage';}else scope='public';if(current(token))library();return;}
   if(action==='members'){await members();return;}
   if(action==='toggle-member'){const member=memberList.find(m=>m.id===id);if(!member)return;button.disabled=true;await client.setMember({...member,active:!member.active});if(current(token))members();return;}
   if(action==='use'&&row){host.useRecord(copy(row));view++;host.closeDrawer();return;}
   if(action==='edit'&&row){editor(copy(row));return;}
   if(action==='history'&&row){await history(row);return;}
   if(action==='archive'&&row){button.disabled=true;const generation=sessionGeneration;await client.archiveRecord({id:row.id,version:row.version,archived:!row.archived});readGeneration++;const result=await client.manageRecords();if(generation===sessionGeneration)managed=result;await refreshPublic();if(current(token))library();}
  }catch(error){if(current(token)){button.disabled=false;feedback(errorText(error));}}
 });
 client.onAuthChange((event,context)=>{
  const previousRole=identity.role,changedAccount=event==='USER_UPDATED'||event==='SIGNED_IN'&&(context?activeUserId!==undefined&&context.userId!==activeUserId:true);
  if(context)activeUserId=context.userId;
  authGeneration++;if(changedAccount||event==='SIGNED_OUT'){sessionGeneration++;managed=[];memberList=[];}
  if(event==='SIGNED_OUT'){pendingRecord=null;updateIdentity(null);scope='public';if(host.isCloudDialog())library();return;}
  if(changedAccount&&host.isCloudDialog()&&!['cloud-login','cloud-library'].includes($('modal').dataset.panel)){pendingRecord=null;scope='public';library();}
  refreshIdentity().then(()=>{const lostPrivilege=previousRole==='admin'&&identity.role!=='admin'||previousRole==='editor'&&!canWrite();if((!canWrite()||lostPrivilege)&&host.isCloudDialog()&&!['cloud-login','cloud-library'].includes($('modal').dataset.panel)){pendingRecord=null;scope='public';library();}else if(host.isCloudDialog()&&$('modal').dataset.panel==='cloud-library')library();});
 });
 Promise.all([refreshPublic(),refreshIdentity()]).catch(()=>{});
 return {open:()=>library(true),saveCurrent:()=>editor(freshRecord()),edit:id=>{const raw=id.replace(/^cloud:/,'');const row=rows.find(r=>r.id===raw)||managed.find(r=>r.id===raw);if(row)editor(copy(row));},canWrite,getRecords:()=>copy(rows),getIdentity:()=>copy(identity)};
}};
})(window);
