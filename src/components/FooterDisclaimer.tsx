import Link from "next/link";
import { brand } from "@/lib/config/brand";

export default function FooterDisclaimer() {
  return (
    <footer className="border-t border-mist bg-white/60 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-ink/60 leading-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-ink/80">{brand.brandFullName}</span>
          <span className="text-ink/40">· {brand.taglineZh}</span>
        </div>
        <p>
          本站所有报告基于传统历法、民俗文化与心理学框架由 AI 自动生成，
          <strong>{brand.brandDisclaimerShort}</strong>
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-ink/70">
          <Link href="/legal/terms" className="hover:underline">用户协议</Link>
          <Link href="/legal/privacy" className="hover:underline">隐私政策</Link>
          <Link href="/legal/disclaimer" className="hover:underline">AI 内容免责声明</Link>
        </div>
      </div>
    </footer>
  );
}
