import Link from "next/link";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { REPORT_TYPE_LABEL, type ReportType } from "@/lib/types";
import MeActions from "./MeActions";
import DeleteAccountButton from "./DeleteAccountButton";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getOrCreateUser();
  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">我的</h1>
        <p className="text-sm text-ink/60">
          匿名 ID：{user.id.slice(0, 8)} · 邮箱：{user.email ?? "（未绑定）"}
        </p>
      </header>

      <MeActions email={user.email} nickname={user.nickname} />

      <section className="card">
        <h3 className="font-serif text-lg mb-2">我的报告</h3>
        {reports.length === 0 ? (
          <div className="text-sm text-ink/60">还没有生成报告。<Link href="/" className="text-cinnabar">回首页</Link>。</div>
        ) : (
          <ul className="divide-y divide-mist">
            {reports.map(r => (
              <li key={r.id} className="py-2 flex items-center gap-3">
                <Link href={`/reports/${r.id}`} className="font-medium hover:underline">
                  {REPORT_TYPE_LABEL[r.reportType as ReportType] ?? r.reportType}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded ${badgeColor(r.status)}`}>
                  {statusLabel(r.status)}
                </span>
                <span className="text-xs text-ink/50">
                  {r.createdAt.toLocaleString("zh-CN")}
                </span>
                {r.isPaid && <span className="text-xs text-jade">已解锁</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="font-serif text-lg mb-2">订单记录</h3>
        {payments.length === 0 ? (
          <div className="text-sm text-ink/60">暂无订单。</div>
        ) : (
          <ul className="divide-y divide-mist text-sm">
            {payments.map(p => (
              <li key={p.id} className="py-2 flex items-center gap-3">
                <span>¥{(p.amount / 100).toFixed(2)}</span>
                <span className="text-xs text-ink/60">{p.provider}</span>
                <span className="text-xs">{p.status}</span>
                <span className="text-xs text-ink/50 ml-auto">
                  {p.createdAt.toLocaleString("zh-CN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card border-cinnabar/30">
        <h3 className="font-serif text-lg mb-2 text-cinnabar">数据与隐私</h3>
        <p className="text-sm text-ink/70 mb-3">
          您可以随时删除您的所有报告、订单与个人信息。删除后账户与数据将无法恢复。
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
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
