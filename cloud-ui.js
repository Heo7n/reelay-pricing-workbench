(function(root){
'use strict';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=value=>JSON.parse(JSON.stringify(value));
root.ReelayCloudUI={mount(host,client){
 if(!client?.enabled)return null;
 const $=id=>document.getElementById(id),esc=escapeHtml;
 let rows=[],managed=[],keyList=[],identity={role:null,authenticated:false},status='正在读取公共实测…',view=0,scope='public',filter='all',pendingRecord=null,authGeneration=0,sessionGeneration=0,readGeneration=0,activeUserId,identityRequest=null;
 const canWrite=()=>identity.authenticated===true&&['editor','admin'].includes(identity.role);
 const dateLabel=value=>value?String(value).slice(0,10):'日期未记录';
 const money=value=>host.formatAmount(value);
 const current=token=>token===view&&host.isCloudDialog();
 function open(name,title,subtitle,html){view++;host.openDrawer(name,title,subtitle,html,true);return view;}
 function errorText(error){return error?.message||'操作未完成，请重试。';}
 function feedback(message){const el=$('cloud-error');if(el){el.textContent=message;el.focus();}else host.toast(message);}
 function lockForm(form,locked){form.dataset.saving=String(locked);form.setAttribute('aria-busy',String(locked));for(const el of form.querySelectorAll('input,select,textarea,button'))el.disabled=locked;}
 function updateIdentity(value){identity=value||{role:null,authenticated:false};if(!canWrite()){managed=[];keyList=[];scope='public';}host.onIdentity(identity);}
 async function refreshIdentity(){
  const generation=++authGeneration;
  let request={generation,promise:null};
  request.promise=Promise.resolve().then(()=>client.identity()).then(value=>{if(generation===authGeneration)updateIdentity(value);return {value};},error=>{if(generation===authGeneration)updateIdentity(null);return {error};});
  identityRequest=request;
  for(;;){
   const result=await request.promise;
   if(request.generation!==authGeneration){if(identityRequest?.generation===authGeneration){request=identityRequest;continue;}throw Error('录入权限已改变，请重新解锁。');}
   if(result.error)throw result.error;
   return result.value;
  }
 }
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
  return `<div class="cloud-toolbar"><div class="cloud-filter"><select id="cloud-model-filter" aria-label="筛选生成模型"><option value="all">全部模型</option>${host.models().map(m=>`<option value="${esc(m.id)}" ${filter===m.id?'selected':''}>${esc(m.label)}</option>`).join('')}</select><span class="cloud-status" id="cloud-status">${esc(status)}</span></div><div class="cloud-actions"><button class="link" data-cloud-action="refresh">刷新</button>${pendingRecord?'<button class="link" data-cloud-action="resume">继续未保存的录入</button>':''}${canWrite()?`<button class="link" data-cloud-action="scope">${scope==='public'?'管理记录':'返回公开记录'}</button>${identity.role==='admin'?'<button class="link" data-cloud-action="keys">密钥管理</button>':''}<button class="link" data-cloud-action="logout">锁定录入</button><button class="btn primary" data-cloud-action="new">录入实测</button>`:'<button class="link" data-cloud-action="login">解锁录入</button>'}</div></div>${canWrite()?`<p class="cloud-access-status">${esc(identity.display_name||'录入权限已解锁')}${identity.expires_at?' · 本机有效至 '+esc(dateLabel(identity.expires_at)):''}</p>`:''}<p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><div class="cloud-list">${available.map(recordCard).join('')||'<div class="cloud-empty">暂无'+(filter==='all'?'':'该模型的')+'公共实测记录。<br>现有本地记录仍可在「实测对账」中使用。</div>'}</div>`;
 }
 async function library(reload=false){
  const token=open('cloud-library',scope==='manage'?'管理公共实测':'公共实测','记录供所有访客查看，计算结果按各自当前方案复算。',libraryHTML());
  $('cloud-model-filter').addEventListener('change',e=>{filter=e.target.value;library();});
  if(reload){try{await Promise.all([refreshPublic(),refreshIdentity()]);if(scope==='manage'&&canWrite()){const generation=sessionGeneration,result=await client.manageRecords();if(generation===sessionGeneration)managed=result;}if(!canWrite())scope='public';if(current(token))library();}catch(error){if(current(token)){await library();feedback(errorText(error));$('cloud-error').insertAdjacentHTML('afterend','<button class="link cloud-retry" data-cloud-action="retry-identity">重试权限检查</button>');}}}
 }
 function login(record=null){
  if(record)pendingRecord=copy(record);
  const token=open('cloud-login','解锁录入','',`<p class="cloud-login-copy">输入管理员提供的录入密钥，本机 7 天内无需重复输入。</p><form id="cloud-unlock-form" class="cloud-form"><label>录入密钥<input class="input" id="cloud-access-key" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴录入密钥" required maxlength="100"></label><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><button class="btn primary" type="submit">解锁录入</button></form>`);
  const form=$('cloud-unlock-form');
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(form.dataset.saving==='true')return;lockForm(form,true);
   try{
    const value=await client.unlock($('cloud-access-key').value.trim());
    if(!current(token))return;
    authGeneration++;updateIdentity(value);activeUserId=value.key_id;
    $('cloud-access-key').value='';
    const draft=pendingRecord;pendingRecord=null;if(draft)editor(draft);else library();
   }catch(error){if(current(token)){feedback(errorText(error));lockForm(form,false);}}
  });
  $('cloud-access-key').focus();
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
 function showCreatedKey(result){
  const item=result.key;
  open('cloud-key-created','保存录入密钥','',`<p class="cloud-login-copy">${esc(item.display_name)} 的密钥已生成，请复制后交给对应的录入者。关闭后无法再次查看；重新生成会使旧密钥失效。</p><label class="cloud-key-label">录入密钥<textarea id="cloud-created-key" class="input cloud-key-secret" readonly spellcheck="false" rows="3">${esc(result.access_key)}</textarea></label><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><div class="cloud-actions cloud-key-actions"><button class="btn" data-cloud-action="keys">返回密钥管理</button><button class="btn primary" data-cloud-action="copy-key">复制密钥</button></div>`);
 }
 async function keys(){
  if(!canWrite()||identity.role!=='admin')return;
  const token=open('cloud-keys','密钥管理','每人一把密钥，便于单独停用。','<p class="cloud-status">正在读取密钥…</p><p id="cloud-error" class="cloud-form-error" role="status"></p>');
  const generation=sessionGeneration;
  try{
   const result=await client.keys();if(!current(token)||generation!==sessionGeneration)return;keyList=result;
   $('drawer-body').innerHTML=`<div class="cloud-toolbar"><span class="cloud-status">每次解锁可使用 7 天，停用立即生效。</span><button class="link" data-cloud-action="library">返回公共实测</button></div><div class="cloud-key-list">${result.map(m=>`<div class="cloud-key-row"><div><b>${esc(m.display_name)}</b><p>${m.role==='admin'?'管理员':'录入者'} · ${m.active?'已启用':'已停用'}${m.id===identity.key_id?' · 当前密钥':''}</p></div><div class="cloud-actions"><button class="link" data-cloud-action="rotate-key" data-cloud-id="${esc(m.id)}" ${m.id===identity.key_id||!m.active?'disabled':''}>重新生成</button><button class="link" data-cloud-action="toggle-key" data-cloud-id="${esc(m.id)}">${m.active?'停用':'启用'}</button></div></div>`).join('')}</div><form id="cloud-key-form" class="cloud-form cloud-key-create"><label>密钥名称<input class="input" id="cloud-key-name" required maxlength="60" placeholder="例如：小陈 / 数据整理"></label><p id="cloud-error" class="cloud-form-error" role="status" tabindex="-1"></p><button class="btn primary" type="submit">生成录入密钥</button></form>`;
   $('cloud-key-form').addEventListener('submit',async e=>{
    e.preventDefault();const form=e.target;if(form.dataset.saving==='true')return;lockForm(form,true);
    try{const result=await client.createKey({display_name:$('cloud-key-name').value.trim(),role:'editor'});if(current(token)&&generation===sessionGeneration)showCreatedKey(result);}
    catch(error){if(current(token)){feedback(errorText(error));lockForm(form,false);}}
   });
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
   if(action==='retry-identity'){button.disabled=true;await library(true);return;}
   if(action==='logout'){authGeneration++;sessionGeneration++;button.disabled=true;let failure;try{await client.signOut();}catch(error){failure=error;}managed=[];keyList=[];pendingRecord=null;updateIdentity(null);scope='public';await library();if(failure)feedback(errorText(failure));return;}
   if(action==='scope'){button.disabled=true;if(scope==='public'){const generation=sessionGeneration,result=await client.manageRecords();if(generation!==sessionGeneration||!current(token))return;managed=result;scope='manage';}else scope='public';if(current(token))library();return;}
   if(action==='keys'){await keys();return;}
   if(action==='copy-key'){await navigator.clipboard.writeText($('cloud-created-key').value);host.toast('密钥已复制。');return;}
   if(action==='toggle-key'){const key=keyList.find(m=>m.id===id);if(!key)return;button.disabled=true;await client.setKey({id:key.id,active:!key.active});if(current(token))keys();return;}
   if(action==='rotate-key'){const key=keyList.find(m=>m.id===id);if(!key||key.id===identity.key_id)return;button.disabled=true;const result=await client.rotateKey({id:key.id});if(current(token))showCreatedKey(result);return;}
   if(action==='use'&&row){host.useRecord(copy(row));view++;host.closeDrawer();return;}
   if(action==='edit'&&row){editor(copy(row));return;}
   if(action==='history'&&row){await history(row);return;}
   if(action==='archive'&&row){button.disabled=true;const generation=sessionGeneration;await client.archiveRecord({id:row.id,version:row.version,archived:!row.archived});readGeneration++;const result=await client.manageRecords();if(generation===sessionGeneration)managed=result;await refreshPublic();if(current(token))library();}
  }catch(error){if(current(token)){button.disabled=false;feedback(errorText(error));}}
 });
 client.onAuthChange((event,context)=>{
  if(event==='SIGNED_IN'&&context?.reason==='unlocked'&&canWrite()&&identity.key_id===context.userId)return;
  const previousRole=identity.role,changedAccount=event==='USER_UPDATED'||event==='SIGNED_IN'&&(context?activeUserId!==undefined&&context.userId!==activeUserId:true);
  if(context)activeUserId=context.userId;
  authGeneration++;if(changedAccount||event==='SIGNED_OUT'){sessionGeneration++;managed=[];keyList=[];}
  if(event==='SIGNED_OUT'){const draft=context?.reason==='expired'?pendingRecord:null;pendingRecord=draft;updateIdentity(null);scope='public';if(host.isCloudDialog()){if(draft)login(draft);else library();}return;}
  if(changedAccount&&host.isCloudDialog()&&!['cloud-login','cloud-library'].includes($('modal').dataset.panel)){pendingRecord=null;scope='public';library();}
  const check=refreshIdentity(),generation=authGeneration;
  check.then(()=>{if(generation!==authGeneration)return;const lostPrivilege=previousRole==='admin'&&identity.role!=='admin'||previousRole==='editor'&&!canWrite();if((!canWrite()||lostPrivilege)&&host.isCloudDialog()&&!['cloud-login','cloud-library'].includes($('modal').dataset.panel)){pendingRecord=null;scope='public';library();}else if(host.isCloudDialog()&&$('modal').dataset.panel==='cloud-library')library();}).catch(error=>{if(generation!==authGeneration||!host.isCloudDialog()||$('modal').dataset.panel==='cloud-login')return;scope='public';library();feedback(errorText(error));$('cloud-error').insertAdjacentHTML('afterend','<button class="link cloud-retry" data-cloud-action="retry-identity">重试权限检查</button>');});
 });
 Promise.all([refreshPublic(),refreshIdentity()]).catch(()=>{});
 return {open:()=>library(true),saveCurrent:()=>editor(freshRecord()),edit:id=>{const raw=id.replace(/^cloud:/,'');const row=rows.find(r=>r.id===raw)||managed.find(r=>r.id===raw);if(row)editor(copy(row));},canWrite,getRecords:()=>copy(rows),getIdentity:()=>copy(identity)};
}};
})(window);
