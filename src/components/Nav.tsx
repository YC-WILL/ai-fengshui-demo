import Link from "next/link";
import { brand } from "@/lib/config/brand";

export default function Nav() {
  return (
    <header className="border-b border-mist bg-white/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
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
        <nav aria-label="账户">
          <Link
            href="/me"
            className="inline-flex items-center rounded-full border border-mist bg-white/65 px-4 py-1.5 text-sm text-ink/75 transition hover:border-gold/45 hover:bg-rice"
          >
            我的
          </Link>
        </nav>
      </div>
    </header>
  );
}
