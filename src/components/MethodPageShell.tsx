import Link from "next/link";
import { METHOD_MODULES } from "@/lib/product/methodUi";

export default function MethodPageShell({
  current,
  title,
  lead,
  basis,
  children
}: {
  current: (typeof METHOD_MODULES)[number]["id"];
  title: string;
  lead: string;
  basis: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <nav className="method-local-nav" aria-label="四盘切换">
        {METHOD_MODULES.map(module => (
          <Link key={module.id} href={module.href} aria-current={module.id === current ? "page" : undefined}>
            {module.title}
          </Link>
        ))}
      </nav>
      <header className="method-page-heading">
        <div>
          <div className="section-kicker">{basis}</div>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/60">{lead}</p>
        </div>
        <Link href="/me" className="btn-secondary shrink-0">查看已保存内容</Link>
      </header>
      {children}
      <p className="px-1 text-[11px] leading-5 text-ink/45">
        传统文化与民俗参考，不作绝对预测，也不作为医疗、法律、投资或重大人生决定的唯一依据。
      </p>
    </div>
  );
}
