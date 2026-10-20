'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const C = require('./model-catalog-check.cjs');
const M = require('./models.js');
const evidence = C.readEvidence();
const derived = C.deriveCatalog(evidence);
const clone = value => structuredClone(value);

test('saved official Markdown directly validates every runtime model rate, dimension and domain', () => {
  const result = C.check();
  assert.equal(result.modelCount, 3);
  assert.equal(result.rateCount, 18);
  assert.equal(result.dimensionCount, 54);
  assert.equal(result.resolutionCount, 9);
  assert.equal(Object.keys(result.sourceFiles).length, 3);
  assert.equal(C.validateCatalog(derived, M.MODELS), true);
  assert.equal(Object.hasOwn(evidence, 'metadata'), false, 'manual models-metadata.json is not used');
});

test('pricing parser reads separate video/non-video rates in the online inference column', () => {
  const parsed = C.parsePricing(evidence.documents['model-pricing.md']);
  assert.deepEqual(parsed['seedance-2.0-fast'], {'480p': ['37', '22'], '720p': ['37', '22']});
  assert.deepEqual(parsed['seedance-2.5'], {'480p': ['70', '42'], '720p': ['70', '42'], '1080p': ['77', '46']});
  assert.deepEqual(parsed['seedance-2.0']['4k'], ['26', '16']);
  assert.equal(Object.hasOwn(parsed['seedance-2.0-fast'], '1080p'), false);
  assert.equal(Object.hasOwn(parsed, 'seedance-2.0-mini'), false);
});

test('API parser distinguishes 2.5 pixels, model supports and generic-reference duration from edit mode', () => {
  const dimensions = C.parseDimensions(evidence.documents['create-video-generation-task-api.md']);
  const capabilities = C.parseCapabilities(evidence.documents['create-video-generation-task-api.md']);
  assert.deepEqual(dimensions['seedance-2.5']['480p']['16:9'], [854, 480]);
  assert.deepEqual(dimensions['seedance-2.0']['480p']['16:9'], [864, 496]);
  assert.equal(Object.hasOwn(dimensions['seedance-2.5'], '4k'), false);
  assert.deepEqual(capabilities['seedance-2.5'].seconds, {min: 4, max: 30});
  assert.deepEqual(capabilities['seedance-2.5'].inputSeconds, {min: 2, max: 30});
  assert.deepEqual(capabilities['seedance-2.0-fast'].resolutions, ['480p', '720p']);
  assert.deepEqual(capabilities['seedance-2.0-fast'].inputSeconds, {min: 2, max: 15});
  assert.deepEqual(capabilities['seedance-2.0-fast'].seconds, {min: 4, max: 15});
  assert.equal(capabilities['seedance-2.5'].fps, '24');
});

test('changing runtime rates fails even when all manually curated metadata could agree', () => {
  for (const [id, res, index, value] of [
    ['seedance-2.0-fast', '480p', 0, '38'],
    ['seedance-2.0-fast', '720p', 1, '37'],
    ['seedance-2.5', '1080p', 1, '46.00000001'],
    ['seedance-2.0', '4k', 0, '51']
  ]) {
    const models = clone(M.MODELS);
    models[id].rates[res][index] = value;
    assert.throws(() => C.check({models}), /Runtime rate differs from official document/);
  }
});

test('changing runtime dimension, supported resolution, durations or fps fails against raw API docs', () => {
  const changes = [
    [models => {models['seedance-2.5'].dims['480p']['16:9'] = [864, 496];}, /Runtime dims/],
    [models => {models['seedance-2.0-fast'].dims['720p']['4:3'] = [1112, 833];}, /Runtime dims/],
    [models => {models['seedance-2.0'].dims['4k']['4:3'] = [3328, 2496];}, /Runtime dims/],
    [models => {models['seedance-2.0-fast'].resolutions.push('1080p');}, /Runtime resolutions/],
    [models => {models['seedance-2.5'].seconds.max = 15;}, /Runtime seconds/],
    [models => {models['seedance-2.5'].inputSeconds.min = 4;}, /Runtime inputSeconds/],
    [models => {models['seedance-2.0-fast'].inputSeconds.max = 30;}, /Runtime inputSeconds/],
    [models => {models['seedance-2.5'].fps = '30';}, /Runtime fps/]
  ];
  for (const [change, pattern] of changes) {
    const models = clone(M.MODELS); change(models);
    assert.throws(() => C.check({models}), pattern);
  }
});

