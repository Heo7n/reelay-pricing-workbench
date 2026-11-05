# 公共实测库

所有访客可读取已公开的实测记录。只有管理员授予权限的邮箱，在完成 Supabase Auth 身份验证后，才能录入。管理员维护全部记录与录入成员；普通录入成员只能修改、撤回和恢复自己录入的记录。

主面板试算、浏览器本地记录、云端公共记录是不同的数据集合。页面输入不会自动上传，旧内置样本也不会自动发布。只有明确选择「保存并公开」才写入公共实测库。

## 部署与首位管理员

2026-11-05 已创建独立免费项目 `Reelay_Pricing`（`fkdljkabuxopizsnawci`，新加坡区域），应用 `20261105040019_public_measurements` 迁移并设置用户指定的管理员邮箱。公开记录当前为空，未自动上传本地记录。真实 PostgREST 检查已确认匿名读取可用、匿名写入被拒、私有 schema 不暴露；完整 SQL 权限断言在该项目内执行并回滚通过。

2026-11-05 Supabase CLI 已完成登录并验证可访问独立项目。控制台已保存正式站点和唯一允许回跳地址 `https://reelay-pricing-v9.vercel.app/`，已确认邮箱验证开启，并将验证码有效期设为 10 分钟，保留云端默认的 8 位长度。前端接受 6–10 位数字验证码，由 Supabase 按实际配置验证，不再截断为 6 位。自定义 SMTP 和首次注册、再次登录的两份邮件模板仍未启用，真实收信登录尚未验收，云端功能未发布到正式站点。Supabase CLI 本机版本为 2.116.0，新版本 3.x 的远程目标语义不同，切换版本前重新核对。

