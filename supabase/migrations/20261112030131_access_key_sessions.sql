-- Incremental replacement of mailbox authorization with scoped access keys.
-- Apply after schema.sql. Existing facts, ownership and audit history stay intact.
-- Bootstrap the first key hash separately; no live credential belongs here.
begin;

create table if not exists reelay_private.access_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default gen_random_uuid(),
  display_name text not null check (length(btrim(display_name)) between 1 and 60),
  role text not null check (role in ('admin','editor')),
  active boolean not null default true,
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create table if not exists reelay_private.access_sessions (
  id uuid primary key default gen_random_uuid(),
  key_id uuid not null references reelay_private.access_keys(id),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  check (expires_at > created_at and expires_at <= created_at + interval '168 hours')
);
create index if not exists reelay_access_sessions_key on reelay_private.access_sessions(key_id);
create table if not exists reelay_private.access_key_changes (
  id bigint generated always as identity primary key,
  key_id uuid not null references reelay_private.access_keys(id),
  actor_key_id uuid not null references reelay_private.access_keys(id),
  action text not null check (action in ('created','enabled','disabled','rotated')),
  previous_value jsonb,
  next_value jsonb not null,
  changed_at timestamptz not null default clock_timestamp()
);
create index if not exists reelay_access_key_changes_key on reelay_private.access_key_changes(key_id);
create index if not exists reelay_access_key_changes_actor on reelay_private.access_key_changes(actor_key_id);
alter table reelay_private.access_keys enable row level security;
alter table reelay_private.access_sessions enable row level security;
alter table reelay_private.access_key_changes enable row level security;
revoke all on all tables in schema reelay_private from public,anon,authenticated;
revoke all on all sequences in schema reelay_private from public,anon,authenticated;

create or replace function reelay_private.access_hash(secret text)
returns text language sql immutable strict security invoker set search_path = ''
as $$ select encode(sha256(convert_to(secret,'UTF8')),'hex') $$;

-- Three independently random UUIDs provide more than 256 bits of entropy;
-- SHA-256 produces a fixed-length secret without an extension dependency.
create or replace function reelay_private.access_secret(prefix text)
returns text language sql volatile security invoker set search_path = ''
as $$ select prefix || reelay_private.access_hash(gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text) $$;

create or replace function reelay_private.access_metadata(k reelay_private.access_keys)
returns jsonb language sql immutable security invoker set search_path = ''
as $$ select jsonb_build_object('id',k.id,'display_name',k.display_name,'role',k.role,
  'active',k.active,'created_at',k.created_at,'updated_at',k.updated_at) $$;