test('pricing parser rejects missing pairs and duplicate rate or model rows', () => {
  const pricing = evidence.documents['model-pricing.md'];
  const missing = pricing.replace('| |   * 输入包含视频：22.00 | |', '');
  assert.throws(() => C.parsePricing(missing), /Incomplete official video\/non-video rate pair/);
  const repeated = pricing.replace('| |   * 输入包含视频：22.00 | |', '| |   * 输入包含视频：22.00 | |\n| |   * 输入包含视频：22.00 | |');
  assert.throws(() => C.parsePricing(repeated), /Duplicate official input-kind rate/);
  const missingModel = pricing.replace('doubao-seedance-2.0-fast |', 'doubao-unknown |');
  assert.throws(() => C.parsePricing(missingModel), /pricing model coverage/);
  const repeatedModel = pricing.replace('doubao-seedance-2.0-mini |', 'doubao-seedance-2.0-fast |');
  assert.throws(() => C.parsePricing(repeatedModel), /Duplicate official price model/);
});

test('API parsers reject missing support, ambiguous pixel rows and inconsistent input totals', () => {
  const create = evidence.documents['create-video-generation-task-api.md'];
  assert.throws(() => C.parseCapabilities(create.replace('* **Seedance 2.0 fast**：默认值 `720p`；可选值 `480p`、`720p`', '')), /Incomplete official capabilities/);
  assert.throws(() => C.parseCapabilities(create.replace('所有视频总时长不超过 30 s。', '所有视频总时长不超过 29 s。')), /Per-video and total reference duration differ/);
  assert.throws(() => C.parseCapabilities(create.replace('实际总帧数 / 24（向下取整）', '不明帧率')), /frame-rate relationship missing/);
  const firstPixelRow = '| 480p | `16:9` | 854×480 | 864×496 | 864×480 |';
  assert.throws(() => C.parseDimensions(create.replace(firstPixelRow, firstPixelRow + '\n' + firstPixelRow)), /Duplicate official dimension row/);
  assert.throws(() => C.parseDimensions(create.replace(firstPixelRow, '')), /Unsupported resolution|Incomplete official dimension ratios/);
});

test('captured source changes, including synchronized manifest edits, cannot bypass pinned receipts', () => {
  const changed = clone(evidence);
  changed.documents['model-pricing.md'] = changed.documents['model-pricing.md'].replace('输入不含视频：70.00', '输入不含视频：71.00');
  assert.throws(() => C.check({evidence: changed}), /Document content hash mismatch/);
  const manifest = JSON.parse(changed.manifest);
  manifest.find(row => row.file === 'model-pricing.md').sha256 = crypto.createHash('sha256').update(changed.documents['model-pricing.md']).digest('hex');
  changed.manifest = JSON.stringify(manifest);
  assert.throws(() => C.check({evidence: changed}), /receipt differs from versioned capture/);
  const wrongUrl = clone(evidence), receipts = JSON.parse(wrongUrl.manifest);
  receipts[0].url = 'https://unrelated.invalid/model-pricing.md'; wrongUrl.manifest = JSON.stringify(receipts);
  assert.throws(() => C.check({evidence: wrongUrl}), /Invalid official document request/);
  const duplicate = clone(evidence), duplicateReceipts = JSON.parse(duplicate.manifest);
  duplicateReceipts.push(duplicateReceipts[0]); duplicate.manifest = JSON.stringify(duplicateReceipts);
  assert.throws(() => C.check({evidence: duplicate}), /duplicate document receipt/);
});

test('source-derived changes are observed by parser independently of version-pinned receipt checks', () => {
  const changed = clone(evidence);
  changed.documents['model-pricing.md'] = changed.documents['model-pricing.md'].replace('输入不含视频：70.00', '输入不含视频：71.00');
  const source = C.deriveCatalog(changed);
  assert.equal(source['seedance-2.5'].rates['480p'][0], '71');
  assert.throws(() => C.validateCatalog(source, M.MODELS), /Runtime rate differs from official document/);
  const changedApi = clone(evidence);
  changedApi.documents['create-video-generation-task-api.md'] = changedApi.documents['create-video-generation-task-api.md'].replace('854×480 | 864×496', '856×480 | 864×496');
  const apiSource = C.deriveCatalog(changedApi);
  assert.deepEqual(apiSource['seedance-2.5'].dims['480p']['16:9'], [856, 480]);
  assert.throws(() => C.validateCatalog(apiSource, M.MODELS), /Runtime dims differs from official document/);
});
