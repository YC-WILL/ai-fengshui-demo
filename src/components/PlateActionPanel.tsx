"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlateActionDetail } from "@/lib/platePresentation";

type ReviewOutcome = "helpful" | "mixed" | "not_helpful";

export interface ReviewIntent {
  requestId: string;
  signature: string;
}

export function normalizeReviewNote(note: string): string | undefined {
  return note.trim() || undefined;
}

export function buildReviewSubmission(
  current: ReviewIntent | null,
  outcome: ReviewOutcome,
  note: string,
  createUuid: () => string
): {
  intent: ReviewIntent;
  payload: { requestId: string; outcome: ReviewOutcome; note?: string };
} {
  const normalizedNote = normalizeReviewNote(note);
  const signature = JSON.stringify({ outcome, note: normalizedNote ?? null });
  const intent = current?.signature === signature
    ? current
    : { requestId: createUuid(), signature };
  return {
    intent,
    payload: {
      requestId: intent.requestId,
      outcome,
      ...(normalizedNote ? { note: normalizedNote } : {})
    }
  };
}

export default function PlateActionPanel({
  snapshotId,
  actionAvailable,
  action
}: {
  snapshotId: string;
  actionAvailable: boolean;
  action: PlateActionDetail | null;
}) {
  const router = useRouter();
  const actionBusy = useRef(false);
  const reviewBusy = useRef(false);
  const reviewIntent = useRef<ReviewIntent | null>(null);
  const [busyKind, setBusyKind] = useState<"create" | "status" | "review" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ReviewOutcome | null>(null);
  const [note, setNote] = useState("");

  async function createAction() {
    if (actionBusy.current) return;
    actionBusy.current = true;
    setBusyKind("create");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/plate-records/${snapshotId}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const body = await safeJson(response);
      if (!response.ok) throw new ActionRequestError(body.error || "现在还不能开始这个行动，请稍后再试。");
      setMessage("行动已开始，并已标记为待进行。");
      router.refresh();
    } catch (requestError: unknown) {
      setError(friendlyError(requestError, "网络暂时没有连上，行动还没有开始。"));
    } finally {
      actionBusy.current = false;
      setBusyKind(null);
    }
  }

  async function updateStatus(status: "pending" | "completed" | "dismissed") {
    if (!action || actionBusy.current) return;
    actionBusy.current = true;
    setBusyKind("status");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/plate-actions/${action.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      });
      const body = await safeJson(response);
      if (!response.ok) throw new ActionRequestError(body.error || "行动状态暂时无法更新。");
      setMessage(status === "completed"
        ? "已标记为完成。"
        : status === "dismissed"
          ? "已标记为暂不进行。"
          : "行动已重新开始。");
      router.refresh();
    } catch (requestError: unknown) {
      setError(friendlyError(requestError, "网络暂时没有连上，原来的行动状态仍然保留。"));
    } finally {
      actionBusy.current = false;
      setBusyKind(null);
    }
  }

  async function submitReview() {
    if (!action || !outcome || reviewBusy.current) return;
    reviewBusy.current = true;
    setBusyKind("review");
    setError(null);
    setMessage(null);
    const submission = buildReviewSubmission(
      reviewIntent.current,
      outcome,
      note,
      () => crypto.randomUUID()
    );
    reviewIntent.current = submission.intent;
    try {
      const response = await fetch(`/api/plate-actions/${action.id}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission.payload)
      });
      const body = await safeJson(response);
      if (!response.ok) throw new ActionRequestError(body.error || "这次复盘暂时没有保存。");
      reviewIntent.current = null;
      setOutcome(null);
      setNote("");
      setMessage("这次复盘已追加到行动记录。");
      router.refresh();
    } catch (requestError: unknown) {
      setError(friendlyError(requestError, "网络暂时没有连上，复盘内容仍保留在这里。"));
    } finally {
      reviewBusy.current = false;
      setBusyKind(null);
    }
  }

  if (!action) {
    if (!actionAvailable) return null;
    return (
      <section className="plate-action-panel is-start" aria-labelledby="plate-action-title">
        <div>
          <span className="section-kicker">行动与复盘</span>
          <h2 id="plate-action-title">把这一步留在记录里</h2>
          <p>只有你明确开始后，它才会成为待进行的行动。</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={createAction}
          disabled={busyKind !== null}
          aria-busy={busyKind === "create"}
        >
          {busyKind === "create" ? "正在开始…" : "开始这个行动"}
        </button>
        <ActionFeedback message={message} error={error} />
      </section>
    );
  }

  if (!action.operable) {
    return (
      <section className="plate-action-panel is-unavailable" role="status">
        <span className="section-kicker">行动与复盘</span>
        <h2>这条行动暂时无法操作</h2>
        <p>行动记录仍然保留，系统不会猜测或改写其中的内容。</p>
      </section>
    );
  }

  return (
    <section className={`plate-action-panel is-${action.status}`} aria-labelledby="plate-action-title">
      <header>
        <div>
          <span className="section-kicker">行动与复盘</span>
          <h2 id="plate-action-title">{action.statusLabel}</h2>
        </div>
        <span className="plate-action-status">{action.statusLabel}</span>
      </header>

      <div className="plate-action-copy">
        {action.sourceDate && <small>对应当时选中的日期：{action.sourceDate}</small>}
        {action.durationMinutes && <b>{action.durationMinutes} 分钟内可以开始</b>}
        <p>{action.text}</p>
        {action.doneWhen && <div><span>完成标准</span><p>{action.doneWhen}</p></div>}
        {action.requiresProfessional && (
          <aside>
            涉及安全问题时，应暂停相关使用并交由物业或合格专业人员处理，不自行拆改。
          </aside>
        )}
      </div>

      {action.status === "pending" && (
        <div className="plate-action-controls">
          <button
            type="button"
            className="btn-primary"
            onClick={() => updateStatus("completed")}
            disabled={busyKind !== null}
            aria-busy={busyKind === "status"}
          >
            {busyKind === "status" ? "正在更新…" : "标记为已完成"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => updateStatus("dismissed")}
            disabled={busyKind !== null}
            aria-busy={busyKind === "status"}
          >
            暂不进行
          </button>
        </div>
      )}

      {action.status === "completed" && (
        <>
          {action.completedAt && <p className="plate-action-completed-at">完成于 {action.completedAt}（中国标准时间）</p>}
          <button
            type="button"
            className="plate-action-restart"
            onClick={() => updateStatus("pending")}
            disabled={busyKind !== null}
            aria-busy={busyKind === "status"}
          >
            重新开始
          </button>
          <ReviewHistory reviews={action.reviews} />
          <div className="plate-review-form">
            <fieldset>
              <legend>这个行动对你有帮助吗？</legend>
              <div>
                {([
                  ["helpful", "有帮助"],
                  ["mixed", "有一点"],
                  ["not_helpful", "暂时没帮助"]
                ] as const).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="plate-review-outcome"
                      value={value}
                      checked={outcome === value}
                      onChange={() => setOutcome(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="plate-review-note">
              <span>补充一句（可选）</span>
              <textarea
                value={note}
                maxLength={300}
                onChange={event => setNote(event.target.value)}
                placeholder="写下这次实际感受即可"
              />
              <small>{note.length} / 300</small>
            </label>
            <button
              type="button"
              className="btn-secondary"
              onClick={submitReview}
              disabled={!outcome || busyKind !== null}
              aria-busy={busyKind === "review"}
            >
              {busyKind === "review" ? "正在保存复盘…" : "保存这次复盘"}
            </button>
          </div>
        </>
      )}

      {action.status === "dismissed" && (
        <div className="plate-action-dismissed">
          <p>这不是失败，只表示现在不准备继续。</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => updateStatus("pending")}
            disabled={busyKind !== null}
            aria-busy={busyKind === "status"}
          >
            {busyKind === "status" ? "正在更新…" : "重新开始"}
          </button>
        </div>
      )}

      <ActionFeedback message={message} error={error} />
    </section>
  );
}

function ReviewHistory({ reviews }: { reviews: PlateActionDetail["reviews"] }) {
  if (reviews.length === 0) return <p className="plate-review-empty">还没有复盘；完成行动后，可以只留下一句真实感受。</p>;
  return (
    <section className="plate-review-history" aria-labelledby="plate-review-history-title">
      <h3 id="plate-review-history-title">已有复盘</h3>
      <ol>
        {reviews.map((review, index) => (
          <li key={`${review.createdAtIso}-${index}`}>
            <b>{review.outcome}</b>
            {review.note && <p>{review.note}</p>}
            <time dateTime={review.createdAtIso}>{review.createdAt}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ActionFeedback({ message, error }: { message: string | null; error: string | null }) {
  return (
    <div className={`plate-action-feedback${error ? " is-error" : ""}`} aria-live="polite">
      {error ?? message}
    </div>
  );
}

async function safeJson(response: Response): Promise<{ error?: string }> {
  try {
    return await response.json() as { error?: string };
  } catch {
    return {};
  }
}

function friendlyError(error: unknown, fallback: string): string {
  return error instanceof ActionRequestError ? error.message : fallback;
}

class ActionRequestError extends Error {}
