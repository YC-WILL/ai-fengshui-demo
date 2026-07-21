import Link from "next/link";
import { METHOD_MODULES } from "@/lib/product/methodUi";

export default function MethodEntryGrid() {
  return (
    <section aria-labelledby="method-entry-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="section-kicker">卦安四盘</div>
          <h2 id="method-entry-title" className="mt-1 font-serif text-2xl">从现在想看的方向进入</h2>
        </div>
        <span className="hidden text-xs text-ink/45 sm:block">各自成盘 · 可以保存 · 持续更新</span>
      </div>
      <div className="method-entry-grid">
        {METHOD_MODULES.map((module, index) => (
          <Link key={module.id} href={module.href} className="method-entry-card group">
            <div className="flex items-start justify-between gap-3">
              <span className="method-entry-index">0{index + 1}</span>
              <span className="text-[11px] tracking-[0.18em] text-cinnabar">{module.eyebrow}</span>
            </div>
            <div>
              <h3 className="font-serif text-2xl">{module.title}</h3>
              <p className="mt-1 text-sm text-ink/60">{module.subtitle}</p>
            </div>
            <p className="text-xs leading-6 text-ink/55">{module.description}</p>
            <div className="flex items-center justify-between border-t border-mist pt-3 text-xs">
              <span className="text-ink/45">{module.basis}</span>
              <span className="text-cinnabar transition group-hover:translate-x-1">入盘 →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
