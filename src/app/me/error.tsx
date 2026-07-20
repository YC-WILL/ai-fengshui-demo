"use client";

import { useEffect } from "react";

/**
 * 「我的」页面包含历史记录查询；本地数据库暂时不可用时，不能把
 * Next.js 的英文错误页直接暴露给用户。保留重试入口，避免用户误以为
 * 已保存的生辰和求签记录被删除。
 */
export default function MeError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[me] page failed", { message: error.message.slice(0, 200), digest: error.digest });
  }, [error]);

  return (
    <section className="card mx-auto max-w-xl text-center">
      <h1 className="font-serif text-xl text-ink">“我的”暂时打不开</h1>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        历史记录服务暂时不可用，你的生辰和求签记录不会因此消失。请稍后重试；如果一直无法打开，再检查本地数据服务配置。
      </p>
      <button type="button" className="btn-primary mt-5" onClick={() => reset()}>
        重新加载
      </button>
    </section>
  );
}
