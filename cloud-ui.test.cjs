'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const E = require('./engine.js');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 12));
const flush = async () => { await tick(); await tick(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return {promise, resolve, reject}; };
const uuid = index => '00000000-0000-4000-8000-' + String(index).padStart(12, '0');
const guest = {role: null, authenticated: false, display_name: ''};
const admin = {role: 'admin', authenticated: true, display_name: 'Owner'};
const params = {model: 'seedance-2.0', res: '480p', ratio: '1:1', seconds: '4', video: true, vin: '2'};
function fixture(index = 1, cost = '1') {
  return {id: uuid(index), version: 1, record: {title: '公共测试记录 ' + index, params: copy(params), provider: '立画', costBasis: 'recorded', P: '', C: cost, N: '', usage: '', date: '2026-11-05', note: '公开来源'}, created_at: '2026-11-05T01:00:00Z', updated_at: '2026-11-05T01:00:00Z', archived: false, can_edit: true};
}

async function boot(t, setup = {}) {
  const errors = [], downloads = [], blobs = new Map(), calls = [], subscribers = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(read('template.html'), {url: 'https://reelay-cloud-test.invalid/', runScripts: 'outside-only', virtualConsole});
  const w = dom.window, doc = w.document;
  w.Blob = Blob;
  w.URL.createObjectURL = blob => { const id = 'blob:test-' + blobs.size; blobs.set(id, blob); return id; };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function () { downloads.push({name: this.download, blob: blobs.get(this.href)}); };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.navigator.clipboard = {writeText: async () => {}};
  w.localStorage.setItem('reelay_cloud_auth_v1', JSON.stringify({access_token: 'sensitive-test-access-token', refresh_token: 'sensitive-test-refresh-token', user: {email: 'private-login@example.com'}}));
  let identity = copy(setup.identity || guest), rows = copy(setup.rows || [fixture()]);
  let publicCalls = 0;
  const client = {
    enabled: true,
    onAuthChange(callback) { subscribers.push(callback); setTimeout(() => callback('INITIAL_SESSION', {userId: identity.authenticated ? uuid(900) : null}), 0); return () => {}; },
    async identity() { calls.push(['identity']); return setup.identityRead ? setup.identityRead(copy(identity)) : copy(identity); },
    async publicRecords() { publicCalls++; calls.push(['public', publicCalls]); return setup.readPublic ? setup.readPublic(publicCalls, copy(rows)) : copy(rows.filter(row => !row.archived)); },
    async manageRecords() { calls.push(['manage']); return setup.readManaged ? setup.readManaged(copy(rows)) : copy(rows); },
    async sendCode(email) { calls.push(['sendCode', email]); return {sent: true}; },
    async verifyCode(email, token) { calls.push(['verifyCode', email, token]); identity = copy(setup.verifiedIdentity || admin); return {authenticated: true}; },
    async signOut() { calls.push(['logout']); identity = copy(guest); return {signedOut: true}; },
    async saveRecord(draft) {
      calls.push(['save', copy(draft)]);
      if (setup.save) return setup.save(copy(draft));
      const saved = {...fixture(), ...copy(draft), version: draft.version + 1, archived: false, can_edit: true};
      rows = [saved, ...rows.filter(row => row.id !== saved.id)];
      return copy(saved);
    },
    async archiveRecord(value) { calls.push(['archive', copy(value)]); const row = rows.find(row => row.id === value.id); Object.assign(row, {version: row.version + 1, archived: value.archived}); return copy(row); },
    async members() { calls.push(['members']); return setup.members ? setup.members() : [{id: uuid(101), email: 'private-member@example.com', display_name: 'Member', role: 'editor', active: true}]; },
    async setMember(member) { calls.push(['setMember', copy(member)]); return {...member, id: member.id || uuid(102)}; },
    async history(id) { calls.push(['history', id]); return [{version: 1, record: fixture().record, archived: false, changed_at: '2026-11-05T00:00:00Z'}]; },
  };
  w.ReelayCloud = setup.offline ? {enabled: false} : client;
  for (const file of ['engine.js', 'generated-minima.js', 'data.js', 'generated-model-minima.js', 'models.js', 'pricing-profiles.js', 'cloud-ui.js']) w.eval(read(file));
  let ui;
  const mount = w.ReelayCloudUI.mount;
  w.ReelayCloudUI.mount = (host, adapter) => { ui = mount(host, adapter); return ui; };
  w.eval(read('app.js'));
  t.after(() => dom.window.close());
  await flush();
  function good() { assert.deepEqual(errors, [], 'no uncaught browser errors'); assert.equal(doc.getElementById('globalError').hidden, true); }
  function input(id, value, event = 'input') { const element = doc.getElementById(id); assert.ok(element, id + ' exists'); element.value = value; element.dispatchEvent(new w.Event(event, {bubbles: true})); }
  function click(selector) { const element = doc.querySelector(selector); assert.ok(element, selector + ' exists'); assert.equal(element.disabled, false, selector + ' is enabled'); element.click(); }
  function submit(id, noSubmitter = false) { const form = doc.getElementById(id); assert.ok(form); const submitter = noSubmitter ? null : form.querySelector('[type="submit"]'); form.dispatchEvent(new w.SubmitEvent('submit', {bubbles: true, cancelable: true, submitter})); }
  async function library() { await ui.open(); await flush(); }
  async function manage() { await library(); click('[data-cloud-action="scope"]'); await flush(); }
  good();
  return {w, doc, ui, api: w.ReelayApp, calls, client, errors, downloads, good, input, click, submit, library, manage,
    async emit(event, nextIdentity = guest, hint = {userId: nextIdentity.authenticated ? uuid(900) : null}) { identity = copy(nextIdentity); for (const callback of subscribers) callback(event, hint); await flush(); },
    setRows(value) { rows = copy(value); },
  };
}

test('guests read and use public costs without changing local observations or theoretical rules', async t => {
  const h = await boot(t, {rows: [fixture(1, '3.1234567890123456789')]});
  const before = h.api.getState(), expectedQuote = h.api.current().calc.P;
  assert.equal(h.doc.getElementById('open-cloud').hidden, false);
  await h.library();
  assert.match(h.doc.querySelector('.cloud-record').textContent, /3\.1234567890123456789/);
  assert.equal(h.doc.querySelector('[data-cloud-action="new"]'), null);
  h.click('[data-cloud-action="use"]');
  assert.equal(h.doc.getElementById('record-cost').value, '3.1234567890123456789');
  assert.equal(h.doc.querySelector('[data-cost-basis][aria-selected="true"]').dataset.costBasis, 'actual');
  assert.equal(E.cmp(h.api.current().calc.P, expectedQuote), 0, 'cloud facts do not replace the theoretical formula');
  assert.deepEqual(copy(h.api.getState().observations), copy(before.observations));
  assert.deepEqual(copy(h.api.getState().rules), copy(before.rules));
  h.good();
});

test('guest login and denied enrollment do not grant writes or disturb the calculator', async t => {
  const h = await boot(t, {verifiedIdentity: {...guest, authenticated: true}});
  const before = copy(h.api.getState()), estimate = h.doc.getElementById('cost-p').textContent;
  h.ui.saveCurrent();
  assert.ok(h.doc.getElementById('cloud-login-form'));
  assert.equal(h.doc.getElementById('cloud-record-form'), null);
  h.input('cloud-email', 'outside@example.com'); h.submit('cloud-login-form'); await flush();
  h.input('cloud-code', '123456'); h.submit('cloud-verify-form'); await flush();
  assert.match(h.doc.getElementById('cloud-error').textContent, /未获得录入权限/);
  assert.equal(h.doc.getElementById('cloud-record-form'), null);
  assert.equal(h.calls.filter(([method]) => method === 'save').length, 0);
  assert.deepEqual(copy(h.api.getState()), before);
  assert.equal(h.doc.getElementById('cost-p').textContent, estimate);
  h.good();
});

test('login form accepts a complete eight-digit email code and forwards it unchanged', async t => {
  const h = await boot(t);
  h.ui.saveCurrent();
  h.input('cloud-email', 'owner@example.com'); h.submit('cloud-login-form'); await flush();
  const code = h.doc.getElementById('cloud-code');
  h.input('cloud-code', '01234567');
  assert.ok(code.maxLength >= code.value.length, 'the input must not truncate the hosted OTP');
  assert.equal(code.checkValidity(), true);
  h.submit('cloud-verify-form'); await flush();
  assert.deepEqual(h.calls.find(([method]) => method === 'verifyCode'), ['verifyCode', 'owner@example.com', '01234567']);
  assert.equal(h.ui.canWrite(), true);
  h.good();
});

test('saving an edited managed record uses the new amount and version from the public list', async t => {
  const h = await boot(t, {identity: admin});
  await h.manage(); h.click('[data-cloud-action="edit"]');
  h.input('cloud-cost', '2'); h.submit('cloud-record-form'); await flush();
  assert.equal(h.doc.querySelector('.cloud-record-head .num').textContent, '2');
  h.click('[data-cloud-action="use"]');
  assert.equal(h.doc.getElementById('record-cost').value, '2', 'a stale managed cache cannot override the displayed public record');
  assert.equal(h.ui.getRecords()[0].version, 2);
  h.good();
});

test('an older pending public read cannot overwrite a subsequent successful save', async t => {
  const stale = deferred();
  const h = await boot(t, {identity: admin, readPublic: (count, rows) => count === 1 ? stale.promise : rows});
  await h.manage(); h.click('[data-cloud-action="edit"]');
  h.input('cloud-cost', '7'); h.submit('cloud-record-form'); await flush();
  assert.equal(h.ui.getRecords()[0].record.C, '7');
  stale.resolve([fixture(1, '1')]); await flush();
  assert.equal(h.ui.getRecords()[0].record.C, '7', 'late network reads must not revert acknowledged writes');
  h.click('[data-cloud-action="use"]');
  assert.equal(h.doc.getElementById('record-cost').value, '7');
  h.good();
});

test('saving the current task opens its own parameters instead of an abandoned different-task draft', async t => {
  const saved = [];
  const h = await boot(t, {identity: admin, save: draft => { saved.push(copy(draft)); return {...fixture(), ...draft, version: 1}; }});
  h.ui.saveCurrent(); h.input('cloud-cost', '2.22');
  h.click('#close-drawer');
  h.input('seconds', '5'); h.click('#cost-tab-actual'); h.input('record-cost', '4.33');
  h.ui.saveCurrent();
  assert.equal(h.doc.getElementById('cloud-cost').value, '4.33');
  h.submit('cloud-record-form'); await flush();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].record.params.seconds, '5');
  assert.equal(saved[0].record.C, '4.33');
  h.good();
});

