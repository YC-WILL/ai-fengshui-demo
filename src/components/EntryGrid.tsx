import Link from "next/link";
import { ENTRY_INTRO } from "@/lib/config/brand";

const ENTRIES = [
  { href: "/bazi",           accent: "border-cinnabar/30", key: "bazi" as const },
  { href: "/marriage",       accent: "border-jade/40",     key: "marriage" as const },
  { href: "/fengshui",       accent: "border-gold/50",     key: "fengshui" as const },
  { href: "/date-selection", accent: "border-ink/30",      key: "date-selection" as const }
];

export default function EntryGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {ENTRIES.map(e => {
        const intro = ENTRY_INTRO[e.key];
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`card hover:-translate-y-0.5 hover:shadow transition border-l-4 ${e.accent}`}
          >
            <div className="font-serif text-lg">{intro.title}</div>
            <div className="text-xs text-ink/60 mt-1 leading-5">{intro.desc}</div>
            <div className="text-cinnabar text-sm mt-3">前往 →</div>
          </Link>
        );
      })}
    </div>
  );
}
