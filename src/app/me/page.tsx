import Link from "next/link";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/config/brand";
import AccountDrawer from "./AccountDrawer";
import BirthProfileCard from "./BirthProfileCard";
import { buildBirthVisual } from "@/lib/domain/birthVisual";
import { dateKeyInTimeZone } from "@/lib/time";
import {
  PLATE_LABELS,
  formatChinaDateTime,
  presentPlateArchive,
  type PlateArchiveItem
} from "@/lib/platePresentation";
import type { PlateType } from "@/lib/plateRecords";
import PlateRecordActions from "./PlateRecordActions";

export const dynamic = "force-dynamic";

// 求签继续保持原有读取边界；四盘归档只读取 PlateSnapshot。
const LEGACY_SIGN_START = new Date("2026-07-23T12:40:00.000Z");
const PLATE_ARCHIVE_LIMIT = 100;

const RECORD_CATEGORIES = [
  {
    id: "bazi",
    plateType: "BAZI",
    description: "明确点击保存的生辰盘、生活观察与当时时间对照",
    action: "前往八字盘"
  },
  {
    id: "relation",
    plateType: "RELATION",
    description: "明确点击保存的双方互动观察与关系结构",
    action: "前往关系盘"
  },
  {
    id: "home",
    plateType: "HOME",
    description: "明确点击保存的真实空间情况与处理建议",
    action: "前往宅居盘"
  },
  {
    id: "timing",
    plateType: "TIMING",
    description: "明确点击保存的事项、日期范围与当时候选",
    action: "前往择时盘"
  }
] as const satisfies ReadonlyArray<{
  id: string;
  plateType: PlateType;
  description: string;
  action: string;
}>;

