export async function readReportResponse(response: Response): Promise<{ ok?: boolean; data?: { reportId?: string }; error?: string }> {
  const raw = await response.text();
  if (!raw.trim()) throw new Error("报告服务暂时没有返回内容，请稍后再试；如果持续出现，请检查本地数据库配置。");
  try {
    return JSON.parse(raw) as { ok?: boolean; data?: { reportId?: string }; error?: string };
  } catch {
    throw new Error("报告服务返回格式异常，请稍后再试。");
  }
}

export async function fetchReport(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 60_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("生成超过 60 秒仍未完成，请稍后重试；如果后台已完成，刷新‘我的报告’即可查看。");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}
