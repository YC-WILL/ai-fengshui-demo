import Link from "next/link";
import type { PlateDetail, PlateDetailContent } from "@/lib/platePresentation";
import PlateActionPanel from "@/components/PlateActionPanel";

export default function PlateSnapshotDetail({
  detail,
  continuationSupported
}: {
  detail: PlateDetail;
  continuationSupported: boolean;
}) {
  if (!detail.displayable) {
    return (
      <div className="plate-detail-content">
        <section className="plate-detail-unavailable" role="status">
          <span aria-hidden>存</span>
          <div>
            <h2>这条记录暂时无法完整展示</h2>
            <p>记录本身仍然保留。蟾先森不会重新计算或补写当时的结果。</p>
            <small>记录编号 {detail.idShort}</small>
          </div>
        </section>
        <ContinuationActions detail={detail} supported={continuationSupported} />
      </div>
    );
  }

  return (
    <div className={`plate-detail-content is-${detail.content.kind.toLowerCase()}`}>
      <DetailContent content={detail.content} />
      <ContinuationActions detail={detail} supported={continuationSupported} />
      <PlateActionPanel
        snapshotId={detail.id}
        actionAvailable={detail.actionAvailable}
        action={detail.action}
      />
    </div>
  );
}

function ContinuationActions({
  detail,
  supported
}: {
  detail: PlateDetail;
  supported: boolean;
}) {
  if (!supported) {
    return (
      <section className="plate-continuation-unavailable">
        <span aria-hidden>续</span>
        <div>
          <h2>这条记录暂不支持继续使用</h2>
          <p>你仍可以回看和删除这份历史快照；系统不会猜测或补写其中的输入。</p>
        </div>
      </section>
    );
  }

  const id = encodeURIComponent(detail.id);
  return (
    <section className="plate-continuation-actions" aria-labelledby="plate-continuation-title">
      <div>
        <span className="section-kicker">继续使用</span>
        <h2 id="plate-continuation-title">把当时输入带入一次新的查看</h2>
        <p>继续使用会按当前资料和现行规则重新计算；新结果不会覆盖这条历史快照。</p>
      </div>
      <div>
        {detail.plateType === "BAZI" && (
          <Link href={`/bazi?from=${id}`}>按当前生辰资料重新查看</Link>
        )}
        {detail.plateType === "RELATION" && (
          <Link href={`/marriage?from=${id}`}>带入这次关系资料</Link>
        )}
        {detail.plateType === "HOME" && (
          <Link href={`/fengshui?from=${id}`}>带入这次空间情况</Link>
        )}
        {detail.plateType === "TIMING" && <>
          <Link href={`/date-selection?from=${id}&mode=original`}>按原起始日期继续</Link>
          <Link href={`/date-selection?from=${id}&mode=today`}>从今天重新开始</Link>
        </>}
      </div>
    </section>
  );
}

function DetailContent({ content }: { content: PlateDetailContent }) {
  if (content.kind === "BAZI") return <BaziDetail content={content} />;
  if (content.kind === "RELATION") return <RelationDetail content={content} />;
  if (content.kind === "HOME") return <HomeDetail content={content} />;
  return <TimingDetail content={content} />;
}

function BaziDetail({ content }: { content: Extract<PlateDetailContent, { kind: "BAZI" }> }) {
  return (
    <>
      <section className="plate-detail-section">
        <div className="plate-detail-heading"><span>当时使用的资料</span><h2>{content.profile.birthDate}</h2></div>
        <div className="plate-detail-facts">
          <p><b>出生时间</b>{content.profile.timeLabel}</p>
          <p><b>出生地点</b>{content.profile.birthLocation ?? "当时未填写"}</p>
          <p><b>时区口径</b>{content.profile.timezone}</p>
        </div>
        <div className="plate-detail-pillars">
          {content.pillars.map(item => <div key={item.label}><span>{item.label}</span><b>{item.value}</b></div>)}
        </div>
      </section>
      <ObservationList title="当时的三项生活观察" observations={content.observations} />
      {content.weeklyAction && <ReadonlySuggestion
        eyebrow="当时的本周行动建议"
        title={content.weeklyAction.title}
        text={content.weeklyAction.text}
      />}
      <section className="plate-detail-section">
        <div className="plate-detail-heading"><span>当时的时间对照</span><h2>保存时看到的时间层</h2></div>
        <div className="plate-detail-time-grid">
          {content.timeLayers.map(item => <article key={`${item.label}-${item.period}`}>
            <span>{item.label} · {item.period}</span>
            <b>{item.pillar} · {item.title}</b>
            <p>{item.summary}</p>
          </article>)}
        </div>
      </section>
    </>
  );
}

