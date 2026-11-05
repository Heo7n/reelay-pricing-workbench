-- Run as postgres against a dedicated LOCAL/test Supabase database after schema.sql.
-- All fixtures and changes are rolled back. Never run against unrelated projects.
begin;

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data)
values
 ('00000000-0000-4000-8000-00000000c101','reelay-admin-test@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-00000000c102','reelay-editor-test@example.invalid',now(),'{}'),
 ('00000000-0000-4000-8000-00000000c103','reelay-other-test@example.invalid',now(),'{"role":"admin"}'),
 ('00000000-0000-4000-8000-00000000c104','reelay-outsider-test@example.invalid',now(),'{"role":"admin"}'),
 ('00000000-0000-4000-8000-00000000c105','reelay-unverified-test@example.invalid',null,'{}');
insert into reelay_private.members(id,email,display_name,role)
values
 ('00000000-0000-4000-8000-00000000d101','reelay-admin-test@example.invalid','测试管理员','admin'),
 ('00000000-0000-4000-8000-00000000d102','reelay-editor-test@example.invalid','测试录入者','editor'),
 ('00000000-0000-4000-8000-00000000d103','reelay-other-test@example.invalid','其他录入者','editor'),
 ('00000000-0000-4000-8000-00000000d105','reelay-unverified-test@example.invalid','未验证邮箱','editor');

-- Temporary helpers contain no production privileges or persistent state.
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAILED: %',message; end if; end $$;
create function pg_temp.expect_error(statement text,code text,message text) returns void language plpgsql as $$
declare actual text;
begin
  begin execute statement;
  exception when others then get stacked diagnostics actual = returned_sqlstate;
    if actual = code then return; end if;
    raise exception 'FAILED: %; expected %, got %: %',message,code,actual,sqlerrm;
  end;
  raise exception 'FAILED: %; operation unexpectedly succeeded',message;
end $$;
create function pg_temp.record_fixture(cost text default '0') returns jsonb language sql as $$
  select jsonb_build_object('title','权限测试样本','provider','立画','costBasis','recorded',
    'params',jsonb_build_object('model','seedance-2.0','res','480p','ratio','1:1','seconds','4','video',false,'vin','2'),
    'P','','C',cost,'N','','usage','','date','2026-11-05','note','测试数据，不应持久化')
$$;
do $$ declare temp_schema text; begin
  select nspname into temp_schema from pg_namespace where oid=pg_my_temp_schema();
  execute format('grant usage on schema %I to anon,authenticated',temp_schema);
  execute format('grant execute on all functions in schema %I to anon,authenticated',temp_schema);
end $$;

-- Anonymous users can read only current public facts, never write or list people.
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
select pg_temp.assert_true(public.reelay_identity()->>'authenticated'='false','anonymous identity');
select count(*) from public.reelay_public_records();
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',0,pg_temp.record_fixture())$q$,'42501','anonymous write denied');
select pg_temp.expect_error('select public.reelay_members()','42501','anonymous member list denied');
select pg_temp.expect_error('select * from reelay_private.records','42501','direct records denied');
select pg_temp.expect_error('select reelay_private.member_identity()','42501','private helper execution denied');

-- Merely authenticating (or adding user_metadata.role) never grants write rights.
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c104',true);
select pg_temp.assert_true((public.reelay_identity()->'role')='null'::jsonb,'nonmember has no role');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',0,pg_temp.record_fixture())$q$,'PT403','nonmember write denied');
select pg_temp.expect_error('select public.reelay_manage_records()','PT403','nonmember management denied');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c105',true);
select pg_temp.assert_true((public.reelay_identity()->'role')='null'::jsonb,'unverified invitation is not authority');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',0,pg_temp.record_fixture())$q$,'PT403','unverified write denied');

-- Invited, verified editors can save exact decimal facts, including zero.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c102',true);
select pg_temp.assert_true(public.reelay_identity()->>'role'='editor','editor identified');
select pg_temp.assert_true(public.reelay_save_record('00000000-0000-4000-8000-00000000e101',0,pg_temp.record_fixture())->>'version'='1','zero cost accepted');
select pg_temp.assert_true(public.reelay_save_record('00000000-0000-4000-8000-00000000e101',0,pg_temp.record_fixture())->>'version'='1','create retry idempotent');
select pg_temp.assert_true(public.reelay_save_record('00000000-0000-4000-8000-00000000e101',1,pg_temp.record_fixture('12.34567890123456789012'))->>'version'='2','edit increments version');
select pg_temp.assert_true(public.reelay_save_record('00000000-0000-4000-8000-00000000e101',1,pg_temp.record_fixture('12.34567890123456789012'))->>'version'='2','edit retry idempotent');
select pg_temp.assert_true((select record->>'C' from public.reelay_public_records() where id='00000000-0000-4000-8000-00000000e101')='12.34567890123456789012','decimal text survives unchanged');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',1,pg_temp.record_fixture('9'))$q$,'PT409','stale edit rejected');
select pg_temp.expect_error('select public.reelay_members()','PT403','editor cannot list members');
select pg_temp.expect_error('select * from reelay_private.record_revisions','42501','editor cannot bypass history RPC');
select pg_temp.assert_true(jsonb_array_length(public.reelay_record_history('00000000-0000-4000-8000-00000000e101'))=2,'history contains actual mutations only');

