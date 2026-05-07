# AI 国学生活顾问 · MVP

> 基于传统历法、民俗文化、空间环境建议与心理学框架的 **生活参考报告平台**。
>
> ⚠️ **本服务不是算命应用**：不预测命运、寿命、疾病、灾祸、彩票股票；不承诺改运、消灾、化煞、保平安。
> 所有报告由 AI 自动生成，**仅供文化参考、娱乐参考与生活规划启发**，
> 不构成医疗、法律、投资、婚姻等专业决策建议。

---

## 1. 产品定位

| ✅ 我们做的 | ❌ 我们不做 |
| --- | --- |
| AI 黄历 / 八字结构参考 | 算命、改命、神算 |
| 关系沟通风格分析 | "必合 / 必分 / 必出轨" 判断 |
| 住宅空间优化（含传统视角） | "保证发财 / 转运" 承诺 |
| 民俗择日参考 | 灾祸、疾病、寿命预测 |
| 0–1000 元三档可执行优化方案 | 开光商城、化太岁商品 |

## 2. MVP 功能清单

- 首页：今日黄历卡片 + 四大入口（八字 / 关系 / 住宅 / 择日）
- 八字基础参考（免费）+ 八字深度参考（付费）
- 关系基础参考（免费）+ 关系深度参考（付费）
- 住宅基础参考（免费）+ 住宅深度参考（付费）
- 民俗择日参考（付费）
- 报告详情页：付费墙预览 + 解锁
- 我的：账户、报告历史、订单、**数据删除**
- 合规：用户协议、隐私政策、AI 内容免责声明

## 3. 技术栈

| 层 | 选型 |
| --- | --- |
| Frontend / Backend | **Next.js 14** (App Router) + TypeScript |
| 样式 | Tailwind CSS（自定义"墨色 / 朱砂 / 米白 / 淡金"主题） |
| ORM / DB | Prisma + **Neon Postgres**（Vercel 准生产 Demo）；SQLite 仅保留为旧本地 demo 思路 |
| AI Provider | OpenAI SDK（默认 `gpt-5.5`，`reasoning_effort` 可配置）+ **mock 模式** |
| 校验 | zod |
| 渲染 | react-markdown + remark-gfm |
| 测试 | Vitest |
| 支付 | mock（生产预留微信支付 / 支付宝接口） |
| Analytics | Vercel Web Analytics |
| 服务器部署 | Docker + Next.js standalone（用于香港 / 新加坡 / 其他云服务器镜像） |

## 4. 文件结构

```
.
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── seed.ts                 # 把 inline 安全规则同步到 DB
├── src/
│   ├── app/                    # Next App Router
│   │   ├── api/                # API 路由
│   │   │   ├── almanac/today
│   │   │   ├── reports/generate
│   │   │   ├── reports/[id]
│   │   │   ├── payments/mock
│   │   │   ├── me
│   │   │   └── health
│   │   ├── bazi / marriage / fengshui / date-selection
│   │   ├── reports/[id]
│   │   ├── me
│   │   └── legal/{terms,privacy,disclaimer}
│   ├── components/             # UI 组件
│   ├── lib/
│   │   ├── ai/                 # provider 抽象 + prompt + openai/mock
│   │   ├── safety/             # 内容安全规则 + filter
│   │   ├── domain/             # 黄历/八字/婚配/风水/择日 规则引擎
│   │   ├── reports/            # 编排 (orchestrator)、preview、输入校验
│   │   ├── auth.ts             # 匿名 cookie 用户
│   │   ├── db.ts               # Prisma 客户端
│   │   └── types.ts            # 共享类型
│   └── data/almanac.ts         # 黄历内容池
└── tests/                      # Vitest 单测
```

## 非 Vercel 服务器部署

当前 Vercel 仍保留为海外 Demo 主线路。为了改善中国大陆访问稳定性，项目已支持 Docker + Next.js standalone 服务器部署，可部署到阿里云香港 ECS、腾讯云香港 Lighthouse / CVM、AWS、GCP、DigitalOcean、Render、Railway 等平台。

