import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { loadPlateSnapshotDetail } from "@/lib/platePresentation";
import PlateSnapshotDetail from "@/components/PlateSnapshotDetail";
import PlateRecordActions from "@/app/me/PlateRecordActions";
import { loadPlateContinuation } from "@/lib/plateContinuation";

export const dynamic = "force-dynamic";

export default async function PlateRecordPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) notFound();
  const detail = await loadPlateSnapshotDetail(userId, params.id);
  if (!detail) notFound();
  const continuation = await loadPlateContinuation(userId, params.id, detail.plateType);

  return (
    <div className="plate-record-page space-y-5">
      <header className="plate-record-hero">
        <div>
          <Link href="/me">← 返回我的</Link>
          <span>当时结果 · {detail.typeTitle}</span>
          <h1>{detail.savedAt}</h1>
          <p>这是保存当时的结果，之后的规则优化不会改写它。</p>
        </div>
        <div className="plate-record-hero-meta">
          <span>记录 {detail.idShort}</span>
          <time dateTime={detail.savedAtIso}>{detail.savedAt}</time>
          <b>{detail.displayable ? "结构化快照" : "有限展示"}</b>
        </div>
      </header>

      <PlateSnapshotDetail
        detail={detail}
        continuationSupported={detail.displayable && continuation !== null}
      />

      <details className="plate-record-basis">
        <summary>查看记录依据</summary>
        <div>
          <p><b>记录格式</b>{detail.protocolLabel}</p>
          <p><b>计算依据</b>{detail.engineLabel}</p>
          {detail.resultDate && <p><b>结果对应日期</b>{detail.resultDate}</p>}
        </div>
      </details>

      <section className="plate-record-footer-actions">
        <Link href="/me" className="btn-primary">返回我的</Link>
        <PlateRecordActions recordId={detail.id} context="detail" />
      </section>
    </div>
  );
}
