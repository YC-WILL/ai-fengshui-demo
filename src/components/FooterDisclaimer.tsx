import Link from "next/link";

export default function FooterDisclaimer() {
  return (
    <footer className="border-t border-mist bg-white/60 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-ink/60 leading-6">
        <div className="font-medium text-ink/80 mb-1">关于内容性质</div>
        <p>
          本站所有报告基于传统历法、民俗文化与心理学框架由 AI 自动生成，
          <strong>仅供文化参考、娱乐参考与生活规划启发</strong>，
          不构成医疗、法律、投资、婚姻、职业等任何专业决策建议。
        </p>
        <div className="mt-3 flex gap-4 text-ink/70">
          <Link href="/legal/terms" className="hover:underline">用户协议</Link>
          <Link href="/legal/privacy" className="hover:underline">隐私政策</Link>
          <Link href="/legal/disclaimer" className="hover:underline">AI 内容免责声明</Link>
        </div>
      </div>
    </footer>
  );
}
