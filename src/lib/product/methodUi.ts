export const METHOD_MODULES = [
  {
    id: "bazi",
    href: "/bazi",
    eyebrow: "识己",
    title: "八字盘",
    subtitle: "我想看清自己的做事方式",
    description: "从开始一件事、面对压力和与人协作三个场景进入，再查看生辰盘里的具体依据。",
    basis: "四柱 · 日主 · 五行"
  },
  {
    id: "relation",
    href: "/marriage",
    eyebrow: "观合",
    title: "关系盘",
    subtitle: "我想理清两个人怎样相处",
    description: "看看你们在沟通、分歧和一起做事时可能怎样回应，再核对双方日柱依据。",
    basis: "日柱 · 生克 · 合冲"
  },
  {
    id: "home",
    href: "/fengshui",
    eyebrow: "安居",
    title: "宅居盘",
    subtitle: "我想先处理家里的实际困扰",
    description: "从入户、主要休息区与厨房的实际情况开始，先处理安全、长期居住条件与日常动线。",
    basis: "安全 · 居住条件 · 动线"
  },
  {
    id: "timing",
    href: "/date-selection",
    eyebrow: "择时",
    title: "择时盘",
    subtitle: "我想为一件事比较几个日期",
    description: "先选事项和时间范围，得到少量候选日、筛选依据与现实准备清单。",
    basis: "事项 · 历法 · 生辰"
  }
] as const;
export const RELATION_DIMENSIONS = [
  { id: "communication", label: "沟通", basis: "日干 · 十神位置" },
  { id: "cooperation", label: "共同推进", basis: "五行 · 生克流向" },
  { id: "rhythm", label: "日常节奏", basis: "日支 · 合冲刑害" },
  { id: "boundary", label: "边界", basis: "位置 · 作用方向" }
] as const;

export const DATE_EVENTS = [
  { id: "wedding", label: "婚礼" },
  { id: "moving", label: "搬家" },
  { id: "opening", label: "开业" },
  { id: "signing", label: "签约" },
  { id: "travel", label: "出行" },
  { id: "renovation_start", label: "动工" }
] as const;