test('cross-tab sign-out clears the visible private member panel and privileged controls', async t => {
  const h = await boot(t, {identity: admin});
  await h.library(); h.click('[data-cloud-action="members"]'); await flush();
  assert.match(h.doc.getElementById('drawer-body').textContent, /private-member@example\.com/);
  await h.emit('SIGNED_OUT');
  assert.doesNotMatch(h.doc.getElementById('drawer-body').textContent, /private-member@example\.com/);
  assert.equal(h.doc.querySelector('[data-cloud-action="toggle-member"]'), null);
  assert.equal(h.ui.canWrite(), false);
  h.ui.saveCurrent();
  assert.ok(h.doc.getElementById('cloud-login-form'));
  h.good();
});

test('private reads completing after sign-out cannot restore member data', async t => {
  const result = deferred();
  const h = await boot(t, {identity: admin, members: () => result.promise});
  await h.library(); h.click('[data-cloud-action="members"]'); await flush();
  await h.emit('SIGNED_OUT');
  result.resolve([{id: uuid(101), email: 'late-private@example.com', display_name: 'Late', role: 'editor', active: true}]);
  await flush();
  assert.doesNotMatch(h.doc.getElementById('drawer-body').textContent, /late-private@example\.com/);
  assert.equal(h.doc.getElementById('cloud-member-form'), null);
  h.good();
});

