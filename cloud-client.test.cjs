'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createCloudClient} = require('./cloud-client.cjs');
const config = {url: 'https://example.supabase.co/', publishableKey: 'sb_publishable_test_key'};
const id = i => '00000000-0000-4000-8000-' + String(i).padStart(12, '0');
const row = i => ({id: id(i), version: 1, record: {C: '1.234567890123456789'}, created_at: '2026-11-05T00:00:00Z', updated_at: '2026-11-05T00:00:00Z', archived: false, can_edit: true});
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

function fake(overrides = {}, options = {}) {
  const calls = [], authCalls = [], factoryCalls = [], subscriptions = [];
  let unsubscribed = 0;
  const sdk = {
    rpc(name, args) {
      const call = {name, args, range: null, signal: null};
      calls.push(call);
      const query = {
        range(from, to) { call.range = [from, to]; return query; },
        abortSignal(signal) { call.signal = signal; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => overrides.rpc ? overrides.rpc(call) : {data: null, error: null}).then(resolve, reject);
        },
      };
      return query;
    },
    auth: {
      async signInWithOtp(args) { authCalls.push(['send', args]); return overrides.send ? overrides.send(args) : {data: {user: null, session: null}, error: null}; },
      async verifyOtp(args) { authCalls.push(['verify', args]); return overrides.verify ? overrides.verify(args) : {data: {session: {access_token: 'do-not-leak', user: {id: id(1)}}, user: {id: id(1), email: 'private@example.com'}}, error: null}; },
      async signOut(args) { authCalls.push(['logout', args]); return overrides.signOut ? overrides.signOut(args) : {error: null}; },
      onAuthStateChange(fn) {
        subscriptions.push(fn);
        return {data: {subscription: {unsubscribe() { unsubscribed++; }}}};
      },
    },
  };
  const client = createCloudClient(config, {...options, createClient(...args) { factoryCalls.push(args); return sdk; }});
  return {client, calls, authCalls, factoryCalls, emit(event, session = {access_token: 'secret-token', refresh_token: 'secret-refresh', user: {id: id(1), email: 'private@example.com'}}) { for (const fn of subscriptions) fn(event, session); }, get unsubscribed() { return unsubscribed; }};
}

test('disabled cloud performs no SDK initialization or requests and gives an explicit error', async () => {
  let calls = 0;
  const client = createCloudClient({}, {createClient() { calls++; }});
  assert.equal(client.enabled, false);
  await assert.rejects(client.publicRecords(), {code: 'NOT_CONFIGURED', message: '云端尚未配置。'});
  await assert.rejects(client.sendCode('a@example.com'), {code: 'NOT_CONFIGURED'});
  client.onAuthChange(() => assert.fail('disabled cloud must not emit'))();
  assert.equal(calls, 0);
});

test('only a public key and a safe service origin may initialize a browser client', () => {
  const jwt = role => ['e30', Buffer.from(JSON.stringify({role})).toString('base64url'), 'signature'].join('.');
  let initialized = 0;
  const factory = {createClient() { initialized++; return {}; }};
  for (const key of ['sb_secret_do_not_expose', 'service_role', jwt('service_role'), jwt('authenticated')]) {
    assert.throws(() => createCloudClient({...config, publishableKey: key}, factory), {code: 'UNSAFE_KEY'});
  }
  for (const url of ['http://public.example.com', 'https://user:password@example.com', 'https://example.com/auth', 'https://example.com/?token=hidden', 'https://example.com/#token', 'javascript:alert(1)']) {
    assert.throws(() => createCloudClient({...config, url}, factory), {code: 'INVALID_CONFIG'});
  }
  assert.equal(initialized, 0);
  assert.equal(createCloudClient({...config, publishableKey: jwt('anon')}, factory).enabled, true);
  assert.equal(createCloudClient({...config, url: 'http://127.0.0.1:54321'}, factory).enabled, true);
});

test('SDK session persistence has its own namespace and does not consume URL fragments', () => {
  const storage = {getItem() {}, setItem() {}, removeItem() {}};
  const h = fake({}, {storage});
  assert.deepEqual(h.factoryCalls[0], ['https://example.supabase.co', config.publishableKey, {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'reelay_cloud_auth_v1', storage}}]);
  assert.equal(h.client.sdk, undefined);
});

