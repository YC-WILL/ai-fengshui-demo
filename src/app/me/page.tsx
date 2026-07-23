import Link from "next/link";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/config/brand";
import AccountDrawer from "./AccountDrawer";
import BirthProfileCard from "./BirthProfileCard";
import { buildBirthVisual } from "@/lib/domain/birthVisual";
import { dateKeyInTimeZone } from "@/lib/time";
import { REPORT_TYPE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

// 新一代“我的记录”从此版本开始归档，旧报告与旧签文不进入新界面。
const RECORDS_V2_START = new Date("2026-07-23T12:40:00.000Z");

const RECORD_CATEGORIES = [
  {
    id: "bazi",
    title: "八字记录",
    mark: "命",
    eyebrow: "识己",
    description: "生辰盘、四柱结构与每次生成的八字报告",
    href: "/bazi",
    action: "查看八字盘",
    reportTypes: ["bazi_basic", "bazi_deep"]
  },
  {
    id: "relation",
    title: "关系记录",
    mark: "合",
    eyebrow: "观合",
    description: "两个人的互动观察与关系报告",
    href: "/marriage",
    action: "新建关系盘",
    reportTypes: ["marriage_basic", "marriage_deep"]
  },
  {
    id: "home",
    title: "宅居记录",
    mark: "宅",
    eyebrow: "安居",
    description: "住宅情况、处理建议与空间报告",
    href: "/fengshui",
    action: "查看宅居盘",
    reportTypes: ["home_fengshui_basic", "home_fengshui_deep"]
  },
  {
    id: "timing",
    title: "择日记录",
    mark: "时",
    eyebrow: "择时",
    description: "事项候选、日期比较与择日报告",
    href: "/date-selection",
    action: "新建择时盘",
    reportTypes: ["date_selection_basic", "date_selection"]
  }
] as const;

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
  const [reports, signRecords, hexagram] = await Promise.all([
    prisma.report.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: RECORDS_V2_START },
        reportType: {
          in: RECORD_CATEGORIES.flatMap(category => [...category.reportTypes])
        }
      },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        reportType: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.report.findMany({
      where: {
        userId: user.id,
        reportType: "daily_sign",
        createdAt: { gte: RECORDS_V2_START }
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
  const categoryRecords = RECORD_CATEGORIES.map(category => {
    const items = reports.filter(report => category.reportTypes.includes(report.reportType as never));
    return { ...category, records: items };
  });
  const totalRecordCount = categoryRecords.reduce((total, category) => total + category.records.length, 0) + signs.length;
  const latestActivity = [
    ...categoryRecords.flatMap(category => category.records.map(record => record.createdAt)),
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
          <div><span>已保存</span><strong>{totalRecordCount}</strong><small>条记录</small></div>
          <div><span>最近更新</span><b>{latestActivity ? formatChinaDateTime(latestActivity, false) : "还没有记录"}</b></div>
        </div>
      </header>

      <nav className="me-record-overview" aria-label="我的五类记录">
        {categoryRecords.map(category => (
          <Link key={category.id} href={`#records-${category.id}`} className={`me-record-overview-card is-${category.id}`}>
            <span className="me-record-overview-mark" aria-hidden>{category.mark}</span>
            <span className="me-record-overview-copy">
              <small>{category.eyebrow}</small>
              <b>{category.title}</b>
              <em>{category.records.length} 条</em>
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
          <p>记录按中国时间倒序排列；点击记录可回看完整内容。</p>
        </div>
        <div className="me-archive-grid">
          {categoryRecords.map(category => (
            <article key={category.id} id={`records-${category.id}`} className={`me-archive-card is-${category.id}`}>
              <header>
                <span aria-hidden>{category.mark}</span>
                <div><small>{category.eyebrow}</small><h3>{category.title}</h3></div>
                <b>{category.records.length}</b>
              </header>
              <p>{category.description}</p>
              {category.records.length ? (
                <ul>
                  {category.records.slice(0, 4).map(record => (
                    <li key={record.id}>
                      <div>
                        <b>{REPORT_TYPE_LABEL[record.reportType as keyof typeof REPORT_TYPE_LABEL]}</b>
                        <time dateTime={record.createdAt.toISOString()}>{formatChinaDateTime(record.createdAt)}</time>
                      </div>
                      <Link href={`/reports/${record.id}`}>{reportStatusLabel(record.status)} →</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="me-archive-empty"><span>暂无记录</span><small>从对应盘开始，完成后会自动归档在这里。</small></div>
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

function formatChinaDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}

function formatChinaDateTime(date: Date, includeTime = true): string {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  });
}

function reportStatusLabel(status: string): string {
  if (status === "generated" || status === "paid") return "查看";
  if (status === "blocked") return "查看说明";
  if (status === "failed") return "未完成";
  return "整理中";
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
