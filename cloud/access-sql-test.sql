-- Dedicated calculator DB only. All synthetic credentials and writes roll back.
begin;

create function pg_temp.assert_access(ok boolean,message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAILED: %',message; end if; end $$;
create function pg_temp.expect_access_error(statement text,code text,message text) returns void language plpgsql as $$
declare actual text;
begin
  begin execute statement;
  exception when others then get stacked diagnostics actual=returned_sqlstate;
    if actual=code then return; end if;
    raise exception 'FAILED: %; expected %, got %: %',message,code,actual,sqlerrm;
  end;
  raise exception 'FAILED: %; operation unexpectedly succeeded',message;
end $$;
create function pg_temp.access_record(cost text default '0') returns jsonb language sql as $$
  select jsonb_build_object('title','密钥权限测试样本','provider','立画','costBasis','recorded',
    'params',jsonb_build_object('model','seedance-2.0','res','480p','ratio','1:1','seconds','4','video',false,'vin','2'),
    'P','','C',cost,'N','','usage','','date','2026-11-12','note','合成验收数据，事务回滚')
$$;
create temporary table reelay_key_fixture(name text primary key,payload jsonb not null);
grant select,insert,update on reelay_key_fixture to anon,authenticated;
create function pg_temp.access_token(name text) returns text language sql as $$
  select payload->>'session_token' from pg_temp.reelay_key_fixture where reelay_key_fixture.name=access_token.name
$$;
create function pg_temp.generated_key() returns text language sql as $$
  select payload->>'access_key' from pg_temp.reelay_key_fixture where name='created'
$$;

do $$ declare temp_schema text; begin
  select nspname into temp_schema from pg_namespace where oid=pg_my_temp_schema();
  execute format('grant usage on schema %I to anon,authenticated',temp_schema);
  execute format('grant execute on all functions in schema %I to anon,authenticated',temp_schema);
end $$;

-- Only explicitly synthetic values; no live key, session, email or secret.
insert into reelay_private.access_keys(id,owner_id,display_name,role,key_hash) values
 ('00000000-0000-4000-8000-00000000a101','00000000-0000-4000-8000-00000000b101','测试管理员','admin',reelay_private.access_hash('rk_'||repeat('a',64))),
 ('00000000-0000-4000-8000-00000000a102','00000000-0000-4000-8000-00000000b102','测试录入者','editor',reelay_private.access_hash('rk_'||repeat('b',64))),
 ('00000000-0000-4000-8000-00000000a103','00000000-0000-4000-8000-00000000b103','其他录入者','editor',reelay_private.access_hash('rk_'||repeat('c',64)));

-- A pre-migration owner UUID remains editable with a key carrying that UUID.
insert into reelay_private.records(id,owner_id,version,record)
 values('00000000-0000-4000-8000-00000000f100','00000000-0000-4000-8000-00000000b102',1,pg_temp.access_record('4'));
insert into reelay_private.record_revisions(record_id,version,record,archived,actor_id)
 values('00000000-0000-4000-8000-00000000f100',1,pg_temp.access_record('4'),false,'00000000-0000-4000-8000-00000000b102');

set local role anon;
select pg_temp.assert_access(public.reelay_access_identity(null)->>'authenticated'='false','missing session is a guest');
select pg_temp.assert_access(public.reelay_access_identity('')->>'role' is null,'empty session has no role');
select pg_temp.expect_access_error($q$select public.reelay_access_identity('rs_'||repeat('f',64))$q$,'PT401','unissued session rejected');
select pg_temp.expect_access_error($q$select public.reelay_access_unlock('rk_'||repeat('f',64))$q$,'PT401','unknown key rejected');
select pg_temp.expect_access_error($q$select public.reelay_access_unlock('short-password')$q$,'PT401','short key rejected');
select pg_temp.expect_access_error($q$select public.reelay_access_unlock(null)$q$,'PT401','null key rejected');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(null,'00000000-0000-4000-8000-00000000f101',0,pg_temp.access_record())$q$,'PT401','anonymous write needs lease');
select pg_temp.expect_access_error($q$select public.reelay_access_keys(null)$q$,'PT401','anonymous key list denied');
select pg_temp.expect_access_error('select * from reelay_private.access_keys','42501','direct keys denied');
select pg_temp.expect_access_error('select * from reelay_private.access_sessions','42501','direct sessions denied');
select pg_temp.expect_access_error('select * from reelay_private.access_key_changes','42501','direct key audit denied');
select pg_temp.expect_access_error($q$select reelay_private.require_access(null)$q$,'42501','unchecked helper cannot be called directly');
select pg_temp.expect_access_error('select public.reelay_identity()','42501','legacy mailbox identity disabled');
select pg_temp.expect_access_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000f101',0,pg_temp.access_record())$q$,'42501','legacy write disabled');
select pg_temp.assert_access((select count(*) from public.reelay_public_records())>=1,'anonymous facts remain readable');

