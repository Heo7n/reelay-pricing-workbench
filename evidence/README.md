# 最低用量规则的来源与复核

当前模型为 **Seedance 2.0 标准版**，规则版本为 `volc-seedance20-2026-10-20`。这些数据用于参数估算；API 返回的 `usage.completion_tokens` 才是实际计费用量。

## 原始证据

- `2026-10-20/calculator-public.html`：匿名读取[官方计算器](https://bytedance.larkoffice.com/share/base/form/shrcnP1Bl0mqCP9OHCbjpe1oBkf)的原始公开 HTML。
- `calculator-fields.json`：从上述 HTML 的字面 JSON 中提取字段，含获取时间、来源 URL 和 HTML SHA-256。构建器会再次独立提取并比对，不执行网页脚本。
- `minimum-{480p,720p,1080p,4k}.clipboard.json`：当日刷新[官方 Seedance 2.0 最低用量表](https://bytedance.larkoffice.com/wiki/FXaYwxzJ5i5Zdik32ipcWzt7nxd?table=tblmNCuMjADrXtDf&view=vew2CR2JYM)后，在每个视图全选48条记录并正常复制，保留浏览器剪贴板的原始返回。公式来自 `text/bitable` 的 `header.property.formula`，字段 ID 为 `fld0p1bMiB`。
- `record-1080p-16x9-4s.ax.txt`：展开单条记录及隐藏字段的界面读数，显示输出4秒、输入3秒、帧率24。仅为补充上下文，不参与计算。
- `manifest.json`：源文件和生成文件哈希，以及规格、记录和求值次数。

表格左侧明确分开2.0和2.5。计算器最低值查表目标是 `tblmNCuMjADrXtDf`；`tblheIYDXXwYM43b` 是2.5表，不能替换。只保存当前页面内容，不读取内部接口或浏览器隐藏状态。

## 计算为什么这样实现

官方计算器先按分辨率、比例、输出时长查最低值，再将它与基础估算取较大值。无视频输入不使用最低值。运行时采用同一流程。

复制数据的数值已经按表格的 `formatter: "0"` 显示取整；不能把它作为精确计价输入。构建器使用受限表达式解释器执行原始公式，在官方计算器列出的输入时长选项内求最小值，再逐条核对显示整数。全部通过后生成精确小数查找表，保留每项的原始视图、行号和来源文件。

原式中确实存在 `ROUNDUP(输出时长*2/3,0)`。这里保留它作为可校验的源公式，运行时代码不再单独手写一个等价阈值式。当前192条源记录因横竖比例共用，覆盖288个规格；4032次求值是288规格×14档输入时长，并非4032次API实测。

例如720p、4:3、输出4秒：精确最低值为152152.875，表格显示152153。输入2秒时按28元/百万Token计算得到4.2602805元。Token显示取整与积分逐笔向上取整是不同步骤。

## 更新与失败处理

1. 新建日期目录，从同一模型的当前官方计算器和表格重新取证。
2. 核对模型、表和字段身份、规格范围、费率及原式变更；更新规则版本和版本校验摘要。
3. `npm run rules:build` 生成数据；`npm run rules:check` 检查源证据和生成结果是否一致。
4. `npm run build`、`npm test` 通过后提交源码、证据、生成表和独立HTML。

缺字段、缺行、重复规格、错误模型、维度不符、原式变化、显示值不符、HTML与字段提取脱节、生成文件过期均报错。构建不会联网悄悄替换规则，也不会在失败后继续输出旧数据。

根目录 `official-table-evidence.json` 保留为10月19日的历史显示值回归样本，当前构建与运行的来源是本目录。输入视频时长整秒化属于工作台输入策略；实测参数保留原始小数。