export default async function MePage() {
  const user = await getOrCreateUser();
  const now = new Date();
  const chinaToday = formatChinaDate(now);
  const birthVisual = user.profile?.birthDate
    ? buildBirthVisual({
        birthDate: user.profile.birthDate,
        birthTime: user.profile.birthTime,
        birthLocation: user.profile.birthLocation,
        timezone: user.profile.timezone
      }, dateKeyInTimeZone())
    : null;
  const [plateSnapshots, plateSnapshotCount, plateCounts, signRecords, hexagram] = await Promise.all([
    prisma.plateSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: PLATE_ARCHIVE_LIMIT,
      select: {
        id: true,
        plateType: true,
        protocolVersion: true,
        engineVersion: true,
        inputSnapshot: true,
        resultSnapshot: true,
        resultDate: true,
        calculatedAt: true,
        action: { select: { id: true, status: true, createdAt: true } },
        createdAt: true
      }
    }),
    prisma.plateSnapshot.count({ where: { userId: user.id } }),
    prisma.plateSnapshot.groupBy({
      by: ["plateType"],
      where: { userId: user.id },
      _count: { _all: true }
    }),
    prisma.report.findMany({
      where: {
        userId: user.id,
        reportType: "daily_sign",
        createdAt: { gte: LEGACY_SIGN_START }
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, aiResult: true, createdAt: true }
    }),
    birthVisual
      ? prisma.zhouyiHexagram.findFirst({
          where: {
            lowerTrigramId: birthVisual.bodyTrigram.id,
            upperTrigramId: birthVisual.useTrigram.id,
            isActive: true
          },
          select: { number: true, name: true, symbol: true, binary: true }
        })
      : Promise.resolve(null)
  ]);
  const signs = signRecords.flatMap(record => {
    const snapshot = parseLegacySignSnapshot(record.aiResult);
    return snapshot ? [{ ...record, ...snapshot }] : [];
  });
  const archiveItems = plateSnapshots.map(snapshot => presentPlateArchive(snapshot));
  const categoryRecords = RECORD_CATEGORIES.map(category => {
    const labels = PLATE_LABELS[category.plateType];
    const records = archiveItems.filter(record => record.plateType === category.plateType);
    const totalCount = plateCounts.find(item => item.plateType === category.plateType)?._count._all ?? 0;
    return { ...category, ...labels, records, totalCount };
  });
  const latestActivity = [
    ...plateSnapshots.map(record => record.createdAt),
    ...signs.map(sign => sign.createdAt)
  ].sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <div className="me-dashboard space-y-6">
      <header className="me-dashboard-hero">
        <div className="me-dashboard-hero-copy">
          <span>我的 · {brand.brandFullName}</span>
          <h1>{user.nickname ? `${user.nickname}的个人档案` : "你的个人档案"}</h1>
          <p>{chinaToday} · 所有记录时间均按中国标准时间显示</p>
          <AccountDrawer email={user.email} nickname={user.nickname} />
        </div>
        <div className="me-dashboard-hero-meta">
          <div className="me-dashboard-seal" aria-hidden>安</div>
          <div><span>已保存</span><strong>{plateSnapshotCount}</strong><small>条四盘记录</small></div>
          <div><span>最近更新</span><b>{latestActivity ? formatChinaDateTime(latestActivity) : "还没有记录"}</b></div>
        </div>
      </header>

      <nav className="me-record-overview" aria-label="我的五类记录">
        {categoryRecords.map(category => (
          <Link key={category.id} href={`#records-${category.id}`} className={`me-record-overview-card is-${category.id}`}>
            <span className="me-record-overview-mark" aria-hidden>{category.mark}</span>
            <span className="me-record-overview-copy">
              <small>{category.eyebrow}</small>
              <b>{category.title}</b>
              <em>{category.totalCount} 条</em>
            </span>
            <i aria-hidden>→</i>
          </Link>
        ))}
        <Link href="#signs" className="me-record-overview-card is-sign">
          <span className="me-record-overview-mark" aria-hidden>签</span>
          <span className="me-record-overview-copy">
            <small>问心</small>
            <b>求签记录</b>
            <em>{signs.length} 条</em>
          </span>
          <i aria-hidden>→</i>
        </Link>
      </nav>

      <section className="me-archive" aria-labelledby="me-archive-title">
        <div className="me-section-heading">
          <div><span>四盘归档</span><h2 id="me-archive-title">每一次查看，都留在对应的位置</h2></div>
          <p>点击保存后，这次查看会归档在这里；当前显示最近最多 {PLATE_ARCHIVE_LIMIT} 条。</p>
        </div>
        <div className="me-archive-grid">
          {categoryRecords.map(category => (
            <article key={category.id} id={`records-${category.id}`} className={`me-archive-card is-${category.id}`}>
              <header>
                <span aria-hidden>{category.mark}</span>
                <div><small>{category.eyebrow}</small><h3>{category.title}</h3></div>
                <b>{category.totalCount}</b>
              </header>
              <p>{category.description}</p>
              {category.records.length ? (
                <ul>
                  {category.records.map(record => (
                    <PlateArchiveRow key={record.id} record={record} />
                  ))}
                </ul>
              ) : (
                <div className="me-archive-empty">
                  <span>还没有保存记录</span>
                  <small>需要在对应盘明确点击“保存这次查看”，记录才会出现在这里。</small>
                </div>
              )}
              {category.totalCount > category.records.length && (
                <p className="me-archive-limit-note">
                  这一类共有 {category.totalCount} 条；本页显示最近查询到的 {category.records.length} 条。
                </p>
              )}
              <Link href={category.href} className="me-archive-action">{category.action}<span aria-hidden>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="me-profile-section" aria-labelledby="me-profile-title">
        <div className="me-section-heading">
          <div><span>基础档案</span><h2 id="me-profile-title">生辰资料与今日结构</h2></div>
          <p>生辰资料是八字盘和择时盘的共同基础。</p>
        </div>
        <BirthProfileCard profile={user.profile ? {
          gender: user.profile.gender,
          birthDate: user.profile.birthDate,
          birthTime: user.profile.birthTime,
          birthLocation: user.profile.birthLocation,
          timezone: user.profile.timezone
        } : null} visual={birthVisual && hexagram ? { ...birthVisual, hexagram } : null} />
      </section>

      <section id="signs" className="me-sign-archive scroll-mt-24">
        <div className="me-sign-archive-heading">
          <div>
            <span>问心 · 求签记录</span>
            <h2>收好每一次当下的回应</h2>
            <p>每支安签按中国时间倒序保存，不作吉凶预测。</p>
          </div>
          <Link href="/#daily-sign">去求一签 →</Link>
        </div>
        {signs.length === 0 ? (
          <div className="me-sign-empty">
            <span aria-hidden>签</span>
            <div><b>还没有求签记录</b><p>不必准备问题，收下一句适合此刻的话。</p></div>
            <Link href="/#daily-sign">现在去摇一摇</Link>
          </div>
        ) : (
          <ul className="me-sign-grid">
            {signs.map(sign => (
              <li key={sign.id}>
                <div className="me-sign-card-top">
                  <span>{sign.title}</span>
                  <small>{sign.periodLabel}</small>
                </div>
                <p>{sign.message}</p>
                <time dateTime={sign.createdAt.toISOString()}>
                  {formatChinaDateTime(sign.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}

function PlateArchiveRow({ record }: { record: PlateArchiveItem }) {
  return (
    <li className={!record.displayable ? "is-unavailable" : undefined}>
      <div>
        <b>{record.summary}</b>
        {record.secondary && <small>{record.secondary}</small>}
        <time dateTime={record.savedAtIso}>{record.savedAt}</time>
        {record.actionStatus && <em>{record.actionStatus}</em>}
      </div>
      <div className="me-archive-row-actions">
        <Link href={`/plate-records/${record.id}`}>查看记录</Link>
        <PlateRecordActions recordId={record.id} context="archive" />
      </div>
    </li>
  );
}

function formatChinaDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}

function parseLegacySignSnapshot(value: string | null): {
  title: string;
  message: string;
  periodLabel: string;
} | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      typeof parsed.word === "string" &&
      typeof parsed.message === "string" &&
      typeof parsed.periodLabel === "string"
    ) {
      return { title: parsed.word, message: parsed.message, periodLabel: parsed.periodLabel };
    }
  } catch {
    return null;
  }
  return null;
}
