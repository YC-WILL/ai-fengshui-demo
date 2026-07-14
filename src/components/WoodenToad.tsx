"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  woodenToadIntensity,
  woodenToadStrengthLabel,
  woodenToadReaction,
  type WoodenToadMood,
  woodenToadVibration,
  woodenToadVolume
} from "@/lib/domain/woodenToad";

type WoodenToadDisplayMood = "neutral" | WoodenToadMood;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export default function WoodenToad() {
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [power, setPower] = useState(0.22);
  const [volume, setVolume] = useState(0.7);
  const [lastStrength, setLastStrength] = useState<string | null>(null);
  const [mood, setMood] = useState<WoodenToadDisplayMood>("neutral");
  const [reply, setReply] = useState<string | null>(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const [struck, setStruck] = useState(false);
  const reactionTimer = useRef<number | null>(null);
  const [hapticsSupported, setHapticsSupported] = useState<boolean | null>(null);
  const holdStartedAt = useRef<number | null>(null);
  const maxPressure = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const powerTimer = useRef<number | null>(null);

  useEffect(() => {
    setHapticsSupported(typeof navigator !== "undefined" && typeof navigator.vibrate === "function");
    return () => {
      if (powerTimer.current) window.clearInterval(powerTimer.current);
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
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
    setPower(woodenToadIntensity(0, pressure));
    setHolding(true);
    setLastStrength(null);
    powerTimer.current = window.setInterval(() => {
      if (holdStartedAt.current != null) {
        setPower(woodenToadIntensity(performance.now() - holdStartedAt.current, maxPressure.current));
      }
    }, 40);
  };

  const updatePressure = (pressure: number, pointerType: string) => {
    const meaningful = pointerType === "pen" || (pointerType === "touch" && pressure !== 0.5);
    if (meaningful) maxPressure.current = Math.max(maxPressure.current, pressure);
  };

  const finishHold = () => {
    if (holdStartedAt.current == null) return;
    const intensity = woodenToadIntensity(
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
      navigator.vibrate(woodenToadVibration(intensity));
    }
    setLastStrength(woodenToadStrengthLabel(intensity));
    const reaction = woodenToadReaction(intensity);
    setMood(reaction.mood);
    setReply(`${reaction.label} · ${reaction.reply}`);
    setStrikeCount(count => count + 1);
    setStruck(true);
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => {
      setStruck(false);
      setMood("neutral");
    }, 1800);
  };

  const playWoodenSound = (intensity: number, masterVolume: number) => {
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = audioContext.current ?? new AudioContextClass();
    audioContext.current = context;
    void context.resume();
    const now = context.currentTime;
    const amplitude = woodenToadVolume(masterVolume, intensity);

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
          <div className="font-serif text-base text-ink">静一静，敲敲木蟾</div>
          <p className="mt-0.5 text-xs text-ink/50">它静静坐在这里，也会认真回应你的每一次轻敲</p>
        </div>
        <button type="button" className="btn-secondary shrink-0" onClick={() => setOpen(true)}>
          敲一下
        </button>
      </div>

      {open && (
        <div className="daily-sign-modal" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !holding) setOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="wooden-toad-title" className="daily-sign-dialog">
            <button
              type="button"
              className="absolute right-4 top-3 text-2xl leading-none text-ink/35 hover:text-ink/70 disabled:opacity-30"
              aria-label="关闭木蟾"
              disabled={holding}
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className="text-center">
              <h2 id="wooden-toad-title" className="font-serif text-2xl text-ink">敲一声，看看它的回应</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">按住静坐的木蟾蓄力，松手轻敲；你的每一种力度，它都会自然回应。</p>

              <button
                type="button"
                className={`wooden-toad-button mood-${mood} ${holding ? "is-holding" : ""} ${struck ? "is-struck" : ""}`}
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
                aria-label="按住蓄力，松手轻敲木蟾"
              >
                <span className="wooden-toad-mallet" aria-hidden="true"><i /></span>
                <span key={`${mood}-${strikeCount}`} className="wooden-toad-sprite" aria-hidden="true" />
                {struck && <span key={`echo-${strikeCount}`} className="wooden-toad-echo" aria-hidden="true" />}
              </button>

              <div className="mt-1 h-6 text-sm font-medium text-cinnabar" aria-live="polite">
                {holding ? `正在蓄力 · ${woodenToadStrengthLabel(power)}` : lastStrength ? `${lastStrength} · 已敲 ${strikeCount} 下` : "按住木蟾，松手听响"}
              </div>
              <div className="mt-1 min-h-6 text-sm text-ink/60" aria-live="polite">
                {reply ?? "轻一点，它缓缓眨眼；稳一些，它随呼吸回应；再深一点，它沉下身又安稳坐好。"}
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
