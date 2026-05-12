// 首页"付费深度报告说明"区块（非弹窗、纯信息展示）
import Link from "next/link";

const BENEFITS = [
  { title: "更完整的结构分析", desc: "覆盖五行强弱、十神倾向、关系结构、空间动线全章节。" },
  { title: "更具体的风险提示", desc: "针对沟通、财务、健康作息给出克制、可执行的风险提醒。" },
  { title: "可执行行动建议",   desc: "0 元 / 300 元内 / 1000 元内 三档可执行优化方案。" },
  { title: "年度 / 月度节奏参考", desc: "结合传统视角与生活节律给出参考节奏，便于规划。" }
];

export default function PaywallTeaser() {
  return (
    <section className="card border-gold/40">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
        <h3 className="font-serif text-xl">免费报告 / 深度报告</h3>
        <span className="text-xs text-ink/50">免费先看 · 深度报告 mock 支付解锁</span>
      </div>
      <p className="text-sm text-ink/70 leading-7 mb-4">
        免费报告展示核心结构与几条建议；深度报告补充<strong>完整章节</strong>、<strong>风险提示</strong>、
        <strong>个性化解释</strong>与<strong>可执行行动建议</strong>。两种报告都通过同一条安全审查管线，
        不会出现绝对化承诺、灾祸恐吓或医疗/投资替代建议。
      </p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {BENEFITS.map(b => (
          <li key={b.title} className="bg-mist/30 rounded-lg p-3">
            <div className="font-medium text-ink">{b.title}</div>
            <div className="text-xs text-ink/60 mt-1 leading-5">{b.desc}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink/60">
        <Link href="/bazi" className="text-cinnabar hover:underline">八字深度 ¥39</Link>
        <Link href="/marriage" className="text-cinnabar hover:underline">关系匹配 ¥49</Link>
        <Link href="/fengshui" className="text-cinnabar hover:underline">住宅空间 ¥69</Link>
        <Link href="/date-selection" className="text-cinnabar hover:underline">择日深度 ¥29</Link>
        <span className="text-ink/40">当前为 mock 支付，未接入真实通道。</span>
      </div>
    </section>
  );
}