test('failed writes keep exact input, expose retry and leave public data untouched', async t => {
  const network = Object.assign(new Error('无法连接云端，请检查网络后重试。'), {code: 'NETWORK'});
  const h = await boot(t, {identity: admin, save: async () => { throw network; }});
  h.ui.saveCurrent(); h.input('cloud-cost', '0.12345678901234567890'); h.input('cloud-note', 'keep this draft');
  h.submit('cloud-record-form'); await flush();
  assert.equal(h.doc.getElementById('cloud-cost').value, '0.12345678901234567890');
  assert.equal(h.doc.getElementById('cloud-note').value, 'keep this draft');
  assert.equal(h.doc.querySelector('#cloud-record-form [type="submit"]').disabled, false);
  assert.match(h.doc.getElementById('cloud-error').textContent, /无法连接云端/);
  assert.equal(h.ui.getRecords()[0].record.C, '1');
  assert.doesNotMatch(h.doc.getElementById('toast').textContent, /已保存到云端/);
  h.good();
});

test('version conflicts keep the attempted edit and explicitly create a new identity when saved separately', async t => {
  let attempts = 0;
  const h = await boot(t, {identity: admin, save: async draft => {
    attempts++;
    if (attempts === 1) throw Object.assign(new Error('记录已发生变化，请刷新后再编辑。'), {code: 'CONFLICT'});
    return {...fixture(), ...draft, version: 1};
  }});
  await h.manage(); h.click('[data-cloud-action="edit"]');
  h.input('cloud-cost', '8'); h.submit('cloud-record-form'); await flush();
  assert.equal(h.doc.getElementById('cloud-cost').value, '8');
  assert.match(h.doc.getElementById('cloud-error').textContent, /发生变化/);
  h.click('[data-cloud-action="new-from-draft"]'); h.submit('cloud-record-form'); await flush();
  const writes = h.calls.filter(([method]) => method === 'save').map(([, draft]) => draft);
  assert.equal(writes.length, 2);
  assert.equal(writes[0].id, uuid(1)); assert.equal(writes[0].version, 1);
  assert.notEqual(writes[1].id, uuid(1)); assert.equal(writes[1].version, 0); assert.equal(writes[1].record.C, '8');
  h.good();
});

