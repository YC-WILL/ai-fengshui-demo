"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  getSignPeriod,
  SIGN_PERIOD_LABEL,
  type SignPeriod
} from "@/lib/domain/dailySign";
import type {
  SignInterpretationReply,
  SignSnapshot
} from "@/lib/domain/signInterpretation";
import { fetchReport, readJsonResponse } from "@/lib/reports/client";

type DrawPhase = "ready" | "loading" | "shaking" | "revealed";

interface SignDraw {
  id: string;
  repeated: boolean;
  signDate: string;
  period: SignPeriod;
  periodLabel: string;
  timezone: string;
  drawnAt: string;
  snapshot: SignSnapshot;
}

interface InterpretationResult {
  sessionId: string;
  drawId: string;
  domain: { code: string; name: string };
  reply: SignInterpretationReply;
}

const STICKS = Array.from({ length: 13 }, (_, index) => index);
const DOMAINS = [
  ["self_state", "我自己目前的状态"],
  ["career_study", "工作或学习"],
  ["relationship", "感情与相处"],
  ["family", "家庭或身边的人"],
  ["cooperation", "合作与人际"],
  ["choice_timing", "某个选择或时机"],
  ["custom", "自定义问题"]
] as const;

export default function DailySignDraw() {
  const [period, setPeriod] = useState<SignPeriod | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DrawPhase>("ready");
  const [sign, setSign] = useState<SignDraw | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domainCode, setDomainCode] = useState("self_state");
  const [question, setQuestion] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [interpreting, setInterpreting] = useState(false);

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

  const periodLabel = sign?.periodLabel ?? (period ? SIGN_PERIOD_LABEL[period] : "今日安签");

  const openCylinder = async () => {
    setOpen(true);
    setSign(null);
    setInterpretation(null);
    setQuestion("");
    setFollowUp("");
    setError(null);
    setPhase("loading");
    try {
      const response = await fetchReport("/api/signs/current", { cache: "no-store" });
      const payload = await readJsonResponse<{
        ok?: boolean;
        error?: string;
        data?: { draw: SignDraw | null };
      }>(response, "安签服务");
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "暂时无法查看本时段安签");
      if (payload.data?.draw) {
        setSign(payload.data.draw);
        setPeriod(payload.data.draw.period);
        setPhase("revealed");
      } else {
        setPhase("ready");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "安签服务暂时不可用");
      setPhase("ready");
    }
  };

  const shakeAndDraw = async () => {
    if (phase === "shaking") return;
    setError(null);
    setPhase("shaking");
    try {
      const [response] = await Promise.all([
        fetchReport("/api/signs/draw", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({})
        }),
        new Promise(resolve => window.setTimeout(resolve, 1100))
      ]);
      const payload = await readJsonResponse<{ ok?: boolean; error?: string; data?: SignDraw }>(
        response,
        "安签服务"
      );
      if (!response.ok || !payload.ok || !payload.data?.snapshot) {
        throw new Error(payload.error ?? "这次没有摇出签，请稍后再试");
      }
      setSign(payload.data);
      setPeriod(payload.data.period);
      setPhase("revealed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "这次没有摇出签，请稍后再试");
      setPhase("ready");
    }
  };

  const startInterpretation = async () => {
    if (!sign || interpreting) return;
    if (question.trim().length < 2) {
      setError("请用一句话说说你现在最想理清的事情");
      return;
    }
    setInterpreting(true);
    setError(null);
    try {
      const response = await fetchReport(`/api/signs/${sign.id}/interpretations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domainCode, question })
      });
      const payload = await readJsonResponse<{
        ok?: boolean;
        error?: string;
        data?: InterpretationResult;
      }>(response, "解签服务");
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error ?? "这次解签没有完成");
      }
      setInterpretation(payload.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "这次解签没有完成");
    } finally {
      setInterpreting(false);
    }
  };

  const continueInterpretation = async () => {
    if (!sign || !interpretation || interpreting || followUp.trim().length < 2) return;
    setInterpreting(true);
    setError(null);
    try {
      const response = await fetchReport(
        `/api/signs/${sign.id}/interpretations/${interpretation.sessionId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: followUp })
        }
      );
      const payload = await readJsonResponse<{
        ok?: boolean;
        error?: string;
        data?: InterpretationResult;
      }>(response, "解签服务");
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error ?? "这次追问没有完成");
      }
      setInterpretation(payload.data);
      setFollowUp("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "这次追问没有完成");
    } finally {
      setInterpreting(false);
    }
  };

  return (
    <div id="daily-sign">
      <div className="daily-sign-entry">
        <div className="daily-sign-entry-meta">
          <span>当下回应</span>
          <span>{periodLabel}</span>
        </div>
        <div className="daily-sign-entry-seal" aria-hidden>安</div>
        <div className="font-serif text-xl text-ink">求一支{periodLabel}</div>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/60">
          每个时段只留一支正式签。先看局势与方向，再带着真实处境继续解签。
        </p>
        <button type="button" onClick={openCylinder} className="daily-sign-entry-action">
          求签
        </button>
        <p className="mt-3 text-[11px] text-ink/40">重复进入会回到原签 · 结果保存到“我的”</p>
      </div>

      {open && (
        <div className="daily-sign-modal" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && phase !== "shaking") setOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="daily-sign-dialog-title" className="daily-sign-dialog">
            <button
              type="button"
              className="absolute right-4 top-3 z-10 text-2xl leading-none text-ink/35 hover:text-ink/70 disabled:opacity-30"
              aria-label="关闭求签"
              disabled={phase === "shaking"}
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            {phase === "loading" ? (
              <div className="py-16 text-center" role="status">
                <div id="daily-sign-dialog-title" className="font-serif text-2xl text-ink">正在查看本时段原签</div>
                <p className="mt-3 text-sm text-ink/55">若已经求过，会直接回到同一支签。</p>
              </div>
            ) : phase !== "revealed" ? (
              <div className="text-center">
                <div id="daily-sign-dialog-title" className="font-serif text-2xl text-ink">摇一摇{periodLabel}</div>
                <p className="mt-2 text-sm leading-6 text-ink/55">轻轻点一下签筒，为这个时段留下唯一一支正式签。</p>
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
                  <span className="daily-sign-cylinder" aria-hidden="true"><span>卦安</span></span>
                </button>
                <div className="mt-2 font-medium text-cinnabar">
                  {phase === "shaking" ? "签声轻响，正在定签……" : "点击签筒 · 摇一摇"}
                </div>
                {error && <p className="mt-3 text-sm text-cinnabar" role="alert">{error}</p>}
                <p className="mt-4 text-[11px] text-ink/40">服务端定签 · 不问吉凶 · 本时段不重复换签</p>
              </div>
            ) : sign ? (
              <SignResult
                sign={sign}
                domainCode={domainCode}
                setDomainCode={setDomainCode}
                question={question}
                setQuestion={setQuestion}
                followUp={followUp}
                setFollowUp={setFollowUp}
                interpretation={interpretation}
                interpreting={interpreting}
                error={error}
                startInterpretation={startInterpretation}
                continueInterpretation={continueInterpretation}
                close={() => setOpen(false)}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function SignResult(props: {
  sign: SignDraw;
  domainCode: string;
  setDomainCode: (value: string) => void;
  question: string;
  setQuestion: (value: string) => void;
  followUp: string;
  setFollowUp: (value: string) => void;
  interpretation: InterpretationResult | null;
  interpreting: boolean;
  error: string | null;
  startInterpretation: () => void;
  continueInterpretation: () => void;
  close: () => void;
}) {
  const snapshot = props.sign.snapshot;
  return (
    <div className="daily-sign-reveal" aria-live="polite">
      <div id="daily-sign-dialog-title" className="sr-only">你的{props.sign.periodLabel}</div>
      <div className="daily-sign-result-heading">
        <span>{props.sign.periodLabel} · 第{snapshot.number}签</span>
        <span>{props.sign.repeated ? "本时段原签" : "刚刚得签"}</span>
      </div>
      <div className="daily-sign-result-core">
        <div className="daily-sign-hexagram" aria-hidden>{snapshot.symbol}</div>
        <div>
          <p className="text-xs tracking-[0.18em] text-cinnabar">{snapshot.hexagramName} · {snapshot.stage}</p>
          <h3 className="mt-1 font-serif text-2xl text-ink">{snapshot.title}</h3>
          <p className="mt-3 text-base font-medium leading-7 text-ink">{snapshot.conclusion}</p>
        </div>
      </div>

      {snapshot.contentNotice && <p className="daily-sign-content-notice">{snapshot.contentNotice}</p>}

      <div className="daily-sign-facts">
        <SignFact label="当前局势" value={snapshot.currentSituation} />
        <SignFact label="主要方向" value={snapshot.mainDirection} />
        <SignFact label="有利因素" value={snapshot.favorableFactors} />
        <SignFact label="阻力与风险" value={snapshot.resistanceRisk} />
        <SignFact label="宜做" value={snapshot.recommended} />
        <SignFact label="忌做" value={snapshot.avoid} />
      </div>

      <details className="daily-sign-evidence">
        <summary>查看这支签的数据库依据</summary>
        <div className="mt-3 space-y-3">
          {snapshot.evidence.map((item, index) => (
            <div key={`${item.source}-${index}`}>
              <strong>{item.source}</strong>
              <p>{item.fact}</p>
              <small>{item.explanation}</small>
            </div>
          ))}
        </div>
      </details>

      <section className="daily-sign-interpretation">
        <div>
          <p className="text-xs tracking-[0.16em] text-cinnabar">围绕原签继续</p>
          <h4 className="mt-1 font-serif text-xl text-ink">说说你现在真正想理清的事</h4>
        </div>
        {!props.interpretation ? (
          <>
            <div className="daily-sign-domain-list" aria-label="选择解签方向">
              {DOMAINS.map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  className={props.domainCode === code ? "is-active" : ""}
                  aria-pressed={props.domainCode === code}
                  onClick={() => props.setDomainCode(code)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="sr-only">描述你的具体事情</span>
              <textarea
                value={props.question}
                maxLength={800}
                rows={3}
                onChange={event => props.setQuestion(event.target.value)}
                placeholder="例如：项目方向一直没有定下来，我该先推动决定，还是再收集信息？"
                className="daily-sign-question"
              />
            </label>
            <button type="button" className="btn-primary" disabled={props.interpreting} onClick={props.startInterpretation}>
              {props.interpreting ? "正在整理……" : "开始解签"}
            </button>
          </>
        ) : (
          <>
            <InterpretationReply reply={props.interpretation.reply} />
            <label className="block">
              <span className="text-sm font-medium text-ink">继续补充一个关键事实</span>
              <textarea
                value={props.followUp}
                maxLength={800}
                rows={2}
                onChange={event => props.setFollowUp(event.target.value)}
                placeholder={props.interpretation.reply.followUpQuestion}
                className="daily-sign-question mt-2"
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              disabled={props.interpreting || props.followUp.trim().length < 2}
              onClick={props.continueInterpretation}
            >
              {props.interpreting ? "正在继续整理……" : "继续解签"}
            </button>
          </>
        )}
        {props.error && <p className="text-sm text-cinnabar" role="alert">{props.error}</p>}
      </section>

      <div className="mt-5 flex justify-center">
        <button type="button" className="btn-secondary" onClick={props.close}>收好这支签</button>
      </div>
      <p className="mt-3 text-center text-[11px] leading-5 text-ink/45">
        已保存到“我的求签” · 签象帮助整理局势，不预测事情结果
      </p>
    </div>
  );
}

function SignFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function InterpretationReply({ reply }: { reply: SignInterpretationReply }) {
  return (
    <div className="daily-sign-reply">
      <SignFact label="先看当前处境" value={reply.assessment} />
      <SignFact label="主要矛盾" value={reply.tension} />
      <SignFact label="方向判断" value={reply.direction} />
      <div>
        <span>近期可以做</span>
        <ol>{reply.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}</ol>
      </div>
      <SignFact label="需要避免" value={reply.avoid} />
      <SignFact label="再确认一件事" value={reply.followUpQuestion} />
      {reply.riskNotice && <p className="daily-sign-risk">{reply.riskNotice}</p>}
      <p className="text-xs leading-5 text-ink/50">{reply.boundary}</p>
    </div>
  );
}
