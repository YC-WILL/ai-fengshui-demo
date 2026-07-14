import type { WoodenToadMood } from "@/lib/domain/woodenToad";

type Props = {
  mood: "neutral" | WoodenToadMood;
  struck: boolean;
};

export function MeditatingToadArt({ mood, struck }: Props) {
  return (
    <svg
      viewBox="0 0 1254 1254"
      className={`meditating-toad mood-${mood} ${struck ? "is-reacting" : ""}`}
      aria-hidden="true"
    >
      <image
        href="/assets/meditating-toad-reference.png"
        width="1254"
        height="1254"
        className="toad-reference-body"
      />

      <g className="toad-reference-eyelid toad-reference-eyelid-left">
        <ellipse cx="439" cy="318" rx="54" ry="40" fill="#b49a59" stroke="#5f512f" strokeWidth="4" />
        <path d="M390 322c27 9 70 9 98 0" fill="none" stroke="#55452b" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="toad-reference-eyelid toad-reference-eyelid-right">
        <ellipse cx="812" cy="318" rx="54" ry="40" fill="#b49a59" stroke="#5f512f" strokeWidth="4" />
        <path d="M763 322c27 9 70 9 98 0" fill="none" stroke="#55452b" strokeWidth="5" strokeLinecap="round" />
      </g>

      <path
        className="toad-breath-highlight"
        d="M388 526c96 91 439 91 535 0"
        fill="none"
        stroke="#fff0ca"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0"
      />
    </svg>
  );
}

export function ToadMalletArt() {
  return (
    <svg viewBox="0 0 82 180" className="wooden-toad-mallet" aria-hidden="true">
      <defs>
        <linearGradient id="mallet-handle" x1="0" x2="1">
          <stop offset="0" stopColor="#5f3722" />
          <stop offset=".42" stopColor="#c48a55" />
          <stop offset=".68" stopColor="#8d5430" />
          <stop offset="1" stopColor="#4c291b" />
        </linearGradient>
        <radialGradient id="mallet-head" cx="35%" cy="25%" r="75%">
          <stop offset="0" stopColor="#e0af76" />
          <stop offset=".55" stopColor="#9a5b34" />
          <stop offset="1" stopColor="#5b301e" />
        </radialGradient>
      </defs>
      <rect x="34" y="43" width="14" height="128" rx="7" fill="url(#mallet-handle)" stroke="#4f2a1c" strokeWidth="2" />
      <rect x="9" y="12" width="64" height="43" rx="18" fill="url(#mallet-head)" stroke="#542d1d" strokeWidth="3" />
      <path d="M18 24c15-7 33-7 47 0M19 41c14 5 30 5 44 0" fill="none" stroke="#efc38c" strokeWidth="2" strokeLinecap="round" opacity=".35" />
      <ellipse cx="41" cy="52" rx="9" ry="4" fill="#4d291b" opacity=".35" />
    </svg>
  );
}
