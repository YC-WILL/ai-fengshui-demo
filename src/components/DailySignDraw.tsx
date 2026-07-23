"use client";

import { useEffect, useState } from "react";
import {
  getSignPeriod,
  SIGN_PERIOD_LABEL,
  type SignPeriod
} from "@/lib/domain/dailySign";
import type {
  SignInterpretationReply,
  SignSnapshot
} from "@/lib/domain/signInterpretation";
import { preloadImages } from "@/lib/client/imagePreload";
import { fetchReport, readJsonResponse } from "@/lib/reports/client";

type DrawPhase = "ready" | "shaking" | "dropping" | "materializing" | "materialized" | "revealed";

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

const DRAW_ANIMATION_MS = {
  shaking: 1200,
  dropping: 1000,
  materializingFallback: 1800,
  materializedHold: 3000
} as const;
const SIGN_DRAW_ASSETS = [
  "/images/sign-draw/cylinder-v2.png",
  "/images/sign-draw/stick-v2.png"
] as const;

function waitForAnimation(duration: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, duration));
}

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
    void preloadImages(SIGN_DRAW_ASSETS);
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
      if (event.key === "Escape" && (phase === "ready" || phase === "revealed")) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, phase]);

  const periodLabel = sign?.periodLabel ?? (period ? SIGN_PERIOD_LABEL[period] : "今日安签");
  const isAnimating =
    phase === "shaking" ||
    phase === "dropping" ||
    phase === "materializing" ||
    phase === "materialized";

  const openCylinder = async () => {
    await preloadImages(SIGN_DRAW_ASSETS);
    setOpen(true);
    setSign(null);
    setInterpretation(null);
    setQuestion("");
    setFollowUp("");
    setError(null);
    setPhase("ready");
  };

  const shakeAndDraw = async () => {
    if (phase !== "ready") return;
    setError(null);
    setPhase("shaking");
    try {
      const responsePromise = fetchReport("/api/signs/draw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      await waitForAnimation(DRAW_ANIMATION_MS.shaking);
      setPhase("dropping");
      await waitForAnimation(DRAW_ANIMATION_MS.dropping);
      const response = await responsePromise;
      const payload = await readJsonResponse<{ ok?: boolean; error?: string; data?: SignDraw }>(
        response,
        "安签服务"
      );
      if (!response.ok || !payload.ok || !payload.data?.snapshot) {
        throw new Error(payload.error ?? "这次没有摇出签，请稍后再试");
      }
      setSign(payload.data);
      setPeriod(payload.data.period);
      setPhase("materializing");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "这次没有摇出签，请稍后再试");
      setPhase("ready");
    }
  };

  useEffect(() => {
    if (phase === "materializing") {
      const fallback = window.setTimeout(() => {
        setPhase(current => current === "materializing" ? "materialized" : current);
      }, DRAW_ANIMATION_MS.materializingFallback);
      return () => window.clearTimeout(fallback);
    }
    if (phase === "materialized") {
      const hold = window.setTimeout(() => {
        setPhase(current => current === "materialized" ? "revealed" : current);
      }, DRAW_ANIMATION_MS.materializedHold);
      return () => window.clearTimeout(hold);
    }
  }, [phase]);

  const finishMaterializing = () => {
    setPhase(current => current === "materializing" ? "materialized" : current);
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
          if (event.target === event.currentTarget && !isAnimating) setOpen(false);
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="daily-sign-dialog-title" className="daily-sign-dialog">
            <button
              type="button"
              className="absolute right-4 top-3 z-10 text-2xl leading-none text-ink/35 hover:text-ink/70 disabled:opacity-30"
              aria-label="关闭求签"
              disabled={isAnimating}
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            {phase !== "revealed" ? (
              <div className="text-center">
                <div id="daily-sign-dialog-title" className="font-serif text-2xl text-ink">摇一摇{periodLabel}</div>
                <p className="mt-2 text-sm leading-6 text-ink/55">轻轻点一下签筒，为这个时段取出正式签。</p>
                <div className={`daily-sign-ritual-stage is-${phase}`} aria-live="polite">
                  {phase !== "materializing" && phase !== "materialized" ? (
                    <button
                      type="button"
                      onClick={shakeAndDraw}
                      disabled={phase !== "ready"}
                      className="daily-sign-cylinder-button"
                      aria-label={phase === "ready" ? "点击签筒摇一摇" : "正在完成求签动画"}
                    >
                      <img
                        src="/images/sign-draw/cylinder-v2.png"
                        alt=""
                        draggable={false}
                        fetchPriority="high"
                        className="daily-sign-cylinder-art"
                      />
                      {phase === "dropping" && (
                        <img
                          src="/images/sign-draw/stick-v2.png"
                          alt=""
                          draggable={false}
                          fetchPriority="high"
                          className="daily-sign-falling-stick"
                        />
                      )}
                    </button>
                  ) : sign ? (
                    <div className="daily-sign-materializing" aria-label={`${sign.snapshot.title}正在显现`}>
                      <img
                        src="/images/sign-draw/stick-v2.png"
                        alt=""
                        draggable={false}
                        fetchPriority="high"
                        onAnimationEnd={finishMaterializing}
                      />
                      <div>
                        <span>{sign.periodLabel} · 第{sign.snapshot.number}签</span>
                        <strong>{sign.snapshot.title}</strong>
                        <p>{sign.snapshot.conclusion}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div key={phase} className="daily-sign-stage-message font-medium text-cinnabar" aria-live="polite">
                  {phase === "ready" && "点击签筒 · 摇一摇"}
                  {phase === "shaking" && "签声轻响，正在摇签……"}
                  {phase === "dropping" && "一支签已经落出……"}
                  {phase === "materializing" && "签意渐渐显现……"}
                  {phase === "materialized" && "签意已经落定"}
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
      <div className={`daily-sign-slip-result ${props.sign.repeated ? "is-restored" : ""}`}>
        <div className="daily-sign-slip" aria-label={`${snapshot.title}，${snapshot.conclusion}`}>
          <div className="flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] text-ink/45">
            <span>蟾先森</span><span className="text-cinnabar/70">·</span><span>{props.sign.periodLabel}</span>
          </div>
          <div className="daily-sign-word">{snapshot.title}</div>
          <div className="mx-auto my-4 h-px w-12 bg-gold/60" />
          <p className="text-center text-sm leading-7 text-ink/75">{snapshot.conclusion}</p>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cinnabar/40 font-serif text-sm text-cinnabar">安</span>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink/45">
          {props.sign.repeated ? "取回本时段原签，不重新抽取" : "签条已落定，继续往下看完整签意"}
        </p>
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
