# 蟾先森 CHAN XIAN SEN · 项目执行规则

## 开始任何任务前

- 完整阅读本文件。
- 非简单任务还必须完整阅读 `docs/PROJECT_CONSTITUTION.md`。
- 承担产品顾问、开发顾问、内容顾问、阶段规划、反馈验收或方向判断时，必须完整阅读 `docs/CONSULTANT_CONTRACT.md`。
- 涉及产品方向、当前功能、版本、发布、用户测试或下一阶段判断时，必须同时阅读 `docs/CURRENT_STATE.md`。
- `docs/PROJECT_CONSTITUTION.md` 是长期产品宪法；`docs/CONSULTANT_CONTRACT.md` 规定顾问如何思考、沟通和验收；`docs/CURRENT_STATE.md` 是可更新的阶段事实。三者不能代替本轮任务的具体范围、验收标准和停止条件。
- 如果代码、页面、数据库与状态文档不一致，以实际核验结果为准，并在任务反馈中指出需要更新的状态文档。

## 项目定位

- 产品品牌：**蟾先森 CHAN XIAN SEN**；仓库历史别名仍保留 `ai-fengshui-demo`。
- 所有面向用户的品牌字面由 `src/lib/config/brand.ts` 单点维护，不要再到处硬编码新品牌名。
- 产品表层是周易风水产品，内核是一套可信、可追溯、灵活友好的个人生活整理与观察系统。
- 本项目通过“整理、收纳、梳理、陪伴、认识”帮助用户获得现实可执行的下一步。
- 本项目不是算命改命平台，不承诺预测命运、改运、消灾、化煞或保证结果。
- 本项目不是医疗、投资、婚姻、法律、职业等专业决策工具。
- 所有报告内容仅供传统文化、民俗参考、娱乐参考和生活规划启发。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- Neon Postgres / PostgreSQL 作为 Vercel 准生产 Demo 数据库
- SQLite 仅作为旧本地 demo 方案；如需继续使用，请保留旧 schema 或单独本地分支
- AI Provider 抽象层
- 默认 mock provider，不调用真实外部 AI；可切换到 Anthropic Claude 或 OpenAI
- Vercel Web Analytics
- Docker + Next.js standalone，用于香港 / 新加坡 / 其他云服务器镜像部署

## 常用命令

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run build
npx prisma db push
npx prisma db seed
```

## 目录说明

- `src/app`：Next.js 页面、布局与 API routes。
- `src/components`：复用 UI 组件与表单组件。
- `src/lib/ai`：AI Provider 抽象、mock provider、Anthropic provider、OpenAI provider 与 prompt。
- `src/lib/domain`：黄历、八字、关系、住宅风水、择日等规则引擎。
- `src/lib/safety`：安全规则、风险词过滤与免责声明处理。
- `src/lib/reports`：报告输入校验、编排流程与付费预览。
- `prisma`：Prisma schema、Neon Postgres 数据模型与 seed。
- `docs`：Vercel 以外的服务器部署、中国大陆访问方案与运维说明。
- `tests`：Vitest 单元测试与 mock 编排测试。

## 绝对禁止

- 不允许硬编码 API Key、token、密码、支付密钥或数据库连接串。
- 不允许硬编码 Anthropic API Key、OpenAI API Key 或任何真实 provider secret。
- 不允许提交 `.env`、`.env.local`、真实数据库文件或私密本地设置。
- 不允许绕过 `safetyFilter` 输出报告。
- 不允许输出“必发财、必离婚、必有灾、改命、消灾、保证有效”等高风险内容。
- 不允许自动接入真实支付。
- 不允许自动部署生产环境。
- 不允许自动 push GitHub。
- 不允许自动购买服务器、绑定域名、修改 DNS 或申请备案。
- 不允许删除核心功能来规避测试或构建失败。
- AI Provider 必须保持可切换，默认必须是 `AI_PROVIDER=mock`。
- 线上切换到 `AI_PROVIDER=anthropic` 或 `AI_PROVIDER=openai` 前，必须先完成本地测试并由产品负责人确认。
- 真实 AI API 调用会产生成本，任何真实调用前都必须人工确认。

## 完成标准

任何修改完成后，必须至少运行：

```bash
npm run test
npm run typecheck
npm run build
```

如果某项失败，先定位根因并做最小修复，不允许隐藏错误或删除核心功能。

## 发布前标准

- `npm run build` 通过。
- 无敏感信息泄露。
- `.env.example` 完整，且不包含真实密钥。
- mock 模式可跑通，默认 `AI_PROVIDER=mock`。
- 页面主路径可访问：首页、八字、婚姻、住宅、择日、我的、报告页、法律页面。
- 报告生成流程可用，且经过 `safetyFilter`。
- 付费 mock 可用，不接真实微信支付或支付宝。
- README 写清楚本地运行、Vercel 发布和服务器镜像部署说明。

## 数据库发布规则

- Vercel 是海外 Demo 主线路，服务器镜像部署作为大陆 / 全球访问补充线路。
- 准生产 Demo 使用 Vercel Marketplace Neon Postgres，通过 `DATABASE_URL` 连接；服务器镜像也可以继续复用同一个 Neon `DATABASE_URL`。
- 本地如果继续用 SQLite，需要使用旧 schema 或单独本地分支。
- 未经产品负责人确认，不要创建真实 Neon 数据库、修改生产数据或输出真实 `DATABASE_URL`。
