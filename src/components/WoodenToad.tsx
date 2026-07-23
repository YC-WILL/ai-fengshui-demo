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
import { MeditatingToadArt, ToadMalletArt } from "@/components/MeditatingToadArt";
import { preloadImages } from "@/lib/client/imagePreload";

type WoodenToadDisplayMood = "neutral" | WoodenToadMood;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const WOODEN_TOAD_ASSETS = [
  "/assets/meditating-toad-reference.png",
  "/assets/toad-snack-plate.png"
] as const;

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
    void preloadImages(WOODEN_TOAD_ASSETS);
    return () => {
      if (powerTimer.current) window.clearInterval(powerTimer.current);
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
      void audioContext.current?.close();
    };
  }, []);

  const openToad = async () => {
    await preloadImages(WOODEN_TOAD_ASSETS);
    setOpen(true);
  };

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
      <div className="wooden-toad-entry">
        <div className="wooden-toad-entry-mark" aria-hidden>静</div>
        <div className="min-w-0 flex-1">
          <span className="wooden-toad-entry-kicker">安定动作</span>
          <div className="font-serif text-base text-ink">静一静，敲敲木蟾</div>
          <p className="mt-0.5 text-xs text-ink/50">它静静坐在这里，也会认真回应你的每一次轻敲</p>
        </div>
        <button type="button" className="wooden-toad-entry-action" onClick={openToad}>
          敲一下
        </button>
      </div>

      {open && (
        <div className="daily-sign-modal" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !holding) setOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="wooden-toad-title" className="daily-sign-dialog wooden-toad-dialog">
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
              <p className="mt-2 text-sm leading-6 text-ink/55">轻敲请它吃颗团子，重敲请它吃个饭团；它会张嘴接住，也会慢慢嚼给你看。</p>

              <button
                type="button"
                className={`wooden-toad-button mood-${mood} ${holding ? "is-holding" : ""} ${struck ? "is-struck" : ""}`}
                style={{ "--wooden-power": power, "--toad-look-x": "0px", "--toad-look-y": "0px" } as CSSProperties}
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  updatePressure(event.pressure, event.pointerType);
                  beginHold(maxPressure.current);
                }}
                onPointerMove={event => {
                  updatePressure(event.pressure, event.pointerType);
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const lookX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
                  const lookY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
                  event.currentTarget.style.setProperty("--toad-look-x", `${(lookX * 3).toFixed(2)}px`);
                  event.currentTarget.style.setProperty("--toad-look-y", `${(lookY * 1.5).toFixed(2)}px`);
                }}
                onPointerLeave={event => {
                  if (!holding) {
                    event.currentTarget.style.setProperty("--toad-look-x", "0px");
                    event.currentTarget.style.setProperty("--toad-look-y", "0px");
                  }
                }}
                onPointerUp={event => {
                  updatePressure(event.pressure, event.pointerType);
                  finishHold();
                }}
                onPointerCancel={cancelHold}
                onContextMenu={event => event.preventDefault()}
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
                <ToadMalletArt />
                <span className="toad-snack-plate" aria-hidden="true" />
                <span key={`${mood}-${strikeCount}`} className="wooden-toad-sprite" aria-hidden="true">
                  <MeditatingToadArt mood={mood} struck={struck} />
                </span>
                {struck && mood !== "neutral" && (
                  <span
                    key={`snack-${strikeCount}`}
                    className={`toad-flying-snack ${mood === "lively" ? "is-onigiri" : `is-dango snack-tone-${strikeCount % 3}`}`}
                    aria-hidden="true"
                  >
                    {mood === "lively" && (
                      <svg viewBox="0 0 44 40" role="presentation">
                        <path
                          d="M22 3.2c10.4 0 17.4 7.8 18.7 19.1 1.2 10.5-4.8 16.5-18.7 16.5S2.1 32.8 3.3 22.3C4.6 11 11.6 3.2 22 3.2Z"
                          fill="#f7f1df"
                          stroke="#b99b72"
                          strokeWidth="1.1"
                          strokeLinejoin="round"
                        />
                        <path d="M8.7 33.2c0-3.7 2.9-6.6 6.6-6.6h13.4c3.7 0 6.6 2.9 6.6 6.6v5.6H8.7Z" fill="#26342a" />
                        <circle cx="16" cy="13" r="1" fill="#e4d6bc" />
                        <circle cx="25" cy="9" r="0.9" fill="#e4d6bc" />
                        <circle cx="29.5" cy="18" r="1" fill="#e4d6bc" />
                      </svg>
                    )}
                  </span>
                )}
                {struck && <span key={`echo-${strikeCount}`} className="wooden-toad-echo" aria-hidden="true" />}
              </button>

              <div className="mt-1 h-6 text-sm font-medium text-cinnabar" aria-live="polite">
                {holding ? `正在蓄力 · ${woodenToadStrengthLabel(power)}` : lastStrength ? `${lastStrength} · 已敲 ${strikeCount} 下` : "按住木蟾，松手听响"}
              </div>
              <div className="mt-1 min-h-6 text-sm text-ink/60" aria-live="polite">
                {reply ?? "轻敲一声，它接住一颗团子；连着敲，它会一颗颗慢慢吃；重敲则会接住饭团。"}
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
