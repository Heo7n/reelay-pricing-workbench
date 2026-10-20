'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const E = require('./engine.js');
const R = require('./data.js');
const M = require('./models.js');
const S = require('./source-rules.cjs');
const DIR = path.join(__dirname, 'evidence', '2026-10-20', 'models');
const json = name => JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8').replace(/^\uFEFF/, ''));
const read = name => fs.readFileSync(path.join(DIR, name), 'utf8');
const eq = (actual, expected) => assert.equal(S.exactDecimal(actual), expected);
const task = (model = 'seedance-2.0', overrides = {}) => ({model, res: '480p', ratio: '16:9', seconds: '5', video: false, vin: '2', ...overrides});
function browserModels(snapshot25, math = E) {
  const context = {window: {ReelayMath: math, ReelayRules: R, ReelayModelMinimumSnapshot: snapshot25}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'models.js'), 'utf8'), context);
  return context.window.ReelayModels;
}

test('all three model descriptors match independently saved official document metadata', () => {
  const metadata = json('models-metadata.json');
  assert.deepEqual(Object.keys(M.MODELS).sort(), ['seedance-2.0', 'seedance-2.0-fast', 'seedance-2.5']);
  assert.equal(M.get().id, 'seedance-2.0');
  for (const id of Object.keys(M.MODELS)) {
    const model = M.get(id), saved = metadata.models.find(x => x.id === id);
    assert.ok(saved);
    assert.deepEqual(model.resolutions, saved.resolutions);
    assert.deepEqual(model.rates, saved.rates);
    assert.deepEqual(model.dims, saved.dimensions);
    assert.deepEqual(model.seconds, {min: saved.outputSeconds.min, max: saved.outputSeconds.max});
    assert.deepEqual(model.inputSeconds, {min: saved.referenceVideo.singleMin, max: saved.referenceVideo.totalMax});
    assert.equal(model.fps, String(metadata.outputFps));
    assert.equal(model.sources.minima.tableId, saved.minimum.tableId);
    assert.ok(Object.isFrozen(model.rates['480p']));
    assert.ok(Object.isFrozen(model.dims['480p']['16:9']));
  }
  assert.throws(() => M.get('seedance-2.0-mini'), /不支持的模型/);
  assert.throws(() => M.get('__proto__'), /不支持的模型/);
});

test('document hashes match saved HTTP receipts and fast minimum sharing has calculator evidence', () => {
  for (const receipt of json('documents-manifest.json')) {
    assert.equal(receipt.httpStatus, 200);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(DIR, receipt.file))).digest('hex'), receipt.sha256);
  }
  const fields = json('seedance-2.0-calculator-fields.json');
  const html = read('seedance-2.0-calculator-public.html');
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'), fields.htmlSha256);
  const captured = S.extractCalculatorSnapshot(html);
  assert.ok(captured.fieldMap.fldxqQNUkO.property.options.some(option => option.name === 'seedance-2.0-fast'));
  const lookup = fields.fields.find(field => field.id === 'fldbHEcb1g').formula;
  assert.ok(lookup.includes('$table[tblmNCuMjADrXtDf]'));
  assert.ok(lookup.includes('$column[fld0p1bMiB]'));
  assert.equal(lookup.includes('fldxqQNUkO'), false, 'minimum lookup does not filter by model');
  assert.ok(fields.fields.find(field => field.id === 'fldxTNE2R7').formula.includes('fldxqQNUkO'), 'rates independently filter by model');
  assert.equal(M.get('seedance-2.0-fast').sources.minima.sharedMinimumWith, 'seedance-2.0');
});

test('standard model retains all verified estimates and exact minimum fractions', () => {
  for (const res of R.RESOLUTIONS) for (const ratio of R.RATIOS) for (const seconds of ['4', '5', '15']) for (const video of [false, true]) {
    const t = task('seedance-2.0', {res, ratio, seconds, video, vin: '3.0001'});
    const current = M.estimate(t), original = R.estimate(t);
    assert.equal(E.cmp(current.P, original.P), 0);
    assert.equal(E.cmp(current.billedTokens, original.billedTokens), 0);
    assert.equal(M.key(t), R.key(t));
  }
  assert.equal(M.officialMinimum(task('seedance-2.0', {res: '720p', ratio: '4:3', seconds: '4'})).tokens, '152152.875');
  assert.equal(M.get().version, R.VERSION);
});