test('authentication and member secrets are absent from calculator JSON export', async t => {
  const h = await boot(t, {identity: admin});
  await h.library(); h.click('[data-cloud-action="use"]');
  h.click('#export'); h.click('#export-json');
  assert.equal(h.downloads.length, 1);
  const exported = await h.downloads[0].blob.text();
  const payload = JSON.parse(exported);
  assert.doesNotMatch(exported, /sensitive-test|private-login|access_token|refresh_token|reelay_cloud_auth/);
  assert.equal(payload.format, 'reelay.pricing.v9');
  assert.equal(payload.state.plan.company, h.api.getState().plan.company);
  assert.ok(h.w.localStorage.getItem('reelay_cloud_auth_v1').includes('sensitive-test-access-token'), 'export does not erase a legitimate login session');
  h.good();
});

test('implicit form submissions do not throw and supported legacy codes still work', async t => {
  const h = await boot(t);
  h.ui.saveCurrent(); h.input('cloud-email', 'owner@example.com'); h.submit('cloud-login-form', true); await flush();
  h.input('cloud-code', '123456');
  assert.equal(h.doc.getElementById('cloud-code').checkValidity(), true);
  h.submit('cloud-verify-form', true); await flush();
  assert.ok(h.doc.getElementById('cloud-record-form'));
  h.input('cloud-cost', '2'); h.submit('cloud-record-form', true); await flush();
  assert.equal(h.calls.filter(([method]) => method === 'save').length, 1);
  h.good();
});

test('two same-spec public records require an explicit selection in both task output and calculation details', async t => {
  const h = await boot(t, {rows: [fixture(1, '11'), fixture(2, '22')]});
  const state = h.api.getState(); state.observations = []; state.taskCostInput = null; state.task = copy(params); h.api.setState(state);
  h.click('#cost-tab-actual');
  assert.equal(h.doc.getElementById('record-cost').value, '');
  assert.equal(h.doc.getElementById('task-record-select').value, '');
  for (const id of ['actual-cash', 'integer-points', 'model-profit']) assert.equal(h.doc.getElementById(id).textContent.trim(), '—', id + ' waits for explicit record choice');
  h.click('#details');
  assert.ok(h.doc.querySelector('.pricing-pending'), 'details must stay pending rather than adopt the first cloud record');
  assert.match(h.doc.getElementById('drawer-body').textContent, /待录入|选择/);
  assert.equal(h.doc.querySelector('.pricing-calculation-flow'), null);
  h.click('#close-drawer');
  h.input('task-record-select', 'cloud:' + uuid(2), 'change');
  assert.equal(h.doc.getElementById('record-cost').value, '22');
  h.good();
});

