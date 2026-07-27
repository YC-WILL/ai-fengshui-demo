"use client";

import Link from "next/link";
import React from "react";
import { useEffect, useReducer, useRef } from "react";

export type SavePlateType = "BAZI" | "RELATION" | "HOME" | "TIMING";

export type PlateSaveState =
  | { phase: "ready"; requestId: null; message: null }
  | { phase: "saving"; requestId: string; message: null }
  | { phase: "success"; requestId: string; message: string }
  | { phase: "error"; requestId: string; message: string };

type PlateSaveEvent =
  | { type: "reset" }
  | { type: "start"; requestId: string }
  | { type: "success" }
  | { type: "error"; message: string };

export const INITIAL_PLATE_SAVE_STATE: PlateSaveState = {
  phase: "ready",
  requestId: null,
  message: null
};

export function plateSaveReducer(
  state: PlateSaveState,
  event: PlateSaveEvent
): PlateSaveState {
  if (event.type === "reset") return INITIAL_PLATE_SAVE_STATE;
  if (event.type === "start") {
    return { phase: "saving", requestId: event.requestId, message: null };
  }
  if (event.type === "success" && state.requestId) {
    return {
      phase: "success",
      requestId: state.requestId,
      message: "这次查看已保存为独立快照"
    };
  }
  if (event.type === "error" && state.requestId) {
    return {
      phase: "error",
      requestId: state.requestId,
      message: event.message
    };
  }
  return state;
}

export function nextPlateSaveRequestId(
  state: PlateSaveState,
  createUuid: () => string
): string | null {
  if (state.phase === "saving" || state.phase === "success") return null;
  return state.phase === "error" ? state.requestId : createUuid();
}

export function buildPlateSavePayload(
  requestId: string,
  plateType: SavePlateType,
  input: Record<string, unknown>
) {
  return { requestId, plateType, input };
}

export function stablePlateSaveKey(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stablePlateSaveKey).sort().join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stablePlateSaveKey(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function PlateSaveControl({
  plateType,
  input,
  resetKey,
  disabled = false,
  disabledReason,
  relationPrivacyNote
}: {
  plateType: SavePlateType;
  input: Record<string, unknown>;
  resetKey: string;
  disabled?: boolean;
  disabledReason?: string;
  relationPrivacyNote?: string;
}) {
  const [state, dispatch] = useReducer(plateSaveReducer, INITIAL_PLATE_SAVE_STATE);
  const currentResetKey = useRef(resetKey);
  const requestInFlight = useRef(false);

  useEffect(() => {
    currentResetKey.current = resetKey;
    requestInFlight.current = false;
    dispatch({ type: "reset" });
  }, [resetKey]);

  async function save() {
    if (disabled || requestInFlight.current) return;
    const requestId = nextPlateSaveRequestId(state, () => crypto.randomUUID());
    if (!requestId) return;

    const intentResetKey = resetKey;
    requestInFlight.current = true;
    dispatch({ type: "start", requestId });

    try {
      const response = await fetch("/api/plate-records", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPlateSavePayload(requestId, plateType, input))
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof body?.error === "string" && body.error.trim()
          ? body.error.trim()
          : "这次查看暂时没有保存成功，请稍后重试。";
        throw new PlateSaveResponseError(message);
      }
      if (currentResetKey.current === intentResetKey) {
        dispatch({ type: "success" });
      }
    } catch (error: unknown) {
      if (currentResetKey.current !== intentResetKey) return;
      dispatch({
        type: "error",
        message: error instanceof PlateSaveResponseError
          ? error.message
          : "网络暂时没有连上，这次查看还没有保存。"
      });
    } finally {
      if (currentResetKey.current === intentResetKey) {
        requestInFlight.current = false;
      }
    }
  }

  const isSaving = state.phase === "saving";
  const isSuccess = state.phase === "success";
  const isDisabled = disabled || isSaving || isSuccess;
  const buttonLabel = isSaving
    ? "正在保存…"
    : isSuccess
      ? "已保存"
      : state.phase === "error"
        ? "重新尝试"
        : "保存这次查看";

  return (
    <section className={`plate-save-control is-${state.phase}`} aria-labelledby={`${plateType.toLowerCase()}-save-title`}>
      <div className="plate-save-copy">
        <span className="section-kicker">保存这次查看</span>
        <h2 id={`${plateType.toLowerCase()}-save-title`}>把此刻的结果留作一份独立快照</h2>
        <p>保存的是此刻输入和计算结果，之后修改不会覆盖它。</p>
        {relationPrivacyNote && <p className="plate-save-privacy">{relationPrivacyNote}</p>}
      </div>
      <div className="plate-save-action">
        <button
          type="button"
          className={isSuccess ? "btn-secondary" : "btn-primary"}
          disabled={isDisabled}
          aria-busy={isSaving}
          onClick={save}
        >
          {buttonLabel}
        </button>
        {disabled && disabledReason && <p className="plate-save-disabled">{disabledReason}</p>}
        <div className="plate-save-feedback" aria-live="polite" aria-atomic="true">
          {state.phase === "success" && <>
            <p>{state.message}</p>
            <Link href="/me">前往我的</Link>
          </>}
          {state.phase === "error" && <p role="alert">{state.message}</p>}
        </div>
      </div>
    </section>
  );
}

class PlateSaveResponseError extends Error {}