test('OTP flows normalize email and never return session tokens or private identity fields', async () => {
  const h = fake();
  assert.deepEqual(await h.client.sendCode('  Owner@Example.COM '), {sent: true});
  assert.deepEqual(await h.client.verifyCode(' Owner@Example.COM ', ' 123456 '), {authenticated: true});
  assert.deepEqual(await h.client.signOut(), {signedOut: true});
  assert.deepEqual(h.authCalls, [
    ['send', {email: 'owner@example.com', options: {shouldCreateUser: true}}],
    ['verify', {email: 'owner@example.com', token: '123456', type: 'email'}],
    ['logout', {scope: 'local'}],
  ]);
  await assert.rejects(h.client.sendCode('not-email'), {code: 'INVALID_EMAIL'});
  await assert.rejects(h.client.verifyCode('a@example.com', '1234'), {code: 'INVALID_CODE'});
  assert.equal(h.authCalls.length, 3);
});

test('auth-change callbacks run outside the SDK auth lock and unsubscribe cancels queued work', async () => {
  const h = fake();
  let inside = false;
  const seen = [];
  const unsubscribe = h.client.onAuthChange((...args) => { assert.equal(inside, false); seen.push(args); });
  inside = true;
  h.emit('SIGNED_IN');
  assert.deepEqual(seen, []);
  inside = false;
  await tick();
  assert.deepEqual(seen, [['SIGNED_IN', {userId: id(1)}]]);
  assert.doesNotMatch(JSON.stringify(seen), /secret-token|secret-refresh|private@example|access_token|refresh_token/);
  h.emit('SIGNED_OUT');
  unsubscribe();
  await tick();
  assert.deepEqual(seen, [['SIGNED_IN', {userId: id(1)}]]);
  assert.equal(h.unsubscribed, 1);
});

test('signed-out auth events expose a null identity hint, never the session object', async () => {
  const h = fake(), seen = [];
  const stop = h.client.onAuthChange((...args) => seen.push(args));
  h.emit('SIGNED_OUT', null);
  await tick();
  assert.deepEqual(seen, [['SIGNED_OUT', {userId: null}]]);
  stop();
});

test('public records paginate, preserve decimal strings and strip private management metadata', async () => {
  const h = fake({rpc(call) {
    assert.equal(call.name, 'reelay_public_records');
    const [from, to] = call.range;
    const count = Math.max(0, Math.min(501, to + 1) - from);
    return {data: Array.from({length: count}, (_, index) => ({...row(from + index + 1), author_email: 'private@example.com', author_id: id(999)}))};
  }});
  const rows = await h.client.publicRecords();
  assert.equal(rows.length, 501);
  assert.deepEqual(h.calls.map(call => call.range), [[0, 499], [500, 999]]);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['created_at', 'id', 'record', 'updated_at', 'version']);
  assert.equal(rows[0].record.C, '1.234567890123456789');
  assert.ok(h.calls.every(call => call.signal instanceof AbortSignal));
});

test('pagination detects changed or excessive data rather than silently returning a partial catalog', async () => {
  const duplicate = fake({rpc(call) { return {data: call.range[0] === 0 ? Array.from({length: 500}, (_, i) => row(i + 1)) : [row(1)]}; }});
  await assert.rejects(duplicate.client.publicRecords(), {code: 'CHANGED_DURING_LOAD'});
  const excessive = fake({rpc(call) { return {data: Array.from({length: 500}, (_, i) => row(call.range[0] + i + 1))}; }});
  await assert.rejects(excessive.client.publicRecords(), {code: 'TOO_MANY_RECORDS'});
  assert.equal(excessive.calls.length, 21);
});

test('public read, identity and malformed responses fail closed without returning partial rows', async () => {
  const h = fake({rpc(call) { return {data: call.name === 'reelay_identity' ? {role: 'admin', authenticated: true, display_name: 'Owner', email: 'private@example.com'} : [row(1), {id: 'bad'}]}; }});
  assert.deepEqual(await h.client.identity(), {role: 'admin', authenticated: true, display_name: 'Owner'});
  await assert.rejects(h.client.publicRecords(), {code: 'INVALID_RESPONSE'});
  const invalid = fake({rpc() { return {data: {role: 'owner'}}; }});
  await assert.rejects(invalid.client.identity(), {code: 'INVALID_RESPONSE'});
});

test('identity distinguishes a signed-in nonmember from a signed-out visitor', async () => {
  for (const authenticated of [true, false]) {
    const h = fake({rpc() { return {data: {role: null, authenticated, display_name: ''}}; }});
    assert.deepEqual(await h.client.identity(), {role: null, authenticated, display_name: ''});
  }
});