test('admin demotion to editor clears private member DOM even though recording rights remain', async t => {
  const h = await boot(t, {identity: admin});
  await h.library(); h.click('[data-cloud-action="members"]'); await flush();
  assert.match(h.doc.getElementById('drawer-body').textContent, /private-member@example\.com/);
  await h.emit('TOKEN_REFRESHED', {role: 'editor', authenticated: true, display_name: 'Owner'});
  assert.equal(h.ui.canWrite(), true, 'editor retains record-writing rights');
  assert.doesNotMatch(h.doc.getElementById('drawer-body').textContent, /private-member@example\.com/);
  assert.equal(h.doc.querySelector('[data-cloud-action="toggle-member"]'), null);
  assert.equal(h.doc.getElementById('cloud-member-form'), null);
  h.good();
});

test('a saving record locks all editable controls and restores them with the original values on failure', async t => {
  const pending = deferred();
  const h = await boot(t, {identity: admin, save: () => pending.promise});
  h.ui.saveCurrent(); h.input('cloud-cost', '2.123456789'); h.input('cloud-note', 'pending draft');
  const form = h.doc.getElementById('cloud-record-form');
  h.submit('cloud-record-form'); await flush();
  assert.equal(form.getAttribute('aria-busy'), 'true');
  for (const control of form.querySelectorAll('input,select,textarea,button')) assert.equal(control.disabled, true, control.id || control.textContent);
  h.submit('cloud-record-form'); await flush();
  assert.equal(h.calls.filter(([method]) => method === 'save').length, 1, 'a second submit cannot duplicate an in-flight write');
  pending.reject(Object.assign(new Error('网络暂时中断，请重试。'), {code: 'NETWORK'})); await flush();
  assert.equal(form.getAttribute('aria-busy'), 'false');
  for (const control of form.querySelectorAll('input,select,textarea,button')) assert.equal(control.disabled, false, control.id || control.textContent);
  assert.equal(h.doc.getElementById('cloud-cost').value, '2.123456789');
  assert.equal(h.doc.getElementById('cloud-note').value, 'pending draft');
  h.good();
});

test('same-user SIGNED_IN on refocus preserves the exact editor and never adds auth data to the saved record', async t => {
  const h = await boot(t, {identity: admin});
  h.ui.saveCurrent(); h.input('cloud-cost', '5.4321'); h.input('cloud-note', 'keep editing');
  const form = h.doc.getElementById('cloud-record-form');
  await h.emit('SIGNED_IN', admin, {userId: uuid(900)});
  assert.equal(h.doc.getElementById('cloud-record-form'), form, 'reaffirming the same session must not discard the editor');
  assert.equal(h.doc.getElementById('cloud-cost').value, '5.4321');
  h.submit('cloud-record-form'); await flush();
  const writes = h.calls.filter(([method]) => method === 'save');
  assert.equal(writes.length, 1);
  assert.doesNotMatch(JSON.stringify(writes[0]), /sensitive-test|private-login|access_token|refresh_token|userId/);
  assert.equal(writes[0][1].record.note, 'keep editing');
  h.good();
});

test('refreshing a newer public version preserves the adopted task snapshot until the user adopts it again', async t => {
  const h = await boot(t, {rows: [fixture(1, '3')]});
  await h.library(); h.click('[data-cloud-action="use"]');
  assert.equal(h.doc.getElementById('record-cost').value, '3');
  const amounts = ['integer-points', 'actual-cash', 'model-profit'].map(id => h.doc.getElementById(id).textContent);
  h.setRows([{...fixture(1, '9'), version: 2, updated_at: '2026-11-05T02:00:00Z'}]);
  await h.library();
  assert.equal(h.ui.getRecords()[0].record.C, '9', 'the public library has received the new version');
  assert.equal(h.doc.querySelector('.cloud-record-head .num').textContent, '9');
  assert.equal(h.doc.getElementById('record-cost').value, '3', 'an active calculation keeps its adopted evidence snapshot');
  assert.deepEqual(['integer-points', 'actual-cash', 'model-profit'].map(id => h.doc.getElementById(id).textContent), amounts);
  h.click('[data-cloud-action="use"]');
  assert.equal(h.doc.getElementById('record-cost').value, '9');
  assert.notEqual(h.doc.getElementById('actual-cash').textContent, amounts[1]);
  h.good();
});

