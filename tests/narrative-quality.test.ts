import { describe, expect, it } from "vitest";
import {
  assessReportNarrativeQuality,
  buildNarrativeRepairPrompt
} from "@/lib/reports/narrativeQuality";
import type { ReportType } from "@/lib/types";

const reports: Array<[ReportType, string]> = [
  ["bazi_basic", `# 这位朋友，我们聊聊你的性格与步调

## 先说说整体印象
讨论重要选择时，你常先听完不同意见，再说明自己的偏好；协调是优势，太晚表态则容易让别人误判。
## 看看五行的小提示
传统线索更偏向稳定落实，遇到需要明确取舍的事情时，可以主动把边界写下来。
## 来看看你的性格画像
从日常互动看，你会留意不同人的位置，也希望事情保持公平。做决定时，你通常先比较各方影响，再确认自己的底线；准备落实时，会提前对齐时间与责任。压力增加后，表达可能反复修改，像是在寻找所有人都能接受的版本。这些表现可以结合真实经历继续观察，并不是固定结论。
## 有两件事想提醒你
- 共同方案形成后，也确认别人是否知道你的真实偏好。
- 协调时间过长时，检查自己是否在回避必要取舍。
## 给你三句小建议
- 先写下自己的第一选择。
- 分别列出可协商与不可退让的条件。
- 确认责任人、截止时间和下一步。`],
  ["marriage_basic", `# 两位朋友，我们看看彼此相处的步调

## 先说说你们相处的感觉
一人习惯先说结论，另一人更希望先听见感受。
## 看看你们各自的步调
重要决定来临时，回应顺序不同，但都希望事情真正向前。
## 你们合拍的地方
双方愿意提供真实反馈，也能在冷静后继续讨论。
## 有些不同也值得听见
抢着解决问题时，较慢开口的人可能还没有表达完整。
## 给你们三句相处建议
- 先约定这次讨论要解决什么。
- 每人用一分钟说完，不中途纠正。
- 结束前复述共同决定与待确认事项。`],
  ["home_fengshui_basic", `# 这位朋友，我们一起看看这个家

## 先说说这个家整体的感觉
卧室临街带来的车流声，是眼下最直接影响休息的因素。
## 从门口慢慢走一圈
先观察常走路线有没有被零碎物品占住，不预设未提供的空间条件。
## 逐个看看你在意的空间
客厅下午西晒明显，卧室则需要优先处理窗边传入的声音。
## 有几处想轻轻提醒你
调整前分别记录午后温度和夜间噪声，避免只凭一次感受购买物品。
## 不花钱也可以先做这三件事
- 把床边需要安静的位置移离临街墙面。
- 连续三晚记录噪声最明显的时段。
- 下午拉上现有窗帘，对比室内体感。`],
  ["date_selection_basic", `# 这位朋友，先挑个从容的日子

## 先说说这段日子
签约窗口有选择余地，日期只负责帮助安排，不代替合同核对。
## 这是为你挑出的日子
两个工作日都可作为候选，最终要结合审核进度与双方实际安排确认。
## 日子之外，先准备好这三件事
- 逐条确认金额、期限和退出条款。
- 核对签约主体与授权文件。
- 保存最终合同版本和沟通记录。`]
];

describe("non-template narrative quality gate", () => {
  it.each(reports)("accepts a complete %s report and rejects a duplicate", (reportType, text) => {
    expect(assessReportNarrativeQuality(reportType, text).ok).toBe(true);
    const duplicate = assessReportNarrativeQuality(reportType, text, [text]);
    expect(duplicate.ok).toBe(false);
    expect(duplicate.issues).toContain("与近期报告正文过度相似");
  });

  it("asks for a fresh composition without exposing recent customer reports", () => {
    const prompt = buildNarrativeRepairPrompt("结构化输入", "上一版正文", ["表达重复"]);
    expect(prompt).toContain("不得复制上一版句子");
    expect(prompt).toContain("只有章节标题可以固定");
    expect(prompt).not.toContain("近期报告正文");
  });
});
