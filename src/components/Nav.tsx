import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { METHOD_MODULES } from "@/lib/product/methodUi";

export default function Nav() {
  return (
    <header className="border-b border-mist bg-white/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="font-serif text-lg text-ink flex items-center gap-2 group">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-cinnabar/10 text-cinnabar text-sm group-hover:bg-cinnabar/20 transition"
          >
            卦
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-semibold tracking-wide">{brand.brandNameZh}</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/40">
              {brand.brandNameEn} · {brand.taglineZh}
            </span>
          </span>
        </Link>
        <div className="flex-1" />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="主要功能">
          <Link href="/" className="nav-method-link">首页</Link>
          {METHOD_MODULES.map(module => <Link key={module.id} href={module.href} className="nav-method-link">{module.title}</Link>)}
        </nav>
        <nav aria-label="账户">
          <Link
            href="/me"
            className="inline-flex items-center rounded-full border border-mist bg-white/65 px-4 py-1.5 text-sm text-ink/75 transition hover:border-gold/45 hover:bg-rice"
          >
            我的
          </Link>
        </nav>
      </div>
      <nav className="nav-mobile-methods lg:hidden" aria-label="主要功能">
        <Link href="/">首页</Link>
        {METHOD_MODULES.map(module => <Link key={module.id} href={module.href}>{module.title}</Link>)}
      </nav>
    </header>
  );
}
