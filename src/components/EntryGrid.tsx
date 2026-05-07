import Link from "next/link";

const ENTRIES = [
  {
    href: "/bazi",
    title: "八字参考",
    desc: "出生信息 → 五行结构、性格倾向、生活节奏建议",
    accent: "border-cinnabar/30"
  },
  {
    href: "/marriage",
    title: "关系参考",
    desc: "双方信息 → 沟通风格、潜在摩擦、相处建议",
    accent: "border-jade/40"
  },
  {
    href: "/fengshui",
    title: "住宅参考",
    desc: "户型与房间 → 采光通风动线 + 三档优化方案",
    accent: "border-gold/50"
  },
  {
    href: "/date-selection",
    title: "择日参考",
    desc: "事项 + 日期区间 → 推荐日期与现实准备清单",
    accent: "border-ink/30"
  }
];

export default function EntryGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {ENTRIES.map(e => (
        <Link
          key={e.href}
          href={e.href}
          className={`card hover:-translate-y-0.5 hover:shadow transition border-l-4 ${e.accent}`}
        >
          <div className="font-serif text-lg">{e.title}</div>
          <div className="text-xs text-ink/60 mt-1 leading-5">{e.desc}</div>
          <div className="text-cinnabar text-sm mt-3">前往 →</div>
        </Link>
      ))}
    </div>
  );
}
