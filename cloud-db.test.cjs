'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {PGlite} = require('@electric-sql/pglite');

const read = name => fs.readFileSync(path.join(__dirname, 'cloud', name), 'utf8');

// A real embedded PostgreSQL engine, with only Supabase's externally owned
// auth surface stubbed. JWT signature verification, SMTP delivery and
// PostgREST are intentionally outside this database permission test.
const authFixture = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    email_confirmed_at timestamptz,
    raw_user_meta_data jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

test('cloud SQL enforces public-read and authorized-write rules, and rolls back every fixture', {timeout: 60000}, async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(authFixture);
  const schema = read('schema.sql');
  await db.exec(schema);
  // Reapplying schema definitions must not fail or reset tables.
  await db.exec(schema);

  const output = await db.exec(read('sql-test.sql'));
  const success = output.flatMap(result => result.rows || [])
    .find(row => row.result === 'Reelay cloud SQL permission and persistence checks passed');
  assert.ok(success, 'the SQL script reaches its final assertion marker');

  const remaining = await db.query(`
    select
      (select count(*)::integer from auth.users) as users,
      (select count(*)::integer from reelay_private.members) as members,
      (select count(*)::integer from reelay_private.records) as records,
      (select count(*)::integer from reelay_private.record_revisions) as revisions,
      (select count(*)::integer from reelay_private.member_changes) as membership_changes
  `);
  assert.deepEqual(remaining.rows, [{users: 0, members: 0, records: 0, revisions: 0, membership_changes: 0}],
    'test users, public records and private audit data all roll back');

  const api = await db.query(`
    select count(*)::integer as count
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'reelay_%'
  `);
  assert.equal(api.rows[0].count, 8, 'the production RPC functions remain after fixture rollback');
});

test('access-key migration preserves facts and legacy ownership while replacing all mailbox authority', {timeout: 60000}, async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(authFixture);
  await db.exec(read('schema.sql'));
  const owner = '11111111-1111-4111-8111-111111111111';
  const record = '22222222-2222-4222-8222-222222222222';
  const historicalFact = {C: '0.1234567890123456789', note: 'pre-migration record'};
  await db.query('insert into reelay_private.records(id,owner_id,version,record) values($1,$2,1,$3)', [record, owner, historicalFact]);
  const before = await db.query('select * from reelay_private.records where id=$1', [record]);
  const schema = read('access-schema.sql');
  await db.exec(schema);
  await db.exec(schema);
  const after = await db.query('select * from reelay_private.records where id=$1', [record]);
  assert.deepEqual(after.rows, before.rows, 'migration and reapplication do not modify facts or ownership');

  const output = await db.exec(read('access-sql-test.sql'));
  const success = output.flatMap(result => result.rows || [])
    .find(row => row.result === 'Reelay access-key SQL permission and persistence checks passed');
  assert.ok(success, 'all new access-key authorization assertions complete');
  const remaining = await db.query(`select
    (select count(*)::integer from reelay_private.access_keys) as keys,
    (select count(*)::integer from reelay_private.access_sessions) as sessions,
    (select count(*)::integer from reelay_private.access_key_changes) as changes,
    (select count(*)::integer from reelay_private.record_revisions) as revisions,
    (select count(*)::integer from reelay_private.records) as records`);
  assert.deepEqual(remaining.rows, [{keys: 0, sessions: 0, changes: 0, revisions: 0, records: 1}],
    'synthetic keys, leases, audit and record mutations roll back; the historical fact remains');
  assert.deepEqual((await db.query('select * from reelay_private.records where id=$1', [record])).rows, before.rows);
  const grants = await db.query(`select
    has_function_privilege('authenticated','public.reelay_save_record(uuid,integer,jsonb)','EXECUTE') as legacy_write,
    has_function_privilege('authenticated','public.reelay_members()','EXECUTE') as legacy_members,
    has_function_privilege('anon','public.reelay_access_save_record(text,uuid,integer,jsonb)','EXECUTE') as key_wrapper,
    has_function_privilege('anon','reelay_private.require_access(text,boolean)','EXECUTE') as unchecked_helper`);
  assert.deepEqual(grants.rows, [{legacy_write: false, legacy_members: false, key_wrapper: true, unchecked_helper: false}]);
});
