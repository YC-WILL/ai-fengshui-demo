import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card text-center py-12">
      <div className="font-serif text-3xl mb-2">页面不存在</div>
      <p className="text-sm text-ink/60 mb-4">您访问的报告或页面可能已被删除，或链接错误。</p>
      <Link href="/" className="btn-primary">回到首页</Link>
    </div>
  );
}
