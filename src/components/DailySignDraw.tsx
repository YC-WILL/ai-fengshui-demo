"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  getSignPeriod,
  SIGN_PERIOD_LABEL,
  type SignPeriod
} from "@/lib/domain/dailySign";
import { fetchReport, readJsonResponse } from "@/lib/reports/client";

type DrawPhase = "ready" | "shaking" | "revealed";

interface SavedSign {
  id: string;
  word: string;
  message: string;
  period: SignPeriod;
  periodLabel: string;
  createdAt: string;
}

const STICKS = Array.from({ length: 13 }, (_, index) => index);

export default function DailySignDraw() {
  const [period, setPeriod] = useState<SignPeriod | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DrawPhase>("ready");
  const [sign, setSign] = useState<SavedSign | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = getSignPeriod(new Date());
    setPeriod(current);
    const timer = window.setInterval(() => {
      const next = getSignPeriod(new Date());
      if (next !== current) {
        current = next;
        setPeriod(next);
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase !== "shaking") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, phase]);

  const periodLabel = period ? SIGN_PERIOD_LABEL[period] : "今日安签";

  const openCylinder = () => {
    setSign(null);
    setError(null);
    setPhase("ready");
    setOpen(true);
  };

  const shakeAndDraw = async () => {
    if (phase === "shaking") return;
    const currentPeriod = getSignPeriod(new Date());
    setPeriod(currentPeriod);
    setError(null);
    setPhase("shaking");

    try {
      const [response] = await Promise.all([
        fetchReport("/api/signs/draw", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ period: currentPeriod })
        }),
        new Promise(resolve => window.setTimeout(resolve, 1400))
      ]);
      const payload = await readJsonResponse<{ ok?: boolean; error?: string; data?: SavedSign }>(response, "安签服务");
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "这次没有摇出签，请再试一次");
      if (!payload.data?.id || !payload.data.word || !payload.data.message || !payload.data.periodLabel) {
        throw new Error("安签结果不完整，请再试一次");
      }
      setSign(payload.data);
      setPhase("revealed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "这次没有摇出签，请再试一次");
      setPhase("ready");
    }
  };

  const drawAgain = () => {
    setSign(null);
    setError(null);
    setPhase("ready");
  };

  return (
    <div id="daily-sign">
      <div className="rounded-xl border border-gold/35 bg-white/55 px-5 py-6 text-center shadow-scroll backdrop-blur-sm">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-cinnabar/30 font-serif text-cinnabar">
          安
        </div>
        <div className="font-serif text-xl text-ink">求一支{periodLabel}</div>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/60">
          不用想问题，摇一摇签筒，收下两个字和一句贴心的话。
        </p>
        <button type="button" onClick={openCylinder} className="btn-primary mt-5 min-w-36">
          求签
        </button>
        <p className="mt-3 text-[11px] text-ink/40">随时都能再来一签 · 每支都会保存到“我的”</p>
      </div>

      {open && (
        <div className="daily-sign-modal" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && phase !== "shaking") setOpen(false);
        }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-sign-dialog-title"
            className="daily-sign-dialog"
          >
            <button
              type="button"
              className="absolute right-4 top-3 text-2xl leading-none text-ink/35 hover:text-ink/70 disabled:opacity-30"
              aria-label="关闭求签"
              disabled={phase === "shaking"}
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            {phase !== "revealed" ? (
              <div className="text-center">
                <div id="daily-sign-dialog-title" className="font-serif text-2xl text-ink">
                  摇一摇{periodLabel}
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/55">
                  轻轻点一下签筒，让此刻的心意参与进来。
                </p>

                <button
                  type="button"
                  onClick={shakeAndDraw}
                  disabled={phase === "shaking"}
                  className={`daily-sign-cylinder-button ${phase === "shaking" ? "is-shaking" : ""}`}
                  aria-label={phase === "shaking" ? "正在摇签" : "点击签筒摇一摇"}
                >
                  <span className="daily-sign-sticks" aria-hidden="true">
                    {STICKS.map(index => (
                      <span key={index} style={{ "--stick-index": index } as CSSProperties} />
                    ))}
                  </span>
                  <span className="daily-sign-cylinder" aria-hidden="true">
                    <span>卦安</span>
                  </span>
                </button>

                <div className="mt-2 font-medium text-cinnabar">
                  {phase === "shaking" ? "签声轻响，稍候片刻……" : "点击签筒 · 摇一摇"}
                </div>
                {error && <p className="mt-3 text-sm text-cinnabar">{error}</p>}
                <p className="mt-4 text-[11px] text-ink/40">不限次数 · 不问吉凶 · 每次结果自动保存</p>
              </div>
            ) : sign ? (
              <div className="daily-sign-reveal" role="status" aria-live="polite">
                <div id="daily-sign-dialog-title" className="sr-only">你的{sign.periodLabel}</div>
                <div className="daily-sign-slip">
                  <div className="flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] text-ink/45">
                    <span>卦安</span><span className="text-cinnabar/70">·</span><span>{sign.periodLabel}</span>
                  </div>
                  <div className="daily-sign-word">{sign.word}</div>
                  <div className="mx-auto my-4 h-px w-12 bg-gold/60" />
                  <p className="text-center text-sm leading-7 text-ink/75">{sign.message}</p>
                  <div className="mt-5 flex justify-center">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cinnabar/40 font-serif text-sm text-cinnabar">安</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] leading-5 text-ink/45">
                  已保存到“我的求签” · 这是一份祝愿，不预测事情结果
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>收好</button>
                  <button type="button" className="btn-primary" onClick={drawAgain}>再求一签</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
