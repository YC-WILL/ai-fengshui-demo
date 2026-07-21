"use client";

import { useRouter } from "next/navigation";
import { BirthProfileForm } from "@/components/TodayCorrespondence";
import type { BirthVisual } from "@/lib/domain/birthVisual";
import type { Element } from "@/lib/domain/elements";
import { DEFAULT_BIRTH_TIMEZONE } from "@/lib/domain/birthTimezone";

type VisualData = BirthVisual & {
  hexagram: { number: number; name: string; symbol: string; binary: string };
};

export default function BirthProfileCard({ profile, visual }: {
  profile: {
    birthDate: string | null;
    birthTime: string | null;
    birthLocation: string | null;
    timezone: string | null;
  } | null;
  visual: VisualData | null;
}) {
  const router = useRouter();
  const initial = profile?.birthDate ? {
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    timezone: profile.timezone ?? DEFAULT_BIRTH_TIMEZONE,
    unknownTime: !profile.birthTime
  } : null;

  if (!initial || !visual) {
    return (
      <div id="birth-profile" className="scroll-mt-24">
        <BirthProfileForm initial={initial} context="profile" onSaved={() => router.refresh()} onRemoved={() => router.refresh()} />
      </div>
    );
  }

  return (
    <section id="birth-profile" className="birth-visual-card scroll-mt-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.2em] text-cinnabar">我的生辰</div>
          <h2 className="mt-1 font-serif text-xl">每日卦象与五行结构</h2>
        </div>
        <div className="text-right text-xs leading-5 text-ink/45">{visual.date}<br />{visual.solarTerm}</div>
      </header>

      <div className="mt-4 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <section className="birth-gua-panel" aria-label={`今日卦象，第${visual.hexagram.number}卦${visual.hexagram.name}`}>
          <div className="flex items-center justify-center gap-4">
            <HexagramLines binary={visual.hexagram.binary} />
            <div>
              <div className="font-serif text-3xl text-black" aria-hidden>{visual.hexagram.symbol}</div>
              <div className="mt-1 font-serif text-lg">第{visual.hexagram.number}卦 · {visual.hexagram.name}</div>
              <div className="mt-1 text-xs text-ink/50">{visual.bodyTrigram.name}为体 · {visual.useTrigram.name}为用</div>
            </div>
          </div>
        </section>

        <section className="birth-elements-panel" aria-label="生辰八字五行结构">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-serif text-base">五行结构</h3>
            <span className="text-xs text-ink/45">{visual.pillars.join(" · ")}{visual.hourKnown ? "" : " · 时柱未计"}</span>
          </div>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-ink/10 bg-rice" aria-hidden>
            {visual.elements.filter(item => item.count > 0).map(item => (
              <span key={item.element} className={elementBarClass[item.element]} style={{ width: `${item.ratio * 100}%` }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {visual.elements.map(item => (
              <div key={item.element} className="text-center">
                <span className={`element-dot ${elementDotClass[item.element]}`} aria-hidden />
                <div className="mt-1 text-xs font-medium">{item.element}</div>
                <div className="text-[11px] text-ink/45">{item.count}份</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-mist pt-3">
        <p className="text-[11px] leading-5 text-ink/45">黑色只表示卦爻；五行颜色只表示属性，不表示吉凶。</p>
        <details className="birth-profile-editor">
          <summary className="cursor-pointer text-xs text-cinnabar">修改或清除资料</summary>
          <div className="mt-3 min-w-0 sm:min-w-[36rem]">
            <BirthProfileForm initial={initial} context="profile" onSaved={() => router.refresh()} onRemoved={() => router.refresh()} />
          </div>
        </details>
      </div>

      <details className="mt-2 text-xs text-ink/45">
        <summary className="cursor-pointer">查看卦象口径</summary>
        <p className="mt-2 leading-5">{visual.methodNote}</p>
      </details>
    </section>
  );
}

const elementBarClass: Record<Element, string> = {
  木: "element-bar-wood", 火: "element-bar-fire", 土: "element-bar-earth", 金: "element-bar-metal", 水: "element-bar-water"
};
const elementDotClass: Record<Element, string> = {
  木: "element-dot-wood", 火: "element-dot-fire", 土: "element-dot-earth", 金: "element-dot-metal", 水: "element-dot-water"
};

function HexagramLines({ binary }: { binary: string }) {
  const lines = [...binary].reverse();
  return (
    <div className="hexagram-lines" aria-hidden>
      {lines.map((line, index) => line === "1"
        ? <span key={index} className="hexagram-line-yang" />
        : <span key={index} className="hexagram-line-yin"><i /><i /></span>)}
    </div>
  );
}
