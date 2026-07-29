import { NextResponse } from "next/server";

import { replaceActionToken } from "@/data-access/action-tokens";
import {
  createPendingUser,
  findUserByEmail,
  refreshPendingUser,
} from "@/data-access/users";
import { jsonError, validationError } from "@/lib/api-response";
import { sendAuthEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import {
  getRequestFingerprint,
  isSameOriginRequest,
} from "@/lib/auth/request-security";
import { createOpaqueToken, hashMetadata, hashToken } from "@/lib/auth/tokens";
import { signupSchema } from "@/lib/validation/auth";

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

  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { ip } = getRequestFingerprint(request);
  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(
      `signup:${hashMetadata(`${ip}:${parsed.data.email}`)}`,
      4,
      15 * 60 * 1000,
    );
  } catch (error) {
    console.error("회원가입 요청 제한 확인 실패", error);
    return jsonError("회원 서비스 설정을 확인해주세요.", 503);
  }
  if (!rateLimit.allowed) {
    return jsonError("잠시 후 다시 시도해주세요.", 429, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
    });
  }

  try {
    const existing = await findUserByEmail(parsed.data.email);

    if (existing && existing.status !== "pending") {
      return jsonError("이미 가입된 이메일입니다.", 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user =
      existing ??
      (await createPendingUser({
        email: parsed.data.email,
        passwordHash,
        nickname: parsed.data.nickname,
      }));

    if (existing) {
      await refreshPendingUser(existing.id, {
        passwordHash,
        nickname: parsed.data.nickname,
      });
    }

    const token = createOpaqueToken();
    await replaceActionToken({
      userId: user.id,
      purpose: "verify_email",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    await sendAuthEmail({
      purpose: "verify",
      email: parsed.data.email,
      nickname: parsed.data.nickname,
      token,
    });

    return NextResponse.json(
      { message: "인증 메일을 보냈습니다. 메일함을 확인해주세요." },
      { status: 201 },
    );
  } catch (error) {
    console.error("회원가입 처리 실패", error);
    return jsonError(
      "회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
      500,
    );
  }
}