function RelationDetail({ content }: { content: Extract<PlateDetailContent, { kind: "RELATION" }> }) {
  return (
    <>
      <section className="plate-detail-section">
        <div className="plate-detail-heading">
          <span>{content.relationshipLabel}关系</span>
          <h2>{content.nickname ?? "关系记录"}</h2>
          <p>这份记录只观察双方结构，不评分，也不判断关系好坏。</p>
        </div>
        <div className="plate-detail-pair">
          <div><span>你 · {content.selfBirthDate}</span><b>{content.selfDay}</b></div>
          <i aria-hidden>↔</i>
          <div><span>对方 · {content.otherBirthDate}</span><b>{content.otherDay}</b></div>
        </div>
      </section>
      <ObservationList title="当时的三项关系观察" observations={content.observations} />
      <section className="plate-detail-section">
        <div className="plate-detail-heading"><span>双向作用摘要</span><h2>双方日柱怎样互相参照</h2></div>
        <ul className="plate-detail-lines">{content.interaction.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
      {content.jointAction && <ReadonlySuggestion
        eyebrow={`${content.jointAction.durationMinutes} 分钟共同动作`}
        title={content.jointAction.title}
        text={content.jointAction.text}
        doneWhen={content.jointAction.doneWhen}
      />}
    </>
  );
}

function HomeDetail({ content }: { content: Extract<PlateDetailContent, { kind: "HOME" }> }) {
  return (
    <>
      <section className="plate-detail-section">
        <div className="plate-detail-heading"><span>当时确认的空间</span><h2>{content.areas.length} 处区域参与判断</h2></div>
        {content.areas.length ? <div className="plate-detail-area-grid">
          {content.areas.map(area => <article key={area.id}>
            <h3>{area.label}</h3>
            {area.issues.length
              ? <ul>{area.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>
              : <p>已检查，没有当时列出的情况</p>}
          </article>)}
        </div> : <p className="plate-detail-empty-copy">当时没有确认任何区域。</p>}
        <p className="plate-detail-note">{content.coverageNote}</p>
      </section>
      <section className="plate-detail-section">
        <div className="plate-detail-heading"><span>当时的优先判断</span><h2>{content.priority?.title ?? homeStatusTitle(content.status)}</h2></div>
        {content.priority
          ? <div className="plate-detail-priority"><b>{content.priority.area} · {content.priority.issue}</b><p>{content.priority.reason}</p></div>
          : <p className="plate-detail-empty-copy">{content.status === "clear" ? "已检查区域暂未见上述问题。" : "当时资料不足，没有生成优先项。"}</p>}
      </section>
      {content.action && <ReadonlySuggestion
        eyebrow={`${content.action.durationMinutes} 分钟行动`}
        title="当时可以怎么做"
        text={content.action.text}
        doneWhen={content.action.doneWhen}
        safety={content.action.requiresProfessional}
      />}
    </>
  );
}

function TimingDetail({ content }: { content: Extract<PlateDetailContent, { kind: "TIMING" }> }) {
  return (
    <>
      <section className="plate-detail-section">
        <div className="plate-detail-heading">
          <span>{content.eventLabel}</span>
          <h2>从 {content.startDate} 起比较 {content.rangeDays} 天</h2>
          <p>{content.selectedDate ? `当时选中 ${content.selectedDate}` : "当时未选出候选日期"}</p>
        </div>
        {content.candidates.length ? <div className="plate-detail-candidates">
          {content.candidates.map(candidate => <article key={candidate.date} className={candidate.date === content.selectedDate ? "is-selected" : ""}>
            <header><span>{candidate.weekday}</span><h3>{candidate.date}</h3></header>
            <p>{candidate.why}</p>
            <dl>
              <div><dt>事项对应</dt><dd>{candidate.fit}</dd></div>
              <div><dt>现实确认</dt><dd>{candidate.confirmBefore}</dd></div>
              <div><dt>当前限制</dt><dd>{candidate.limitation}</dd></div>
            </dl>
            <div className="plate-detail-candidate-action">
              <b>{candidate.action.durationMinutes} 分钟准备动作</b>
              <p>{candidate.action.text}</p>
              <small>完成标准：{candidate.action.doneWhen}</small>
            </div>
            <details><summary>查看当时候选依据</summary><ul>{candidate.evidence.map(item => <li key={item}>{item}</li>)}</ul></details>
          </article>)}
        </div> : <div className="plate-detail-empty-copy">
          <b>{content.status === "insufficient" ? "当时资料不足" : "当时没有候选日期"}</b>
          {content.insufficientReason && <p>{content.insufficientReason}</p>}
        </div>}
        <p className="plate-detail-note">{content.boundary}</p>
      </section>
    </>
  );
}

function ObservationList({
  title,
  observations
}: {
  title: string;
  observations: Extract<PlateDetailContent, { kind: "BAZI" | "RELATION" }>["observations"];
}) {
  return (
    <section className="plate-detail-section">
      <div className="plate-detail-heading"><span>当时结果</span><h2>{title}</h2></div>
      <div className="plate-detail-observations">
        {observations.map((item, index) => <article key={`${item.title}-${index}`}>
          <header><span>0{index + 1}</span><h3>{item.title}</h3></header>
          <p>{item.conclusion}</p>
          <dl>
            <div><dt>什么时候明显</dt><dd>{item.trigger}</dd></div>
            <div><dt>可能的优势</dt><dd>{item.strength}</dd></div>
            <div><dt>容易卡住</dt><dd>{item.watchout}</dd></div>
            <div><dt>当时建议</dt><dd>{item.action}</dd></div>
          </dl>
          {item.limitation && <small>{item.limitation}</small>}
        </article>)}
      </div>
    </section>
  );
}

function ReadonlySuggestion({
  eyebrow,
  title,
  text,
  doneWhen,
  safety = false
}: {
  eyebrow: string;
  title: string;
  text: string;
  doneWhen?: string;
  safety?: boolean;
}) {
  return (
    <section className={`plate-detail-suggestion${safety ? " is-safety" : ""}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {doneWhen && <div><b>完成标准</b><p>{doneWhen}</p></div>}
      {safety && <small>涉及安全问题时，应暂停相关使用并交由物业或合格专业人员处理，不自行拆改。</small>}
    </section>
  );
}

function homeStatusTitle(status: "insufficient" | "priority" | "clear") {
  return status === "clear" ? "已检查区域暂未见上述问题" : status === "insufficient" ? "当时资料不足" : "当时优先项暂无法展示";
}
