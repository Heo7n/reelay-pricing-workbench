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
