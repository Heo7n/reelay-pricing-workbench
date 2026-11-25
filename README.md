# Reelay 视频定价工作台

用于 Seedance 系列模型的用量、费用、积分定价及实测对账。当前版本为 V9.16.0。

在线使用：<https://reelay-pricing-v9.vercel.app/>

## 直接打开

在 GitHub 选择 **Code → Download ZIP**，解压后用 Chrome 或 Edge 打开 `reelay_pricing_workbench_v9.html`。计算器及界面资源包含在这个 HTML 中；公共实测的读取、密钥解锁和保存需要联网。

`template.html` 是构建模板，请使用完整 HTML 运行计算器。本地设置和本地实测保存在各自浏览器中，可通过 JSON 导入导出迁移。

## 本地开发

使用 Node.js 24 LTS：

```sh
npm ci
npm test
npm run build
```

构建同时生成 `dist/index.html` 和 `reelay_pricing_workbench_v9.html`。修改源文件后运行构建，再检查生成页面。

## 文件说明

- `template.html`、`app.js`：页面样式与交互。
- `engine.js`、`models.js`、`pricing-profiles.js`：费用与积分计算规则。
- `evidence/`、`source-rules.cjs`、`models-source.cjs`：规则来源、核验与生成。
- `cloud-client.cjs`、`cloud-ui.js`：公共实测及录入密钥交互。
- `cloud/README.md`、`supabase/migrations/`：云端结构、权限与部署说明。
- `使用与核验说明.txt`：详细计算和界面说明。

## 公共实测

访客无需解锁即可查看公开记录。授权录入者在「公共实测 → 解锁录入」输入密钥，同一浏览器可使用七天；明确选择「保存并公开」才上传数据。获取源码不附带录入权限。

`cloud-config.json` 只包含前端所需的公开连接配置。管理员密钥、会话、本机部署登录信息和服务器凭证不属于源码，不应提交到仓库。数据库迁移仅由管理员按云端说明执行。
