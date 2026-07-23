"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  COMPANION_PURPOSES,
  type CompanionPurpose,
  type CompanionTurn
} from "@/lib/companion/core";
import { readJsonResponse } from "@/lib/reports/client";

type ProfileResponse = {
  ok?: boolean;
  error?: string;
  data?: { purpose: CompanionPurpose | null };
};

type HistoryResponse = {
  ok?: boolean;
  error?: string;
  data?: { turns: CompanionTurn[] };
};

type ChatResponse = {
  ok?: boolean;
  error?: string;
  data?: { turn: CompanionTurn };
};

const STARTERS: Record<CompanionPurpose, string[]> = {
  talk: ["最近有件事想说说", "今天心里有点乱", "我也不知道从哪里说起"],
  clarify: ["我在两个选择之间犹豫", "有件事拖了很久", "我想把一段关系理清"],
  self: ["我想看看自己的做事方式", "为什么我总在最后才行动", "我只是对自己有些好奇"],
  daily: ["陪我随便坐坐", "给我一个今天的小提醒", "我想让今天安静一点"]
};

export default function CompanionExperience() {
  const [loading, setLoading] = useState(true);
  const [purpose, setPurpose] = useState<CompanionPurpose | null>(null);
  const [turns, setTurns] = useState<CompanionTurn[]>([]);
  const [message, setMessage] = useState("");
  const [savingPurpose, setSavingPurpose] = useState<CompanionPurpose | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns, sending]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await fetch("/api/companion/profile", { cache: "no-store" });
      const profileJson = await readJsonResponse<ProfileResponse>(profileResponse, "陪伴偏好");
      if (!profileResponse.ok || !profileJson.ok) throw new Error(profileJson.error ?? "陪伴偏好读取失败");
      const nextPurpose = profileJson.data?.purpose ?? null;
      setPurpose(nextPurpose);
      if (nextPurpose) {
        const historyResponse = await fetch("/api/companion/chat", { cache: "no-store" });
        const historyJson = await readJsonResponse<HistoryResponse>(historyResponse, "陪伴记录");
        if (!historyResponse.ok || !historyJson.ok) throw new Error(historyJson.error ?? "陪伴记录读取失败");
        setTurns(historyJson.data?.turns ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "暂时无法进入蟾先森，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function choosePurpose(nextPurpose: CompanionPurpose) {
    setSavingPurpose(nextPurpose);
    setError(null);
    try {
      const response = await fetch("/api/companion/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purpose: nextPurpose })
      });
      const json = await readJsonResponse<ProfileResponse>(response, "初心保存");
      if (!response.ok || !json.ok) throw new Error(json.error ?? "保存失败");
      setPurpose(nextPurpose);
      setTurns([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "这份初心暂时没有保存下来。");
    } finally {
      setSavingPurpose(null);
    }
  }

  async function send(value = message) {
    const nextMessage = value.trim();
    if (!nextMessage || sending || !purpose) return;
    setSending(true);
    setMessage("");
    setError(null);
    try {
      const response = await fetch("/api/companion/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: nextMessage })
      });
      const json = await readJsonResponse<ChatResponse>(response, "蟾先森陪伴");
      if (!response.ok || !json.ok || !json.data?.turn) {
        throw new Error(json.error ?? "蟾先森刚才没有接住这句话。");
      }
      setTurns(current => [...current, json.data!.turn]);
    } catch (err) {
      setMessage(nextMessage);
      setError(err instanceof Error ? err.message : "发送失败，请稍后再试。");
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  if (loading) {
    return (
      <section className="companion-shell flex min-h-[32rem] items-center justify-center" aria-busy="true">
        <div className="text-center text-sm text-ink/55">
          <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-cinnabar/15" />
          蟾先森正在把门轻轻打开……
        </div>
      </section>
    );
  }

  if (!purpose) {
    return (
      <section className="companion-shell companion-onboarding">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 text-xs tracking-[0.3em] text-cinnabar/70">初次见面</div>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">你希望蟾先森以后主要怎样陪你？</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink/60">
            先选一个比较接近的。这只是我们认识彼此的开始，不会限制以后可以聊什么。
          </p>
          <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
            {(Object.entries(COMPANION_PURPOSES) as Array<[CompanionPurpose, typeof COMPANION_PURPOSES[CompanionPurpose]]>).map(([key, item]) => (
              <button
                key={key}
                type="button"
                disabled={savingPurpose !== null}
                onClick={() => void choosePurpose(key)}
                className="group rounded-2xl border border-mist bg-white/75 p-5 text-left transition hover:-translate-y-0.5 hover:border-cinnabar/35 hover:shadow-scroll disabled:cursor-wait disabled:opacity-60"
              >
                <span className="font-serif text-lg text-ink group-hover:text-cinnabar">{item.title}</span>
                <span className="mt-2 block text-sm leading-6 text-ink/60">{item.description}</span>
                <span className="mt-4 block text-xs text-cinnabar/70">
                  {savingPurpose === key ? "正在记下……" : "从这里开始 →"}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-6 text-xs leading-5 text-ink/45">
            你的选择会保存到“我的”，以后可以修改或删除账户数据。
          </p>
          {error && <ErrorNotice message={error} onRetry={() => void load()} />}
        </div>
      </section>
    );
  }

  const purposeInfo = COMPANION_PURPOSES[purpose];
  return (
    <section className="companion-shell overflow-hidden p-0">
      <header className="border-b border-mist/80 bg-white/55 px-5 py-4 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.24em] text-cinnabar/70">有事来聊，无事来坐</div>
            <h1 className="mt-1 font-serif text-2xl">蟾先森陪你慢慢说</h1>
          </div>
          <Link href="/me#purpose" className="text-xs text-ink/50 hover:text-cinnabar">
            初心：{purposeInfo.title} · 查看
          </Link>
        </div>
      </header>

      <div className="companion-thread max-h-[34rem] min-h-[25rem] overflow-y-auto px-4 py-5 md:px-7" aria-live="polite">
        <AssistantBubble text={purposeInfo.welcome} />
        {turns.map(turn => (
          <div key={turn.id} className="space-y-3">
            <UserBubble text={turn.message} />
            <AssistantBubble text={turn.reply} />
          </div>
        ))}
        {turns.length === 0 && (
          <div className="my-5 flex flex-wrap gap-2 pl-10">
            {STARTERS[purpose].map(starter => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
                className="rounded-full border border-gold/35 bg-rice/80 px-3 py-1.5 text-xs text-ink/70 hover:border-cinnabar/30 hover:text-cinnabar"
              >
                {starter}
              </button>
            ))}
          </div>
        )}
        {sending && (
          <div className="mb-4 flex items-center gap-2 text-sm text-ink/45">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cinnabar/10 font-serif text-cinnabar">安</span>
            <span className="animate-pulse">我在听，稍等一下……</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="border-t border-mist bg-white/65 p-4 md:px-7 md:py-5">
        <label htmlFor="companion-message" className="sr-only">想和蟾先森说的话</label>
        <textarea
          id="companion-message"
          value={message}
          maxLength={800}
          disabled={sending}
          onChange={event => setMessage(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="不必想好怎么问，像平常说话一样就好……"
          className="min-h-[5.5rem] w-full resize-none rounded-xl border border-mist bg-rice/55 px-4 py-3 text-sm leading-6 outline-none transition focus:border-cinnabar/35 focus:ring-2 focus:ring-cinnabar/10 disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-ink/40">对话会留在“我的”里，方便下次接着聊。</span>
          <button type="submit" className="btn-primary" disabled={sending || !message.trim()}>
            {sending ? "听你说着…" : "说给蟾先森听"}
          </button>
        </div>
        {error && <ErrorNotice message={error} />}
      </form>
    </section>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cinnabar/10 font-serif text-sm text-cinnabar">安</span>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-mist bg-white/80 px-4 py-3 text-sm leading-7 text-ink/85 shadow-sm">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="mb-4 flex justify-end">
      <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-jade/10 px-4 py-3 text-sm leading-7 text-ink/85">
        {text}
      </div>
    </div>
  );
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-4 rounded-lg border border-cinnabar/20 bg-cinnabar/5 px-3 py-2 text-sm text-cinnabar">
      {message}
      {onRetry && <button type="button" className="ml-2 underline" onClick={onRetry}>重试</button>}
    </div>
  );
}
