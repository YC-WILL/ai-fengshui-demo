"use client";

export default function SubmitBar({
  loading, error,
  basicLabel, deepLabel,
  onBasic, onDeep
}: {
  loading: "basic" | "deep" | null;
  error: string | null;
  basicLabel?: string;
  deepLabel?: string;
  onBasic: () => void;
  onDeep?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn-primary"
        disabled={loading !== null}
        onClick={onBasic}
      >
        {loading === "basic" ? "正在整理你的描述…" : basicLabel ?? "生成基础参考（免费）"}
      </button>
      {onDeep && (
        <button
          type="button"
          className="btn-secondary"
          disabled={loading !== null}
          onClick={onDeep}
        >
          {loading === "deep"
          ? "正在整理你的描述…"
            : `${deepLabel ?? "生成深度参考"}（会员）`}
        </button>
      )}
      {loading && <span className="w-full text-xs text-ink/55">通常需要几秒；超过 60 秒会提示你重试，不会无限等待。</span>}
      {error && <span className="text-sm text-cinnabar">{error}</span>}
    </div>
  );
}
