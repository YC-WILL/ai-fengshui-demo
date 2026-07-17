import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { makePreview } from "@/lib/reports/preview";
import {
  isMemberReportType, type ReportType
} from "@/lib/types";
import { getMembershipStatus } from "@/lib/membership";
import { PAGE_TITLE, brand } from "@/lib/config/brand";
import ReportRenderer from "@/components/ReportRenderer";
import MembershipCard from "@/components/MembershipCard";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.userId !== userId) notFound();

  const reportType = report.reportType as ReportType;
  const label = PAGE_TITLE[reportType];
  const membership = getMembershipStatus();
  const needsMembership = isMemberReportType(reportType) && !membership.active && !report.isPaid;
  const blocked = report.status === "blocked";
  const pending = report.status === "draft";
  const failed = report.status === "failed";
  const fullText = report.aiResult ?? "";
  const display = blocked
    ? fullText // safety filter 已经替换为安全提示文本
    : (needsMembership ? makePreview(fullText) : fullText);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-serif text-2xl">{label}</h1>
        {needsMembership && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/15 text-ink/70 border border-gold/30">
            会员内容 · 当前展示预览
          </span>
        )}
        {isMemberReportType(reportType) && membership.active && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-jade/15 text-jade border border-jade/30">
            卦安常伴会员
          </span>
        )}
        <span className="text-xs text-ink/50">
          报告 ID：{report.id.slice(0, 8)} · 生成于 {report.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
        </span>
        <div className="flex-1" />
        <Link href="/me" className="btn-secondary">我的报告</Link>
      </header>

      {blocked && (
        <div className="card border-cinnabar/40 bg-cinnabar/5 text-cinnabar text-sm">
          本次输出未通过内容安全检查，已停止显示完整内容。请尝试调整描述或更换报告类型。
        </div>
      )}

      {(pending || failed) && (
        <section className="card border-gold/40 bg-gold/5">
          <h2 className="font-serif text-lg">{pending ? "报告还在整理中" : "这次没有完成生成"}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {pending
              ? "后台可能仍在处理。请稍等片刻后刷新；如果超过 60 秒，请回到首页重试，已填写的内容不会因为这次等待而改变。"
              : "这次生成没有完成。你可以回到入口重新提交，或先去‘我的’查看是否已经留下可读版本。"}
          </p>
          <div className="mt-3 flex gap-2">
            <Link href={`/reports/${report.id}`} className="btn-secondary">刷新本页</Link>
            <Link href="/" className="btn-primary">回到入口</Link>
          </div>
        </section>
      )}

      {!pending && !failed && <article className="card"><ReportRenderer markdown={display} /></article>}

      {needsMembership && !blocked && (
        <MembershipCard />
      )}

      <div className="text-xs text-ink/50 leading-5">
        本报告已通过 {brand.brandFullName} 内容安全规则审查；如涉及健康、法律、投资、婚姻等重要事项，请咨询相应专业人士。
      </div>
    </div>
  );
}
