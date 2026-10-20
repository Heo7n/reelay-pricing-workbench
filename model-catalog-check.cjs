'use strict';

// Read-only closure from captured official Markdown to the runtime model catalog.
// This does not use the manually curated models-metadata.json as an oracle.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const M = require('./models.js');
const DATE = '2026-10-20';
const DIR = `evidence/${DATE}/models`;
const IDS = Object.freeze(['seedance-2.0', 'seedance-2.0-fast', 'seedance-2.5']);
const RATIOS = Object.freeze(['16:9', '4:3', '1:1', '3:4', '9:16', '21:9']);
const RECEIPTS = Object.freeze({
  'model-pricing.md': '7a191c8ad51f6f0fd296040b4fd8e70a9ab9bf201524f4aaae04d22cc2c604af',
  'create-video-generation-task-api.md': 'b397daf9a72c5c93de6dcf66610dea543c4bbdd3a500a00a234135898abaee24',
  'get-video-generation-task-api.md': 'f7e6e434bb9cd12ba79d39b0cb2c80fbef8b56780e6efd6d95e98c4e1b9aabe8'
});
const BASE_URL = 'https://ark.volcengine.com/region:cn-beijing/docs/';
const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b, message) => { try { assert.deepStrictEqual(a, b); } catch { throw new Error(message); } };
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
function parseJSON(text, label) { try { return JSON.parse(text); } catch { throw new Error(label + ': invalid JSON'); } }
function section(text, from, to) {
  const begin = text.indexOf(from);
  ensure(begin >= 0 && text.indexOf(from, begin + from.length) < 0, 'Missing or ambiguous source section: ' + from);
  const end = text.indexOf(to, begin + from.length);
  ensure(end > begin, 'Unclosed source section: ' + from);
  return text.slice(begin, end);
}
function decimal(text) {
  ensure(/^\d+(?:\.\d+)?$/.test(text) && E.cmp(text, '0') > 0, 'Invalid official price');
  return text.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}
