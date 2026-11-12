'use strict';

// A narrow interface keeps auth sessions out of calculator state and JSON exports.
// Authorization is enforced by the database, never by this browser adapter.
const ACCESS_STORAGE_KEY = 'reelay_cloud_access_v1';
const ACCESS_KEY = /^rk_[0-9a-f]{64}$/;
const SESSION_TOKEN = /^rs_[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function problem(code, message) {
  const error = new Error(message);
  error.name = 'CloudError';
  error.code = code;
  return error;
}

function publicError(error) {
  if (error?.name === 'CloudError') return error;
  const code = String(error?.code || error?.status || '');
  if (code === 'PT400') return problem('INVALID_INPUT', '输入不完整或格式不正确，请检查后重试。');
  if (code === 'PT403' || code === '42501' || code === '403') return problem('FORBIDDEN', '当前密钥没有此操作的权限，请联系管理员。');
  if (code === 'PT404') return problem('NOT_FOUND', '这条记录已不存在，请刷新列表。');
  if (code === 'PT409' || code === '23505') return problem('CONFLICT', '记录已发生变化，请刷新后再编辑；当前输入尚未保存。');
  if (['PT401', '401', 'PGRST301', 'PGRST302', 'PGRST303'].includes(code)) return problem('SESSION_EXPIRED', '录入权限已失效，请重新输入密钥。');
  if (['over_request_rate_limit', '429'].includes(code)) return problem('RATE_LIMIT', '请求过于频繁，请稍后再试。');
  if (error?.name === 'AbortError') return problem('CANCELLED', '请求已取消。');
  if (error instanceof TypeError || code === '0' || error?.name === 'AuthRetryableFetchError') return problem('NETWORK', '无法连接云端，请检查网络后重试。');
  // Do not expose upstream response messages, request details, or tokens to UI.
  return problem('UNAVAILABLE', '云端暂时不可用，请稍后重试。');
}

function validateConfig(config) {
  if (!config || (!config.url && !config.publishableKey)) return null;
  if (typeof config.url !== 'string' || typeof config.publishableKey !== 'string') throw problem('INVALID_CONFIG', '云端配置不完整。');
  let url;
  try { url = new URL(config.url); } catch (_) { throw problem('INVALID_CONFIG', '云端地址无效。'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw problem('INVALID_CONFIG', '云端地址须为安全的服务地址。');
  const key = config.publishableKey;
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicKey && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
    try {
      const part = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
      publicKey = payload.role === 'anon';
    } catch (_) { /* An unrecognized key must not reach a browser request. */ }
  }
  if (!publicKey || key.length > 4096) throw problem('UNSAFE_KEY', '网页只能配置公开访问密钥，不能使用服务端密钥。');
  return {url: url.origin, publishableKey: key};
}

function recordId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw problem('INVALID_INPUT', '记录标识无效，请重新打开记录。');
  return value;
}

function recordVersion(value, allowNew = false) {
  if (!Number.isSafeInteger(value) || value < (allowNew ? 0 : 1)) throw problem('INVALID_INPUT', '记录版本无效，请刷新后重试。');
  return value;
}

function rowValue(row, management = false) {
  if (!row || typeof row !== 'object' || !UUID.test(row.id) || !Number.isSafeInteger(row.version) || row.version < 1 || !row.record || typeof row.record !== 'object' || Array.isArray(row.record)) throw problem('INVALID_RESPONSE', '云端记录格式异常，请稍后刷新。');
  const value = {id: row.id, version: row.version, record: row.record, created_at: row.created_at, updated_at: row.updated_at};
  if (management) {
    value.archived = row.archived === true;
    value.can_edit = row.can_edit === true;
  }
  return value;
}

const guestIdentity = () => ({role: null, authenticated: false, display_name: '', key_id: null, expires_at: null});

function identityValue(data, expiresAt) {
  if (data?.authenticated === false && data.role === null) return guestIdentity();
  if (!data || data.authenticated !== true || !['editor', 'admin'].includes(data.role) || !UUID.test(data.key_id) || !Number.isFinite(Date.parse(data.expires_at))) throw problem('INVALID_RESPONSE', '录入权限信息异常，请重新解锁。');
  return {role: data.role, authenticated: true, display_name: typeof data.display_name === 'string' ? data.display_name : '', key_id: data.key_id, expires_at: expiresAt || data.expires_at};
}

function keyValue(data) {
  if (!data || !UUID.test(data.id) || !['editor', 'admin'].includes(data.role) || typeof data.active !== 'boolean' || typeof data.display_name !== 'string') throw problem('INVALID_RESPONSE', '密钥信息异常，请稍后刷新。');
  return {id: data.id, display_name: data.display_name, role: data.role, active: data.active, created_at: data.created_at, updated_at: data.updated_at};
}

function issuedKey(data) {
  if (!ACCESS_KEY.test(data?.access_key)) throw problem('INVALID_RESPONSE', '密钥生成结果异常，请刷新后检查。');
  return {key: keyValue(data.key), access_key: data.access_key};
}

function createCloudClient(config, options = {}) {
  const settings = validateConfig(config);
  const timeoutMs = options.timeoutMs ?? 15000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw problem('INVALID_CONFIG', '云端请求超时设置无效。');
  const now = options.now || Date.now;
  let storage = options.storage;
  if (!storage) { try { storage = globalThis.localStorage; } catch (_) { /* A blocked storage origin still permits an in-memory session. */ } }
  const eventTarget = options.eventTarget || (typeof globalThis.addEventListener === 'function' ? globalThis : null);
  let sdk = null, session = null, generation = 0, knownIdentity = guestIdentity();
  const listeners = new Set();
  if (settings) {
    if (typeof options.createClient !== 'function') throw problem('INVALID_CONFIG', '云端连接组件未加载。');
    sdk = options.createClient(settings.url, settings.publishableKey, {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
    });
  }

  function ensureEnabled() { if (!sdk) throw problem('NOT_CONFIGURED', '云端尚未配置。'); }
  function sameSession(a, b) { return a?.session_token === b?.session_token && a?.expires_at === b?.expires_at; }
  function normalizedSession(value) {
    if (!value || !SESSION_TOKEN.test(value.session_token) || !Number.isFinite(Date.parse(value.expires_at)) || Date.parse(value.expires_at) <= now()) return null;
    return {session_token: value.session_token, expires_at: value.expires_at};
  }
  function storedSession() {
    if (!storage) return session;
    let raw;
    try { raw = storage.getItem(ACCESS_STORAGE_KEY); }
    catch (_) { storage = null; return session; }
    try { return normalizedSession(JSON.parse(raw || 'null')); }
    catch (_) { return null; }
  }
  function persist(next) {
    if (!storage) return;
    try { if (next) storage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(next)); else storage.removeItem(ACCESS_STORAGE_KEY); }
    catch (_) { storage = null; /* Storage denial does not invalidate an already verified in-memory session. */ }
  }
  function notify(event, reason) {
    const revision = generation, hint = {userId: knownIdentity.key_id, ...(reason ? {reason} : {})};
    for (const listener of listeners) {
      const timer = setTimeout(() => {
        listener.timers.delete(timer);
        if (listeners.has(listener) && revision === generation) listener.callback(event, hint);
      }, 0);
      listener.timers.add(timer);
    }
  }
  function replaceSession(next, identity = guestIdentity(), event = null, save = true, reason = undefined) {
    generation++;
    session = next;
    knownIdentity = identity;
    if (save) persist(next);
    if (event) notify(event, reason);
  }
  function syncStorage() {
    if (session && Date.parse(session.expires_at) <= now()) { replaceSession(null, guestIdentity(), 'SIGNED_OUT', true, 'expired'); return session; }
    const next = storedSession();
    if (!sameSession(session, next)) replaceSession(next, guestIdentity(), next ? 'SIGNED_IN' : 'SIGNED_OUT', false, next ? undefined : 'external');
    return session;
  }
  if (sdk) {
    session = storedSession();
    if (!session) persist(null);
    eventTarget?.addEventListener('storage', event => {
      if ((event.key === ACCESS_STORAGE_KEY || event.key === null) && (!event.storageArea || event.storageArea === storage)) syncStorage();
    });
  }

  async function request(execute, requestOptions = {}) {
    ensureEnabled();
    const outerSignal = requestOptions.signal;
    if (outerSignal?.aborted) throw problem('CANCELLED', '请求已取消。');
    const controller = new AbortController();
    let timer, onAbort;
    try {
      const stopped = new Promise((_, reject) => {
        onAbort = () => { reject(problem('CANCELLED', '请求已取消。')); controller.abort(); };
        outerSignal?.addEventListener('abort', onAbort, {once: true});
        timer = setTimeout(() => { reject(problem('TIMEOUT', requestOptions.write ? '请求超时，保存结果尚未确认，请刷新记录后再试。' : '请求超时，请检查网络后重试。')); controller.abort(); }, timeoutMs);
      });
      const response = await Promise.race([Promise.resolve().then(() => {
        if (controller.signal.aborted) throw problem('CANCELLED', '请求已取消。');
        return execute(controller.signal);
      }), stopped]);
      if (response?.error) throw response.error;
      return response?.data;
    } catch (error) { throw publicError(error); }
    finally { clearTimeout(timer); outerSignal?.removeEventListener('abort', onAbort); }
  }

  function rpc(name, args = {}, requestOptions = {}, range = null) {
    return request(signal => {
      let query = sdk.rpc(name, args);
      if (range) query = query.range(range[0], range[1]);
      return query.abortSignal(signal);
    }, requestOptions);
  }
  function credentials() {
    ensureEnabled();
    const current = syncStorage();
    if (!current) throw problem('SESSION_EXPIRED', '请先输入录入密钥。');
    return {generation, ...current};
  }
  function stillCurrent(capture) { syncStorage(); return capture.generation === generation && capture.session_token === session?.session_token; }
  async function privateRpc(name, args = {}, requestOptions = {}, range = null, capture = credentials()) {
    try {
      const data = await rpc(name, {session_token: capture.session_token, ...args}, requestOptions, range);
      if (!stillCurrent(capture)) throw problem('CANCELLED', '录入权限已改变，请重新操作。');
      return data;
    } catch (error) {
      if (!stillCurrent(capture)) throw problem('CANCELLED', '录入权限已改变，请重新操作。');
      if (error.code === 'SESSION_EXPIRED') replaceSession(null, guestIdentity(), 'SIGNED_OUT', true, 'expired');
      throw error;
    }
  }

  async function records(name, management, requestOptions = {}) {
    const pageSize = 500, maxRecords = 10000, output = [], seen = new Set(), capture = management ? credentials() : null;
    for (let start = 0; start <= maxRecords; start += pageSize) {
      const range = [start, start + pageSize - 1];
      const rows = management ? await privateRpc(name, {}, requestOptions, range, capture) : await rpc(name, {}, requestOptions, range);
      if (!Array.isArray(rows) || rows.length > pageSize) throw problem('INVALID_RESPONSE', '云端记录列表格式异常，请稍后刷新。');
      if (output.length + rows.length > maxRecords) throw problem('TOO_MANY_RECORDS', '云端记录超过当前页面可加载的数量，请联系管理员。');
      for (const row of rows) {
        const value = rowValue(row, management);
        if (seen.has(value.id)) throw problem('CHANGED_DURING_LOAD', '记录列表正在更新，请重新刷新。');
        seen.add(value.id); output.push(value);
      }
      if (rows.length < pageSize) return output;
    }
    throw problem('TOO_MANY_RECORDS', '云端记录超过当前页面可加载的数量，请联系管理员。');
  }

  const api = {
    enabled: Boolean(sdk),
    onAuthChange(callback) {
      if (typeof callback !== 'function') throw new TypeError('callback must be a function');
      if (!sdk) return () => {};
      const listener = {callback, timers: new Set()}; listeners.add(listener);
      const revision = generation, hint = {userId: knownIdentity.key_id};
      const timer = setTimeout(() => { listener.timers.delete(timer); if (listeners.has(listener) && revision === generation) callback('INITIAL_SESSION', hint); }, 0);
      listener.timers.add(timer);
      return () => { listeners.delete(listener); for (const timer of listener.timers) clearTimeout(timer); listener.timers.clear(); };
    },
    async unlock(accessKey, requestOptions = {}) {
      ensureEnabled();
      const value = String(accessKey || '').trim();
      if (!ACCESS_KEY.test(value)) throw problem('INVALID_KEY', '请输入完整的录入密钥。');
      syncStorage();
      const revision = ++generation;
      let data;
      try { data = await rpc('reelay_access_unlock', {access_key: value}, requestOptions); }
      catch (error) { if (error.code === 'SESSION_EXPIRED' || error.code === 'FORBIDDEN') throw problem('INVALID_KEY', '密钥无效或已停用，请联系管理员。'); throw error; }
      const next = normalizedSession(data), identity = identityValue(data?.identity, next?.expires_at);
      if (!next || !identity.authenticated) throw problem('INVALID_RESPONSE', '解锁结果异常，请重新输入密钥。');
      syncStorage();
      if (revision !== generation) {
        // A superseded request may have created a server session. Revoke it
        // without ever making it the active browser credential.
        void rpc('reelay_access_lock', {session_token: next.session_token}).catch(() => {});
        throw problem('CANCELLED', '解锁已取消，请重新操作。');
      }
      replaceSession(next, identity, 'SIGNED_IN', true, 'unlocked');
      return {...identity};
    },
    async signOut(requestOptions = {}) {
      ensureEnabled();
      const current = syncStorage();
      replaceSession(null, guestIdentity(), 'SIGNED_OUT', true, 'locked');
      if (current) {
        try { await rpc('reelay_access_lock', {session_token: current.session_token}, requestOptions); }
        catch (_) { throw problem('LOCK_UNCONFIRMED', '本机已锁定，云端会话撤销未确认。'); }
      }
      return {signedOut: true};
    },
    async identity(requestOptions = {}) {
      ensureEnabled();
      if (!syncStorage()) return guestIdentity();
      const capture = credentials();
      const value = identityValue(await privateRpc('reelay_access_identity', {}, requestOptions, null, capture), capture.expires_at);
      if (!value.authenticated) replaceSession(null, guestIdentity(), 'SIGNED_OUT', true, 'expired');
      else knownIdentity = value;
      return {...value};
    },
    publicRecords(requestOptions) { return records('reelay_public_records', false, requestOptions); },
    manageRecords(requestOptions) { return records('reelay_access_manage_records', true, requestOptions); },
    async saveRecord({id, version, record}, requestOptions = {}) {
      const args = {record_id: recordId(id), expected_version: recordVersion(version, true), record};
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw problem('INVALID_INPUT', '请填写实测记录。');
      return rowValue(await privateRpc('reelay_access_save_record', args, {...requestOptions, write: true}), true);
    },
    async archiveRecord({id, version, archived}, requestOptions = {}) {
      if (typeof archived !== 'boolean') throw problem('INVALID_INPUT', '记录状态无效。');
      return rowValue(await privateRpc('reelay_access_archive_record', {record_id: recordId(id), expected_version: recordVersion(version), archived}, {...requestOptions, write: true}), true);
    },
    async history(id, requestOptions = {}) {
      const data = await privateRpc('reelay_access_record_history', {record_id: recordId(id)}, requestOptions);
      if (!Array.isArray(data)) throw problem('INVALID_RESPONSE', '修改历史格式异常，请稍后刷新。');
      return data;
    },
    async keys(requestOptions = {}) {
      const data = await privateRpc('reelay_access_keys', {}, requestOptions);
      if (!Array.isArray(data)) throw problem('INVALID_RESPONSE', '密钥列表格式异常，请稍后刷新。');
      return data.map(keyValue);
    },
    async createKey({display_name, role = 'editor'}, requestOptions = {}) {
      if (typeof display_name !== 'string' || !display_name.trim() || display_name.trim().length > 60 || !['editor', 'admin'].includes(role)) throw problem('INVALID_INPUT', '请填写密钥名称和有效权限。');
      return issuedKey(await privateRpc('reelay_access_create_key', {display_name: display_name.trim(), key_role: role}, {...requestOptions, write: true}));
    },
    async setKey({id, active}, requestOptions = {}) {
      if (typeof active !== 'boolean') throw problem('INVALID_INPUT', '密钥状态无效。');
      return keyValue(await privateRpc('reelay_access_set_key', {key_id: recordId(id), active}, {...requestOptions, write: true}));
    },
    async rotateKey({id}, requestOptions = {}) {
      return issuedKey(await privateRpc('reelay_access_rotate_key', {key_id: recordId(id)}, {...requestOptions, write: true}));
    },
  };
  return Object.freeze(api);
}

module.exports = {createCloudClient, validateConfig};
