/* Reelay V9 · Versioned official Seedance 2.0 estimation rules.
 * Formula provenance: the official Lark table's normal copy output
 * (text/bitable, header.property.formula), not a fit to displayed numbers.
 * These are exact evaluations of an estimation formula, not API billing usage.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.ReelayRules = factory(root.ReelayMath);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (MathEngine) {
  'use strict';
  if (!MathEngine) throw new Error('ReelayRules requires ReelayMath');

  const VERSION = 'volc-seedance20-2026-10-19';
  const MODEL = 'seedance-2.0';
  const VERIFIED_AT = '2026-10-19';
  const TABLE_ID = 'tblmNCuMjADrXtDf';
  const BASE_URL = 'https://bytedance.larkoffice.com/wiki/FXaYwxzJ5i5Zdik32ipcWzt7nxd';
  const RESOLUTIONS = Object.freeze(['480p', '720p', '1080p', '4k']);
  const RATIOS = Object.freeze(['16:9', '4:3', '1:1', '3:4', '9:16', '21:9']);
  const VIEWS = Object.freeze({
    '480p': 'vew2CR2JYM',
    '720p': 'vewVBehIlq',
    '1080p': 'vewQ2CK6dj',
    '4k': 'vewrMAE6IZ'
  });
  const SOURCE_FORMULA = 'IF(VALUE([时长-输入视频（秒）])>0,(MAX(ROUNDUP(VALUE([时长-输出视频（秒）])*2/3,0),VALUE([时长-输入视频（秒）]))+VALUE([时长-输出视频（秒）]))*VALUE([长边（像素）])*VALUE([短边（像素）])*VALUE([帧率])/1024,VALUE([时长-输出视频（秒）])*VALUE([长边（像素）])*VALUE([短边（像素）])*VALUE([帧率])/1024)';
  const SOURCE_DESCRIPTION = '估算值，实际以调用 API 后返回信息中的 usage 字段为准。';
  const NOTE = '依据官方 Seedance 2.0 表格公式计算的最低用量估算值；保留公式的小数精度，表格显示可能按数字格式取整。实际计费用量以 API usage.completion_tokens 为准。';

  function viewUrl(resolution) {
    return BASE_URL + '?table=' + TABLE_ID + '&view=' + VIEWS[resolution];
  }

  const sources = Object.freeze({
    version: VERSION,
    model: MODEL,
    verifiedAt: VERIFIED_AT,
    timezone: 'Asia/Shanghai',
    pricing: Object.freeze({
      url: 'https://console.volcengine.com/ark/region:cn-beijing/docs/model-pricing',
      publicUrl: 'https://docs.volcengine.com/docs/ark/model-pricing?lang=zh',
      updatedAt: '2026-10-17',
      verifiedAt: VERIFIED_AT,
      note: '采用当前标准刊例费率；不自动应用已过期的限时优惠。'
    }),
    dimensions: Object.freeze({
      url: 'https://console.volcengine.com/ark/region:cn-beijing/docs/create-video-generation-task-api',
      verifiedAt: VERIFIED_AT,
      note: 'Seedance 2.0 标准版支持 480p、720p、1080p、4k，输出帧率为 24 fps。'
    }),
    usage: Object.freeze({
      url: 'https://console.volcengine.com/ark/region:cn-beijing/docs/get-video-generation-task-api',
      verifiedAt: VERIFIED_AT,
      note: 'usage.completion_tokens 已包含最低用量限制；total_tokens 与其相等，不重复加总或再次套用门槛。'
    }),
    minima: Object.freeze({
      url: viewUrl('480p'),
      tableId: TABLE_ID,
      views: Object.freeze(Object.fromEntries(RESOLUTIONS.map(res => [res, viewUrl(res)]))),
      verifiedAt: VERIFIED_AT,
      provenance: '官方飞书表格正常选择并复制所得 text/bitable，读取“最低token用量”字段的 header.property.formula 与字段说明。',
      sourceFormula: SOURCE_FORMULA,
      sourceDescription: SOURCE_DESCRIPTION,
      formulaNote: '下列阈值式由本工具从2026-10-19保存的表格公式字段分离出下限；与基础用量取较大值后的整体计算才与原字段公式等价，不是官方价格正文直接列出的公式。',
      documentationReview: Object.freeze({verifiedAt: '2026-10-20', scope: '仅复核官方模型价格正文与任务查询API的最低用量说明；本次未重新取得飞书表内公式。', tableFormulaRechecked: false}),
      minimumFormula: '(输出秒数 + ceil(输出秒数 × 2 / 3)) × 宽 × 高 × 24 / 1024',
      combinedFormula: '(输出秒数 + max(输入视频总秒数, ceil(输出秒数 × 2 / 3))) × 宽 × 高 × 24 / 1024',
      scope: '含视频输入的 Seedance 2.0 标准版；4 个分辨率 × 6 个固定宽高比 × 4–15 秒整数输出时长，共 288 个规格。',
      precision: '仅对公式中的 2 × 输出秒数 / 3 向上取整；token 结果保留精确有限十进制，不按表格的显示格式预先取整。',
      billingNotice: SOURCE_DESCRIPTION
    })
  });

  // All quantities here have denominators dividing 1024. Long division preserves
  // the exact terminating decimal without Number conversion or display rounding.
  function exactDecimal(value) {
    const q = MathEngine.dec(value);
    const negative = q.n < 0n;
    let numerator = negative ? -q.n : q.n;
    let remainder = numerator % q.d;
    let result = (numerator / q.d).toString();
    if (remainder) {
      result += '.';
      let digits = 0;
      while (remainder) {
        if (++digits > 16) throw new Error('最低用量应为有限十进制');
        remainder *= 10n;
        result += (remainder / q.d).toString();
        remainder %= q.d;
      }
    }
    return (negative ? '-' : '') + result;
  }

  function key(task, version = VERSION) {
    const res = String(task.res).trim().toLowerCase();
    const ratio = String(task.ratio).trim();
    if (String(task.seconds).trim() === 'auto' || ratio === 'auto' || ratio === 'adaptive') return null;
    const seconds = MathEngine.normalizeSeconds(task.seconds);
    if (!RESOLUTIONS.includes(res) || !RATIOS.includes(ratio)) {
      throw new Error('不支持的比例或分辨率');
    }
    return [MODEL, String(version), res, ratio, seconds].join('|');
  }

  function buildMinima() {
    const minima = {};
    for (const res of RESOLUTIONS) {
      for (const ratio of RATIOS) {
        const wh = MathEngine.DIMS[res][ratio];
        const area = MathEngine.mul(String(wh[0]), String(wh[1]));
        for (let seconds = 4; seconds <= 15; seconds++) {
          const output = MathEngine.dec(String(seconds));
          const referenceFloor = MathEngine.ceil(MathEngine.div(MathEngine.mul(output, '2'), '3'));
          const tokens = MathEngine.div(
            MathEngine.mul(MathEngine.mul(MathEngine.add(output, referenceFloor), area), '24'),
            '1024'
          );
          minima[key({ res, ratio, seconds })] = {
            tokens: exactDecimal(tokens),
            note: NOTE,
            kind: 'official',
            sourceUrl: viewUrl(res),
            verifiedAt: VERIFIED_AT
          };
        }
      }
    }
    return minima;
  }

  const MINIMA = buildMinima();
  for (const entry of Object.values(MINIMA)) Object.freeze(entry);
  Object.freeze(MINIMA);

  // The lookup is by output specification alone. The caller applies the returned
  // minimum only when video input is present; input duration is never a key part.
  function officialMinimum(task) {
    const lookup = key(task);
    return lookup ? MINIMA[lookup] || null : null;
  }

  return Object.freeze({
    VERSION, MODEL, VERIFIED_AT, RESOLUTIONS, RATIOS, VIEWS,
    sources, buildMinima, key, officialMinimum, MINIMA
  });
});
