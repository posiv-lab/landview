import { NextResponse } from "next/server";

import { replaceActionToken } from "@/data-access/action-tokens";
import { findUserByEmail } from "@/data-access/users";
import { jsonError, validationError } from "@/lib/api-response";
import { sendAuthEmail } from "@/lib/auth/email";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  getRequestFingerprint,
  isSameOriginRequest,
} from "@/lib/auth/request-security";
import { createOpaqueToken, hashMetadata, hashToken } from "@/lib/auth/tokens";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "가입된 이메일이라면 비밀번호 재설정 안내를 보내드렸습니다.";

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

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { ip } = getRequestFingerprint(request);
  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(
      `forgot:${hashMetadata(`${ip}:${parsed.data.email}`)}`,
      4,
      30 * 60 * 1000,
    );
  } catch (error) {
    console.error("비밀번호 재설정 요청 제한 확인 실패", error);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
  if (!rateLimit.allowed) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  try {
    const user = await findUserByEmail(parsed.data.email);

    if (user?.status === "active" && user.emailVerifiedAt) {
      const token = createOpaqueToken();
      await replaceActionToken({
        userId: user.id,
        purpose: "reset_password",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      await sendAuthEmail({
        purpose: "reset",
        email: user.email,
        nickname: user.nickname,
        token,
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("비밀번호 재설정 메일 처리 실패", error);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