test('JSON snapshots preserve an adopted public record for import into an offline calculator', async t => {
  const source = fixture(7, '6.1234567890123456789');
  source.record.N = '102'; source.record.note = 'verified source';
  const h = await boot(t, {rows: [source]});
  await h.library(); h.click('[data-cloud-action="use"]');
  h.click('#export'); h.click('#export-json');
  const exported = await h.downloads[0].blob.text(), payload = JSON.parse(exported);
  assert.equal(payload.state.publicRecordSnapshots.length, 1);
  const snapshot = payload.state.publicRecordSnapshots[0];
  assert.equal(snapshot.id, 'cloud:' + source.id);
  assert.equal(snapshot.C, source.record.C); assert.equal(snapshot.N, '102'); assert.equal(snapshot.note, 'verified source');
  assert.equal(snapshot._cloud, undefined);
  assert.doesNotMatch(JSON.stringify(snapshot), /session|access_token|refresh_token|sensitive-test|private-login/);
  const offline = await boot(t, {offline: true});
  assert.equal(offline.ui, undefined);
  assert.equal(offline.doc.getElementById('open-cloud').hidden, true);
  const restored = offline.api.migrate(payload).value;
  assert.equal(offline.api.validState(restored), true);
  assert.deepEqual(copy(restored.publicRecordSnapshots[0]), snapshot);
  offline.api.setState(restored);
  offline.click('#cost-tab-actual');
  offline.input('task-record-select', snapshot.id, 'change');
  assert.equal(offline.doc.getElementById('record-cost').value, source.record.C);
  assert.notEqual(offline.doc.getElementById('actual-cash').textContent, '—');
  assert.equal(offline.calls.length, 0, 'offline import makes no cloud requests');
  h.good(); offline.good();
});

test('record specification editing saves the edited model and dimensions and rejects unsupported model limits', async t => {
  const h = await boot(t, {identity: admin});
  const originalTask = copy(h.api.getState().task);
  h.ui.saveCurrent();
  h.doc.querySelector('.cloud-spec').open = true;
  h.input('cloud-task-model', 'seedance-2.5', 'change');
  h.input('cloud-task-res', '1080p', 'change');
  h.input('cloud-task-ratio', '16:9', 'change');
  h.input('cloud-task-seconds', '30', 'change');
  h.input('cloud-task-video', 'true', 'change');
  h.input('cloud-task-vin', '20', 'change');
  h.input('cloud-cost', '35.125');
  h.submit('cloud-record-form'); await flush();
  const writes = h.calls.filter(([method]) => method === 'save');
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0][1].record.params, {model: 'seedance-2.5', res: '1080p', ratio: '16:9', seconds: '30', video: true, vin: '20'});
  assert.deepEqual(copy(h.api.getState().task), originalTask, 'recording a different task does not change the main calculation');
  h.ui.saveCurrent();
  h.doc.querySelector('.cloud-spec').open = true;
  h.input('cloud-task-model', 'seedance-2.0-fast', 'change');
  assert.deepEqual([...h.doc.getElementById('cloud-task-res').options].map(option => option.value), ['480p', '720p']);
  assert.equal(h.doc.getElementById('cloud-task-seconds').max, '15');
  h.input('cloud-task-seconds', '30', 'change');
  h.input('cloud-cost', '5');
  h.submit('cloud-record-form'); await flush();
  assert.equal(h.calls.filter(([method]) => method === 'save').length, 1, 'unsupported Fast duration never reaches cloud storage');
  assert.ok(h.doc.getElementById('cloud-record-form'));
  assert.ok(h.doc.getElementById('cloud-error').textContent);
  assert.equal(h.doc.querySelector('#cloud-record-form [type="submit"]').disabled, false);
  h.good();
});