- 中国大陆访问方案评估：[docs/CHINA_ACCESS_DEPLOYMENT.md](./docs/CHINA_ACCESS_DEPLOYMENT.md)
- 通用服务器部署指南：[docs/SERVER_DEPLOYMENT.md](./docs/SERVER_DEPLOYMENT.md)
- 生产环境变量示例：[.env.production.example](./.env.production.example)

健康检查：

```bash
curl http://localhost:3000/api/health
```

## 5. 本地运行

> 依赖：Node ≥ 20

```bash
# 1) 准备依赖
cp .env.example .env
npm install
npm run db:generate

# 2) 如果已创建 Neon Postgres，并已拿到 DATABASE_URL，再初始化数据库
npm run db:push
npm run db:seed   # 可选：把 inline 安全规则同步到 DB

# 3) 启动
npm run dev      # http://localhost:3000

# 4) 校验
npm run typecheck
npm test
```

默认 `AI_PROVIDER=mock`，**无需 API key 即可跑通整套链路**。

注意：当前 schema 已切到 PostgreSQL，推荐本地也使用 Neon 提供的 `DATABASE_URL`。如果要继续使用 SQLite 本地 demo，需要使用旧 schema 或单独本地分支。

切到真实 OpenAI：
```bash
# .env
AI_PROVIDER=openai
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-5.5            # 你要求的默认模型
OPENAI_REASONING_EFFORT_BASIC=high
OPENAI_REASONING_EFFORT_DEEP=xhigh
```

## 6. 环境变量速查

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `AI_PROVIDER` | `mock` | `mock` / `openai`，未来 `dashscope` 等 |
| `OPENAI_MODEL` | `gpt-5.5` | 主模型 |
| `OPENAI_FALLBACK_MODEL` | `gpt-5.5` | 主模型失败时降级 |
| `OPENAI_REASONING_EFFORT_BASIC` | `high` | 基础报告 reasoning 强度 |
| `OPENAI_REASONING_EFFORT_DEEP` | `xhigh` | 付费深度报告 reasoning 强度 |
| `OPENAI_TEMPERATURE` | `0.4` | 报告类建议较低 |
| `OPENAI_TIMEOUT_MS` | `60000` | 单次请求超时 |
| `DATABASE_URL` | — | Neon Postgres 连接串；Vercel Marketplace Neon 会注入 |
| `APP_URL` | — | Vercel 站点 URL，例如 `https://your-app.vercel.app` |
| `PAYMENT_PROVIDER` | `mock` | `wechat` / `alipay` 留待接入 |
| `LOG_AI_RAW_PAYLOAD` | `false` | 生产建议保持 false，避免敏感数据落库 |
| `SESSION_SECRET` | — | 生产请改为强随机串 |

完整变量见 [`.env.example`](./.env.example)。

## Vercel + Neon 发布准备

本项目唯一发布平台选择 **Vercel**。准生产 Demo 方案固定为：

- Vercel 托管 Next.js。
- Vercel Marketplace 添加 Neon Postgres。
- `AI_PROVIDER=mock`，不调用真实 OpenAI。
- `PAYMENT_PROVIDER=mock`，不接真实支付。
- Vercel Web Analytics 记录基础访问数据。
- 自定义域名后续在 Vercel Project Settings 里添加。

当前 Prisma schema 已切到 PostgreSQL。SQLite 仅适合旧本地 demo，不适合 Vercel 公开部署；如果要继续用 SQLite，需要使用旧 schema 或单独本地分支。

### Vercel 环境变量

必填：

```bash
AI_PROVIDER=mock
PAYMENT_PROVIDER=mock
DATABASE_URL=由 Vercel Marketplace Neon 提供
APP_URL=https://你的-vercel-url.vercel.app
NEXT_PUBLIC_APP_URL=https://你的-vercel-url.vercel.app
LOG_AI_RAW_PAYLOAD=false
SESSION_SECRET=在 Vercel 中设置强随机字符串
```

