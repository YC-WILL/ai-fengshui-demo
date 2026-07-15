import Link from "next/link";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { type ReportType } from "@/lib/types";
import { PAGE_TITLE, brand } from "@/lib/config/brand";
import MeActions from "./MeActions";
import DeleteAccountButton from "./DeleteAccountButton";
import MembershipCard from "@/components/MembershipCard";
import { getMembershipStatus } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getOrCreateUser();
  const membership = getMembershipStatus();
  const [reports, signRecords] = await Promise.all([
    prisma.report.findMany({
      where: { userId: user.id, NOT: { reportType: "daily_sign" } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.report.findMany({
      where: { userId: user.id, reportType: "daily_sign" },
      orderBy: { createdAt: "desc" },
      select: { id: true, aiResult: true, createdAt: true }
    })
  ]);
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
        <Link href="#reports" className="btn-secondary">我的报告</Link>
        <Link href="#signs" className="btn-secondary">我的求签</Link>
      </nav>

      <MeActions email={user.email} nickname={user.nickname} />

      {membership.active ? (
        <section className="card border-jade/30 bg-jade/5">
          <h3 className="font-serif text-lg mb-1">卦安常伴会员</h3>
          <p className="text-sm text-ink/70">
            当前为{membership.plan === "annual" ? "年度" : "月度"}常伴会员，有效期至 {new Date(membership.expiresAt!).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}。
          </p>
        </section>
      ) : <MembershipCard />}

      <section id="reports" className="card scroll-mt-24">
        <h3 className="font-serif text-lg mb-2">我的报告</h3>
        {reports.length === 0 ? (
          <div className="text-sm text-ink/60">还没有生成报告。<Link href="/" className="text-cinnabar">回首页</Link>。</div>
        ) : (
          <ul className="divide-y divide-mist">
            {reports.map(r => (
              <li key={r.id} className="py-2 flex items-center gap-3">
                <Link href={`/reports/${r.id}`} className="font-medium hover:underline">
                  {PAGE_TITLE[r.reportType as ReportType] ?? r.reportType}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded ${badgeColor(r.status)}`}>
                  {statusLabel(r.status)}
                </span>
                <span className="text-xs text-ink/50">
                  {r.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
          您可以随时删除您的所有报告、求签记录、订单与个人信息。删除后账户与数据将无法恢复。
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

function statusLabel(s: string) {
  return ({
    draft: "草稿",
    generated: "已生成",
    blocked: "已拦截",
    paid: "已解锁",
    failed: "失败"
  } as Record<string, string>)[s] ?? s;
}
function badgeColor(s: string) {
  return ({
    draft: "bg-mist text-ink/60",
    generated: "bg-jade/20 text-jade",
    blocked: "bg-cinnabar/15 text-cinnabar",
    paid: "bg-gold/20 text-ink",
    failed: "bg-cinnabar/15 text-cinnabar"
  } as Record<string, string>)[s] ?? "bg-mist";
}
