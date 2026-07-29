import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-response";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { destroyCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  try {
    await destroyCurrentSession();
    return NextResponse.json({ message: "로그아웃되었습니다." });
  } catch (error) {
    console.error("로그아웃 처리 실패", error);
    return jsonError("로그아웃을 처리하지 못했습니다.", 500);
  }
}
