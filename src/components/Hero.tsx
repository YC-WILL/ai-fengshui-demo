import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/config/brand";
import DailySignDraw from "@/components/DailySignDraw";
import WoodenToad from "@/components/WoodenToad";

const COMFORT_LINES = [
  "不必急着把一切想明白，先把眼前这一小步走稳。",
  "看不清方向的时候，就停一停，答案会慢慢浮现。",
  "日子偶有纷乱，我们陪你把心里的线头轻轻理顺。"
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-mist bg-gradient-to-br from-white via-rice to-mist/40 px-6 py-8 md:px-10 md:py-12 shadow-scroll">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-cinnabar/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 bottom-0 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src={brand.logoPath}
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="text-xs tracking-[0.3em] uppercase text-ink/50">
              {brand.brandNameEn}
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
            {brand.brandNameZh}
          </h1>
          <div className="font-serif text-lg md:text-xl text-ink/70 mt-1">
            心里有事，我们慢慢聊
          </div>
          <div
            className="hero-comfort mt-4 max-w-xl"
            aria-label={COMFORT_LINES.join(" ")}
          >
            {COMFORT_LINES.map((line) => (
              <p key={line} aria-hidden="true" className="hero-comfort-line">
                {line}
              </p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/bazi" className="btn-primary">陪我看看自己</Link>
            <Link href="/#almanac" className="btn-secondary">看看今天怎么过</Link>
          </div>

          <div className="text-xs text-ink/45 mt-5 leading-5">
            {brand.brandDisclaimerShort}
          </div>
        </div>

        <div className="space-y-3">
          <DailySignDraw />
          <WoodenToad />
        </div>
      </div>
    </section>
  );
}
