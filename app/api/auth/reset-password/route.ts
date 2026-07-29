import { NextResponse } from "next/server";

import { consumeActionToken } from "@/data-access/action-tokens";
import { revokeAllUserSessions } from "@/data-access/sessions";
import { updateUserPassword } from "@/data-access/users";
import { jsonError, validationError } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  getRequestFingerprint,
  isSameOriginRequest,
} from "@/lib/auth/request-security";
import { hashToken } from "@/lib/auth/tokens";
import { resetPasswordSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError("요청 형식을 확인해주세요.", 400);
  }

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const { ip } = getRequestFingerprint(request);
    const rateLimit = await consumeRateLimit(
      `reset:${hashToken(`${ip}:${parsed.data.token}`)}`,
      8,
      60 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return jsonError("재설정 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const actionToken = await consumeActionToken(
      hashToken(parsed.data.token),
      "reset_password",
    );

    if (!actionToken) {
      return jsonError("재설정 링크가 만료되었거나 이미 사용되었습니다.", 400);
    }

    await updateUserPassword(actionToken.userId, passwordHash);
    await revokeAllUserSessions(actionToken.userId);

    return NextResponse.json({
      message: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.",
    });
  } catch (error) {
    console.error("비밀번호 재설정 실패", error);
    return jsonError("비밀번호를 변경하지 못했습니다.", 500);
  }
}
