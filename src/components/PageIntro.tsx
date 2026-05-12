// 各报告页顶部统一标题 / 副标题 / "不做什么" 提示三件套
export default function PageIntro({
  title, subtitle, avoid
}: {
  title: string;
  subtitle: string;
  avoid?: string[];
}) {
  return (
    <header>
      <h1 className="font-serif text-2xl mb-1">{title}</h1>
      <p className="text-sm text-ink/70 leading-7">{subtitle}</p>
      {avoid && avoid.length > 0 && (
        <div className="mt-2 inline-flex flex-wrap items-center gap-1 text-xs text-ink/55">
          <span className="text-ink/45">本报告不做：</span>
          {avoid.map(a => (
            <span key={a} className="px-2 py-0.5 rounded-full bg-mist/60 border border-mist text-ink/60">
              {a}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
