"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  woodenFishIntensity,
  woodenFishStrengthLabel,
  woodenFishVibration,
  woodenFishVolume
} from "@/lib/domain/woodenFish";

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export default function WoodenFish() {
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [power, setPower] = useState(0.22);
  const [volume, setVolume] = useState(0.7);
  const [lastStrength, setLastStrength] = useState<string | null>(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const [struck, setStruck] = useState(false);
  const [hapticsSupported, setHapticsSupported] = useState<boolean | null>(null);
  const holdStartedAt = useRef<number | null>(null);
  const maxPressure = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const powerTimer = useRef<number | null>(null);

  useEffect(() => {
    setHapticsSupported(typeof navigator !== "undefined" && typeof navigator.vibrate === "function");
    return () => {
      if (powerTimer.current) window.clearInterval(powerTimer.current);
      void audioContext.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !holding) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, holding]);

  const beginHold = (pressure = 0) => {
    if (holding) return;
    holdStartedAt.current = performance.now();
    maxPressure.current = pressure;
    setPower(woodenFishIntensity(0, pressure));
    setHolding(true);
    setLastStrength(null);
    powerTimer.current = window.setInterval(() => {
      if (holdStartedAt.current != null) {
        setPower(woodenFishIntensity(performance.now() - holdStartedAt.current, maxPressure.current));
      }
    }, 40);
  };

  const updatePressure = (pressure: number, pointerType: string) => {
    const meaningful = pointerType === "pen" || (pointerType === "touch" && pressure !== 0.5);
    if (meaningful) maxPressure.current = Math.max(maxPressure.current, pressure);
  };

  const finishHold = () => {
    if (holdStartedAt.current == null) return;
    const intensity = woodenFishIntensity(
      performance.now() - holdStartedAt.current,
      maxPressure.current
    );
    holdStartedAt.current = null;
    if (powerTimer.current) window.clearInterval(powerTimer.current);
    powerTimer.current = null;
    setHolding(false);
    setPower(intensity);
    strike(intensity);
  };

  const cancelHold = () => {
    holdStartedAt.current = null;
    if (powerTimer.current) window.clearInterval(powerTimer.current);
    powerTimer.current = null;
    setHolding(false);
    setPower(0.22);
  };

  const strike = (intensity: number) => {
    playWoodenSound(intensity, volume);
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(woodenFishVibration(intensity));
    }
    setLastStrength(woodenFishStrengthLabel(intensity));
    setStrikeCount(count => count + 1);
    setStruck(false);
    window.requestAnimationFrame(() => {
      setStruck(true);
      window.setTimeout(() => setStruck(false), 220);
    });
  };

  const playWoodenSound = (intensity: number, masterVolume: number) => {
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = audioContext.current ?? new AudioContextClass();
    audioContext.current = context;
    void context.resume();
    const now = context.currentTime;
    const amplitude = woodenFishVolume(masterVolume, intensity);

    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(460 + intensity * 70, now);
    body.frequency.exponentialRampToValueAtTime(260, now + 0.28);
    bodyGain.gain.setValueAtTime(Math.max(0.001, amplitude * 0.42), now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    body.connect(bodyGain).connect(context.destination);
    body.start(now);
    body.stop(now + 0.4);

    const click = context.createOscillator();
    const clickGain = context.createGain();
    click.type = "triangle";
    click.frequency.setValueAtTime(820 + intensity * 140, now);
    clickGain.gain.setValueAtTime(Math.max(0.001, amplitude * 0.2), now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    click.connect(clickGain).connect(context.destination);
    click.start(now);
    click.stop(now + 0.1);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-mist bg-white/45 px-4 py-3">
        <div>
          <div className="font-serif text-base text-ink">静一静，敲敲木鱼</div>
          <p className="mt-0.5 text-xs text-ink/50">听一声清响，把注意力带回此刻</p>
        </div>
        <button type="button" className="btn-secondary shrink-0" onClick={() => setOpen(true)}>
          敲一下
        </button>
      </div>

      {open && (
        <div className="daily-sign-modal" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !holding) setOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="wooden-fish-title" className="daily-sign-dialog">
            <button
              type="button"
              className="absolute right-4 top-3 text-2xl leading-none text-ink/35 hover:text-ink/70 disabled:opacity-30"
              aria-label="关闭木鱼"
              disabled={holding}
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className="text-center">
              <h2 id="wooden-fish-title" className="font-serif text-2xl text-ink">敲一声，静一静</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">按住蓄力，松手敲下；按得越久，声音越有分量。</p>

              <button
                type="button"
                className={`wooden-fish-button ${holding ? "is-holding" : ""} ${struck ? "is-struck" : ""}`}
                style={{ "--wooden-power": power } as CSSProperties}
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  updatePressure(event.pressure, event.pointerType);
                  beginHold(maxPressure.current);
                }}
                onPointerMove={event => updatePressure(event.pressure, event.pointerType)}
                onPointerUp={event => {
                  updatePressure(event.pressure, event.pointerType);
                  finishHold();
                }}
                onPointerCancel={cancelHold}
                onKeyDown={event => {
                  if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                    event.preventDefault();
                    beginHold();
                  }
                }}
                onKeyUp={event => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    finishHold();
                  }
                }}
                aria-label="按住蓄力，松手敲木鱼"
              >
                <span className="wooden-fish-mallet" aria-hidden="true"><i /></span>
                <span className="wooden-fish-body" aria-hidden="true"><i /></span>
              </button>

              <div className="mt-1 h-6 text-sm font-medium text-cinnabar" aria-live="polite">
                {holding ? `正在蓄力 · ${woodenFishStrengthLabel(power)}` : lastStrength ? `${lastStrength} · 已敲 ${strikeCount} 下` : "按住木鱼，松手听响"}
              </div>

              <label className="mx-auto mt-5 block max-w-xs text-left text-xs text-ink/55">
                <span className="mb-2 flex justify-between"><span>基础音量</span><span>{Math.round(volume * 100)}%</span></span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={event => setVolume(Number(event.target.value))}
                  className="w-full accent-cinnabar"
                />
              </label>

              <p className="mt-4 text-[11px] leading-5 text-ink/40">
                {hapticsSupported
                  ? "当前设备支持网页震动，力度越大，震动反馈会更明显。"
                  : "当前设备不支持网页震动，将保留声音和视觉反馈。"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