insert into reelay_key_fixture values
 ('admin',public.reelay_access_unlock('rk_'||repeat('a',64))),
 ('editor',public.reelay_access_unlock('rk_'||repeat('b',64))),
 ('other',public.reelay_access_unlock('rk_'||repeat('c',64)));
select pg_temp.assert_access(public.reelay_access_identity(pg_temp.access_token('admin'))->>'role'='admin','admin key unlocks');
select pg_temp.assert_access(public.reelay_access_identity(pg_temp.access_token('editor'))->>'role'='editor','editor key unlocks');
select pg_temp.assert_access((select bool_and(payload->>'session_token' ~ '^rs_[0-9a-f]{64}$') from reelay_key_fixture),'opaque lease format');
select pg_temp.assert_access((select bool_and(payload->'identity'->>'expires_at'=payload->>'expires_at') from reelay_key_fixture),'one authoritative expiry');
select pg_temp.assert_access(not (public.reelay_access_identity(pg_temp.access_token('admin')) ?| array['email','owner_id','key_hash','session_token']),'identity does not leak credentials');

-- Data integrity and ownership are unchanged by the new authentication mode.
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f100',1,pg_temp.access_record('4.5'))->>'version'='2','legacy owner preserved');
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',0,pg_temp.access_record())->>'version'='1','zero cost accepted');
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',0,pg_temp.access_record())->>'version'='1','create retry idempotent');
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',1,pg_temp.access_record('12.34567890123456789012'))->>'version'='2','edit increments version');
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',1,pg_temp.access_record('12.34567890123456789012'))->>'version'='2','edit retry idempotent');
select pg_temp.assert_access((select record->>'C' from public.reelay_public_records() where id='00000000-0000-4000-8000-00000000f101')='12.34567890123456789012','exact decimal unchanged');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',1,pg_temp.access_record('9'))$q$,'PT409','stale update rejected');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('other'),'00000000-0000-4000-8000-00000000f101',2,pg_temp.access_record('9'))$q$,'PT403','other key cannot edit');
select pg_temp.expect_access_error($q$select public.reelay_access_archive_record(pg_temp.access_token('other'),'00000000-0000-4000-8000-00000000f101',2,true)$q$,'PT403','other key cannot archive');
select pg_temp.expect_access_error($q$select public.reelay_access_record_history(pg_temp.access_token('other'),'00000000-0000-4000-8000-00000000f101')$q$,'PT403','other key cannot read history');
select pg_temp.assert_access((select not can_edit from public.reelay_access_manage_records(pg_temp.access_token('other')) where id='00000000-0000-4000-8000-00000000f101'),'management marks others read only');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f102',0,pg_temp.access_record('-1'))$q$,'PT400','negative costs denied');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f102',0,pg_temp.access_record()||'{"owner_id":"spoof"}'::jsonb)$q$,'PT400','ownership spoof rejected');
select pg_temp.assert_access(jsonb_array_length(public.reelay_access_record_history(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101'))=2,'retries create no extra history');
select pg_temp.assert_access(public.reelay_access_archive_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',2,true)->>'version'='3','archive increments version');
select pg_temp.assert_access(public.reelay_access_archive_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',2,true)->>'version'='3','archive retry idempotent');
select pg_temp.assert_access(not exists(select 1 from public.reelay_public_records() where id='00000000-0000-4000-8000-00000000f101'),'archived not public');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',3,pg_temp.access_record('7'))$q$,'PT409','archived update rejected');
select pg_temp.assert_access(public.reelay_access_archive_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',3,false)->>'version'='4','restore increments version');
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('admin'),'00000000-0000-4000-8000-00000000f101',4,pg_temp.access_record('8'))->>'version'='5','admin can edit another owner');
select pg_temp.expect_access_error($q$select public.reelay_access_keys(pg_temp.access_token('editor'))$q$,'PT403','editor cannot list keys');
select pg_temp.expect_access_error($q$select public.reelay_access_create_key(pg_temp.access_token('editor'),'forged admin','admin')$q$,'PT403','editor cannot create key');
select pg_temp.expect_access_error($q$select public.reelay_access_set_key(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000a103',false)$q$,'PT403','editor cannot revoke others');

-- Key management reveals a raw secret only when creating or rotating it.
insert into reelay_key_fixture values('created',public.reelay_access_create_key(pg_temp.access_token('admin'),'新增录入者','editor'));
select pg_temp.assert_access(pg_temp.generated_key() ~ '^rk_[0-9a-f]{64}$','created key format');
select pg_temp.assert_access((select count(distinct payload->>'session_token') from reelay_key_fixture where name in ('admin','editor','other'))=3,'sessions are independently generated');
select pg_temp.assert_access(not exists(select 1 from jsonb_array_elements(public.reelay_access_keys(pg_temp.access_token('admin'))) k where k ?| array['owner_id','key_hash','access_key','session_token','email']),'key list excludes all credentials and emails');
insert into reelay_key_fixture values('created-session',public.reelay_access_unlock(pg_temp.generated_key()));
select pg_temp.assert_access(public.reelay_access_identity(pg_temp.access_token('created-session'))->>'display_name'='新增录入者','new key actually works');
select pg_temp.expect_access_error($q$select public.reelay_access_create_key(pg_temp.access_token('admin'),'','editor')$q$,'PT400','empty display name denied');
select pg_temp.expect_access_error($q$select public.reelay_access_create_key(pg_temp.access_token('admin'),'name','owner')$q$,'PT400','invalid role denied');
select public.reelay_access_set_key(pg_temp.access_token('admin'),'00000000-0000-4000-8000-00000000a102',false);
select pg_temp.expect_access_error($q$select public.reelay_access_identity(pg_temp.access_token('editor'))$q$,'PT401','revocation immediately invalidates session');
select pg_temp.expect_access_error($q$select public.reelay_access_unlock('rk_'||repeat('b',64))$q$,'PT401','disabled key cannot unlock');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',5,pg_temp.access_record('10'))$q$,'PT401','revoked session cannot write');
select public.reelay_access_set_key(pg_temp.access_token('admin'),'00000000-0000-4000-8000-00000000a102',true);
select pg_temp.expect_access_error($q$select public.reelay_access_identity(pg_temp.access_token('editor'))$q$,'PT401','reenable never resurrects old lease');
update reelay_key_fixture set payload=public.reelay_access_unlock('rk_'||repeat('b',64)) where name='editor';
insert into reelay_key_fixture values('rotated',public.reelay_access_rotate_key(pg_temp.access_token('admin'),'00000000-0000-4000-8000-00000000a102'));
select pg_temp.expect_access_error($q$select public.reelay_access_unlock('rk_'||repeat('b',64))$q$,'PT401','old key no longer unlocks after rotation');
select pg_temp.expect_access_error($q$select public.reelay_access_identity(pg_temp.access_token('editor'))$q$,'PT401','rotation invalidates all old sessions');
update reelay_key_fixture set payload=public.reelay_access_unlock((select payload->>'access_key' from reelay_key_fixture where name='rotated')) where name='editor';
select pg_temp.assert_access(public.reelay_access_save_record(pg_temp.access_token('editor'),'00000000-0000-4000-8000-00000000f101',5,pg_temp.access_record('10'))->>'version'='6','rotated key retains original ownership');
select pg_temp.expect_access_error($q$select public.reelay_access_rotate_key(pg_temp.access_token('admin'),'00000000-0000-4000-8000-00000000a101')$q$,'PT409','self rotation requires another administrator');

-- Logout is idempotent and does not revoke a different session for that key.
insert into reelay_key_fixture values('other-second',public.reelay_access_unlock('rk_'||repeat('c',64)));
select public.reelay_access_lock(pg_temp.access_token('other'));
select public.reelay_access_lock(pg_temp.access_token('other'));
select public.reelay_access_lock(null);
select pg_temp.expect_access_error($q$select public.reelay_access_identity(pg_temp.access_token('other'))$q$,'PT401','logout invalidates that lease');
select pg_temp.assert_access(public.reelay_access_identity(pg_temp.access_token('other-second'))->>'role'='editor','other device remains active');

-- Even a verified legacy Auth admin has no access without a key session.
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000b101',true);
select set_config('request.jwt.claims','{"role":"authenticated","user_metadata":{"role":"admin"}}',true);
select pg_temp.expect_access_error('select public.reelay_manage_records()','42501','legacy management disabled');
select pg_temp.expect_access_error('select public.reelay_members()','42501','legacy member management disabled');
select pg_temp.expect_access_error($q$select reelay_private.require_member(true)$q$,'42501','legacy private helper disabled');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(null,'00000000-0000-4000-8000-00000000f102',0,pg_temp.access_record())$q$,'PT401','auth JWT never substitutes for key');

reset role;
select pg_temp.assert_access((select bool_and(extract(epoch from expires_at-created_at)=604800) from reelay_private.access_sessions),'all sessions exactly seven days');
select pg_temp.assert_access(not exists(select 1 from reelay_private.access_keys where key_hash like 'rk_%'),'only key hashes stored');
select pg_temp.assert_access(not exists(select 1 from reelay_private.access_sessions where token_hash like 'rs_%'),'only session hashes stored');
select pg_temp.assert_access((select owner_id from reelay_private.access_keys where id='00000000-0000-4000-8000-00000000a102')='00000000-0000-4000-8000-00000000b102','stable owner survives rotation');
select pg_temp.assert_access((select count(*) from reelay_private.record_revisions where record_id='00000000-0000-4000-8000-00000000f101')=6,'all actual record changes audited');
select pg_temp.assert_access(not exists(select 1 from reelay_private.access_key_changes c where c.next_value ?| array['key_hash','access_key','session_token'] or c.previous_value ?| array['key_hash','access_key','session_token']),'audit never contains secrets');
update reelay_private.access_sessions set created_at=statement_timestamp()-interval '8 days',expires_at=statement_timestamp()-interval '1 day'
 where token_hash=reelay_private.access_hash(pg_temp.access_token('created-session'));
-- Make the last-admin fixture deterministic even on an already bootstrapped DB.
update reelay_private.access_keys set active=false where role='admin' and id<>'00000000-0000-4000-8000-00000000a101';
set local role anon;
select pg_temp.expect_access_error($q$select public.reelay_access_identity(pg_temp.access_token('created-session'))$q$,'PT401','expired lease rejected');
select pg_temp.expect_access_error($q$select public.reelay_access_save_record(pg_temp.access_token('created-session'),'00000000-0000-4000-8000-00000000f102',0,pg_temp.access_record())$q$,'PT401','expired lease cannot write');
select pg_temp.expect_access_error($q$select public.reelay_access_set_key(pg_temp.access_token('admin'),'00000000-0000-4000-8000-00000000a101',false)$q$,'PT409','last admin cannot be disabled');
reset role;
select pg_temp.assert_access(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'reelay_%' and p.prosecdef),'all public wrappers security invoker');
select pg_temp.assert_access((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='reelay_private' and c.relkind='r'),'all private tables retain RLS');
select pg_temp.assert_access(not exists(select 1 from public.reelay_public_records() r where to_jsonb(r) ?| array['email','owner_id','actor_id','key_id','key_hash','session_token']),'public facts expose no private metadata');
select 'Reelay access-key SQL permission and persistence checks passed' as result;
rollback;