-- Reads also check the current key, so disabling a key invalidates every lease
-- immediately, regardless of the browser's cached expiry or role.
create or replace function reelay_private.access_identity(session_token text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare k reelay_private.access_keys; s reelay_private.access_sessions;
begin
  if session_token is null or session_token = '' then
    return '{"authenticated":false,"role":null,"display_name":"","key_id":null,"expires_at":null}'::jsonb;
  end if;
  if session_token !~ '^rs_[0-9a-f]{64}$' then
    raise exception using errcode='PT401',message='录入权限已失效，请重新输入密钥';
  end if;
  select * into s from reelay_private.access_sessions a
    where a.token_hash=reelay_private.access_hash(session_token)
      and not a.revoked and a.expires_at > clock_timestamp();
  select * into k from reelay_private.access_keys a where a.id=s.key_id and a.active;
  if k.id is null then raise exception using errcode='PT401',message='录入权限已失效，请重新输入密钥'; end if;
  return jsonb_build_object('authenticated',true,'role',k.role,'display_name',k.display_name,
    'key_id',k.id,'expires_at',s.expires_at);
end
$$;

-- Mutations share-lock the current key/session. A completed revocation therefore
-- cannot be followed by a write that checked an older active-key snapshot.
create or replace function reelay_private.require_access(session_token text,admin_only boolean default false)
returns reelay_private.access_keys language plpgsql volatile security definer set search_path = ''
as $$
declare k reelay_private.access_keys;
begin
  if session_token is null or session_token !~ '^rs_[0-9a-f]{64}$' then
    raise exception using errcode='PT401',message='请先输入有效的录入密钥';
  end if;
  select a.* into k from reelay_private.access_sessions s join reelay_private.access_keys a on a.id=s.key_id
    where s.token_hash=reelay_private.access_hash(session_token)
      and not s.revoked and s.expires_at > clock_timestamp() and a.active
    for share of a,s;
  if k.id is null then raise exception using errcode='PT401',message='录入权限已失效，请重新输入密钥'; end if;
  if admin_only and k.role <> 'admin' then raise exception using errcode='PT403',message='此操作需要管理员密钥'; end if;
  return k;
end
$$;

create or replace function reelay_private.access_unlock(access_key text)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare k reelay_private.access_keys; raw_token text; issued timestamptz; expiry timestamptz;
begin
  if access_key is null or access_key !~ '^rk_[0-9a-f]{64}$' then
    raise exception using errcode='PT401',message='密钥无效或已停用，请检查后重试';
  end if;
  select * into k from reelay_private.access_keys a
    where a.key_hash=reelay_private.access_hash(access_key) and a.active for share;
  if k.id is null then raise exception using errcode='PT401',message='密钥无效或已停用，请检查后重试'; end if;
  raw_token := reelay_private.access_secret('rs_');
  issued := clock_timestamp(); expiry := issued + interval '168 hours';
  insert into reelay_private.access_sessions(key_id,token_hash,created_at,expires_at)
    values(k.id,reelay_private.access_hash(raw_token),issued,expiry);
  return jsonb_build_object('session_token',raw_token,'expires_at',expiry,
    'identity',jsonb_build_object('authenticated',true,'role',k.role,'display_name',k.display_name,
      'key_id',k.id,'expires_at',expiry));
end
$$;

create or replace function reelay_private.access_lock(session_token text)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
begin
  if session_token ~ '^rs_[0-9a-f]{64}$' then
    update reelay_private.access_sessions set revoked=true
      where token_hash=reelay_private.access_hash(session_token) and not revoked;
  end if;
  return '{"locked":true}'::jsonb;
end
$$;

create or replace function reelay_private.access_keys_list(session_token text)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare result jsonb;
begin
  perform reelay_private.require_access(session_token,true);
  select coalesce(jsonb_agg(reelay_private.access_metadata(k) order by k.created_at,k.id),'[]'::jsonb)
    into result from reelay_private.access_keys k;
  return result;
end
$$;

create or replace function reelay_private.access_create_key(session_token text,display_name text,key_role text default 'editor')
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare actor reelay_private.access_keys; k reelay_private.access_keys; raw_key text; result jsonb;
begin
  lock table reelay_private.access_keys in share row exclusive mode;
  actor := reelay_private.require_access(session_token,true);
  if display_name is null or length(btrim(display_name)) not between 1 and 60
    or key_role is null or key_role not in ('admin','editor') then
    raise exception using errcode='PT400',message='请填写密钥名称和有效权限';
  end if;
  raw_key := reelay_private.access_secret('rk_');
  insert into reelay_private.access_keys(display_name,role,key_hash)
    values(btrim(display_name),key_role,reelay_private.access_hash(raw_key)) returning * into k;
  result := reelay_private.access_metadata(k);
  insert into reelay_private.access_key_changes(key_id,actor_key_id,action,next_value)
    values(k.id,actor.id,'created',result);
  return jsonb_build_object('key',result,'access_key',raw_key);
end
$$;

create or replace function reelay_private.access_set_key(session_token text,key_id uuid,active boolean)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare actor reelay_private.access_keys; k reelay_private.access_keys; previous jsonb; result jsonb;
begin
  -- Serialize all key changes before checking the last active administrator.
  lock table reelay_private.access_keys in share row exclusive mode;
  actor := reelay_private.require_access(session_token,true);
  if key_id is null or active is null then raise exception using errcode='PT400',message='密钥编号或状态无效'; end if;
  select * into k from reelay_private.access_keys a where a.id=key_id for update;
  if k.id is null then raise exception using errcode='PT404',message='密钥不存在'; end if;
  if k.active=active then return reelay_private.access_metadata(k); end if;
  if k.role='admin' and k.active and not active
    and (select count(*) from reelay_private.access_keys a where a.active and a.role='admin') <= 1 then
    raise exception using errcode='PT409',message='至少保留一把启用的管理员密钥';
  end if;
  previous := reelay_private.access_metadata(k);
  update reelay_private.access_keys set active=access_set_key.active,updated_at=clock_timestamp()
    where id=key_id returning * into k;
  -- Re-enabling a key permits new unlocks, never resurrects a revoked lease.
  if not active then update reelay_private.access_sessions set revoked=true where access_sessions.key_id=access_set_key.key_id; end if;
  result := reelay_private.access_metadata(k);
  insert into reelay_private.access_key_changes(key_id,actor_key_id,action,previous_value,next_value)
    values(k.id,actor.id,case when active then 'enabled' else 'disabled' end,previous,result);
  return result;
end
$$;

create or replace function reelay_private.access_rotate_key(session_token text,key_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare actor reelay_private.access_keys; k reelay_private.access_keys; previous jsonb; result jsonb; raw_key text;
begin
  lock table reelay_private.access_keys in share row exclusive mode;
  actor := reelay_private.require_access(session_token,true);
  if key_id is null then raise exception using errcode='PT400',message='密钥编号无效'; end if;
  if key_id=actor.id then raise exception using errcode='PT409',message='请先使用另一把管理员密钥，再更换当前密钥'; end if;
  select * into k from reelay_private.access_keys a where a.id=key_id for update;
  if k.id is null then raise exception using errcode='PT404',message='密钥不存在'; end if;
  previous := reelay_private.access_metadata(k);
  raw_key := reelay_private.access_secret('rk_');
  update reelay_private.access_keys set key_hash=reelay_private.access_hash(raw_key),updated_at=clock_timestamp()
    where id=key_id returning * into k;
  update reelay_private.access_sessions set revoked=true where access_sessions.key_id=access_rotate_key.key_id;
  result := reelay_private.access_metadata(k);
  insert into reelay_private.access_key_changes(key_id,actor_key_id,action,previous_value,next_value)
    values(k.id,actor.id,'rotated',previous,result);
  return jsonb_build_object('key',result,'access_key',raw_key);
end
$$;

create or replace function reelay_private.access_manage_records(session_token text)
returns table(id uuid,version integer,record jsonb,created_at timestamptz,updated_at timestamptz,archived boolean,can_edit boolean)
language plpgsql volatile security definer set search_path = ''
as $$
declare k reelay_private.access_keys;
begin
  k := reelay_private.require_access(session_token);
  return query select r.id,r.version,r.record,r.created_at,r.updated_at,r.archived,
    (r.owner_id=k.owner_id or k.role='admin') from reelay_private.records r
    where not r.archived or r.owner_id=k.owner_id or k.role='admin' order by r.id;
end
$$;

create or replace function reelay_private.access_save_record(session_token text,record_id uuid,expected_version integer,record jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare k reelay_private.access_keys; r reelay_private.records; normalized jsonb;
begin
  k := reelay_private.require_access(session_token);
  if record_id is null or expected_version is null or expected_version < 0 or expected_version > 2147483645 then
    raise exception using errcode='PT400',message='记录编号或版本无效';
  end if;
  normalized := reelay_private.validate_record(record);
  perform pg_advisory_xact_lock(hashtextextended(record_id::text,0));
  select * into r from reelay_private.records where id=record_id for update;
  if found then
    if r.owner_id <> k.owner_id and k.role <> 'admin' then raise exception using errcode='PT403',message='只能修改自己录入的实测'; end if;
    if r.archived then raise exception using errcode='PT409',message='记录已撤回，请先恢复再编辑'; end if;
    if r.version=expected_version+1 and r.record=normalized then return reelay_private.row_value(r,true); end if;
    if r.version <> expected_version then raise exception using errcode='PT409',message='记录已被更新，请刷新后重新编辑'; end if;
    if r.record=normalized then return reelay_private.row_value(r,true); end if;
    update reelay_private.records set record=normalized,version=r.version+1,updated_at=clock_timestamp()
      where id=record_id returning * into r;
  else
    if expected_version <> 0 then raise exception using errcode='PT404',message='实测记录不存在'; end if;
    insert into reelay_private.records(id,owner_id,version,record)
      values(record_id,k.owner_id,1,normalized) returning * into r;
  end if;
  insert into reelay_private.record_revisions(record_id,version,record,archived,actor_id,changed_at)
    values(r.id,r.version,r.record,r.archived,k.owner_id,r.updated_at);
  return reelay_private.row_value(r,true);
end
$$;

create or replace function reelay_private.access_archive_record(session_token text,record_id uuid,expected_version integer,archived boolean)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare k reelay_private.access_keys; r reelay_private.records;
begin
  k := reelay_private.require_access(session_token);
  if record_id is null or expected_version is null or expected_version < 1 or expected_version > 2147483645 or archived is null then
    raise exception using errcode='PT400',message='记录编号、版本或撤回状态无效';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(record_id::text,0));
  select * into r from reelay_private.records where id=record_id for update;
  if not found then raise exception using errcode='PT404',message='实测记录不存在'; end if;
  if r.owner_id <> k.owner_id and k.role <> 'admin' then raise exception using errcode='PT403',message='只能撤回或恢复自己录入的实测'; end if;
  if r.version=expected_version+1 and r.archived=access_archive_record.archived then return reelay_private.row_value(r,true); end if;
  if r.version <> expected_version then raise exception using errcode='PT409',message='记录已被更新，请刷新后再操作'; end if;
  if r.archived=access_archive_record.archived then return reelay_private.row_value(r,true); end if;
  update reelay_private.records set archived=access_archive_record.archived,version=r.version+1,updated_at=clock_timestamp()
    where id=record_id returning * into r;
  insert into reelay_private.record_revisions(record_id,version,record,archived,actor_id,changed_at)
    values(r.id,r.version,r.record,r.archived,k.owner_id,r.updated_at);
  return reelay_private.row_value(r,true);
end
$$;

create or replace function reelay_private.access_record_history(session_token text,record_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare k reelay_private.access_keys; r reelay_private.records; result jsonb;
begin
  k := reelay_private.require_access(session_token);
  select * into r from reelay_private.records where id=record_id;
  if not found then raise exception using errcode='PT404',message='实测记录不存在'; end if;
  if r.owner_id <> k.owner_id and k.role <> 'admin' then raise exception using errcode='PT403',message='没有查看此记录历史的权限'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('version',v.version,'record',v.record,'archived',v.archived,'changed_at',v.changed_at) order by v.version desc),'[]'::jsonb)
    into result from reelay_private.record_revisions v where v.record_id=access_record_history.record_id;
  return result;
end
$$;

-- Public wrappers do not own privileged access. Every helper checks its token.
create or replace function public.reelay_access_unlock(access_key text) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_unlock(access_key) $$;
create or replace function public.reelay_access_identity(session_token text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select reelay_private.access_identity(session_token) $$;
create or replace function public.reelay_access_lock(session_token text) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_lock(session_token) $$;
create or replace function public.reelay_access_keys(session_token text) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_keys_list(session_token) $$;
create or replace function public.reelay_access_create_key(session_token text,display_name text,key_role text default 'editor') returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_create_key(session_token,display_name,key_role) $$;
create or replace function public.reelay_access_set_key(session_token text,key_id uuid,active boolean) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_set_key(session_token,key_id,active) $$;
create or replace function public.reelay_access_rotate_key(session_token text,key_id uuid) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_rotate_key(session_token,key_id) $$;
create or replace function public.reelay_access_manage_records(session_token text)
returns table(id uuid,version integer,record jsonb,created_at timestamptz,updated_at timestamptz,archived boolean,can_edit boolean)
language sql volatile security invoker set search_path = '' as $$ select * from reelay_private.access_manage_records(session_token) $$;
create or replace function public.reelay_access_save_record(session_token text,record_id uuid,expected_version integer,record jsonb) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_save_record(session_token,record_id,expected_version,record) $$;
create or replace function public.reelay_access_archive_record(session_token text,record_id uuid,expected_version integer,archived boolean) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_archive_record(session_token,record_id,expected_version,archived) $$;
create or replace function public.reelay_access_record_history(session_token text,record_id uuid) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select reelay_private.access_record_history(session_token,record_id) $$;

-- Retain historical email tables/functions for audit, but remove every client
-- execution path. A valid old Auth JWT is no longer a recording credential.
revoke all on all functions in schema reelay_private from public,anon,authenticated;
revoke all on function public.reelay_identity(),public.reelay_manage_records(),
  public.reelay_save_record(uuid,integer,jsonb),public.reelay_archive_record(uuid,integer,boolean),
  public.reelay_record_history(uuid),public.reelay_members(),public.reelay_set_member(uuid,text,text,text,boolean)
  from public,anon,authenticated;
revoke all on function public.reelay_access_unlock(text),public.reelay_access_identity(text),public.reelay_access_lock(text),
  public.reelay_access_keys(text),public.reelay_access_create_key(text,text,text),public.reelay_access_set_key(text,uuid,boolean),
  public.reelay_access_rotate_key(text,uuid),public.reelay_access_manage_records(text),public.reelay_access_save_record(text,uuid,integer,jsonb),
  public.reelay_access_archive_record(text,uuid,integer,boolean),public.reelay_access_record_history(text,uuid)
  from public,anon,authenticated;
grant execute on function reelay_private.public_records() to anon,authenticated;
grant execute on function public.reelay_access_unlock(text),public.reelay_access_identity(text),public.reelay_access_lock(text),
  public.reelay_access_keys(text),public.reelay_access_create_key(text,text,text),public.reelay_access_set_key(text,uuid,boolean),
  public.reelay_access_rotate_key(text,uuid),public.reelay_access_manage_records(text),public.reelay_access_save_record(text,uuid,integer,jsonb),
  public.reelay_access_archive_record(text,uuid,integer,boolean),public.reelay_access_record_history(text,uuid),
  reelay_private.access_unlock(text),reelay_private.access_identity(text),reelay_private.access_lock(text),
  reelay_private.access_keys_list(text),reelay_private.access_create_key(text,text,text),reelay_private.access_set_key(text,uuid,boolean),
  reelay_private.access_rotate_key(text,uuid),reelay_private.access_manage_records(text),reelay_private.access_save_record(text,uuid,integer,jsonb),
  reelay_private.access_archive_record(text,uuid,integer,boolean),reelay_private.access_record_history(text,uuid)
  to anon,authenticated;

notify pgrst,'reload schema';
commit;
