-- Reelay public observations / invite-only editing.
-- Apply only to the calculator's dedicated Supabase project, as postgres.
-- This is an editable schema source, not a generated migration.
begin;

create schema if not exists reelay_private;
revoke all on schema reelay_private from public, anon, authenticated;
grant usage on schema reelay_private to anon, authenticated;

create table if not exists reelay_private.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and length(email) between 3 and 254),
  display_name text not null check (length(display_name) between 1 and 60),
  role text not null check (role in ('admin', 'editor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reelay_private.records (
  id uuid primary key,
  owner_id uuid not null,
  version integer not null check (version > 0),
  record jsonb not null check (jsonb_typeof(record) = 'object'),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reelay_records_owner on reelay_private.records (owner_id);

create table if not exists reelay_private.record_revisions (
  record_id uuid not null references reelay_private.records (id),
  version integer not null check (version > 0),
  record jsonb not null,
  archived boolean not null,
  actor_id uuid not null,
  changed_at timestamptz not null default now(),
  primary key (record_id, version)
);

create table if not exists reelay_private.member_changes (
  id bigint generated always as identity primary key,
  member_id uuid not null references reelay_private.members (id),
  actor_id uuid not null,
  previous_value jsonb,
  next_value jsonb not null,
  changed_at timestamptz not null default now()
);

alter table reelay_private.members enable row level security;
alter table reelay_private.records enable row level security;
alter table reelay_private.record_revisions enable row level security;
alter table reelay_private.member_changes enable row level security;
revoke all on all tables in schema reelay_private from public, anon, authenticated;
revoke all on all sequences in schema reelay_private from public, anon, authenticated;
alter default privileges in schema reelay_private revoke execute on functions from public;

-- These helpers never trust user_metadata or an email supplied by the caller.
-- Verified email is read from auth.users using the signed JWT's auth.uid().
-- Membership is checked on every operation, so deactivation takes effect even
-- while a previously issued access token remains valid.
create or replace function reelay_private.member_identity()
returns reelay_private.members language sql stable security definer set search_path = ''
as $$
  select m.* from reelay_private.members m
  join auth.users u on lower(u.email) = m.email
  where u.id = auth.uid() and u.email_confirmed_at is not null
    and m.active
  limit 1
$$;

create or replace function reelay_private.require_member(admin_only boolean default false)
returns reelay_private.members language plpgsql stable security definer set search_path = ''
as $$
declare m reelay_private.members;
begin
  if auth.uid() is null then raise exception using errcode='PT403', message='请先登录获授权的账号'; end if;
  m := reelay_private.member_identity();
  if m.id is null or (admin_only and m.role <> 'admin') then
    raise exception using errcode='PT403', message='此账号没有操作权限';
  end if;
  return m;
end
$$;

create or replace function reelay_private.is_decimal(value jsonb, allow_zero boolean, places integer)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $$
declare s text;
begin
  if jsonb_typeof(value) is distinct from 'string' then return false; end if;
  s := value #>> '{}';
  if length(s) > 47 or s !~ ('^[0-9]{1,12}(\.[0-9]{1,' || places || '})?$') then return false; end if;
  return s::numeric < 1000000000000 and (case when allow_zero then s::numeric >= 0 else s::numeric > 0 end);
end
$$;

create or replace function reelay_private.validate_record(input jsonb)
returns jsonb language plpgsql immutable security invoker set search_path = ''
as $$
declare p jsonb; h jsonb; k text; max_seconds integer; normalized jsonb; d date;
begin
  if jsonb_typeof(input) is distinct from 'object' or octet_length(input::text) > 16000 then
    raise exception using errcode='PT400', message='实测记录格式无效';
  end if;
  for k in select jsonb_object_keys(input) loop
    if k <> all(array['title','provider','params','costBasis','P','C','N','date','note','usage','historicalPricing']) then
      raise exception using errcode='PT400', message='实测记录包含不支持的字段';
    end if;
  end loop;
  foreach k in array array['title','provider','costBasis','P','C','N','date','note'] loop
    if jsonb_typeof(input->k) is distinct from 'string' then
      raise exception using errcode='PT400', message='实测记录缺少必填字段';
    end if;
  end loop;
  if length(btrim(input->>'title')) not between 1 and 100
    or length(btrim(input->>'provider')) not between 1 and 60
    or length(input->>'note') > 1000 or input->>'costBasis' <> 'recorded' then
    raise exception using errcode='PT400', message='请填写名称、来源及实际成本';
  end if;
  if not reelay_private.is_decimal(input->'C', true, 20)
    or ((input->>'P') <> '' and not reelay_private.is_decimal(input->'P', false, 20)) then
    raise exception using errcode='PT400', message='实际成本须为非负金额；折前成本如填写须大于零';
  end if;
  if input->>'N' <> '' and input->>'N' !~ '^[0-9]{1,12}$' then
    raise exception using errcode='PT400', message='历史实扣须为非负整数';
  end if;
  if input ? 'usage' then
    if jsonb_typeof(input->'usage') is distinct from 'string' then
      raise exception using errcode='PT400', message='API Token 用量须为正整数';
    end if;
    if input->>'usage' <> '' then
      if input->>'usage' !~ '^[0-9]{1,12}$' then
        raise exception using errcode='PT400', message='API Token 用量须为正整数';
      end if;
      if (input->>'usage')::numeric <= 0 then raise exception using errcode='PT400', message='API Token 用量须为正整数'; end if;
    end if;
  end if;
  if input->>'date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception using errcode='PT400', message='请填写有效的实测日期';
  end if;
  begin
    d := (input->>'date')::date;
    if to_char(d, 'YYYY-MM-DD') <> input->>'date' then raise invalid_datetime_format; end if;
  exception when invalid_datetime_format or datetime_field_overflow then
    raise exception using errcode='PT400', message='请填写有效的实测日期';
  end;
  p := input->'params';
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception using errcode='PT400', message='缺少任务参数';
  end if;
  for k in select jsonb_object_keys(p) loop
    if k <> all(array['model','res','ratio','seconds','video','vin']) then
      raise exception using errcode='PT400', message='任务参数包含不支持的字段';
    end if;
  end loop;
  foreach k in array array['model','res','ratio','seconds','vin'] loop
    if jsonb_typeof(p->k) is distinct from 'string' then
      raise exception using errcode='PT400', message='任务参数格式无效';
    end if;
  end loop;
  if jsonb_typeof(p->'video') is distinct from 'boolean'
    or p->>'model' not in ('seedance-2.0','seedance-2.0-fast','seedance-2.5')
    or p->>'ratio' not in ('21:9','16:9','4:3','1:1','3:4','9:16') then
    raise exception using errcode='PT400', message='请选择有效的模型、比例与视频输入';
  end if;
  if not (case p->>'model'
    when 'seedance-2.0' then p->>'res' in ('480p','720p','1080p','4k')
    when 'seedance-2.0-fast' then p->>'res' in ('480p','720p')
    when 'seedance-2.5' then p->>'res' in ('480p','720p','1080p') end) then
    raise exception using errcode='PT400', message='此模型不支持所选分辨率';
  end if;
  max_seconds := case p->>'model' when 'seedance-2.5' then 30 else 15 end;
  if p->>'seconds' !~ '^[0-9]{1,2}$' then
    raise exception using errcode='PT400', message='输出时长须为有效的整数秒';
  end if;
  if (p->>'seconds')::integer not between 4 and max_seconds then
    raise exception using errcode='PT400', message='输出时长超出此模型支持的范围';
  end if;
  if (p->>'video')::boolean then
    if not reelay_private.is_decimal(p->'vin', false, 4) then
      raise exception using errcode='PT400', message='输入视频总时长格式无效';
    end if;
    if (p->>'vin')::numeric not between 2 and max_seconds then
      raise exception using errcode='PT400', message='输入视频总时长超出此模型支持的范围';
    end if;
  end if;
  if input ? 'historicalPricing' then
    h := input->'historicalPricing';
    if jsonb_typeof(h) is distinct from 'object' then
      raise exception using errcode='PT400', message='历史定价格式无效';
    end if;
    for k in select jsonb_object_keys(h) loop
      if k not in ('q','M') then raise exception using errcode='PT400', message='历史定价包含不支持的字段'; end if;
    end loop;
    if not reelay_private.is_decimal(h->'q', false, 6) or not reelay_private.is_decimal(h->'M', false, 20) then
      raise exception using errcode='PT400', message='历史采购比例与倍率须为有效正数';
    end if;
    if (h->>'q')::numeric > 10 then raise exception using errcode='PT400', message='历史采购比例超出范围'; end if;
  end if;
  normalized := input || jsonb_build_object('title', btrim(input->>'title'), 'provider', btrim(input->>'provider'), 'usage', coalesce(input->>'usage',''));
  p := p || jsonb_build_object('seconds', ((p->>'seconds')::integer)::text);
  if not (p->>'video')::boolean then p := p || '{"vin":"2"}'::jsonb; end if;
  return normalized || jsonb_build_object('params', p);
end
$$;

create or replace function reelay_private.row_value(r reelay_private.records, editable boolean)
returns jsonb language sql immutable security invoker set search_path = ''
as $$ select jsonb_build_object('id',r.id,'version',r.version,'record',r.record,
  'created_at',r.created_at,'updated_at',r.updated_at,'archived',r.archived,'can_edit',editable) $$;

-- Deliberately anonymous-readable: only current, published facts, no identities.
create or replace function reelay_private.public_records()
returns table(id uuid, version integer, record jsonb, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = ''
as $$ select r.id,r.version,r.record,r.created_at,r.updated_at
  from reelay_private.records r where not r.archived order by r.id $$;

create or replace function reelay_private.identity()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare m reelay_private.members;
begin
  if auth.uid() is null then return '{"authenticated":false,"role":null,"display_name":""}'::jsonb; end if;
  m := reelay_private.member_identity();
  return jsonb_build_object('authenticated',true,'role',m.role,'display_name',coalesce(m.display_name,''));
end
$$;

create or replace function reelay_private.manage_records()
returns table(id uuid,version integer,record jsonb,created_at timestamptz,updated_at timestamptz,archived boolean,can_edit boolean)
language plpgsql stable security definer set search_path = ''
as $$
declare m reelay_private.members;
begin
  m := reelay_private.require_member();
  return query select r.id,r.version,r.record,r.created_at,r.updated_at,r.archived,
    (r.owner_id = auth.uid() or m.role = 'admin')
    from reelay_private.records r
    where not r.archived or r.owner_id = auth.uid() or m.role = 'admin'
    order by r.id;
end
$$;

create or replace function reelay_private.save_record(record_id uuid,expected_version integer,record jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare m reelay_private.members; r reelay_private.records; normalized jsonb;
begin
  m := reelay_private.require_member();
  if record_id is null or expected_version is null or expected_version < 0 or expected_version > 2147483645 then
    raise exception using errcode='PT400', message='记录编号或版本无效';
  end if;
  normalized := reelay_private.validate_record(record);
  -- Serializes retries for a new UUID as well as subsequent edits. Hash
  -- collisions merely serialize unrelated saves; they cannot grant access.
  perform pg_advisory_xact_lock(hashtextextended(record_id::text,0));
  select * into r from reelay_private.records where id=record_id for update;
  if found then
    if r.owner_id <> auth.uid() and m.role <> 'admin' then
      raise exception using errcode='PT403', message='只能修改自己录入的实测';
    end if;
    if r.archived then raise exception using errcode='PT409', message='记录已撤回，请先恢复再编辑'; end if;
    if r.version = expected_version+1 and r.record = normalized then
      return reelay_private.row_value(r,true);
    end if;
    if r.version <> expected_version then raise exception using errcode='PT409', message='记录已被更新，请刷新后重新编辑'; end if;
    if r.record = normalized then return reelay_private.row_value(r,true); end if;
    update reelay_private.records set record=normalized,version=r.version+1,updated_at=clock_timestamp()
      where id=record_id returning * into r;
  else
    if expected_version <> 0 then raise exception using errcode='PT404', message='实测记录不存在'; end if;
    insert into reelay_private.records (id,owner_id,version,record)
      values (record_id,auth.uid(),1,normalized) returning * into r;
  end if;
  insert into reelay_private.record_revisions (record_id,version,record,archived,actor_id,changed_at)
    values (r.id,r.version,r.record,r.archived,auth.uid(),r.updated_at);
  return reelay_private.row_value(r,true);
end
$$;

create or replace function reelay_private.archive_record(record_id uuid,expected_version integer,archived boolean)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare m reelay_private.members; r reelay_private.records;
begin
  m := reelay_private.require_member();
  if record_id is null or expected_version is null or expected_version < 1 or expected_version > 2147483645 or archived is null then
    raise exception using errcode='PT400', message='记录编号、版本或撤回状态无效';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(record_id::text,0));
  select * into r from reelay_private.records where id=record_id for update;
  if not found then raise exception using errcode='PT404', message='实测记录不存在'; end if;
  if r.owner_id <> auth.uid() and m.role <> 'admin' then
    raise exception using errcode='PT403', message='只能撤回或恢复自己录入的实测';
  end if;
  if r.version = expected_version+1 and r.archived = archive_record.archived then return reelay_private.row_value(r,true); end if;
  if r.version <> expected_version then raise exception using errcode='PT409', message='记录已被更新，请刷新后再操作'; end if;
  if r.archived = archive_record.archived then return reelay_private.row_value(r,true); end if;
  update reelay_private.records set archived=archive_record.archived,version=r.version+1,updated_at=clock_timestamp()
    where id=record_id returning * into r;
  insert into reelay_private.record_revisions (record_id,version,record,archived,actor_id,changed_at)
    values (r.id,r.version,r.record,r.archived,auth.uid(),r.updated_at);
  return reelay_private.row_value(r,true);
end
$$;

create or replace function reelay_private.record_history(record_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare m reelay_private.members; r reelay_private.records; result jsonb;
begin
  m := reelay_private.require_member();
  select * into r from reelay_private.records where id=record_id;
  if not found then raise exception using errcode='PT404', message='实测记录不存在'; end if;
  if r.owner_id <> auth.uid() and m.role <> 'admin' then raise exception using errcode='PT403', message='没有查看此记录历史的权限'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('version',v.version,'record',v.record,'archived',v.archived,'changed_at',v.changed_at) order by v.version desc),'[]'::jsonb)
    into result from reelay_private.record_revisions v where v.record_id=record_history.record_id;
  return result;
end
$$;

create or replace function reelay_private.members_list()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  perform reelay_private.require_member(true);
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'email',m.email,'display_name',m.display_name,'role',m.role,'active',m.active) order by m.created_at,m.id),'[]'::jsonb)
    into result from reelay_private.members m;
  return result;
