import { NextResponse } from "next/server";
import {
  SignAccessDeniedError,
  SignConversationLimitError,
  SignKnowledgeUnavailableError,
  SignNotFoundError
} from "./service";

export function signErrorResponse(error: unknown) {
  if (error instanceof SignAccessDeniedError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }
  if (error instanceof SignNotFoundError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  }
  if (error instanceof SignConversationLimitError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  }
  if (error instanceof SignKnowledgeUnavailableError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  const message = error instanceof Error ? error.message : "";
  const databaseError = /prisma|database|datasource|DATABASE_URL|connect|P100/i.test(message);
  return NextResponse.json(
    {
      ok: false,
      error: databaseError
        ? "安签保存服务暂时不可用，请稍后再试。"
        : "安签服务暂时不可用，请稍后再试。"
    },
    { status: databaseError ? 503 : 500 }
  );
}
