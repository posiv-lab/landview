import { NextResponse } from "next/server";

import { findUserByEmail, markLogin } from "@/data-access/users";
import { jsonError, validationError } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  getRequestFingerprint,
  isSameOriginRequest,
} from "@/lib/auth/request-security";
import { createUserSession } from "@/lib/auth/session";
import { hashMetadata } from "@/lib/auth/tokens";
import { loginSchema } from "@/lib/validation/auth";

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

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const fingerprint = getRequestFingerprint(request);
  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(
      `login:${hashMetadata(`${fingerprint.ip}:${parsed.data.email}`)}`,
      8,
      15 * 60 * 1000,
    );
  } catch (error) {
    console.error("로그인 요청 제한 확인 실패", error);
    return jsonError("회원 서비스 설정을 확인해주세요.", 503);
  }
  if (!rateLimit.allowed) {
    return jsonError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  try {
    const user = await findUserByEmail(parsed.data.email);
    const comparisonHash =
      user?.passwordHash ?? (await hashPassword("not-a-real-password-1234"));
    const passwordMatches = await verifyPassword(
      comparisonHash,
      parsed.data.password,
    );

    if (
      !user ||
      !passwordMatches ||
      user.status !== "active" ||
      !user.emailVerifiedAt
    ) {
      return jsonError("이메일 또는 비밀번호를 확인해주세요.", 401);
    }

    await createUserSession({
      userId: user.id,
      ip: fingerprint.ip,
      userAgent: fingerprint.userAgent,
    });
    await markLogin(user.id);

    return NextResponse.json({
      message: "로그인되었습니다.",
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("로그인 처리 실패", error);
    return jsonError("로그인을 처리하지 못했습니다.", 500);
  }
}