test('record writes send stable IDs and expected versions and keep edits separate from insert retries', async () => {
  const h = fake({rpc(call) { return {data: {...row(8), version: Math.max(1, call.args.expected_version + 1), archived: call.args.archived ?? false}}; }});
  const record = {C: '0', N: '0', note: 'recorded amount'};
  const saved = await h.client.saveRecord({id: id(8), version: 0, record});
  assert.equal(saved.version, 1);
  assert.equal(saved.can_edit, true);
  await h.client.saveRecord({id: id(8), version: 1, record});
  await h.client.archiveRecord({id: id(8), version: 2, archived: true});
  assert.deepEqual(h.calls.map(({name, args}) => ({name, args})), [
    {name: 'reelay_save_record', args: {record_id: id(8), expected_version: 0, record}},
    {name: 'reelay_save_record', args: {record_id: id(8), expected_version: 1, record}},
    {name: 'reelay_archive_record', args: {record_id: id(8), expected_version: 2, archived: true}},
  ]);
  await assert.rejects(h.client.saveRecord({id: 'cloud:' + id(8), version: 0, record}), {code: 'INVALID_INPUT'});
  await assert.rejects(h.client.archiveRecord({id: id(8), version: 0, archived: true}), {code: 'INVALID_INPUT'});
  await assert.rejects(h.client.archiveRecord({id: id(8), version: 2, archived: 'true'}), {code: 'INVALID_INPUT'});
  assert.equal(h.calls.length, 3);
});

test('member and history APIs only use their explicit RPC argument contract', async () => {
  const h = fake({rpc(call) { return {data: call.name === 'reelay_set_member' ? {id: id(3)} : []}; }});
  await h.client.members();
  await h.client.history(id(3));
  await h.client.setMember({email: ' User@Example.com ', display_name: ' Member ', role: 'editor', active: true});
  assert.deepEqual(h.calls.map(({name, args}) => ({name, args})), [
    {name: 'reelay_members', args: {}},
    {name: 'reelay_record_history', args: {record_id: id(3)}},
    {name: 'reelay_set_member', args: {member_id: null, email: 'user@example.com', display_name: 'Member', role: 'editor', active: true}},
  ]);
});

test('upstream errors are normalized without exposing details, emails or bearer tokens', async () => {
  for (const [upstream, expected] of [['PT400', 'INVALID_INPUT'], ['PT403', 'FORBIDDEN'], ['PT404', 'NOT_FOUND'], ['PT409', 'CONFLICT'], ['42501', 'FORBIDDEN'], ['PGRST301', 'SESSION_EXPIRED'], ['over_email_send_rate_limit', 'RATE_LIMIT'], ['otp_expired', 'INVALID_CODE'], ['email_address_not_authorized', 'EMAIL_UNAVAILABLE']]) {
    const h = fake({rpc() { return {error: {code: upstream, message: 'private@example.com Bearer secret-token', details: 'private details'}}; }});
    await assert.rejects(h.client.identity(), error => {
      assert.equal(error.code, expected);
      assert.doesNotMatch(JSON.stringify(error) + error.message, /private@example|secret-token|private details/);
      return true;
    });
  }
});

test('timeouts abort RPC transport and mark writes as an unconfirmed outcome', async () => {
  const h = fake({rpc() { return new Promise(() => {}); }}, {timeoutMs: 10});
  await assert.rejects(h.client.saveRecord({id: id(1), version: 0, record: {C: '1'}}), error => {
    assert.equal(error.code, 'TIMEOUT');
    assert.match(error.message, /结果尚未确认/);
    return true;
  });
  assert.equal(h.calls[0].signal.aborted, true);
});

test('caller cancellation aborts current RPC and prevents a pre-cancelled request from sending', async () => {
  const h = fake({rpc() { return new Promise(() => {}); }});
  const controller = new AbortController();
  const pending = h.client.publicRecords({signal: controller.signal});
  await tick();
  controller.abort();
  await assert.rejects(pending, {code: 'CANCELLED'});
  assert.equal(h.calls[0].signal.aborted, true);
  await assert.rejects(h.client.publicRecords({signal: controller.signal}), {code: 'CANCELLED'});
  await assert.rejects(h.client.sendCode('a@example.com', {signal: controller.signal}), {code: 'CANCELLED'});
  assert.equal(h.calls.length, 1);
  assert.equal(h.authCalls.length, 0);
});
