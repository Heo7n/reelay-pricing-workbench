/* Reelay · source-validated Seedance 2.0 lookup; see evidence/README.md. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./generated-minima.js'));
  else root.ReelayRules = factory(root.ReelayMath, root.ReelayMinimumSnapshot);
})(typeof window !== 'undefined' ? window : globalThis, function (E, snapshot) {
  'use strict';
  if (!E || !snapshot) throw new Error('缺少经过核验的用量规则');
  const MODEL = 'seedance-2.0';
  if (snapshot.model !== MODEL) throw new Error('用量表模型不匹配');
  const VERSION = snapshot.version, VERIFIED_AT = snapshot.verifiedAt;
  const PREVIOUS_VERSIONS = Object.freeze(['volc-seedance20-2026-10-19']);
  const TABLE_ID = 'tblmNCuMjADrXtDf';
  const BASE_URL = 'https://bytedance.larkoffice.com/wiki/FXaYwxzJ5i5Zdik32ipcWzt7nxd';
  const RESOLUTIONS = Object.freeze(['480p', '720p', '1080p', '4k']);
  const RATIOS = Object.freeze(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']);
  const VIEWS = Object.freeze({'480p':'vew2CR2JYM','720p':'vewVBehIlq','1080p':'vewQ2CK6dj','4k':'vewrMAE6IZ'});
  const viewUrl = res => BASE_URL + '?table=' + TABLE_ID + '&view=' + VIEWS[res];
  const sources = Object.freeze({
    version: VERSION, model: MODEL, verifiedAt: VERIFIED_AT, timezone: 'Asia/Shanghai',
    pricing: Object.freeze({url:'https://console.volcengine.com/ark/region:cn-beijing/docs/model-pricing',updatedAt:'2026-10-19',verifiedAt:VERIFIED_AT,note:'标准刊例费率；不自动应用已过期的限时优惠。'}),
    dimensions: Object.freeze({url:'https://console.volcengine.com/ark/region:cn-beijing/docs/create-video-generation-task-api',verifiedAt:'2026-10-19',note:'Seedance 2.0 标准版，24 fps。'}),
    usage: Object.freeze({url:'https://console.volcengine.com/ark/region:cn-beijing/docs/get-video-generation-task-api',verifiedAt:VERIFIED_AT,note:'completion_tokens 已含最低用量；total_tokens 与其相等，不重复相加或补门槛。'}),
    minima: Object.freeze({
      url:viewUrl('480p'),tableId:TABLE_ID,fieldId:'fld0p1bMiB',
      views:Object.freeze(Object.fromEntries(RESOLUTIONS.map(res=>[res,viewUrl(res)]))),
      verifiedAt:VERIFIED_AT,
      calculatorUrl:'https://bytedance.larkoffice.com/share/base/form/shrcnP1Bl0mqCP9OHCbjpe1oBkf',
      sourceFormula:snapshot.sourceFormula,sourceDescription:snapshot.sourceDescription,
      provenance:'当日刷新官方 Seedance 2.0 表格后正常复制四个视图；保留 text/bitable 原文、公式字段及官方计算器公开页面。',
      method:'按分辨率、比例、输出时长查询已核验最低值；有视频时与基础估算取较大值，无视频时仅采用基础估算。',
      precision:'构建时解释原始公式，在官方输入时长选项内求最低值并逐项核对192条显示记录；保留公式小数，展开为288个输出规格。',
      evidencePath:'evidence/2026-10-20/',billingNotice:'估算值，实际以调用 API 后返回信息中的 usage 字段为准。'
    })
  });
  function assertModel(task) {
    if (task.model !== undefined && task.model !== MODEL) throw new Error('用量规则仅适用于 Seedance 2.0 标准版');
  }
  function key(task, version = VERSION) {
    assertModel(task);
    const res=String(task.res).trim().toLowerCase(),ratio=String(task.ratio).trim();
    if (String(task.seconds).trim()==='auto' || ratio==='auto' || ratio==='adaptive') return null;
    const seconds=E.normalizeSeconds(task.seconds);
    if (!RESOLUTIONS.includes(res) || !RATIOS.includes(ratio)) throw new Error('不支持的比例或分辨率');
    return [MODEL,String(version),res,ratio,seconds].join('|');
  }
  function buildMinima() {
    const result={};
    for(const res of RESOLUTIONS) for(const ratio of RATIOS) for(let seconds=4;seconds<=15;seconds++) {
      const row=snapshot.entries[[res,ratio,seconds].join('|')];
      if(!row || E.cmp(row.tokens,0)<=0) throw new Error('官方最低用量快照缺项');
      result[key({res,ratio,seconds})]={tokens:row.tokens,note:'官方最低用量表的估算值；按原始公式保留精度，实际以 API usage 为准。',kind:'official',model:MODEL,version:VERSION,sourceUrl:viewUrl(res),sourceFile:row.sourceFile,displayedTokens:row.displayedTokens,verifiedAt:VERIFIED_AT};
    }
    return result;
  }
  const MINIMA=buildMinima();
  Object.values(MINIMA).forEach(Object.freeze);Object.freeze(MINIMA);
  function officialMinimum(task) {const lookup=key(task);return lookup?MINIMA[lookup]||null:null;}
  // Source-aware boundary; API observations never enter the minimum lookup.
  function estimate(task, minimum = officialMinimum(task), version = VERSION) {
    assertModel(task);
    if(version!==VERSION) throw new Error('用量规则版本不匹配');
    const video=E.normalizeVideo(task.video);
    if(video && minimum && !['official','manual'].includes(minimum.kind)) throw new Error('最低用量来源类型无效');
    if(video && minimum?.kind==='official') {
      const known=officialMinimum(task);
      if(!known || minimum.model!==MODEL || minimum.version!==VERSION || E.cmp(minimum.tokens,known.tokens)!==0) throw new Error('官方用量记录与已核验快照不符');
    }
    const rule=video?minimum:null,calc=E.estimate(task,rule?.tokens||'');
    return {...calc,status:rule?.kind==='official'?'rule-estimate':calc.status,ruleVersion:VERSION,minimumSource:rule?{kind:rule.kind,sourceUrl:rule.sourceUrl||null,verifiedAt:rule.verifiedAt||null}:null};
  }
  return Object.freeze({VERSION,MODEL,VERIFIED_AT,PREVIOUS_VERSIONS,RESOLUTIONS,RATIOS,VIEWS,sources,buildMinima,key,officialMinimum,estimate,MINIMA});
});
