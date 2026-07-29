import "server-only";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

export class AuthenticationRequiredError extends Error {}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationRequiredError("로그인이 필요합니다.");
  }

  return user;
}
