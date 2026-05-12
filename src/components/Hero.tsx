import Link from "next/link";
import { brand } from "@/lib/config/brand";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-mist bg-gradient-to-br from-white via-rice to-mist/40 px-6 py-8 md:px-10 md:py-12 shadow-scroll">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-cinnabar/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 bottom-0 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cinnabar/10 text-cinnabar font-serif text-xl"
          >
            卦
          </span>
          <span className="text-xs tracking-[0.3em] uppercase text-ink/50">
            {brand.brandNameEn}
          </span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
          {brand.brandNameZh}
        </h1>
        <div className="font-serif text-lg md:text-xl text-ink/70 mt-1">
          {brand.taglineZh}
        </div>
        <p className="text-sm md:text-base text-ink/70 leading-7 mt-4 max-w-xl">
          {brand.subtitleZh}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/bazi" className="btn-primary">生成我的八字参考</Link>
          <Link href="/#almanac" className="btn-secondary">查看今日黄历</Link>
        </div>

        <div className="text-xs text-ink/45 mt-5 leading-5">
          {brand.brandDisclaimerShort}
        </div>
      </div>
    </section>
  );
}
