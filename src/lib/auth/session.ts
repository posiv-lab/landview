import "server-only";

import { cookies } from "next/headers";

import {
  findActiveSession,
  insertSession,
  revokeSessionByTokenHash,
  touchSession,
} from "@/data-access/sessions";
import { findUserById, type UserRecord } from "@/data-access/users";
import { createOpaqueToken, hashMetadata, hashToken } from "@/lib/auth/tokens";

export type SessionUser = Pick<UserRecord, "id" | "email" | "nickname" | "role">;

function getSessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-landview_session"
    : "landview_session";
}

function getSessionTtlDays() {
  const value = Number(process.env.AUTH_SESSION_TTL_DAYS ?? "14");
  return Number.isFinite(value) && value >= 1 && value <= 90 ? value : 14;
}

export async function createUserSession(input: {
  userId: string;
  ip: string;
  userAgent: string;
}) {
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + getSessionTtlDays() * 24 * 60 * 60 * 1000,
  );

  await insertSession({
    userId: input.userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    ipHash: hashMetadata(input.ip),
    userAgentHash: hashMetadata(input.userAgent),
  });

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  const session = await findActiveSession(hashToken(token));

  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);

  if (
    !user ||
    user.status !== "active" ||
    !user.emailVerifiedAt ||
    new Date(user.passwordChangedAt) > new Date(session.createdAt)
  ) {
    return null;
  }

  void touchSession(session.id).catch(() => undefined);

  return {
    sessionId: session.id,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    } satisfies SessionUser,
  };
}

export async function getCurrentUser() {
  try {
    return (await getCurrentSession())?.user ?? null;
  } catch {
    return null;
  }
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  try {
    if (token) {
      await revokeSessionByTokenHash(hashToken(token));
    }
  } finally {
    cookieStore.delete(getSessionCookieName());
  }
}
