import type { WoodenToadMood } from "@/lib/domain/woodenToad";

type Props = {
  mood: "neutral" | WoodenToadMood;
  struck: boolean;
};

export function MeditatingToadArt({ mood, struck }: Props) {
  return (
    <svg
      viewBox="0 0 320 300"
      className={`meditating-toad mood-${mood} ${struck ? "is-reacting" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="toad-skin" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#d8b789" />
          <stop offset="0.52" stopColor="#b88d5d" />
          <stop offset="1" stopColor="#8f6844" />
        </linearGradient>
        <linearGradient id="toad-skin-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ead2aa" />
          <stop offset="1" stopColor="#b88b59" />
        </linearGradient>
        <linearGradient id="robe-outer" x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#b85b3c" />
          <stop offset="0.55" stopColor="#93452f" />
          <stop offset="1" stopColor="#713322" />
        </linearGradient>
        <linearGradient id="robe-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcae65" />
          <stop offset="1" stopColor="#a66c30" />
        </linearGradient>
        <pattern id="skin-grain" width="19" height="17" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.4" fill="#765338" opacity=".28" />
          <circle cx="13" cy="10" r="2.1" fill="#f0d4a7" opacity=".22" />
          <circle cx="18" cy="2" r=".9" fill="#674630" opacity=".2" />
        </pattern>
        <filter id="toad-shadow" x="-20%" y="-20%" width="140%" height="155%">
          <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#4b2d1c" floodOpacity=".2" />
        </filter>
      </defs>

      <ellipse className="toad-ground" cx="160" cy="270" rx="116" ry="13" fill="#805b3b" opacity=".14" />

      <g className="toad-whole" filter="url(#toad-shadow)">
        <g className="toad-legs">
          <path d="M154 229c-22 3-42 5-61 1-21-5-37 0-47 15-10 15 0 29 20 30 32 2 65-5 94-19z" fill="url(#toad-skin)" stroke="#6f4c32" strokeWidth="3" />
          <path d="M166 229c22 3 42 5 61 1 21-5 37 0 47 15 10 15 0 29-20 30-32 2-65-5-94-19z" fill="url(#toad-skin)" stroke="#6f4c32" strokeWidth="3" />
          <path d="M47 253c20 7 40 8 63 3" fill="none" stroke="#e3c394" strokeWidth="4" strokeLinecap="round" opacity=".5" />
          <path d="M273 253c-20 7-40 8-63 3" fill="none" stroke="#e3c394" strokeWidth="4" strokeLinecap="round" opacity=".5" />
        </g>

        <path className="toad-body" d="M78 138c10-38 39-58 82-58s72 20 82 58c12 45 1 91-22 116-16 17-38 22-60 22s-44-5-60-22c-23-25-34-71-22-116z" fill="url(#toad-skin)" stroke="#6f4c32" strokeWidth="3.5" />
        <path d="M83 142c21-22 48-32 77-32 31 0 58 10 78 32" fill="none" stroke="#f0d4aa" strokeWidth="5" strokeLinecap="round" opacity=".32" />

        <g className="toad-throat">
          <ellipse cx="160" cy="134" rx="54" ry="33" fill="url(#toad-skin-light)" opacity=".92" />
          <ellipse cx="160" cy="137" rx="48" ry="27" fill="url(#skin-grain)" opacity=".48" />
        </g>

        <g className="toad-head">
          <path d="M82 83c5-28 29-48 59-48h38c30 0 54 20 59 48l5 31c3 24-17 44-42 44h-82c-25 0-45-20-42-44z" fill="url(#toad-skin)" stroke="#6f4c32" strokeWidth="3.5" />
          <path d="M88 87c18-16 42-24 72-24s54 8 72 24" fill="none" stroke="#edcf9f" strokeWidth="5" strokeLinecap="round" opacity=".42" />
          <path d="M89 78c-2-23 11-39 31-39 18 0 31 14 29 34" fill="url(#toad-skin-light)" stroke="#6f4c32" strokeWidth="3" />
          <path d="M231 78c2-23-11-39-31-39-18 0-31 14-29 34" fill="url(#toad-skin-light)" stroke="#6f4c32" strokeWidth="3" />
          <path d="M91 75c18-9 36-12 53-10M229 75c-18-9-36-12-53-10" fill="none" stroke="#765137" strokeWidth="3" strokeLinecap="round" opacity=".55" />

          <g className="toad-eye toad-eye-left">
            <ellipse cx="119" cy="69" rx="13" ry="11" fill="#f2d6a6" />
            <ellipse cx="119" cy="70" rx="5" ry="7" fill="#2f241d" />
            <circle cx="117" cy="67" r="1.6" fill="#fff8e9" />
            <path className="toad-eyelid" d="M106 69q13-12 26 0q-13 8-26 0z" fill="#ad8053" />
          </g>
          <g className="toad-eye toad-eye-right">
            <ellipse cx="201" cy="69" rx="13" ry="11" fill="#f2d6a6" />
            <ellipse cx="201" cy="70" rx="5" ry="7" fill="#2f241d" />
            <circle cx="199" cy="67" r="1.6" fill="#fff8e9" />
            <path className="toad-eyelid" d="M188 69q13-12 26 0q-13 8-26 0z" fill="#ad8053" />
          </g>

          <ellipse cx="145" cy="98" rx="3" ry="2" fill="#60412e" opacity=".65" />
          <ellipse cx="175" cy="98" rx="3" ry="2" fill="#60412e" opacity=".65" />
          <path className="toad-mouth" d="M123 119c17 6 57 6 74 0" fill="none" stroke="#5f402c" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M127 124c20 5 46 5 66 0" fill="none" stroke="#e6bd88" strokeWidth="2" strokeLinecap="round" opacity=".45" />
          <path d="M93 92c8 2 15 6 20 12M227 92c-8 2-15 6-20 12" fill="none" stroke="#755039" strokeWidth="2.4" strokeLinecap="round" opacity=".45" />
          <path d="M82 83c5-28 29-48 59-48h38c30 0 54 20 59 48l5 31c3 24-17 44-42 44h-82c-25 0-45-20-42-44z" fill="url(#skin-grain)" opacity=".38" />
        </g>

        <g className="toad-robes">
          <path d="M104 139c15-13 31-20 47-22l17 20c21 2 42 10 59 27 6 34-1 70-20 94-26 14-69 14-95 0-21-27-29-78-8-119z" fill="url(#robe-inner)" stroke="#805126" strokeWidth="3" />
          <path d="M145 119c10 6 18 13 25 21l-35 56-30-51c9-13 23-22 40-26z" fill="#e8ca91" stroke="#936330" strokeWidth="2.5" />
          <path d="M105 145c29 22 50 43 65 65 17-24 37-40 58-48 5 35-2 72-22 96-25 13-64 14-91 2-19-28-27-77-10-115z" fill="url(#robe-outer)" stroke="#6e3022" strokeWidth="3" />
          <path d="M112 153c25 19 44 39 58 57" fill="none" stroke="#d98b68" strokeWidth="5" strokeLinecap="round" opacity=".7" />
          <path d="M170 210c14-18 32-33 53-43" fill="none" stroke="#5e291f" strokeWidth="3" strokeLinecap="round" opacity=".55" />
          <path d="M124 222c26 8 54 8 82 0M120 238c28 9 58 9 87 0" fill="none" stroke="#e09a71" strokeWidth="2.4" strokeLinecap="round" opacity=".42" />
        </g>

        <g className="toad-arms">
          <path d="M105 160c-18 17-25 42-15 63 8 15 22 19 38 12" fill="none" stroke="url(#toad-skin)" strokeWidth="24" strokeLinecap="round" />
          <path d="M215 160c18 17 25 42 15 63-8 15-22 19-38 12" fill="none" stroke="url(#toad-skin)" strokeWidth="24" strokeLinecap="round" />
          <path d="M124 230c10 7 22 10 36 10s26-3 36-10" fill="none" stroke="#c49b6c" strokeWidth="13" strokeLinecap="round" />
          <path d="M142 238c12 3 24 3 36 0" fill="none" stroke="#775139" strokeWidth="2" strokeLinecap="round" opacity=".55" />
        </g>

        <path d="M73 116c9-4 16-4 23 0M247 116c-9-4-16-4-23 0" fill="none" stroke="#79543a" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      </g>
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
