# `lib/domain` — 规则引擎层

> "**规则引擎产生结论，AI 只负责把结论翻译成自然语言。**"
>
> 这一层的作用是 **不让 AI 自由发挥下结论**。
> 所有报告先跑规则引擎产出结构化数据（JSON），再喂给 prompt。

## 模块

| 文件 | 作用 |
| --- | --- |
| `elements.ts` | 天干、地支、五行、生克、阴阳、生肖映射 |
| `bazi.ts`     | 精确四柱底座（立春换年、十二节换月、法定时区换算） |
| `almanac.ts`  | 今日黄历组装（干支日由 bazi 派生 + 内置内容池） |
| `marriage.ts` | 双方匹配：日主元素生克 + 生肖六合/三合/相冲 + 沟通风格表 |
| `fengshui.ts` | 朝向 / 房间 / 用户关注点 → 三档优化方案 |
| `dateSelection.ts` | 区间评分 + 事项加权 → 推荐 / 不推荐 + 现实准备清单 |

## 关键约束

- **不输出绝对判断**：函数返回值里不应出现"必合 / 必分 / 必发财"。`marriage.test.ts` 里有断言。
- **不返回个人敏感信息**：返回的 ruleResult 应能直接放进 prompt 而不泄漏地址、身份证、电话等。
- **可单独测试**：每个函数都是纯函数，无 DB / 网络依赖；测试见 `tests/`。

## 已知简化

| 模块 | 简化点 | 生产替换 |
| --- | --- | --- |
| `bazi.ts` | 已接入 `lunar-typescript`；出生地目前用于选择法定时区，尚不做经度真太阳时校正 | 后续若采集城市/经度，再单独提供可解释的真太阳时口径 |
| `almanac.ts` | 节气、宜忌、生肖冲为内置 mock | 紫金山天文台节气 + 权威黄历库 |
| `dateSelection.ts` | 区间最长 90 天，简化评分 | 接入更细颗粒的"建除十二神"等传统择日因子 |

## 加新报告类型

1. 在 `types.ts:ReportType` 中加枚举
2. 在 `lib/domain/` 中加一个新模块产生 `ruleResult`
3. 在 `lib/reports/orchestrator.ts:runRuleEngine` 中加 case
4. 在 `lib/ai/prompts.ts` 中加 system prompt 模板 + 章节要求
5. 在 `lib/ai/mock.ts` 中加对应 mock markdown
6. 加 zod schema 到 `lib/reports/inputs.ts`
7. 增加页面 + 表单