**邮件上线前置条件：** Supabase 自 2026-06-03 起，禁止新建免费项目在使用默认邮件服务时修改 Auth 邮件模板；本项目属于受影响范围。必须先配置自定义 SMTP，再应用并核验两份验证码模板。默认邮件服务还只向 Supabase 组织成员邮箱发送邮件，计算器的录入成员名单不等于组织成员。CLI 登录完成不能替代发信服务配置，不得通过关闭邮箱确认或将录入者加入 Supabase 管理组织来绕过这些限制。依据：[邮件模板变更公告](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier)、[SMTP 文档](https://supabase.com/docs/guides/auth/auth-smtp)。

当前安全检查的四项 `rls_enabled_no_policy` 提示属于私有表的默认拒绝设计：客户端没有直接表权限，访问由经过身份检查的函数执行。不能为消除提示添加允许所有人访问的策略。

1. 使用此计算器独立的 Supabase 项目，不能直接套用到其他 Reelay 项目。部署前检查 `public` 暴露 schema 列表，**不要**暴露 `reelay_private`。
2. 由数据库管理员审阅并应用 `schema.sql`。本文件是开发中的 schema 源码；正式发布时用 Supabase 迁移工具生成对应迁移，不把本文件名冒充迁移历史。
3. 由数据库管理员向 `reelay_private.members` 插入用户确认的首位管理员邮箱、称呼、`role='admin'`、`active=true`。邮箱使用小写、去除首尾空格。**不从第一次登录者、账号元数据或公开请求自动产生管理员。**
4. 配置 Supabase Auth 的站点 URL、允许的生产回跳地址和邮件模板。当前客户端使用邮箱验证码：Magic Link 模板必须包含 `{{ .Token }}`，否则默认邮件只包含链接，不符合输入验证码的页面。
5. 生产邮件应配置可用的自定义 SMTP。Supabase 默认邮件服务的收件人、频率等限制不适合作为多人登录的交付保证；必须实际验证管理员和获授权成员能收到验证码。邮件密钥只填写在服务商的受保护配置中，不进代码仓库或 HTML。
6. 客户端首次登录采用 `shouldCreateUser: true`，允许身份服务建立账号；**身份账号不是录入资格**。即使未获授权的人成功验证邮箱，数据库仍拒绝其所有写入和成员管理请求。录入资格始终由数据库的成员名单决定。
7. 将项目 URL 和 **publishable key** 配入 `cloud-config.json`。文件只能含 `url`、`publishableKey`；它们会进入公开 HTML。禁止放入 `service_role`、secret key、数据库密码、SMTP 密钥。
8. 先在独立测试库执行 `sql-test.sql`（整个测试事务最终回滚），再验证生产上的匿名只读、授权录入和停用效果。权限验证不能仅看登录按钮是否隐藏。

首位管理员登录后，在公共实测库的「录入成员」界面添加邮箱。成员权限只保存在私有表中；此操作不直接发邀请邮件，成员通过登录入口自行获取验证码。现有成员的邮箱不能原地替换，换邮箱应新增成员，再停用旧邮箱。停用成员保留其记录与修改历史。

## 数据与权限

- `reelay_private.records` 保存当前记录、所属账号、版本与撤回状态。
- `record_revisions` 对每次实际变更追加历史版本，保存操作者和时间。重试或重复保存相同内容不会追加伪变更。
- `members` 存储邮箱名单和角色；`member_changes` 保留授权变化。
- 全部私有表启用 RLS，客户端没有表权限或策略通路。Data API 只暴露下列 `public.reelay_*` 函数。
- `public` 中函数均为 `SECURITY INVOKER`。私有函数以固定空 `search_path` 执行必要的授权、事务、审计操作，撤销默认 `PUBLIC EXECUTE` 后仅向所需角色授权。
- 身份匹配读取 `auth.uid()` 对应的 `auth.users` 已验证邮箱，不信任请求中的邮箱、`user_metadata` 或客户端角色。每次写入重新检查启用状态，停用后无需等待旧 JWT 过期。
- 公开响应只包含事实记录、记录 ID、版本和时间，不包含邮箱、账号 ID、操作者、成员权限或修改日志。记录备注本身属于公开内容，填写时应避免个人信息与凭证。
- 实际成本 `C` 必须明确录入，可为零；金额始终以十进制字符串保存，最多 20 位小数。不乘当前采购折扣，不用预估回填历史。
- 实测日期必填，历史实扣 `N`、折前成本 `P`、API 用量与历史定价可留空。历史定价仅接受明确提供的 `q`、`M`，不会读取当前试算方案。
- 同规格可以保存多条记录。ID 标识实测记录，生成参数不是数据库唯一键，也不代表某种规格永久只有一个实际价格。

## RPC 合约

| RPC | 参数 | 返回 |
| --- | --- | --- |
| `reelay_public_records` | 无 | TABLE：`id, version, record, created_at, updated_at`，只含未撤回记录 |
| `reelay_identity` | 无 | `{authenticated, role, display_name}`；无资格时 `role:null` |
| `reelay_manage_records` | 无 | TABLE：上述字段及 `archived, can_edit`；管理员可见全部撤回记录，成员可见自己的撤回记录 |
| `reelay_save_record` | `record_id, expected_version, record` | 单条记录及 `archived, can_edit` |
| `reelay_archive_record` | `record_id, expected_version, archived` | 单条记录；`archived=false` 为恢复 |
| `reelay_record_history` | `record_id` | JSON 数组：`version, record, archived, changed_at`，仅录入者与管理员 |
| `reelay_members` | 无 | JSON 数组：`id, email, display_name, role, active`，仅管理员 |
| `reelay_set_member` | `member_id, email, display_name, role, active` | 单个成员；新成员传 `member_id:null`，称呼最多 60 字符 |

两个 TABLE 列表按 `id ASC` 排序，客户端可以使用 `.range()` 分页；不要依赖默认最大行数取得全部记录。其余 RPC 返回单一 JSON 值，不使用 `.range()`。

`record` 的字段为 `title, provider, params, costBasis, P, C, N, date, note`，可选 `usage, historicalPricing`。不含 `id`。`costBasis` 只能为 `recorded`；参数需要明确模型、分辨率、比例、输出时长、是否有视频以及输入视频总时长。服务器拒绝额外字段，防止把整个本地方案、账号字段或其他私有元数据一并上传。

新增记录在客户端生成并保留 UUID，`expected_version=0`。相同 UUID、相同内容的首轮保存重试幂等。编辑、撤回和恢复必须提交读取时的版本；冲突返回 `PT409`，不能自动用旧编辑覆盖较新的记录。恢复旧内容可先查看历史版本，再明确作为新版本保存。

| 错误码 | 含义 |
| --- | --- |
| `PT400` | 输入不合法 |
| `PT403` | 未登录、未授权或操作他人记录 |
| `PT404` | 指定记录或成员不存在 |
| `PT409` | 版本冲突、重复成员、最后管理员保护等状态冲突 |
| `42501` | 数据库对象层拒绝访问，例如匿名调用写接口 |

## 验证

`sql-test.sql` 应以 `postgres` 在本地或专用测试库执行，使用失败即停止的 SQL 客户端。它创建带 `.invalid` 邮箱的临时测试身份，模拟 `anon` / `authenticated` 及不同 JWT 身份，执行权限、精度、幂等、冲突、撤回恢复、审计等检查，最后整体回滚。

可复现的本地入口为 `node --test cloud-db.test.cjs`：它用 PGlite PostgreSQL 建立独立数据库和最小 Auth 模拟，执行 schema 与完整权限脚本，并断言所有测试身份、记录和审计数据已经回滚。该验证覆盖数据库 SQL 行为，不替代真实 Supabase Auth 邮件投递、JWT 验签、PostgREST 分页及生产网络链路的验收。