test('independent price anchors distinguish model rates and 480p dimensions', () => {
  eq(M.estimate(task('seedance-2.0')).tokens, '50220');
  eq(M.estimate(task('seedance-2.0')).P, '2.31012');
  eq(M.estimate(task('seedance-2.0-fast')).P, '1.85814');
  eq(M.estimate(task('seedance-2.0-fast', {seconds: '4', video: true})).billedTokens, '70308');
  eq(M.estimate(task('seedance-2.0-fast', {seconds: '4', video: true})).P, '1.546776');
  eq(M.estimate(task('seedance-2.5')).tokens, '48037.5');
  eq(M.estimate(task('seedance-2.5')).P, '3.362625');
  eq(M.estimate(task('seedance-2.5', {res: '720p', seconds: '30'})).P, '45.36');
  assert.deepEqual(M.estimate(task('seedance-2.5')).wh, [854, 480]);
  assert.deepEqual(M.estimate(task('seedance-2.0')).wh, [864, 496]);
  assert.equal(M.estimate(task('seedance-2.5')).minimum, null);
});

test('fast shares only supported minimum entries and keys are isolated by model and version', () => {
  const fast = M.officialMinimum(task('seedance-2.0-fast'));
  const standard = M.officialMinimum(task('seedance-2.0'));
  assert.equal(fast.tokens, standard.tokens);
  assert.equal(fast.sharedMinimumWith, 'seedance-2.0');
  assert.notEqual(fast.key, standard.key);
  assert.notEqual(fast.version, standard.version);
  assert.equal(Object.values(M.buildMinima()).filter(row => row.model === 'seedance-2.0').length, 288);
  assert.equal(Object.values(M.buildMinima()).filter(row => row.model === 'seedance-2.0-fast').length, 144);
  assert.throws(() => M.estimate(task('seedance-2.0-fast', {res: '1080p'})), /不支持分辨率/);
  assert.throws(() => M.officialMinimum(task('seedance-2.0-fast', {res: '4k'})), /不支持分辨率/);
  assert.throws(() => M.estimate(task('seedance-2.5', {res: '4k'})), /不支持分辨率/);
});

test('output and input duration validation is model-specific, exact and independent of UI rounding', () => {
  assert.equal(M.normalizeSeconds('30', 'seedance-2.5'), '30');
  assert.equal(M.normalizeSeconds('4.0'), '4');
  assert.equal(M.normalizeSeconds('-1', 'seedance-2.5'), 'auto');
  for (const id of ['seedance-2.0', 'seedance-2.0-fast']) {
    assert.throws(() => M.estimate(task(id, {seconds: '16'})), /15/);
    assert.throws(() => M.estimate(task(id, {video: true, vin: '15.0001'})), /15/);
  }
  for (const seconds of ['3', '30.1', '31']) assert.throws(() => M.estimate(task('seedance-2.5', {seconds})), /30/);
  for (const vin of ['1.9999', '30.0001']) assert.throws(() => M.estimate(task('seedance-2.5', {video: true, vin})), /30/);
  const exact = M.estimate(task('seedance-2.0-fast', {res: '720p', ratio: '4:3', seconds: '4', video: true, vin: '3.0001'}));
  eq(exact.tokens, '152155.0486125');
  eq(exact.billedTokens, '152155.0486125');
  assert.equal(M.estimate(task('seedance-2.5', {seconds: '30', video: true, vin: '30'}), null).partial, true);
});

