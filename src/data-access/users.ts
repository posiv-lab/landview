import "server-only";

import { requireSupabaseServerClient } from "@/lib/supabase/server";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  role: "member" | "moderator" | "admin";
  status: "pending" | "active" | "suspended" | "deleted";
  emailVerifiedAt: string | null;
  passwordChangedAt: string;
};

const USER_COLUMNS =
  "id,email,password_hash,nickname,role,status,email_verified_at,password_changed_at";

function toUserRecord(data: Record<string, unknown>): UserRecord {
  return {
    id: String(data.id),
    email: String(data.email),
    passwordHash: String(data.password_hash),
    nickname: String(data.nickname),
    role: data.role as UserRecord["role"],
    status: data.status as UserRecord["status"],
    emailVerifiedAt: data.email_verified_at
      ? String(data.email_verified_at)
      : null,
    passwordChangedAt: String(data.password_changed_at),
  };
}

export async function findUserByEmail(email: string) {
  const { data, error } = await requireSupabaseServerClient()
    .from("users")
    .select(USER_COLUMNS)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toUserRecord(data) : null;
}

export async function findUserById(id: string) {
  const { data, error } = await requireSupabaseServerClient()
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toUserRecord(data) : null;
}

export async function createPendingUser(input: {
  email: string;
  passwordHash: string;
  nickname: string;
}) {
  const agreedAt = new Date().toISOString();
  const { data, error } = await requireSupabaseServerClient()
    .from("users")
    .insert({
      email: input.email,
      password_hash: input.passwordHash,
      nickname: input.nickname,
      terms_agreed_at: agreedAt,
      privacy_agreed_at: agreedAt,
    })
    .select(USER_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return toUserRecord(data);
}

export async function refreshPendingUser(
  userId: string,
  input: { passwordHash: string; nickname: string },
) {
  const agreedAt = new Date().toISOString();
  const { error } = await requireSupabaseServerClient()
    .from("users")
    .update({
      password_hash: input.passwordHash,
      nickname: input.nickname,
      terms_agreed_at: agreedAt,
      privacy_agreed_at: agreedAt,
    })
    .eq("id", userId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

export async function activateUser(userId: string) {
  const now = new Date().toISOString();
  const { error } = await requireSupabaseServerClient()
    .from("users")
    .update({
      status: "active",
      email_verified_at: now,
    })
    .eq("id", userId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

export async function markLogin(userId: string) {
  const { error } = await requireSupabaseServerClient()
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const now = new Date().toISOString();
  const { error } = await requireSupabaseServerClient()
    .from("users")
    .update({
      password_hash: passwordHash,
      password_changed_at: now,
    })
    .eq("id", userId)
    .eq("status", "active");

  if (error) {
    throw error;
  }
}