function readEvidence(root = __dirname) {
  return {
    manifest: fs.readFileSync(path.join(root, DIR, 'documents-manifest.json'), 'utf8'),
    documents: Object.fromEntries(Object.keys(RECEIPTS).map(file => [file, fs.readFileSync(path.join(root, DIR, file), 'utf8')]))
  };
}
function validateReceipts(evidence) {
  const manifest = parseJSON(evidence.manifest, 'Document request manifest');
  ensure(Array.isArray(manifest), 'Document request manifest must be an array');
  const sourceFiles = {};
  for (const [file, digest] of Object.entries(RECEIPTS)) {
    const receipts = manifest.filter(receipt => receipt.file === file);
    ensure(receipts.length === 1, 'Missing or duplicate document receipt: ' + file);
    const receipt = receipts[0];
    ensure(receipt.httpStatus === 200 && receipt.url === BASE_URL + file, 'Invalid official document request: ' + file);
    ensure(receipt.sha256 === digest, 'Document receipt differs from versioned capture: ' + file);
    ensure(typeof evidence.documents?.[file] === 'string' && hash(evidence.documents[file]) === digest, 'Document content hash mismatch: ' + file);
    sourceFiles[DIR + '/' + file] = digest;
  }
  return sourceFiles;
}
function parsePricing(markdown) {
  const text = section(markdown, '## 按token单价', '## 价格示例'), result = {};
  let current = null, resolutions = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(cell => cell.trim());
    const modelMatch = /^doubao-(\S+)$/.exec(cells[1]);
    if (modelMatch) {
      current = IDS.includes(modelMatch[1]) ? modelMatch[1] : null; resolutions = null;
      if (current) {
        ensure(!Object.hasOwn(result, current), 'Duplicate official price model: ' + current);
        result[current] = {};
      }
    }
    if (!current) continue;
    const value = cells[2];
    if (value.includes('输出视频分辨率为')) {
      resolutions = [...value.matchAll(/\b(?:480p|720p|1080p|4k)\b/g)].map(match => match[0]);
      ensure(resolutions.length && new Set(resolutions).size === resolutions.length, 'Invalid official price resolution group');
      for (const res of resolutions) {
        ensure(!Object.hasOwn(result[current], res), 'Duplicate official price resolution: ' + current + '/' + res);
        result[current][res] = [null, null];
      }
    }
    const price = /输入(不含|包含)视频[：:]\s*(\d+(?:\.\d+)?)/.exec(value);
    if (price) {
      ensure(resolutions?.length, 'Official rate has no resolution scope');
      const index = price[1] === '不含' ? 0 : 1;
      for (const res of resolutions) {
        ensure(result[current][res][index] === null, 'Duplicate official input-kind rate: ' + current + '/' + res);
        result[current][res][index] = decimal(price[2]);
      }
    }
  }
  same(Object.keys(result).sort(), [...IDS].sort(), 'Official pricing model coverage mismatch');
  for (const [id, rates] of Object.entries(result)) {
    ensure(Object.keys(rates).length, 'Official model has no rates: ' + id);
    for (const [res, pair] of Object.entries(rates)) ensure(pair.every(value => value !== null), 'Incomplete official video/non-video rate pair: ' + id + '/' + res);
  }
  return result;
}
function parseCapabilities(markdown) {
  const resolutionsText = section(markdown, '**resolution** `string`', '**ratio** `string`');
  const durationText = section(markdown, '**duration** `integer`', '**frames** `integer`');
  const inputText = section(markdown, '> **说明：传入单个视频要求**', '**支持的视频编码格式**');
  const result = Object.fromEntries(IDS.map(id => [id, {}]));
  const labels = {'2.0': 'seedance-2.0', '2.0 fast': 'seedance-2.0-fast', '2.5': 'seedance-2.5'};
  for (const match of resolutionsText.matchAll(/^\* \*\*Seedance ([^*]+)\*\*[：:].*?可选值 (.+)$/gm)) {
    const id = labels[match[1]];
    if (!id) continue;
    ensure(!result[id].resolutions, 'Duplicate resolution support line: ' + id);
    result[id].resolutions = [...match[2].matchAll(/`([^`]+)`/g)].map(value => value[1]);
    ensure(result[id].resolutions.length && new Set(result[id].resolutions).size === result[id].resolutions.length, 'Invalid model resolution support');
  }
  const durationMatches = [...durationText.matchAll(/^\* \*\*Seedance (2\.5|2\.0 系列)\*\*[：:].*?取值范围 `\[(\d+),\s*(\d+)\]`/gm)];
  ensure(durationMatches.length === 2, 'Missing or duplicate official output-duration lines');
  for (const match of durationMatches) {
    const targets = match[1] === '2.5' ? ['seedance-2.5'] : ['seedance-2.0', 'seedance-2.0-fast'];
    for (const id of targets) {
      ensure(!result[id].seconds, 'Duplicate output-duration model');
      result[id].seconds = {min: Number(match[2]), max: Number(match[3])};
    }
  }
  const input25 = /非视频编辑任务：单个视频时长 `\[(\d+),\s*(\d+)\]` s。/.exec(inputText);
  const total25 = /最多传入 10 个参考视频，所有视频总时长不超过 (\d+) s。/.exec(inputText);
  const input20 = /\*\*Seedance 2\.0 系列\*\*：单个视频时长 `\[(\d+),\s*(\d+)\]` s，最多传入 3 个参考视频，所有视频总时长不超过 (\d+) s。/.exec(inputText);
  ensure(input25 && total25 && input20, 'Official reference-video duration limits missing');
  ensure(input25[2] === total25[1] && input20[2] === input20[3], 'Per-video and total reference duration differ; runtime domain needs review');
  result['seedance-2.5'].inputSeconds = {min: Number(input25[1]), max: Number(total25[1])};
  for (const id of ['seedance-2.0', 'seedance-2.0-fast']) result[id].inputSeconds = {min: Number(input20[1]), max: Number(input20[3])};
  const fpsMatch = /接口返回的 `duration` = 实际总帧数 \/ (\d+)（向下取整）/.exec(durationText);
  ensure(fpsMatch, 'Official output frame-rate relationship missing');
  for (const id of IDS) {
    ensure(result[id].resolutions && result[id].seconds && result[id].inputSeconds, 'Incomplete official capabilities: ' + id);
    result[id].fps = fpsMatch[1];
  }
  return result;
}
function parseDimensions(markdown) {
  const table = section(markdown, '| 分辨率 | 宽高比 | 宽高像素值 Seedance 2.5 |', '\n> **注意**');
  const result = {'seedance-2.0': {}, 'seedance-2.5': {}};
  let resolution = null;
  for (const line of table.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map(cell => cell.trim());
    const ratio = /^`([^`]+)`$/.exec(cells[2] || '')?.[1];
    if (!ratio) continue;
    ensure(RATIOS.includes(ratio), 'Unsupported ratio in official pixel table');
    if (!cells[1].startsWith('^^')) resolution = cells[1].split('<br>')[0];
    ensure(['480p', '720p', '1080p', '4k'].includes(resolution), 'Unsupported resolution in official pixel table');
    for (const [id, column] of [['seedance-2.5', 3], ['seedance-2.0', 4]]) {
      if (cells[column] === '—') continue;
      ensure(/^\d+×\d+$/.test(cells[column]), 'Invalid official pixel dimensions: ' + id);
      result[id][resolution] ??= {};
      ensure(!result[id][resolution][ratio], 'Duplicate official dimension row');
      result[id][resolution][ratio] = cells[column].split('×').map(Number);
    }
  }
  for (const [id, dimensions] of Object.entries(result)) {
    ensure(Object.keys(dimensions).length, 'Missing official model dimensions: ' + id);
    for (const [res, ratios] of Object.entries(dimensions)) same(Object.keys(ratios).sort(), [...RATIOS].sort(), 'Incomplete official dimension ratios: ' + id + '/' + res);
  }
  return result;
}
function deriveCatalog(evidence) {
  const pricing = parsePricing(evidence.documents['model-pricing.md']);
  const capabilities = parseCapabilities(evidence.documents['create-video-generation-task-api.md']);
  const dimensions = parseDimensions(evidence.documents['create-video-generation-task-api.md']);
  return Object.fromEntries(IDS.map(id => {
    const caps = capabilities[id], family = id === 'seedance-2.0-fast' ? 'seedance-2.0' : id;
    same(Object.keys(pricing[id]).sort(), [...caps.resolutions].sort(), 'Pricing and API supported resolutions differ: ' + id);
    const dims = Object.fromEntries(caps.resolutions.map(res => {
      ensure(dimensions[family][res], 'Missing supported model dimensions: ' + id + '/' + res);
      return [res, dimensions[family][res]];
    }));
    return [id, {...caps, rates: pricing[id], dims}];
  }));
}
function validateCatalog(derived, models) {
  same(Object.keys(models).sort(), [...IDS].sort(), 'Runtime model inventory differs from audited scope');
  for (const id of IDS) {
    const runtime = models[id], source = derived[id];
    ensure(runtime.id === id, 'Runtime descriptor model identity mismatch: ' + id);
    for (const field of ['resolutions', 'seconds', 'inputSeconds', 'fps', 'dims'])
      same(runtime[field], source[field], 'Runtime ' + field + ' differs from official document: ' + id);
    same(Object.keys(runtime.rates).sort(), Object.keys(source.rates).sort(), 'Runtime rate resolutions differ from source: ' + id);
    for (const [res, pair] of Object.entries(source.rates)) {
      ensure(Array.isArray(runtime.rates[res]) && runtime.rates[res].length === 2, 'Runtime rate pair missing: ' + id + '/' + res);
      pair.forEach((rate, index) => ensure(E.cmp(runtime.rates[res][index], rate) === 0, 'Runtime rate differs from official document: ' + id + '/' + res + '/' + (index ? 'withVideo' : 'withoutVideo')));
    }
  }
  return true;
}
function check({root = __dirname, evidence = readEvidence(root), models = M.MODELS} = {}) {
  const sourceFiles = validateReceipts(evidence), derived = deriveCatalog(evidence);
  validateCatalog(derived, models);
  const resolutionCount = Object.values(derived).reduce((sum, model) => sum + model.resolutions.length, 0);
  return {verifiedAt: DATE, modelCount: IDS.length, resolutionCount, dimensionCount: resolutionCount * RATIOS.length, rateCount: resolutionCount * 2, sourceFiles, derived};
}
module.exports = {DATE, DIR, IDS, RECEIPTS, readEvidence, validateReceipts, parsePricing, parseCapabilities, parseDimensions, deriveCatalog, validateCatalog, check};
if (require.main === module) {
  try {
    ensure(process.argv.slice(2).every(arg => arg === '--check'), 'Only --check is supported');
    const result = check();
    console.log(`Verified ${result.modelCount} runtime models against captured official Markdown: ${result.rateCount} rates, ${result.dimensionCount} dimension mappings, resolutions and input/output duration domains.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
