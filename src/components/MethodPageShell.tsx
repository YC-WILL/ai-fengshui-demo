import Link from "next/link";
import { METHOD_MODULES } from "@/lib/product/methodUi";

export default function MethodPageShell({
  current,
  title,
  lead,
  basis,
  status,
  stages,
  children
}: {
  current: (typeof METHOD_MODULES)[number]["id"];
  title: string;
  lead: string;
  basis: string;
  status?: string;
  stages?: readonly [string, string, string];
  children: React.ReactNode;
}) {
  const currentModule = METHOD_MODULES.find(module => module.id === current);

  return (
    <div className={`method-page method-page-${current} space-y-5`}>
      <nav className="method-local-nav" aria-label="四盘切换">
        {METHOD_MODULES.map(module => (
          <Link key={module.id} href={module.href} aria-current={module.id === current ? "page" : undefined}>
            {module.title}
          </Link>
        ))}
      </nav>
      {status && stages ? <header className="method-page-hero">
        <div className="method-page-meta">
          <span>{basis}</span>
          {status && <b>{status}</b>}
        </div>
        <div className="method-page-intro">
          <div>
            <h1>{title}</h1>
            <div className="method-page-lead">
              <span>这一盘怎么看</span>
              <p>{lead}</p>
            </div>
          </div>
          <Link href="/me" className="method-saved-link"><span>我的</span><b>查看个人资料</b><i aria-hidden>→</i></Link>
        </div>
        {stages && <ol className="method-reading-path" aria-label="本页阅读顺序">
          {stages.map((stage, index) => <li key={stage}><span>0{index + 1}</span><b>{stage}</b></li>)}
        </ol>}
      </header> : <header className="method-page-heading">
        <div>
          <div className="section-kicker">{basis}</div>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/60">{lead}</p>
        </div>
        <Link href="/me" className="btn-secondary shrink-0">查看个人资料</Link>
      </header>}
      <div id={`${current}-input`} className="method-workspace-anchor">
        {children}
      </div>
      <section className="method-completion-actions" aria-labelledby={`${current}-completion-title`}>
        <div>
          <span className="section-kicker">完成这一盘后</span>
          <h2 id={`${current}-completion-title`}>下一步由你决定</h2>
          <p>可以回到四盘总览，也可以回到本页开头调整当前资料。</p>
        </div>
        <nav aria-label={`${currentModule?.title ?? title}后续操作`}>
          <Link href="/#method-entry-title" className="btn-primary">返回四盘总览</Link>
          <a href={`#${current}-input`} className="btn-secondary">重新调整当前输入</a>
        </nav>
      </section>
      <p className="px-1 text-[11px] leading-5 text-ink/45">
        传统文化与民俗参考，不作绝对预测，也不作为医疗、法律、投资或重大人生决定的唯一依据。
      </p>
    </div>
  );
}