暂不启用：

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=high
OPENAI_REASONING_EFFORT_BASIC=high
OPENAI_REASONING_EFFORT_DEEP=xhigh
```

说明：

- 当前 Demo 不接真实 OpenAI。
- 当前 Demo 不接真实支付。
- 当前 Demo 使用 Neon Postgres 保存报告和订单。
- 以后正式接 OpenAI 时，只改 `AI_PROVIDER=openai` 并添加 `OPENAI_API_KEY`。
- 以后正式接支付时，再添加微信支付 / 支付宝配置。
- Vercel Marketplace Neon 会注入 `DATABASE_URL`；数据库表结构仍需执行 `npx prisma db push` 初始化。

### Vercel Web Analytics

代码已接入 `@vercel/analytics/next` 的 `Analytics` 组件。部署后在 Vercel 后台执行：

1. 打开 Vercel Dashboard。
2. 进入 Project。
3. 打开 Analytics。
4. 点击 Enable。
5. 部署后可查看访问页面、来源、地区、设备等基础数据。

### GitHub + Vercel 手动发布步骤

```bash
git init
git add .
git commit -m "Initial MVP"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

Vercel 操作步骤：

1. 创建 GitHub repo，建议名称：`ai-fengshui-demo`。
2. 在本地执行 `git init`。
3. 执行 `git add .`。
4. 执行 `git commit -m "Initial MVP"`。
5. 执行 `git branch -M main`。
6. 执行 `git remote add origin <repo-url>`。
7. 执行 `git push -u origin main`。
8. 登录 Vercel。
9. 点击 Add New Project。
10. Import GitHub repo。
11. Framework 自动识别 Next.js。
12. 在 Vercel Marketplace 添加 Neon Postgres。
13. 确认 `DATABASE_URL` 已注入 Project Environment Variables。
14. 添加 `AI_PROVIDER=mock`。
15. 添加 `PAYMENT_PROVIDER=mock`。
16. 添加 `APP_URL` 和 `NEXT_PUBLIC_APP_URL`。
17. 在本地或受控环境临时使用 Neon `DATABASE_URL` 执行 `npx prisma db push`，初始化表结构。
18. Deploy。
19. 打开 Web Analytics。
20. 添加自定义域名：Project Settings → Domains → Add Domain。
21. 根据 Vercel 提示配置 DNS。
22. 等待 SSL 自动生效。

### 部署后验证清单

- 首页 `/` 是否能打开。
- 八字页 `/bazi` 是否能打开。
- 婚姻页 `/marriage` 是否能打开。
- 住宅页 `/fengshui` 是否能打开。
- 择日页 `/date-selection` 是否能打开。
- 报告是否能生成。
- 报告是否能写入 Neon 数据库。
- mock 支付是否能解锁。
- 我的页面 `/me` 是否能看到历史。
- 用户协议 `/legal/terms` 是否能打开。
- 隐私政策 `/legal/privacy` 是否能打开。
- AI 免责声明 `/legal/disclaimer` 是否能打开。
- Vercel Analytics 是否有访问数据。
- 自定义域名是否能访问。
- HTTPS 是否正常。

## 7. 端到端 demo 流程

1. 访问 `http://localhost:3000` → 看到今日黄历 + 四大入口
2. 点 **「八字参考」** → 填出生信息 → 「生成基础参考（免费）」 → 跳转报告页
3. 回到 `/bazi` → 「生成深度参考（¥49）」 → 跳转报告页 → 上方为预览
4. 点 **「解锁完整报告」** → mock 支付 → 自动刷新展示完整内容
5. 进入 **「我的」** → 查看报告历史 / 订单 / 数据删除入口

## 8. 接入真实支付（生产 TODO）

- [ ] `src/app/api/payments/mock/route.ts` 拆分为：
  - `payments/create` — 创建预下单（调用微信 V3 / 支付宝 alipay.trade.create）
  - `payments/notify/wechat` — 微信回调，验签后置 Payment.status = success
  - `payments/notify/alipay` — 支付宝回调
