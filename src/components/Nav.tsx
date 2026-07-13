import Link from "next/link";
import { brand } from "@/lib/config/brand";

const NAV_ITEMS = [
  { href: "/", label: "今日" },
  { href: "/bazi", label: "八字" },
  { href: "/marriage", label: "关系" },
  { href: "/fengshui", label: "住宅" },
  { href: "/date-selection", label: "择日" },
  { href: "/me", label: "我的" }
];

export default function Nav() {
  return (
    <header className="border-b border-mist bg-white/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
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
        <nav className="hidden md:flex items-center gap-1 text-sm text-ink/80">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded hover:bg-mist/60"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <Link href="/legal/disclaimer" className="text-xs text-ink/50 hover:text-ink">
          免责声明
        </Link>
      </div>
      {/* 移动端简化菜单 */}
      <nav className="md:hidden border-t border-mist bg-white/60 px-2 py-1.5 flex overflow-x-auto gap-1 text-xs">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2 py-1 rounded hover:bg-mist whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