test('unresolved automatic outputs do not invent dimensions, tokens or prices', () => {
  for (const id of Object.keys(M.MODELS)) for (const overrides of [{seconds: 'auto'}, {seconds: '-1'}, {ratio: 'auto'}, {ratio: 'adaptive'}]) {
    const t = task(id, overrides), estimate = M.estimate(t);
    assert.equal(M.key(t), null); assert.equal(M.officialMinimum(t), null);
    assert.equal(estimate.status, 'unresolved'); assert.equal(estimate.partial, true);
    assert.equal(estimate.P, null); assert.equal(estimate.billedTokens, null); assert.equal(estimate.wh, null);
  }
  assert.throws(() => M.key(task('seedance-2.5', {ratio: '5:4'})), /不支持的比例/);
  assert.throws(() => M.key(task('seedance-2.0-fast', {res: '4k', seconds: 'auto'})), /不支持分辨率/);
});

test('a missing 2.5 capture produces partial base estimates and never borrows standard minima', () => {
  const missing = browserModels(null);
  const t = task('seedance-2.5', {seconds: '4', video: true});
  assert.equal(missing.officialMinimum(t), null);
  const estimate = missing.estimate(t);
  assert.equal(estimate.partial, true); assert.equal(estimate.status, 'base-theory');
  assert.equal(estimate.minimum, null); assert.equal(estimate.minimumSource, null);
  eq(estimate.tokens, '57645'); eq(estimate.P, '2.42109');
  assert.equal(E.cmp(estimate.P, estimate.base), 0);
  assert.match(estimate.reason, /不能作为完整报价/);
  assert.throws(() => missing.estimate(t, R.officialMinimum({...t, model: 'seedance-2.0'})), /跨模型/);
});

test('independent 2.5 capture covers 486 outputs, preserves fractions and crosses 15-second boundary', () => {
  const captured = require('./generated-model-minima.js');
  assert.equal(Object.keys(captured.entries).length, 486);
  assert.equal(Object.values(M.MINIMA).filter(row => row.model === 'seedance-2.5').length, 486);
  assert.equal(Object.keys(M.MINIMA).length, 918);
  assert.equal(M.get('seedance-2.5').sources.minima.sourceFormula, captured.sourceFormula);
  assert.notEqual(M.get('seedance-2.5').sources.minima.tableId, M.get('seedance-2.0').sources.minima.tableId);
  const short = task('seedance-2.5', {seconds: '4', video: true});
  eq(M.estimate(short).billedTokens, '67252.5');
  eq(M.estimate(short).P, '2.824605');
  eq(M.estimate({...short, vin: '3.0001'}).billedTokens, '67253.46075');
  eq(M.estimate(task('seedance-2.5', {video: true})).P, '3.631635');
  eq(M.estimate(task('seedance-2.5', {video: true, vin: '30'})).P, '14.123025');
  const long = task('seedance-2.5', {res: '1080p', ratio: '21:9', seconds: '30', video: true});
  eq(M.estimate(long).billedTokens, '2445557.8125');
  eq(M.estimate(long).P, '112.495659375');
  eq(M.estimate({...long, vin: '30'}).P, '134.99479125');
  assert.equal(M.estimate(long).partial, false);
  for (const [entryKey, row] of Object.entries(captured.entries)) {
    const [res, ratio, seconds] = entryKey.split('|');
    const entry = M.officialMinimum(task('seedance-2.5', {res, ratio, seconds}));
    assert.equal(entry.tokens, row.tokens);
    assert.equal(entry.sourceTable, 'tblheIYDXXwYM43b');
    assert.equal(entry.sourceFile, row.sourceFile);
    assert.ok(entry.sourceUrl.endsWith('view=' + row.sourceView));
    assert.equal(new URL(entry.sourceUrl).searchParams.getAll('view').length, 1);
  }
});

test('2.5 runtime lookup/MAX matches the separately interpreted captured formula for every output', () => {
  const captured = require('./generated-model-minima.js'), formula = S.compileFormula(captured.sourceFormula);
  for (const entryKey of Object.keys(captured.entries)) {
    const [res, ratio, seconds] = entryKey.split('|'), wh = M.get('seedance-2.5').dims[res][ratio];
    for (const vin of ['2', '3.0001', '15', '20', '30']) {
      const original = formula.evaluate({'时长-输入视频（秒）': vin, '时长-输出视频（秒）': seconds, '长边（像素）': String(Math.max(...wh)), '短边（像素）': String(Math.min(...wh)), '帧率': '24'});
      const estimate = M.estimate(task('seedance-2.5', {res, ratio, seconds, vin, video: true}));
      assert.equal(E.cmp(estimate.billedTokens, original), 0, entryKey + '/' + vin);
    }
  }
});

