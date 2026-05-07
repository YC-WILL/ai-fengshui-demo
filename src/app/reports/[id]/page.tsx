import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { makePreview } from "@/lib/reports/preview";
import {
  REPORT_PRICING, REPORT_TYPE_LABEL,
  type ReportType
} from "@/lib/types";
import ReportRenderer from "@/components/ReportRenderer";
import PaywallCard from "@/components/PaywallCard";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report || report.userId !== userId) notFound();

  const reportType = report.reportType as ReportType;
  const label = REPORT_TYPE_LABEL[reportType];
  const pricing = REPORT_PRICING[reportType];
  const needsPayment = !!pricing && !report.isPaid;
  const blocked = report.status === "blocked";
  const fullText = report.aiResult ?? "";
  const display = blocked
    ? fullText // safety filter 已经替换为安全提示文本
    : (needsPayment ? makePreview(fullText) : fullText);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="font-serif text-2xl">{label}</h1>
        <span className="text-xs text-ink/50">
          报告 ID：{report.id.slice(0, 8)} · 生成于 {report.createdAt.toLocaleString("zh-CN")}
        </span>
        <div className="flex-1" />
        <Link href="/me" className="btn-secondary">我的报告</Link>
      </header>

      {blocked && (
        <div className="card border-cinnabar/40 bg-cinnabar/5 text-cinnabar text-sm">
          本次输出未通过内容安全检查，已停止显示完整内容。请尝试调整描述或更换报告类型。
        </div>
      )}

      <article className="card">
        <ReportRenderer markdown={display} />
      </article>

      {needsPayment && !blocked && (
        <PaywallCard reportId={report.id} reportType={reportType} />
      )}

      <div className="text-xs text-ink/50 leading-5">
        本报告由 AI 自动生成，仅供文化与生活规划参考；
        不构成医疗、法律、投资、婚姻、职业等专业建议。
      </div>
    </div>
  );
}
