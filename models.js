/* Model-scoped Seedance estimates. Captured sources: evidence/2026-10-20/models/. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    let snapshot25 = null;
    try { snapshot25 = require('./generated-model-minima.js'); }
    catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND' || !error.message.startsWith("Cannot find module './generated-model-minima.js'")) throw error;
    }
    module.exports = factory(require('./engine.js'), require('./data.js'), snapshot25);
  } else root.ReelayModels = factory(root.ReelayMath, root.ReelayRules, root.ReelayModelMinimumSnapshot || null);
})(typeof window !== 'undefined' ? window : globalThis, function (E, R, snapshot25) {
  'use strict';
  if (!E || !R) throw new Error('缺少精确计算引擎或 Seedance 2.0 来源规则');
  const VERSION = 'volc-seedance-models-2026-10-20', VERIFIED_AT = '2026-10-20';
  const DEFAULT_MODEL = 'seedance-2.0', VERSION25 = 'volc-seedance25-2026-10-20';
  const RATIOS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];
  const DIR = 'evidence/2026-10-20/models/';
  const CALC20 = 'https://bytedance.larkoffice.com/share/base/form/shrcnP1Bl0mqCP9OHCbjpe1oBkf';
  const CALC25 = 'https://bytedance.larkoffice.com/share/base/form/shrcnhVCMxKxcwW1QML5r9u8nvh';
  const BASE_URL = 'https://bytedance.larkoffice.com/wiki/FXaYwxzJ5i5Zdik32ipcWzt7nxd';
  const NOTICE = '估算值，实际以调用 API 后返回信息中的 usage.completion_tokens 为准。';
  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(deepFreeze); Object.freeze(value);
    }
    return value;
  }
  const copyDims = resolutions => Object.fromEntries(resolutions.map(res => [
    res, Object.fromEntries(Object.entries(E.DIMS[res]).map(([ratio, wh]) => [ratio, [...wh]]))
  ]));
  const dimensions25 = copyDims(['480p', '720p', '1080p']);
  dimensions25['480p']['16:9'] = [854, 480];
  dimensions25['480p']['9:16'] = [480, 854];
  function sources(calculator, tableId, sharedMinimumWith = null) {
    const is25 = tableId === 'tblheIYDXXwYM43b';
    const resolutions = is25 ? ['480p', '720p', '1080p'] : sharedMinimumWith ? ['480p', '720p'] : R.RESOLUTIONS;
    const views = Object.fromEntries(resolutions.map(res => {
      if (!is25) return [res, R.sources.minima.views[res]];
      const entry = snapshot25?.entries && Object.entries(snapshot25.entries).find(([key]) => key.startsWith(res + '|'))?.[1];
      return [res, BASE_URL + '?table=' + tableId + (entry?.sourceView ? '&view=' + entry.sourceView : '')];
    }));
    return {
      verifiedAt: VERIFIED_AT, timezone: 'Asia/Shanghai',
      pricing: {url: 'https://ark.volcengine.com/region:cn-beijing/docs/model-pricing.md', pageUrl: 'https://ark.volcengine.com/region:cn-beijing/docs/model-pricing', file: DIR + 'model-pricing.md', unit: '元/百万 completion_tokens', note: '标准刊例费率；不自动沿用已结束的促销。'},
      dimensions: {url: 'https://ark.volcengine.com/region:cn-beijing/docs/create-video-generation-task-api.md', pageUrl: 'https://ark.volcengine.com/region:cn-beijing/docs/create-video-generation-task-api', file: DIR + 'create-video-generation-task-api.md'},
      usage: {url: 'https://ark.volcengine.com/region:cn-beijing/docs/get-video-generation-task-api.md', file: DIR + 'get-video-generation-task-api.md', note: 'completion_tokens 已含最低用量；不与 total_tokens 相加，不再次补最低门槛。'},
      minima: {
        url: views[resolutions[0]], views, tableId, fieldId: 'fld0p1bMiB', verifiedAt: is25 ? snapshot25?.verifiedAt || VERIFIED_AT : R.VERIFIED_AT,
        calculatorUrl: calculator, calculatorFile: DIR + (tableId === 'tblheIYDXXwYM43b' ? 'seedance-2.5' : 'seedance-2.0') + '-calculator-fields.json',
        sourceFormula: is25 ? snapshot25?.sourceFormula || null : R.sources.minima.sourceFormula,
        sourceDescription: is25 ? snapshot25?.sourceDescription || NOTICE : R.sources.minima.sourceDescription,
        provenance: is25 ? snapshot25 ? '独立取得官方 Seedance 2.5 最低用量表的原始复制数据，并核对该模型官方计算器与文档。' : '已核对官方 Seedance 2.5 计算器与文档；最低用量数据尚未接入，含视频结果只提供基础估算。' : R.sources.minima.provenance,
        method: '按本模型的分辨率、比例和输出时长查询已核验最低值；有视频时与基础估算取较大值，无视频时仅使用基础估算。',
        precision: '保留源公式的精确小数；显示值的舍入不参与计价。',
        evidencePath: is25 ? DIR : R.sources.minima.evidencePath,
        sharedMinimumWith, sharedMinimumEvidence: sharedMinimumWith ? '官方 2.0 系列计算器包含 fast 选项；最低用量 lookup 按分辨率、比例、输出时长筛选，不筛模型；费率另按模型筛选。' : null,
        billingNotice: NOTICE
      }
    };
  }
  const MODELS = deepFreeze({
    'seedance-2.0': {
      id: 'seedance-2.0', label: 'Seedance 2.0', resolutions: ['480p', '720p', '1080p', '4k'],
      seconds: {min: 4, max: 15}, inputSeconds: {min: 2, max: 15},
      dims: copyDims(['480p', '720p', '1080p', '4k']),
      rates: {'480p': ['46', '28'], '720p': ['46', '28'], '1080p': ['51', '31'], '4k': ['26', '16']},
      fps: '24', version: R.VERSION, sources: sources(CALC20, 'tblmNCuMjADrXtDf')
    },
    'seedance-2.0-fast': {
      id: 'seedance-2.0-fast', label: 'Seedance 2.0 Fast', resolutions: ['480p', '720p'],
      seconds: {min: 4, max: 15}, inputSeconds: {min: 2, max: 15}, dims: copyDims(['480p', '720p']),
      rates: {'480p': ['37', '22'], '720p': ['37', '22']},
      fps: '24', version: 'volc-seedance20-fast-2026-10-20', sources: sources(CALC20, 'tblmNCuMjADrXtDf', DEFAULT_MODEL)
    },
    'seedance-2.5': {
      id: 'seedance-2.5', label: 'Seedance 2.5', resolutions: ['480p', '720p', '1080p'],
      seconds: {min: 4, max: 30}, inputSeconds: {min: 2, max: 30}, dims: dimensions25,
      rates: {'480p': ['70', '42'], '720p': ['70', '42'], '1080p': ['77', '46']},
      fps: '24', version: VERSION25, sources: sources(CALC25, 'tblheIYDXXwYM43b')
    }
  });
  if (snapshot25 && (snapshot25.model !== 'seedance-2.5' || snapshot25.version !== VERSION25)) throw new Error('Seedance 2.5 最低用量快照模型或版本不匹配');
  function get(id = DEFAULT_MODEL) {
    if (!Object.hasOwn(MODELS, id)) throw new Error('不支持的模型：' + String(id));
    return MODELS[id];
  }
  function normalizeSeconds(value, model = DEFAULT_MODEL) {
    const descriptor = get(model), text = String(value).trim();
    if (text === 'auto' || text === '-1') return 'auto';
    const seconds = E.dec(text);
    if (seconds.d !== 1n || E.cmp(seconds, descriptor.seconds.min) < 0 || E.cmp(seconds, descriptor.seconds.max) > 0)
      throw new Error(descriptor.label + ' 输出时长须为 ' + descriptor.seconds.min + '～' + descriptor.seconds.max + ' 秒整数');
    return seconds.n.toString();
  }
  function specification(task) {
    const model = get(task.model), res = String(task.res).trim().toLowerCase(), ratio = String(task.ratio).trim();
    if (!model.resolutions.includes(res)) throw new Error(model.label + ' 不支持分辨率 ' + res);
    if (!RATIOS.includes(ratio) && ratio !== 'auto' && ratio !== 'adaptive') throw new Error('不支持的比例：' + ratio);
    return {model, res, ratio, seconds: normalizeSeconds(task.seconds, model.id)};
  }
  function key(task, version) {
    const spec = specification(task);
    if (spec.seconds === 'auto' || spec.ratio === 'auto' || spec.ratio === 'adaptive') return null;
    return [spec.model.id, version === undefined ? spec.model.version : String(version), spec.res, spec.ratio, spec.seconds].join('|');
  }
  function buildMinima() {
    const minima = {};
    for (const model of Object.values(MODELS)) for (const res of model.resolutions) for (const ratio of RATIOS)
      for (let seconds = model.seconds.min; seconds <= model.seconds.max; seconds++) {
        const task = {model: model.id, res, ratio, seconds}, lookup = key(task);
        let row;
        if (model.id === 'seedance-2.5') {
          row = snapshot25?.entries?.[[res, ratio, seconds].join('|')];
          if (!row) continue;
          if (row.sourceTable !== model.sources.minima.tableId) throw new Error('Seedance 2.5 最低用量来源表不匹配');
          if (row.sourceField !== 'fld0p1bMiB' || typeof row.sourceFile !== 'string' || !row.sourceFile.startsWith(DIR))
            throw new Error('Seedance 2.5 最低用量来源记录不完整');
        } else row = R.officialMinimum({...task, model: DEFAULT_MODEL});
        if (!row || E.cmp(row.tokens, '0') <= 0) throw new Error(model.label + ' 最低用量记录缺失或无效');
        minima[lookup] = {
          tokens: row.tokens, displayedTokens: row.displayedTokens, kind: 'official',
          model: model.id, version: model.version, key: lookup, res, ratio, seconds: String(seconds),
          verifiedAt: snapshot25 && model.id === 'seedance-2.5' ? snapshot25.verifiedAt : VERIFIED_AT,
          sourceUrl: row.sourceUrl || BASE_URL + '?table=' + model.sources.minima.tableId + (row.sourceView ? '&view=' + row.sourceView : ''),
          sourceFile: row.sourceFile, sourceTable: model.sources.minima.tableId,
          sourceField: 'fld0p1bMiB', sharedMinimumWith: model.sources.minima.sharedMinimumWith,
          note: NOTICE
        };
      }
    return minima;
  }
  const MINIMA = deepFreeze(buildMinima());
  function officialMinimum(task) { const lookup = key(task); return lookup ? MINIMA[lookup] || null : null; }
  function validateMinimum(task, minimum) {
    if (minimum == null) return null;
    if (typeof minimum !== 'object' || !['official', 'manual'].includes(minimum.kind)) throw new Error('最低用量来源类型无效');
    const spec = specification(task), lookup = key(task);
    if (minimum.model !== undefined && minimum.model !== spec.model.id) throw new Error('最低用量记录不能跨模型使用');
    if (minimum.version !== undefined && minimum.version !== spec.model.version) throw new Error('最低用量记录版本不匹配');
    if (minimum.key !== undefined && minimum.key !== lookup) throw new Error('最低用量记录规格不匹配');
    for (const name of ['res', 'ratio', 'seconds'])
      if (minimum[name] !== undefined && String(minimum[name]) !== spec[name]) throw new Error('最低用量记录规格不匹配');
    const tokens = E.dec(minimum.tokens);
    if (E.cmp(tokens, '0') < 0) throw new Error('最低用量不能为负');
    if (minimum.kind === 'official') {
      const known = officialMinimum(task);
      if (!known || minimum.model !== spec.model.id || minimum.version !== spec.model.version || E.cmp(tokens, known.tokens) !== 0)
        throw new Error('官方最低用量记录与本模型已核验快照不符');
      return known;
    }
    return {...minimum, model: spec.model.id, version: spec.model.version, key: lookup};
  }
  function estimate(task, optionalMinimum) {
    const spec = specification(task), model = spec.model, video = E.normalizeVideo(task.video);
    const input = E.dec(video ? task.vin : '0');
    if (video && (E.cmp(input, model.inputSeconds.min) < 0 || E.cmp(input, model.inputSeconds.max) > 0))
      throw new Error(model.label + ' 参考视频总时长须为 ' + model.inputSeconds.min + '～' + model.inputSeconds.max + ' 秒');
    const rate = E.dec(model.rates[spec.res][video ? 1 : 0]);
    const metadata = {model: model.id, ruleVersion: model.version, normalizedSeconds: spec.seconds};
    if (!key(task)) return {...metadata, status: 'unresolved', tokens: null, billedTokens: null, minimum: null, P: null, base: null, rate, wh: null, partial: true, minimumSource: null, reason: '自动输出规格尚未确定'};
    const wh = model.dims[spec.res][spec.ratio];
    const tokens = E.div(E.mul(E.mul(E.mul(E.add(spec.seconds, input), String(wh[0])), String(wh[1])), model.fps), '1024');
    const base = E.div(E.mul(tokens, rate), '1000000');
    const supplied = optionalMinimum === undefined ? officialMinimum(task) : optionalMinimum;
    const rule = video ? validateMinimum(task, supplied) : null;
    const minimum = rule ? E.dec(rule.tokens) : null;
    const billedTokens = minimum && E.cmp(tokens, minimum) < 0 ? minimum : tokens;
    const partial = video && !rule;
    return {
      ...metadata, tokens, billedTokens, minimum, P: E.div(E.mul(billedTokens, rate), '1000000'),
      base, rate, wh, partial, status: partial ? 'base-theory' : rule?.kind === 'manual' ? 'manual-minimum' : 'rule-estimate',
      minimumSource: rule ? {kind: rule.kind, model: model.id, version: model.version, key: key(task), sourceUrl: rule.sourceUrl || null, sourceFile: rule.sourceFile || null, sourceTable: rule.sourceTable || null, verifiedAt: rule.verifiedAt || null, sharedMinimumWith: rule.sharedMinimumWith || null} : null,
      reason: partial ? '本模型此规格缺少已核验最低用量；当前金额仅为基础估算，不能作为完整报价。' : null
    };
  }
  function fromUsage(task, usage) {
    const model = get(task.model), res = String(task.res).trim().toLowerCase(), video = E.normalizeVideo(task.video), tokens = E.dec(usage);
    if (!model.resolutions.includes(res)) throw new Error(model.label + ' 不支持分辨率 ' + res);
    if (tokens.d !== 1n || E.cmp(tokens, '0') <= 0) throw new Error('计费用量须为正整数');
    return E.div(E.mul(tokens, model.rates[res][video ? 1 : 0]), '1000000');
  }
  return deepFreeze({VERSION, VERIFIED_AT, DEFAULT_MODEL, MODELS, RATIOS, MINIMA, get, normalizeSeconds, estimate, fromUsage, officialMinimum, key, buildMinima});
});
