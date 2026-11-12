# 公共实测与录入密钥

所有访客可读取并采用公共实测。录入者使用管理员提供的独立密钥解锁，同一浏览器保存服务器签发的 7 天会话；不再使用邮箱验证码。实际成本、个人浏览器试算、云端公开记录继续独立，只有明确选择「保存并公开」才上传。

## 使用

- 访客：公共实测 → 选择记录 → 用于本次测算。
- 录入者：公共实测 → 解锁录入 → 输入密钥。此后七天内无需逐条输入；只可维护自己录入的记录。
- 管理员：解锁后打开「密钥管理」，填写名称并生成录入者密钥。原始密钥只显示一次，复制交给对应录入者；支持停用、启用、重新生成。
- 停用立即撤销该密钥的全部会话。重新启用需再解锁。重新生成保留原录入者身份及记录归属，并使旧密钥、旧会话失效。
- 锁定录入会清除本机会话并向服务器撤销当前会话。固定七天期限不随使用延长。不同浏览器、公网与本地 HTML 的会话互不共享。
- 会话到期时保留正在编辑的草稿；重新解锁后继续填写，不自动提交。网络失败显示真实错误并允许重试，不误报无权限。

## 部署

独立免费项目 `Reelay_Pricing`，ref `fkdljkabuxopizsnawci`，正式站点 `https://reelay-pricing-v9.vercel.app/`。

按迁移顺序应用 `supabase/migrations`。`cloud/schema.sql` 是最初公共记录与邮箱权限的历史基础；`cloud/access-schema.sql` 是后续密钥权限迁移源码。新部署必须应用两者，禁止只重新应用旧 schema 恢复已退役的邮箱写入权限。迁移不删除已有实测、版本历史或旧成员审计。

首把管理员密钥由受信任的部署操作在本机生成高熵随机值，私下交付，只将 SHA-256 哈希写入 `reelay_private.access_keys`。首次管理员 `owner_id` 沿用原验证账号 UUID，保持历史记录归属；不得把原 `members.id` 当成 `auth.users.id`。不在迁移、源码、HTML、公开附件中放原始密钥。后续录入者密钥由服务器签发。当前密钥不能在使用自己的会话时重新生成；如需更换管理员密钥，先由受信任部署操作提供另一把管理员密钥。

`cloud-config.json` 只包含 URL 与 publishable key。前端不使用 Supabase Auth，不读取旧邮箱登录状态；原邮件服务配置不参与录入授权。已有邮箱登录获得的 JWT 无法继续调用旧写入、管理及成员接口。

## 数据与权限

`access_keys` 保存稳定录入者 ID、记录所属 UUID、名称、角色、启用状态与密钥哈希。`access_sessions` 只存会话哈希、所属密钥、七天截止时间和撤销状态。`access_key_changes` 追加管理审计，不记录原始密钥、会话或哈希。数据库从不存原始密钥或会话令牌。

每个受限请求均重新检查服务器会话期限、撤销状态、当前密钥启用状态和角色，不能只信任浏览器缓存。密钥与会话的密码学随机值通过三个独立随机 UUID 的 SHA-256 产生；原始凭证为 `rk_` 或 `rs_` 加 64 位十六进制。原始录入密钥只在解锁请求或首次生成响应出现；浏览器仅保留 `reelay_cloud_access_v1` 中的会话令牌及原始截止时间。普通 JSON 导入导出不读取此存储。

所有私有表启用 RLS 且无客户端直接表权限。`public` 中窄 RPC 为 `SECURITY INVOKER`，实际授权放在非暴露 schema 内、空 search_path 的受检 `SECURITY DEFINER` 函数；默认 PUBLIC EXECUTE 已撤销。私有表的「RLS enabled no policy」INFO 属于有意默认拒绝，不添加宽松策略。邮箱成员与原审计表仅保留历史，不再授予邮箱身份客户端执行权。

原有事实约束继续有效：实际成本十进制字符串精确保存，最多 20 位小数，不再次乘采购折扣；实测日期必填，历史实扣与原始计价条件按实际填写。记录 UUID 与参数规格分离，同规格可多次测量。写入使用 UUID 幂等和乐观版本，冲突不覆盖他人修改；撤回保留版本历史，公开列表不暴露操作者、凭证或历史审计。

## RPC

| RPC | 参数 | 响应 |
| --- | --- | --- |
| `reelay_public_records` | 无 | 未撤回的公开事实表，按 ID 分页 |
| `reelay_access_unlock` | `access_key` | 一次性会话令牌、期限、脱敏身份 |
| `reelay_access_identity` | `session_token` | 当前角色、名称、密钥 ID、期限 |
| `reelay_access_lock` | `session_token` | 撤销当前会话 |
| `reelay_access_manage_records` | `session_token` | 公开记录及自己/管理员可维护的撤回记录 |
| `reelay_access_save_record` | `session_token, record_id, expected_version, record` | 保存后的当前版本 |
| `reelay_access_archive_record` | `session_token, record_id, expected_version, archived` | 撤回或恢复后的版本 |
| `reelay_access_record_history` | `session_token, record_id` | 自己或管理员可见的版本历史 |
| `reelay_access_keys` | `session_token` | 管理员可见的密钥元数据，无原始凭证/哈希 |
| `reelay_access_create_key` | `session_token, display_name, key_role` | 元数据及只返回一次的新密钥 |
| `reelay_access_set_key` | `session_token, key_id, active` | 更新后的元数据 |
| `reelay_access_rotate_key` | `session_token, key_id` | 同一身份的新密钥，旧会话失效 |

`PT401` 表示密钥或会话无效；`PT403` 是角色/记录归属不足；`PT409` 是版本、最后管理员或当前密钥轮换等冲突。客户端只显示经整理的错误，不回显上游请求和凭证。未确认的写入显示结果尚未确认，禁止自动断言保存成功。

## 核验

`npm test` 覆盖客户端凭证生命周期、界面与本地数据隔离、实际 PostgreSQL 权限和模型计算。`cloud-db.test.cjs` 先执行历史邮箱权限基线，再应用新迁移，验证旧接口撤权、七天期限、撤销、轮换、旧所有权、金额精度、幂等、审计和最后管理员保护；测试在事务中回滚，不产生公开实测。完整本地验证不能替代正式 Supabase/PostgREST 请求验收。

2026-11-12 正式服务验收通过：真实 publishable-key/PostgREST 链路完成密钥解锁、七天会话恢复、普通录入者权限限制、精确金额保存及匿名读取、撤回、同身份轮换、停用即时失效、服务器锁定。迁移前后原两条记录及三条历史版本的校验值一致；验收新增的合成记录已撤回、临时录入密钥已停用，现有一条真实公开记录内容保持一致。邮箱旧入口已拒绝调用。完整本地套件 271 项通过，最终调整后 UI/客户端 52 项再次通过；数据库另含 75 项密钥权限断言。管理员原始密钥仅保存在用户私有本地目录，未进入项目或分享包。
