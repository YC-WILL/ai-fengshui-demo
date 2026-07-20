import Link from "next/link";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/config/brand";
import MeActions from "./MeActions";
import DeleteAccountButton from "./DeleteAccountButton";
import BirthProfileCard from "./BirthProfileCard";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getOrCreateUser();
  const signRecords = await prisma.report.findMany({
    where: { userId: user.id, reportType: "daily_sign" },
    orderBy: { createdAt: "desc" },
    select: { id: true, aiResult: true, createdAt: true }
  });
  const signs = signRecords.flatMap(record => {
    const snapshot = parseSignSnapshot(record.aiResult);
    return snapshot ? [{ ...record, ...snapshot }] : [];
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">我的 · {brand.brandFullName}</h1>
        <p className="text-sm text-ink/60">
          匿名 ID：{user.id.slice(0, 8)} · 邮箱：{user.email ?? "（未绑定）"}
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="我的内容">
        <Link href="#birth-profile" className="btn-secondary">我的生辰</Link>
        <Link href="#signs" className="btn-secondary">我的求签</Link>
      </nav>

      <BirthProfileCard profile={user.profile ? {
        birthDate: user.profile.birthDate,
        birthTime: user.profile.birthTime,
        birthLocation: user.profile.birthLocation
      } : null} />

      <MeActions email={user.email} nickname={user.nickname} />

      <section id="signs" className="card scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg">我的求签</h3>
            <p className="mt-1 text-xs text-ink/50">每一次求得的安签都会留在这里，按时间倒序保存。</p>
          </div>
          <Link href="/#daily-sign" className="text-sm text-cinnabar hover:underline">再求一签 →</Link>
        </div>
        {signs.length === 0 ? (
          <div className="text-sm text-ink/60">
            还没有求过安签。<Link href="/#daily-sign" className="text-cinnabar">现在去摇一摇</Link>。
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {signs.map(sign => (
              <li key={sign.id} className="rounded-xl border border-gold/35 bg-rice/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-serif text-2xl tracking-[0.18em] text-cinnabar">{sign.word}</span>
                  <span className="text-xs text-ink/45">{sign.periodLabel}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/75">{sign.message}</p>
                <time className="mt-3 block text-xs text-ink/45" dateTime={sign.createdAt.toISOString()}>
                  {sign.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card border-cinnabar/30">
        <h3 className="font-serif text-lg mb-2 text-cinnabar">数据与隐私</h3>
        <p className="text-sm text-ink/70 mb-3">
          您可以随时删除账户资料、生辰资料、求签记录及其他关联数据。删除后账户与数据将无法恢复。
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}

function parseSignSnapshot(value: string | null): {
  word: string;
  message: string;
  periodLabel: string;
} | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      typeof parsed.word === "string" &&
      typeof parsed.message === "string" &&
      typeof parsed.periodLabel === "string"
    ) {
      return { word: parsed.word, message: parsed.message, periodLabel: parsed.periodLabel };
    }
  } catch {
    return null;
  }
  return null;
}
