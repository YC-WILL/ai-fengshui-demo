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
  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">我的 · {brand.brandFullName}</h1>
        <p className="text-sm text-ink/60">
          匿名 ID：{user.id.slice(0, 8)} · 邮箱：{user.email ?? "（未绑定）"}
        </p>
      </header>

      <MeActions email={user.email} nickname={user.nickname} />

      {membership.active ? (
        <section className="card border-jade/30 bg-jade/5">
          <h3 className="font-serif text-lg mb-1">卦安常伴会员</h3>
          <p className="text-sm text-ink/70">
            当前为{membership.plan === "annual" ? "年度" : "月度"}常伴会员，有效期至 {new Date(membership.expiresAt!).toLocaleDateString("zh-CN")}。
          </p>
        </section>
      ) : <MembershipCard />}

      <section className="card">
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
                  {r.createdAt.toLocaleString("zh-CN")}
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
