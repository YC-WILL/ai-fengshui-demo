"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type PlateDeleteState =
  | { phase: "idle"; message: null }
  | { phase: "confirm"; message: null }
  | { phase: "deleting"; message: null }
  | { phase: "error"; message: string };

export const INITIAL_PLATE_DELETE_STATE: PlateDeleteState = {
  phase: "idle",
  message: null
};

export default function PlateRecordActions({
  recordId,
  context
}: {
  recordId: string;
  context: "archive" | "detail";
}) {
  const router = useRouter();
  const [state, setState] = useState<PlateDeleteState>(INITIAL_PLATE_DELETE_STATE);
  const deleting = useRef(false);

  async function remove() {
    if (deleting.current) return;
    deleting.current = true;
    setState({ phase: "deleting", message: null });
    try {
      const response = await fetch(`/api/plate-records/${recordId}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new PlateDeleteResponseError(
          typeof body?.error === "string" && body.error.trim()
            ? body.error.trim()
            : "这条记录暂时没有删除，请稍后重试。"
        );
      }
      if (context === "detail") {
        router.replace("/me");
      }
      router.refresh();
    } catch (error: unknown) {
      setState({
        phase: "error",
        message: error instanceof PlateDeleteResponseError
          ? error.message
          : "网络暂时没有连上，这条记录仍然保留。"
      });
    } finally {
      deleting.current = false;
    }
  }

  if (state.phase === "idle") {
    return (
      <button
        type="button"
        className="plate-record-delete-trigger"
        onClick={() => setState({ phase: "confirm", message: null })}
      >
        删除这条记录
      </button>
    );
  }

  return (
    <div className={`plate-record-delete is-${state.phase}`} aria-live="polite">
      <p>删除后不能在页面中恢复；生辰资料不会因此删除。</p>
      <div>
        <button
          type="button"
          className="plate-record-delete-confirm"
          disabled={state.phase === "deleting"}
          aria-busy={state.phase === "deleting"}
          onClick={remove}
        >
          {state.phase === "deleting" ? "正在删除…" : state.phase === "error" ? "重新尝试删除" : "确认删除"}
        </button>
        <button
          type="button"
          className="plate-record-delete-cancel"
          disabled={state.phase === "deleting"}
          onClick={() => setState(INITIAL_PLATE_DELETE_STATE)}
        >
          取消
        </button>
      </div>
      {state.phase === "error" && <p role="alert">{state.message}</p>}
    </div>
  );
}

class PlateDeleteResponseError extends Error {}