end
$$;

create or replace function reelay_private.set_member(member_id uuid,email text,display_name text,role text,active boolean)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare m reelay_private.members; previous reelay_private.members; updated reelay_private.members; result jsonb;
begin
  perform reelay_private.require_member(true);
  if email is null or length(email) > 254 or lower(btrim(email)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or display_name is null or length(btrim(display_name)) not between 1 and 60
    or role is null or role not in ('admin','editor') or active is null then
    raise exception using errcode='PT400', message='请填写有效的邮箱、姓名及权限';
  end if;
  -- Serializes last-admin protection, including two simultaneous removals.
  lock table reelay_private.members in share row exclusive mode;
  m := reelay_private.require_member(true);
  if member_id is not null then
    select * into previous from reelay_private.members where id=member_id for update;
    if not found then raise exception using errcode='PT404', message='成员不存在'; end if;
    if previous.email <> lower(btrim(email)) then raise exception using errcode='PT400', message='更换邮箱请添加新成员，再停用旧成员'; end if;
    if previous.role='admin' and previous.active and (role<>'admin' or not active)
      and (select count(*) from reelay_private.members x where x.role='admin' and x.active) <= 1 then
      raise exception using errcode='PT409', message='至少保留一位启用的管理员';
    end if;
    update reelay_private.members set display_name=btrim(set_member.display_name),role=set_member.role,active=set_member.active,updated_at=clock_timestamp()
      where id=member_id returning * into updated;
  else
    if exists(select 1 from reelay_private.members x where x.email=lower(btrim(set_member.email))) then
      raise exception using errcode='PT409', message='此邮箱已在成员列表中';
    end if;
    insert into reelay_private.members (email,display_name,role,active)
      values (lower(btrim(email)),btrim(display_name),role,active) returning * into updated;
  end if;
  result := jsonb_build_object('id',updated.id,'email',updated.email,'display_name',updated.display_name,'role',updated.role,'active',updated.active);
  insert into reelay_private.member_changes (member_id,actor_id,previous_value,next_value)
    values(updated.id,auth.uid(),case when previous.id is null then null else to_jsonb(previous) end,result);
  return result;
end
$$;

-- Only these narrow wrappers are exposed through PostgREST. Definer helpers
-- stay in a non-exposed schema; all mutations perform authorization there.
create or replace function public.reelay_public_records()
returns table(id uuid,version integer,record jsonb,created_at timestamptz,updated_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from reelay_private.public_records() $$;
create or replace function public.reelay_identity()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select reelay_private.identity() $$;
create or replace function public.reelay_manage_records()
returns table(id uuid,version integer,record jsonb,created_at timestamptz,updated_at timestamptz,archived boolean,can_edit boolean)
language sql stable security invoker set search_path = ''
as $$ select * from reelay_private.manage_records() $$;
create or replace function public.reelay_save_record(record_id uuid,expected_version integer,record jsonb)
returns jsonb language sql volatile security invoker set search_path = ''
as $$ select reelay_private.save_record(record_id,expected_version,record) $$;
create or replace function public.reelay_archive_record(record_id uuid,expected_version integer,archived boolean)
returns jsonb language sql volatile security invoker set search_path = ''
as $$ select reelay_private.archive_record(record_id,expected_version,archived) $$;
create or replace function public.reelay_record_history(record_id uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select reelay_private.record_history(record_id) $$;
create or replace function public.reelay_members()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select reelay_private.members_list() $$;
create or replace function public.reelay_set_member(member_id uuid,email text,display_name text,role text,active boolean)
returns jsonb language sql volatile security invoker set search_path = ''
as $$ select reelay_private.set_member(member_id,email,display_name,role,active) $$;

revoke all on all functions in schema reelay_private from public, anon, authenticated;
revoke all on function public.reelay_public_records(),public.reelay_identity(),public.reelay_manage_records(),
  public.reelay_save_record(uuid,integer,jsonb),public.reelay_archive_record(uuid,integer,boolean),
  public.reelay_record_history(uuid),public.reelay_members(),public.reelay_set_member(uuid,text,text,text,boolean)
  from public, anon, authenticated;

grant execute on function public.reelay_public_records(),public.reelay_identity(),
  reelay_private.public_records(),reelay_private.identity() to anon,authenticated;
grant execute on function public.reelay_manage_records(),public.reelay_save_record(uuid,integer,jsonb),
  public.reelay_archive_record(uuid,integer,boolean),public.reelay_record_history(uuid),
  public.reelay_members(),public.reelay_set_member(uuid,text,text,text,boolean),
  reelay_private.manage_records(),reelay_private.save_record(uuid,integer,jsonb),
  reelay_private.archive_record(uuid,integer,boolean),reelay_private.record_history(uuid),
  reelay_private.members_list(),reelay_private.set_member(uuid,text,text,text,boolean) to authenticated;

notify pgrst, 'reload schema';
commit;
