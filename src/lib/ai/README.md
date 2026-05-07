# `lib/ai` — AI Provider 抽象 + Prompt 模板

## 设计目标

- **可替换**：今天用 OpenAI（gpt-5.5），明天切通义/文心/豆包，业务代码 0 改动。
- **可降级**：主模型失败时自动 fallback 到备用模型，再失败才抛错。
- **可观测**：每次调用写一条 `ModelLog`（token usage + safetyFlags），生产可关闭原文落库。
- **可低成本本地跑**：默认 `AI_PROVIDER=mock`，不依赖任何外部服务。

## 文件

| 文件 | 作用 |
| --- | --- |
| `client.ts` | `AIProvider` 接口 + `getAIProvider()` 工厂 + `reasoningEffortFor(tier)` |
| `openai.ts` | OpenAI 实现，使用官方 SDK；超时 / 重试 / fallback / token usage |
| `mock.ts` | Mock 实现，根据 reportType 拼接示例 markdown，本地开发使用 |
| `prompts.ts` | 共享硬约束（13 条）+ 每类报告 system prompt + user prompt 构造器 |

## 新增 Provider

1. 实现 `AIProvider` 接口：
   ```ts
   export class DashScopeProvider implements AIProvider {
     readonly name = "dashscope";
     async generateReport(input: AIGenerateInput): Promise<AIGenerateOutput> { ... }
   }
   ```
2. 在 `client.ts:getAIProvider()` 的 switch 里加分支
3. 在 `.env` 中设 `AI_PROVIDER=dashscope` + 对应 key

`prompts.ts` 与 `safetyFilter` **不需改动**。

## reasoning_effort

| Tier | 默认 | 适用 |
| --- | --- | --- |
| basic | `high` | 免费报告（300–1200 字） |
| deep  | `xhigh` | 付费深度报告（2500–8000 字） |

可通过 `OPENAI_REASONING_EFFORT_BASIC` / `OPENAI_REASONING_EFFORT_DEEP` 环境变量覆盖。

## Prompt 硬约束（节选）

13 条底线写在 `prompts.ts:SHARED_SYSTEM_PROMPT`，所有报告 system prompt 都会拼接，**违反任意一条都会被 `safetyFilter` 拦截或重写**：

- 不预测：死亡、绝症、寿命、灾祸、彩票、股票
- 不承诺：改运、消灾、化煞、保平安、开光保证有效
- 不替代专业意见（医疗、法律、投资、婚姻）
- 不制造焦虑诱导付费
- 婚姻只描述沟通模式，不下"必合 / 必分"判断
- 风水必须结合现实空间逻辑（采光、通风、动线…）
- 输出结构化 + 可执行
