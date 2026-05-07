# `lib/safety` — 内容安全规则 + 过滤

## 三档 × 三动作

| Severity | Action  | 例子 | 处理 |
| --- | --- | --- | --- |
| **high**   | `block`   | "血光之灾" / "必发财" / "改命" / "彩票号码" | **阻断**整篇，返回安全提示 |
| **medium** | `rewrite` | "你们必然分手" / "今年一定破财" | **段落重写**：剔除高风险句 + 追加克制提示 |
| **low**    | `soften`  | "必然 / 一定 / 保证 / 注定" | **全文 replace** 为克制表达 |

所有放行的报告，最后强制追加 `DISCLAIMER_BLOCK`（避免重复）。

## 处理顺序

```
input → 高风险扫描 ──命中──→ 直接 block + 安全提示 + disclaimer
                  └─未命中→ 中风险扫描 → 段落重写
                                       → 低风险全局软化
                                       → 拼接 disclaimer
                                       → SafetyResult
```

## 文件

- `rules.ts` — `INLINE_RULES` 数组（high/medium/low 三档）+ `DISCLAIMER_BLOCK`
- `filter.ts` — `safetyFilter(text)` 主函数

## 扩展

1. **简单加词**：在 `rules.ts` 对应数组里加一条 `{ name, pattern, severity, action }`
2. **运行时热更新**：`prisma seed` 已把规则写入 `ContentSafetyRule` 表；可改 `filter.ts` 在启动时 `findMany()` 合并 inline + DB 规则
3. **接入第三方关键词库**：在 `filter.ts` 中追加一道扫描，例如调用网易云盾 / 阿里绿网 / 公安部敏感词库

## 设计取舍

- **MVP 不做语义级判断**：所有规则都是正则。语义层面的隐含恐吓（如"你将来肯定不顺"）会先被 medium-rewrite 命中（因为含"肯定"），但更隐蔽的语义需上语义模型，留作 v2。
- **block 优先于 rewrite**：高风险一条命中即整篇 block，不做"局部裁剪"，避免漏网。
- **disclaimer 强制追加**：即使报告本身已包含免责声明，也会做去重检测避免双重追加。