-- Validate hostile/malformed payloads on the server, not only the UI.
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,pg_temp.record_fixture('-1'))$q$,'PT400','negative cost denied');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,pg_temp.record_fixture('NaN'))$q$,'PT400','non-numeric cost denied');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,pg_temp.record_fixture()||'{"owner_id":"spoof"}'::jsonb)$q$,'PT400','ownership spoof field denied');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,pg_temp.record_fixture()||'{"date":"2026-02-30"}'::jsonb)$q$,'PT400','invalid date denied');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,pg_temp.record_fixture()||'{"usage":"bad"}'::jsonb)$q$,'PT400','invalid usage denied');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,jsonb_set(pg_temp.record_fixture(),'{params,model}','"seedance-2.0-fast"')||jsonb_build_object('params',jsonb_set(jsonb_set(pg_temp.record_fixture()->'params','{model}','"seedance-2.0-fast"'),'{res}','"1080p"')))$q$,'PT400','model resolution mismatch denied');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e102',0,pg_temp.record_fixture()||'{"historicalPricing":{"q":"0","M":"1.65"}}'::jsonb)$q$,'PT400','invalid historical pricing denied');

-- Another editor can use the public record but cannot mutate it or see revisions.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c103',true);
select pg_temp.assert_true((select not can_edit from public.reelay_manage_records() where id='00000000-0000-4000-8000-00000000e101'),'other editor marked readonly');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',2,pg_temp.record_fixture('7'))$q$,'PT403','other editor update denied');
select pg_temp.expect_error($q$select public.reelay_archive_record('00000000-0000-4000-8000-00000000e101',2,true)$q$,'PT403','other editor archive denied');
select pg_temp.expect_error($q$select public.reelay_record_history('00000000-0000-4000-8000-00000000e101')$q$,'PT403','other editor history denied');

-- Owner archive is reversible; public reads omit withdrawn records.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c102',true);
select pg_temp.assert_true(public.reelay_archive_record('00000000-0000-4000-8000-00000000e101',2,true)->>'version'='3','archive increments version');
select pg_temp.assert_true(public.reelay_archive_record('00000000-0000-4000-8000-00000000e101',2,true)->>'version'='3','archive retry idempotent');
select pg_temp.assert_true(not exists(select 1 from public.reelay_public_records() where id='00000000-0000-4000-8000-00000000e101'),'archived not public');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',3,pg_temp.record_fixture('7'))$q$,'PT409','archived edit needs explicit restore');
select pg_temp.assert_true(public.reelay_archive_record('00000000-0000-4000-8000-00000000e101',3,false)->>'version'='4','restore increments version');
select pg_temp.assert_true(exists(select 1 from public.reelay_public_records() where id='00000000-0000-4000-8000-00000000e101'),'restored public again');

-- Admin can maintain other records, grant/revoke access and inspect membership.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c101',true);
select pg_temp.assert_true(public.reelay_save_record('00000000-0000-4000-8000-00000000e101',4,pg_temp.record_fixture('8'))->>'version'='5','admin can edit another owner');
select public.reelay_set_member('00000000-0000-4000-8000-00000000d102','reelay-editor-test@example.invalid','测试录入者','editor',false);
select pg_temp.assert_true(jsonb_array_length(public.reelay_members())>=4,'admin member listing');
select pg_temp.expect_error($q$select public.reelay_set_member('00000000-0000-4000-8000-00000000d103','changed@example.invalid','其他','editor',true)$q$,'PT400','member email cannot be silently reassigned');

-- Revocation applies without refreshing or clearing the original JWT.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c102',true);
select pg_temp.assert_true(public.reelay_identity()->'role'='null'::jsonb,'revoked member loses role immediately');
select pg_temp.expect_error($q$select public.reelay_save_record('00000000-0000-4000-8000-00000000e101',5,pg_temp.record_fixture('10'))$q$,'PT403','revoked member cannot write');

reset role;
-- Remove other active-admin fixtures only inside this rollback transaction so
-- the last-admin assertion remains deterministic on an already bootstrapped DB.
update reelay_private.members set active=false where role='admin' and id<>'00000000-0000-4000-8000-00000000d101';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000c101',true);
select pg_temp.expect_error($q$select public.reelay_set_member('00000000-0000-4000-8000-00000000d101','reelay-admin-test@example.invalid','测试管理员','editor',true)$q$,'PT409','last admin cannot be demoted');
select pg_temp.expect_error($q$select public.reelay_set_member('00000000-0000-4000-8000-00000000d101','reelay-admin-test@example.invalid','测试管理员','admin',false)$q$,'PT409','last admin cannot be disabled');

reset role;
select pg_temp.assert_true(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'reelay_%' and p.prosecdef),'no public security-definer RPC');
select pg_temp.assert_true((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='reelay_private' and c.relkind='r'),'RLS enabled on all private tables');
select pg_temp.assert_true((select count(*) from reelay_private.record_revisions where record_id='00000000-0000-4000-8000-00000000e101')=5,'all modifications audited');
select pg_temp.assert_true(not exists(select 1 from public.reelay_public_records() r where (to_jsonb(r) ?| array['email','owner_id','actor_id','user_id','can_edit'])),'public rows contain no identity metadata');
select 'Reelay cloud SQL permission and persistence checks passed' as result;
rollback;
