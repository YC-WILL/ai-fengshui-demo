"use client";

import { useEffect, useState } from "react";
import {
  getSignCandidates,
  getSignDateKey,
  getSignPeriod,
  SIGN_PERIOD_LABEL,
  type DailySign,
  type SignPeriod
} from "@/lib/domain/dailySign";

const STORAGE_PREFIX = "guaan.daily-sign";
const HISTORY_LIMIT = 24;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式或禁用本地存储时仍允许本次求签，只是不跨刷新保留。
  }
}

function randomIndex(length: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % length;
  }
  return Math.floor(Math.random() * length);
}

function findCandidate(period: SignPeriod, id: string | null): DailySign | null {
  if (!id) return null;
  return getSignCandidates(period).find(candidate => candidate.id === id) ?? null;
}

function drawForPeriod(period: SignPeriod, now: Date): DailySign {
  const candidates = getSignCandidates(period);
  const dateKey = getSignDateKey(now);
  const resultKey = `${STORAGE_PREFIX}.${dateKey}.${period}`;
  const existing = findCandidate(period, readStorage(resultKey));
  if (existing) return existing;

  const historyKey = `${STORAGE_PREFIX}.history.${period}`;
  let history: string[] = [];
  try {
    const parsed = JSON.parse(readStorage(historyKey) ?? "[]");
    history = Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    history = [];
  }

  const recentWords = new Set(
    history.slice(0, 6).map(id => findCandidate(period, id)?.word).filter(Boolean)
  );
  let available = candidates.filter(candidate =>
    !history.includes(candidate.id) && !recentWords.has(candidate.word)
  );
  if (available.length === 0) {
    available = candidates.filter(candidate => !history.includes(candidate.id));
  }
  if (available.length === 0) available = candidates;

  const selected = available[randomIndex(available.length)];
  writeStorage(resultKey, selected.id);
  writeStorage(
    historyKey,
    JSON.stringify([selected.id, ...history.filter(id => id !== selected.id)].slice(0, HISTORY_LIMIT))
  );
  return selected;
}

export default function DailySignDraw() {
  const [period, setPeriod] = useState<SignPeriod | null>(null);
  const [sign, setSign] = useState<DailySign | null>(null);

  useEffect(() => {
    let current = getSignPeriod(new Date());
    setPeriod(current);
    const timer = window.setInterval(() => {
      const next = getSignPeriod(new Date());
      if (next !== current) {
        current = next;
        setPeriod(next);
        setSign(null);
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleDraw = () => {
    const now = new Date();
    const currentPeriod = getSignPeriod(now);
    setPeriod(currentPeriod);
    setSign(drawForPeriod(currentPeriod, now));
  };

  const periodLabel = period ? SIGN_PERIOD_LABEL[period] : "今日安签";

  if (sign) {
    return (
      <div className="daily-sign-reveal" role="status" aria-live="polite">
        <div className="daily-sign-slip">
          <div className="flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] text-ink/45">
            <span>卦安</span><span className="text-cinnabar/70">·</span><span>{periodLabel}</span>
          </div>
          <div className="daily-sign-word">{sign.word}</div>
          <div className="mx-auto my-4 h-px w-12 bg-gold/60" />
          <p className="text-sm leading-7 text-ink/75 text-center">{sign.message}</p>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cinnabar/40 font-serif text-sm text-cinnabar">
              安
            </span>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-ink/45">
          这是一份今日祝愿，不预测吉凶或事情结果
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/35 bg-white/55 px-5 py-6 text-center shadow-scroll backdrop-blur-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-cinnabar/30 font-serif text-cinnabar">
        安
      </div>
      <div className="font-serif text-xl text-ink">求一支{periodLabel}</div>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/60">
        不用想问题，轻轻一点，收下两个字和一句贴心的话。
      </p>
      <button type="button" onClick={handleDraw} className="btn-primary mt-5 min-w-36">
        求签
      </button>
      <p className="mt-3 text-[11px] text-ink/40">不问吉凶，只给今天一个温柔的落点</p>
    </div>
  );
}
