'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createCloudClient} = require('./cloud-client.cjs');
const config = {url: 'https://example.supabase.co/', publishableKey: 'sb_publishable_test_key'};
const STORAGE_KEY = 'reelay_cloud_access_v1';
const KEY = 'rk_' + 'a'.repeat(64), TOKEN = 'rs_' + 'b'.repeat(64), TOKEN2 = 'rs_' + 'c'.repeat(64);
const id = i => '00000000-0000-4000-8000-' + String(i).padStart(12, '0');
const expires = '2030-01-08T00:00:00Z';
const now = () => Date.parse('2030-01-01T00:00:00Z');
const identity = {role: 'admin', authenticated: true, display_name: 'Owner', key_id: id(900), expires_at: expires};
const guest = {role: null, authenticated: false, display_name: '', key_id: null, expires_at: null};
const issued = () => ({session_token: TOKEN, expires_at: expires, identity: {...identity}});
const metadata = (i=3) => ({id:id(i),display_name:'录入者',role:'editor',active:true,created_at:'2030-01-01T00:00:00Z',updated_at:'2030-01-01T00:00:00Z'});
const row = i => ({id: id(i), version: 1, record: {C: '1.234567890123456789'}, created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z', archived: false, can_edit: true});
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const deferred = () => {let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function memoryStorage(initial={}) {const values=new Map(Object.entries(initial));return {values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
function saved(token=TOKEN) {return JSON.stringify({session_token:token,expires_at:expires});}

function fake(overrides = {}, options = {}) {
  const calls = [], factoryCalls = [], authCalls = [];
  const storage = options.storage || memoryStorage(options.unlocked ? {[STORAGE_KEY]:saved()} : {});
  const eventTarget = options.eventTarget || new EventTarget();
  const sdk = {
    rpc(name,args) {
      const call={name,args,range:null,signal:null};calls.push(call);
      const query={range(from,to){call.range=[from,to];return query;},abortSignal(signal){call.signal=signal;return query;},then(resolve,reject){return Promise.resolve().then(()=>{
        if(overrides.rpc)return overrides.rpc(call);
        if(name==='reelay_access_unlock')return {data:issued()};
        if(name==='reelay_access_identity')return {data:{...identity}};
        if(name==='reelay_access_lock')return {data:{locked:true}};
        return {data:[]};
      }).then(resolve,reject);}};
      return query;
    },
    auth:new Proxy({}, {get(_target,key){authCalls.push(key);throw Error('Email auth must not be used');}}),
  };
  const client=createCloudClient(config,{...options,now:options.now||now,storage,eventTarget,createClient(...args){factoryCalls.push(args);return sdk;}});
  return {client,calls,factoryCalls,authCalls,storage,eventTarget,storageEvent(){const event=new Event('storage');Object.defineProperties(event,{key:{value:STORAGE_KEY},storageArea:{value:storage}});eventTarget.dispatchEvent(event);}};
}

test('disabled cloud performs no SDK initialization or requests and gives an explicit error', async()=>{
  let calls=0;const client=createCloudClient({}, {createClient(){calls++;}});
  assert.equal(client.enabled,false);
  await assert.rejects(client.publicRecords(),{code:'NOT_CONFIGURED'});
  await assert.rejects(client.unlock(KEY),{code:'NOT_CONFIGURED'});
  client.onAuthChange(()=>assert.fail('disabled cloud must not emit'))();
  assert.equal(calls,0);
});

test('only a public key and safe service origin initialize a browser client',()=>{
  const jwt=role=>['e30',Buffer.from(JSON.stringify({role})).toString('base64url'),'signature'].join('.');
  let initialized=0;const factory={createClient(){initialized++;return {};}};
  for(const key of ['sb_secret_do_not_expose','service_role',jwt('service_role'),jwt('authenticated')])assert.throws(()=>createCloudClient({...config,publishableKey:key},factory),{code:'UNSAFE_KEY'});
  for(const url of ['http://public.example.com','https://user:password@example.com','https://example.com/auth','https://example.com/?token=hidden','https://example.com/#token','javascript:alert(1)'])assert.throws(()=>createCloudClient({...config,url},factory),{code:'INVALID_CONFIG'});
  assert.equal(initialized,0);
  assert.equal(createCloudClient({...config,publishableKey:jwt('anon')},factory).enabled,true);
  assert.equal(createCloudClient({...config,url:'http://127.0.0.1:54321'},factory).enabled,true);
});

test('email auth is disabled and old email session storage is never used as authority',async()=>{
  const legacy=JSON.stringify({access_token:'old-email-token',user:{email:'private@example.com'}});
  const storage=memoryStorage({reelay_cloud_auth_v1:legacy});
  const h=fake({}, {storage});
  assert.deepEqual(h.factoryCalls[0],['https://example.supabase.co',config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}]);
  assert.deepEqual(await h.client.identity(),guest);
  assert.equal(h.client.sendCode,undefined);assert.equal(h.client.verifyCode,undefined);
  assert.equal(storage.getItem('reelay_cloud_auth_v1'),legacy);
  assert.deepEqual(h.calls,[]);assert.deepEqual(h.authCalls,[]);assert.equal(h.client.sdk,undefined);
});

test('unlock exchanges a key once, stores only opaque session and fixed expiry, and returns public identity only',async()=>{
  const h=fake();const seen=[];const stop=h.client.onAuthChange((...args)=>seen.push(args));await tick();seen.length=0;
  const result=await h.client.unlock(' '+KEY+' ');
  assert.deepEqual(result,identity);
  assert.deepEqual(JSON.parse(h.storage.getItem(STORAGE_KEY)),{session_token:TOKEN,expires_at:expires});
  assert.doesNotMatch(h.storage.getItem(STORAGE_KEY),/rk_|display_name|role|key_id/);
  assert.deepEqual(h.calls[0].args,{access_key:KEY});
  await tick();assert.deepEqual(seen,[['SIGNED_IN',{userId:id(900),reason:'unlocked'}]]);
  assert.doesNotMatch(JSON.stringify(result)+JSON.stringify(seen),/rs_|rk_|session_token|access_token|refresh_token/);
  for(const key of ['short','rk_'+'a'.repeat(63),'rk_'+'z'.repeat(64),'rs_'+'a'.repeat(64)])await assert.rejects(h.client.unlock(key),{code:'INVALID_KEY'});
  assert.equal(h.calls.length,1);stop();
});

test('stored session restores permission without re-entering key or extending its expiry',async()=>{
  const h=fake({rpc(){return {data:{...identity,expires_at:'2030-02-01T00:00:00Z',email:'private@example.com',session_token:TOKEN}};}},{unlocked:true});
  const result=await h.client.identity();
  assert.deepEqual(result,identity);
  assert.equal(h.calls[0].name,'reelay_access_identity');assert.deepEqual(h.calls[0].args,{session_token:TOKEN});
  assert.equal(JSON.parse(h.storage.getItem(STORAGE_KEY)).expires_at,expires);
  assert.doesNotMatch(JSON.stringify(result),/private@example|rs_|session_token/);
});

test('expired and malformed browser credentials are discarded before private requests',async()=>{
  for(const value of [JSON.stringify({session_token:TOKEN,expires_at:'2020-01-01T00:00:00Z'}),JSON.stringify({session_token:'bogus',expires_at:expires}),'not-json']){
    const h=fake({}, {storage:memoryStorage({[STORAGE_KEY]:value})});
    assert.deepEqual(await h.client.identity(),guest);assert.equal(h.storage.getItem(STORAGE_KEY),null);
    await assert.rejects(h.client.manageRecords(),{code:'SESSION_EXPIRED'});assert.equal(h.calls.length,0);
  }
});

test('temporary network and timeout failures preserve reusable session; server expiry clears it',async()=>{
  let mode='network';
  const h=fake({rpc(){if(mode==='network')throw new TypeError('private-secret');if(mode==='expired')return {error:{code:'PT401',message:TOKEN}};return {data:{...identity}};}},{unlocked:true});
  await assert.rejects(h.client.identity(),{code:'NETWORK'});assert.ok(h.storage.getItem(STORAGE_KEY));
  mode='success';assert.deepEqual(await h.client.identity(),identity);
  mode='expired';await assert.rejects(h.client.identity(),{code:'SESSION_EXPIRED'});assert.equal(h.storage.getItem(STORAGE_KEY),null);
  assert.deepEqual(await h.client.identity(),guest);
  const slow=fake({rpc(){return new Promise(()=>{});}},{unlocked:true,timeoutMs:10});
  await assert.rejects(slow.client.identity(),{code:'TIMEOUT'});assert.ok(slow.storage.getItem(STORAGE_KEY));
});

test('locking clears local permission immediately and revokes server session; network failure is explicit',async()=>{
  const pending=deferred();const h=fake({rpc(){return pending.promise;}},{unlocked:true});
  const closing=h.client.signOut();assert.equal(h.storage.getItem(STORAGE_KEY),null);assert.deepEqual(await h.client.identity(),guest);
  pending.resolve({data:true});assert.deepEqual(await closing,{signedOut:true});
  assert.deepEqual(h.calls[0].args,{session_token:TOKEN});
  const offline=fake({rpc(){throw new TypeError();}},{unlocked:true});
  await assert.rejects(offline.client.signOut(),{code:'LOCK_UNCONFIRMED'});assert.equal(offline.storage.getItem(STORAGE_KEY),null);
});

test('late unlock response cannot restore permission after locking and its unused session is revoked',async()=>{
  const pending=deferred();const h=fake({rpc(call){return call.name==='reelay_access_unlock'?pending.promise:{data:true};}});
  const unlocking=h.client.unlock(KEY);await tick();await h.client.signOut();
  pending.resolve({data:issued()});await assert.rejects(unlocking,{code:'CANCELLED'});
  assert.equal(h.storage.getItem(STORAGE_KEY),null);assert.deepEqual(await h.client.identity(),guest);
  assert.equal(h.calls.at(-1).name,'reelay_access_lock');assert.deepEqual(h.calls.at(-1).args,{session_token:TOKEN});
});

test('late identity success and expiry from an old key cannot affect a newly unlocked key',async()=>{
  for(const expired of [false,true]){
    const pending=deferred();const h=fake({rpc(call){if(call.name==='reelay_access_identity')return pending.promise;return {data:{...issued(),session_token:TOKEN2,identity:{...identity,key_id:id(901)}}};}},{unlocked:true});
    const read=h.client.identity();await tick();await h.client.unlock(KEY);
    pending.resolve(expired?{error:{code:'PT401'}}:{data:{...identity}});
    await assert.rejects(read,{code:'CANCELLED'});
    assert.equal(JSON.parse(h.storage.getItem(STORAGE_KEY)).session_token,TOKEN2);
  }
});

test('cross-tab lock invalidates pending private responses and notifies only opaque identity hints',async()=>{
  const pending=deferred();const h=fake({rpc(){return pending.promise;}},{unlocked:true}),seen=[];
  const stop=h.client.onAuthChange((...args)=>seen.push(args));await tick();seen.length=0;
  const read=h.client.identity();await tick();h.storage.removeItem(STORAGE_KEY);h.storageEvent();await tick();
  assert.deepEqual(seen,[['SIGNED_OUT',{userId:null,reason:'external'}]]);
  pending.resolve({data:{...identity}});await assert.rejects(read,{code:'CANCELLED'});
  stop();
});

test('unsubscribing cancels queued notifications and browser storage denial permits in-memory use',async()=>{
  const h=fake();const seen=[];const stop=h.client.onAuthChange((...args)=>seen.push(args));stop();await tick();assert.deepEqual(seen,[]);
  const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
  const memory=fake({}, {storage});await memory.client.unlock(KEY);assert.deepEqual(await memory.client.identity(),identity);
});

test('public records paginate without sending private session and preserve exact decimals',async()=>{
  const h=fake({rpc(call){assert.equal(call.name,'reelay_public_records');assert.deepEqual(call.args,{});const[from,to]=call.range;const count=Math.max(0,Math.min(501,to+1)-from);return {data:Array.from({length:count},(_,index)=>({...row(from+index+1),author_email:'private@example.com',author_id:id(999)}))};}},{unlocked:true});
  const rows=await h.client.publicRecords();assert.equal(rows.length,501);assert.deepEqual(h.calls.map(c=>c.range),[[0,499],[500,999]]);
  assert.deepEqual(Object.keys(rows[0]).sort(),['created_at','id','record','updated_at','version']);assert.equal(rows[0].record.C,'1.234567890123456789');
  assert.ok(h.calls.every(c=>c.signal instanceof AbortSignal));
});

test('pagination rejects duplicate, excessive and malformed catalogs',async()=>{
  const duplicate=fake({rpc(call){return {data:call.range[0]===0?Array.from({length:500},(_,i)=>row(i+1)):[row(1)]};}});
  await assert.rejects(duplicate.client.publicRecords(),{code:'CHANGED_DURING_LOAD'});
  const excessive=fake({rpc(call){return {data:Array.from({length:500},(_,i)=>row(call.range[0]+i+1))};}});
  await assert.rejects(excessive.client.publicRecords(),{code:'TOO_MANY_RECORDS'});assert.equal(excessive.calls.length,21);
  const malformed=fake({rpc(){return {data:[row(1),{id:'bad'}]};}});await assert.rejects(malformed.client.publicRecords(),{code:'INVALID_RESPONSE'});
});

test('record writes preserve explicit ids, versions, decimal data and include only current server session',async()=>{
  const h=fake({rpc(call){return {data:{...row(8),version:Math.max(1,call.args.expected_version+1),archived:call.args.archived??false}};}},{unlocked:true});
  const record={C:'0',N:'0',note:'recorded amount'};
  const result=await h.client.saveRecord({id:id(8),version:0,record});assert.equal(result.version,1);assert.equal(result.can_edit,true);
  await h.client.saveRecord({id:id(8),version:1,record});await h.client.archiveRecord({id:id(8),version:2,archived:true});
  assert.deepEqual(h.calls.map(({name,args})=>({name,args})),[
    {name:'reelay_access_save_record',args:{session_token:TOKEN,record_id:id(8),expected_version:0,record}},
    {name:'reelay_access_save_record',args:{session_token:TOKEN,record_id:id(8),expected_version:1,record}},
    {name:'reelay_access_archive_record',args:{session_token:TOKEN,record_id:id(8),expected_version:2,archived:true}},
  ]);
  await assert.rejects(h.client.saveRecord({id:'cloud:'+id(8),version:0,record}),{code:'INVALID_INPUT'});
  await assert.rejects(h.client.archiveRecord({id:id(8),version:0,archived:true}),{code:'INVALID_INPUT'});
  await assert.rejects(h.client.archiveRecord({id:id(8),version:2,archived:'true'}),{code:'INVALID_INPUT'});assert.equal(h.calls.length,3);
});

test('management APIs use key-specific RPCs, strip secret metadata, and expose new key only on issuance',async()=>{
  const h=fake({rpc(call){if(call.name==='reelay_access_keys')return {data:[{...metadata(),key_hash:'hidden',owner_id:id(99)}]};if(call.name==='reelay_access_create_key'||call.name==='reelay_access_rotate_key')return {data:{key:{...metadata(),key_hash:'hidden'},access_key:KEY}};if(call.name==='reelay_access_set_key')return {data:metadata()};return {data:[]};}},{unlocked:true});
  const keys=await h.client.keys();assert.deepEqual(keys,[metadata()]);
  await h.client.history(id(3));const created=await h.client.createKey({display_name:' Entry ',role:'editor'});
  assert.deepEqual(created,{key:metadata(),access_key:KEY});
  await h.client.setKey({id:id(3),active:false});await h.client.rotateKey({id:id(3)});
  assert.deepEqual(h.calls.map(({name,args})=>({name,args})),[
    {name:'reelay_access_keys',args:{session_token:TOKEN}},
    {name:'reelay_access_record_history',args:{session_token:TOKEN,record_id:id(3)}},
    {name:'reelay_access_create_key',args:{session_token:TOKEN,display_name:'Entry',key_role:'editor'}},
    {name:'reelay_access_set_key',args:{session_token:TOKEN,key_id:id(3),active:false}},
    {name:'reelay_access_rotate_key',args:{session_token:TOKEN,key_id:id(3)}},
  ]);
  assert.doesNotMatch(h.storage.getItem(STORAGE_KEY),/rk_|hidden/);
  await assert.rejects(h.client.createKey({display_name:'',role:'editor'}),{code:'INVALID_INPUT'});
  await assert.rejects(h.client.createKey({display_name:'Other',role:'owner'}),{code:'INVALID_INPUT'});
});

test('invalid identity responses fail closed without inventing permission',async()=>{
  for(const value of [{role:'owner'}, {...identity,key_id:'bad'}, {...identity,authenticated:false}]){
    const h=fake({rpc(){return {data:value};}},{unlocked:true});await assert.rejects(h.client.identity(),{code:'INVALID_RESPONSE'});
  }
});

test('upstream errors are sanitized and wrong unlock keys do not reveal upstream details',async()=>{
  for(const [upstream,expected] of [['PT400','INVALID_INPUT'],['PT403','FORBIDDEN'],['PT404','NOT_FOUND'],['PT409','CONFLICT'],['42501','FORBIDDEN'],['PT401','SESSION_EXPIRED'],['PGRST301','SESSION_EXPIRED'],['429','RATE_LIMIT']]){
    const h=fake({rpc(){return {error:{code:upstream,message:'private@example.com Bearer '+TOKEN,details:KEY}};}},{unlocked:true});
    await assert.rejects(h.client.identity(),error=>{assert.equal(error.code,expected);assert.doesNotMatch(JSON.stringify(error)+error.message,/private@example|rs_|rk_/);return true;});
  }
  const wrong=fake({rpc(){return {error:{code:'PT401',message:KEY}};}});await assert.rejects(wrong.client.unlock(KEY),{code:'INVALID_KEY'});
});

test('write timeout aborts transport and leaves outcome explicitly unconfirmed',async()=>{
  const h=fake({rpc(){return new Promise(()=>{});}},{unlocked:true,timeoutMs:10});
  await assert.rejects(h.client.saveRecord({id:id(1),version:0,record:{C:'1'}}),error=>{assert.equal(error.code,'TIMEOUT');assert.match(error.message,/结果尚未确认/);return true;});
  assert.equal(h.calls[0].signal.aborted,true);assert.ok(h.storage.getItem(STORAGE_KEY));
});

test('cancellation aborts current transport and prevents pre-cancelled reads and unlocks',async()=>{
  const h=fake({rpc(){return new Promise(()=>{});}}),controller=new AbortController();
  const read=h.client.publicRecords({signal:controller.signal});await tick();controller.abort();
  await assert.rejects(read,{code:'CANCELLED'});assert.equal(h.calls[0].signal.aborted,true);
  await assert.rejects(h.client.publicRecords({signal:controller.signal}),{code:'CANCELLED'});
  await assert.rejects(h.client.unlock(KEY,{signal:controller.signal}),{code:'CANCELLED'});assert.equal(h.calls.length,1);
});

test('expiration, explicit lock and cross-tab replacement report distinct lifecycle reasons',async()=>{
  let clock=now();const h=fake({}, {unlocked:true,now:()=>clock}),events=[];
  const stop=h.client.onAuthChange((...args)=>events.push(args));await tick();events.length=0;
  clock=Date.parse(expires);
  assert.deepEqual(await h.client.identity(),guest);await tick();
  assert.deepEqual(events,[['SIGNED_OUT',{userId:null,reason:'expired'}]]);
  assert.equal(h.storage.getItem(STORAGE_KEY),null);stop();
  const locking=fake({}, {unlocked:true}),locked=[];const stopLock=locking.client.onAuthChange((...args)=>locked.push(args));await tick();locked.length=0;
  await locking.client.signOut();await tick();assert.deepEqual(locked,[['SIGNED_OUT',{userId:null,reason:'locked'}]]);stopLock();
});

test('a later unlock wins even if an earlier unlock completes last',async()=>{
  const first=deferred(),second=deferred();let requests=0;
  const h=fake({rpc(call){if(call.name==='reelay_access_unlock')return ++requests===1?first.promise:second.promise;return {data:true};}});
  const a=h.client.unlock(KEY);await tick();const b=h.client.unlock('rk_'+'d'.repeat(64));await tick();
  second.resolve({data:{...issued(),session_token:TOKEN2,identity:{...identity,key_id:id(901)}}});
  assert.equal((await b).key_id,id(901));
  first.resolve({data:issued()});await assert.rejects(a,{code:'CANCELLED'});
  assert.equal(JSON.parse(h.storage.getItem(STORAGE_KEY)).session_token,TOKEN2);
  assert.equal(h.calls.at(-1).name,'reelay_access_lock');assert.equal(h.calls.at(-1).args.session_token,TOKEN);
});