test('manual minima are explicit, exact, model-scoped and marked as manual', () => {
  const t = task('seedance-2.5', {seconds: '4', video: true});
  const manual = M.estimate(t, {kind: 'manual', tokens: '150000', note: 'contract'});
  eq(manual.billedTokens, '150000'); eq(manual.P, '6.3');
  assert.equal(manual.partial, false); assert.equal(manual.status, 'manual-minimum');
  assert.equal(manual.minimumSource.model, 'seedance-2.5'); assert.equal(manual.minimumSource.kind, 'manual');
  assert.throws(() => M.estimate(t, {kind: 'manual', tokens: '1', model: 'seedance-2.0'}), /跨模型/);
  assert.throws(() => M.estimate(t, {kind: 'manual', tokens: '1', version: 'old'}), /版本/);
  assert.throws(() => M.estimate(t, {kind: 'manual', tokens: '1', key: M.key({...t, seconds: '5'})}), /规格/);
  assert.throws(() => M.estimate(t, {kind: 'manual', tokens: '-1'}), /不能为负/);
  assert.throws(() => M.estimate(t, {kind: 'api-observation', tokens: '1'}), /来源/);
  assert.throws(() => M.estimate(t, '150000'), /来源/);
  eq(M.estimate({...t, video: false}, {kind: 'manual', tokens: '150000'}).P, '2.6901');
});

test('forged official records cannot cross models or alter exact snapshot tokens', () => {
  const t = task('seedance-2.0-fast', {res: '720p', ratio: '4:3', seconds: '4', video: true}), official = M.officialMinimum(t);
  assert.throws(() => M.estimate(t, {...official, tokens: '152153'}), /快照/);
  assert.throws(() => M.estimate(t, {...official, model: 'seedance-2.0'}), /跨模型/);
  assert.throws(() => M.estimate(t, {...official, version: 'old'}), /版本/);
  assert.throws(() => M.estimate(t, {...official, seconds: '5'}), /规格/);
  assert.equal(M.estimate(t, {...official, sourceUrl: 'untrusted'}).minimumSource.sourceUrl, official.sourceUrl);
  assert.equal(M.estimate(t, null).partial, true);
  assert.equal(M.estimate(t).partial, false);
});

test('API usage uses each model rate without reapplying a minimum or summing total tokens', () => {
  eq(M.fromUsage(task('seedance-2.0', {video: true}), '1'), '0.000028');
  eq(M.fromUsage(task('seedance-2.0-fast', {video: true}), '100000'), '2.2');
  eq(M.fromUsage(task('seedance-2.5', {video: true}), '100000'), '4.2');
  eq(M.fromUsage(task('seedance-2.5', {res: '1080p'}), '100000'), '7.7');
  for (const usage of ['0', '-1', '1.5']) assert.throws(() => M.fromUsage(task('seedance-2.5'), usage), /正整数/);
  assert.throws(() => M.fromUsage(task('seedance-2.0-fast', {res: '1080p'}), '1'), /不支持分辨率/);
});

test('model estimator does not call the standard-only E.estimate implementation', () => {
  const independent = browserModels(null, {...E, estimate() { throw new Error('standard-only engine invoked'); }});
  eq(independent.estimate(task('seedance-2.5')).P, '3.362625');
  eq(independent.estimate(task('seedance-2.0-fast')).P, '1.85814');
  assert.throws(() => browserModels({model: 'seedance-2.0', version: R.VERSION, entries: {}}), /快照模型或版本/);
  assert.throws(() => browserModels({model: 'seedance-2.5', version: 'old', entries: {}}), /快照模型或版本/);
  assert.throws(() => browserModels({model: 'seedance-2.5', version: M.get('seedance-2.5').version, entries: {'480p|16:9|4': {tokens: '1', sourceTable: 'tblmNCuMjADrXtDf'}}}), /来源表/);
});
