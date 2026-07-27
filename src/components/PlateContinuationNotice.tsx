import Link from "next/link";

export default function PlateContinuationNotice({
  sourceId,
  message,
  warning
}: {
  sourceId: string;
  message: string;
  warning?: string | null;
}) {
  return (
    <aside className="plate-continuation-notice" aria-label="从历史记录继续">
      <div className="plate-continuation-mark" aria-hidden>续</div>
      <div>
        <span className="section-kicker">从历史记录继续</span>
        <h2>这一次使用现行规则重新查看</h2>
        <p>{message}</p>
        <ul>
          <li>原记录不会被修改</li>
          <li>新结果需要再次明确点击保存</li>
        </ul>
        {warning && <p className="plate-continuation-warning" role="status">{warning}</p>}
        <Link href={`/plate-records/${sourceId}`}>返回历史快照</Link>
      </div>
    </aside>
  );
}
