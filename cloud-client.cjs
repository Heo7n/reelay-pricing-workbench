'use strict';

// A narrow interface keeps auth sessions out of calculator state and JSON exports.
// Authorization is enforced by the database, never by this browser adapter.
const AUTH_STORAGE_KEY = 'reelay_cloud_auth_v1';
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
  if (code === 'PT403' || code === '42501' || code === '403') return problem('FORBIDDEN', '当前账号没有此操作的权限，请联系管理员。');
  if (code === 'PT404') return problem('NOT_FOUND', '这条记录已不存在，请刷新列表。');
  if (code === 'PT409' || code === '23505') return problem('CONFLICT', '记录已发生变化，请刷新后再编辑；当前输入尚未保存。');
  if (['401', 'PGRST301', 'PGRST302', 'PGRST303', 'bad_jwt', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used'].includes(code)) return problem('SESSION_EXPIRED', '登录状态已失效，请重新登录。');
  if (['over_email_send_rate_limit', 'over_request_rate_limit', '429'].includes(code)) return problem('RATE_LIMIT', '请求过于频繁，请稍后再试。');
  if (['otp_expired', 'invalid_credentials', 'otp_disabled'].includes(code)) return problem('INVALID_CODE', '验证码无效或已过期，请重新获取。');
  if (['email_address_not_authorized', 'unexpected_failure', 'email_provider_disabled'].includes(code)) return problem('EMAIL_UNAVAILABLE', '登录邮件暂时无法发送，请联系管理员检查邮件配置。');
  if (code === 'email_address_invalid') return problem('INVALID_EMAIL', '请输入有效的邮箱地址。');
  if (code === 'user_banned') return problem('FORBIDDEN', '当前账号已停用，请联系管理员。');
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

function emailValue(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw problem('INVALID_EMAIL', '请输入有效的邮箱地址。');
  return email;
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

function createCloudClient(config, options = {}) {
  const settings = validateConfig(config);
  const timeoutMs = options.timeoutMs ?? 15000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw problem('INVALID_CONFIG', '云端请求超时设置无效。');
  let sdk = null;
  if (settings) {
    if (typeof options.createClient !== 'function') throw problem('INVALID_CONFIG', '云端连接组件未加载。');
    sdk = options.createClient(settings.url, settings.publishableKey, {
      auth: {
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
        storageKey: AUTH_STORAGE_KEY,
        ...(options.storage ? {storage: options.storage} : {}),
      },
    });
  }

  function ensureEnabled() {
    if (!sdk) throw problem('NOT_CONFIGURED', '云端尚未配置。');
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
        timer = setTimeout(() => {
          reject(problem('TIMEOUT', requestOptions.write ? '请求超时，保存结果尚未确认，请刷新记录后再试。' : '请求超时，请检查网络后重试。'));
          controller.abort();
        }, timeoutMs);
      });
      const response = await Promise.race([Promise.resolve().then(() => {
        if (controller.signal.aborted) throw problem('CANCELLED', '请求已取消。');
        return execute(controller.signal);
      }), stopped]);
      if (response?.error) throw response.error;
      return response?.data;
    } catch (error) {
      throw publicError(error);
    } finally {
      clearTimeout(timer);
      outerSignal?.removeEventListener('abort', onAbort);
    }
  }

  function rpc(name, args = {}, requestOptions = {}, range = null) {
    return request(signal => {
      let query = sdk.rpc(name, args);
      if (range) query = query.range(range[0], range[1]);
      return query.abortSignal(signal);
    }, requestOptions);
  }

  async function records(name, management, requestOptions = {}) {
    const pageSize = 500, maxRecords = 10000, output = [], seen = new Set();
    for (let start = 0; start <= maxRecords; start += pageSize) {
      const rows = await rpc(name, {}, requestOptions, [start, start + pageSize - 1]);
      if (!Array.isArray(rows) || rows.length > pageSize) throw problem('INVALID_RESPONSE', '云端记录列表格式异常，请稍后刷新。');
      if (output.length + rows.length > maxRecords) throw problem('TOO_MANY_RECORDS', '云端记录超过当前页面可加载的数量，请联系管理员。');
      for (const row of rows) {
        const value = rowValue(row, management);
        if (seen.has(value.id)) throw problem('CHANGED_DURING_LOAD', '记录列表正在更新，请重新刷新。');
        seen.add(value.id);
        output.push(value);
      }
      if (rows.length < pageSize) return output;
    }
    // A full final page must never be silently treated as the end of a dataset.
    throw problem('TOO_MANY_RECORDS', '云端记录超过当前页面可加载的数量，请联系管理员。');
  }

  const api = {
    enabled: Boolean(sdk),
    onAuthChange(callback) {
      if (typeof callback !== 'function') throw new TypeError('callback must be a function');
      if (!sdk) return () => {};
      let active = true;
      const timers = new Set();
      const {data} = sdk.auth.onAuthStateChange((event, session) => {
        // Supabase holds an auth lock during its callback. Run application work
        // on the next task, and never hand the session/JWT to calculator state.
        const identityHint = {userId: typeof session?.user?.id === 'string' ? session.user.id : null};
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (active) callback(event, identityHint);
        }, 0);
        timers.add(timer);
      });
      return () => {
        active = false;
        for (const timer of timers) clearTimeout(timer);
        timers.clear();
        data?.subscription?.unsubscribe();
      };
    },
    async sendCode(email, requestOptions) {
      const value = emailValue(email);
      await request(() => sdk.auth.signInWithOtp({email: value, options: {shouldCreateUser: true}}), requestOptions);
      return {sent: true};
    },
    async verifyCode(email, code, requestOptions) {
      const value = emailValue(email), token = String(code || '').trim();
      if (!/^\d{6,10}$/.test(token)) throw problem('INVALID_CODE', '请输入邮件中的完整数字验证码。');
      const data = await request(() => sdk.auth.verifyOtp({email: value, token, type: 'email'}), requestOptions);
      if (!data?.session || !data?.user) throw problem('INVALID_RESPONSE', '登录尚未完成，请重新验证。');
      return {authenticated: true};
    },
    async signOut(requestOptions) {
      await request(() => sdk.auth.signOut({scope: 'local'}), requestOptions);
      return {signedOut: true};
    },
    async identity(requestOptions) {
      const data = await rpc('reelay_identity', {}, requestOptions);
      if (!data || ![null, 'editor', 'admin'].includes(data.role)) throw problem('INVALID_RESPONSE', '账号权限信息异常，请重新登录。');
      return {role: data.role, authenticated: data.authenticated === true, display_name: typeof data.display_name === 'string' ? data.display_name : ''};
    },
    publicRecords(requestOptions) { return records('reelay_public_records', false, requestOptions); },
    manageRecords(requestOptions) { return records('reelay_manage_records', true, requestOptions); },
    async saveRecord({id, version, record}, requestOptions = {}) {
      const args = {record_id: recordId(id), expected_version: recordVersion(version, true), record};
      if (!record || typeof record !== 'object' || Array.isArray(record)) throw problem('INVALID_INPUT', '请填写实测记录。');
      return rowValue(await rpc('reelay_save_record', args, {...requestOptions, write: true}), true);
    },
    async archiveRecord({id, version, archived}, requestOptions = {}) {
      if (typeof archived !== 'boolean') throw problem('INVALID_INPUT', '记录状态无效。');
      const args = {record_id: recordId(id), expected_version: recordVersion(version), archived};
      return rowValue(await rpc('reelay_archive_record', args, {...requestOptions, write: true}), true);
    },
    async members(requestOptions) {
      const data = await rpc('reelay_members', {}, requestOptions);
      if (!Array.isArray(data)) throw problem('INVALID_RESPONSE', '成员列表格式异常，请稍后刷新。');
      return data;
    },
    async setMember({id = null, email, display_name = '', role, active}, requestOptions = {}) {
      if (!['admin', 'editor'].includes(role) || typeof active !== 'boolean' || typeof display_name !== 'string' || display_name.trim().length > 60) throw problem('INVALID_INPUT', '请检查成员名称与权限。');
      const args = {member_id: id === null ? null : recordId(id), email: emailValue(email), display_name: display_name.trim(), role, active};
      return rpc('reelay_set_member', args, {...requestOptions, write: true});
    },
    async history(id, requestOptions) {
      const data = await rpc('reelay_record_history', {record_id: recordId(id)}, requestOptions);
      if (!Array.isArray(data)) throw problem('INVALID_RESPONSE', '修改历史格式异常，请稍后刷新。');
      return data;
    },
  };
  return Object.freeze(api);
}

module.exports = {createCloudClient,validateConfig};