- [ ] `Payment` 表加字段：`outTradeNo`、`prepayId`、`payerOpenId`
- [ ] 增加幂等键（`outTradeNo` 唯一）防止重复回调
- [ ] 微信支付：商户号、API V3 密钥、平台证书
- [ ] 支付宝：appId、应用私钥、支付宝公钥

## 9. 接入国内备案 AI 模型（生产 TODO）

- [ ] 新增 `src/lib/ai/dashscope.ts`（通义千问）/ `ernie.ts`（文心）/ `doubao.ts`（豆包）
- [ ] 实现 `AIProvider` 接口 → 在 `src/lib/ai/client.ts:getAIProvider` 中按 `AI_PROVIDER` 分支
- [ ] 复用同一份 `prompts.ts` 与 `safetyFilter`
- [ ] 注意：国内备案模型请求体中 `reasoning_effort` 需替换为对应字段（如通义的 `enable_thinking`）

## 10. 合规风险 TODO

- [ ] **算法备案**：生成式 AI 服务在大陆需做"生成式人工智能服务备案"（网信办）
- [ ] **ICP 备案 / 增值电信业务**：上线前完成
- [ ] **18+ 提示**：注册流程加成年人确认 + 监护人提示
- [ ] **未成年人保护**：检测出"出生年份 < 18 岁"时提示监护人陪同
- [ ] **第三方模型供应商合同**：明确不得用于训练用户隐私数据
- [ ] **日志保留**：模型日志按要求保留 ≥ 6 个月，但**不存敏感原文**
- [ ] **关键词敏感库**：定期对接外部敏感词库，叠加到 `ContentSafetyRule`
- [ ] **报告导出**：用户可导出/迁移自己的报告数据（GDPR-style）
- [ ] **支付合规**：付费产品须明示价格、退款政策、虚拟商品提示
- [ ] **不得诱导付费焦虑**：审核所有付费墙文案
- [ ] **跨境数据**：若使用境外 OpenAI，需评估数据出境合规（CAC 申报）

## 11. 测试用例索引

| 测试 | 覆盖 |
| --- | --- |
| `tests/safety.test.ts` | 高/中/低 风险词命中、拦截、重写、软化、disclaimer 注入 |
| `tests/bazi.test.ts` | 四柱计算、未知时辰、五行分布、性格关键词、错误日期处理 |
| `tests/marriage.test.ts` | 关系结构、不输出绝对判断、caveat 存在性 |
| `tests/orchestrator.mock.test.ts` | mock provider + safetyFilter 的端到端冒烟 |

```bash
npm test           # 跑一次
npm run test:watch # watch 模式
```

## 12. 模块文档索引

- [`src/lib/ai/README.md`](./src/lib/ai/README.md) — AI Provider 抽象与 prompt 设计
- [`src/lib/safety/README.md`](./src/lib/safety/README.md) — 内容安全规则与过滤
- [`src/lib/domain/README.md`](./src/lib/domain/README.md) — 黄历/八字/婚配/风水/择日 规则引擎

## 13. 已知简化

- **八字算法**：年/月柱按公历近似；正式上线请替换为基于节气的精确实现（推荐 `lunar-typescript`）。
- **黄历**：节气、宜忌、生肖冲煞为内置内容池；正式上线建议接入紫金山天文台节气数据 + 权威黄历库。
- **支付**：当前为 mock，文件结构已预留真实接入路径。
- **登录**：MVP 使用 cookie 内匿名 ID，可绑定邮箱；正式上线建议接入 NextAuth + 邮箱验证码 / 手机短信。
- **数据库**：当前准生产 Demo 使用 Neon Postgres；`inputData`、`ruleResult` 等 JSON 内容仍以字符串保存，后续可升级为 Prisma `Json` 字段。

## 14. License

Proprietary（仅作 MVP demo 使用，未授权不得用于商业上线）。
