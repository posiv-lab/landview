import "server-only";

import { requireSupabaseServerClient } from "@/lib/supabase/server";

export async function insertSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgentHash?: string;
  ipHash?: string;
}) {
  const { error } = await requireSupabaseServerClient()
    .from("user_sessions")
    .insert({
      user_id: input.userId,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt,
      user_agent_hash: input.userAgentHash,
      ip_hash: input.ipHash,
    });

  if (error) {
    throw error;
  }
}

export async function findActiveSession(tokenHash: string) {
  const { data, error } = await requireSupabaseServerClient()
    .from("user_sessions")
    .select("id,user_id,created_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: String(data.id),
        userId: String(data.user_id),
        createdAt: String(data.created_at),
      }
    : null;
}

export async function touchSession(sessionId: string) {
  await requireSupabaseServerClient()
    .from("user_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function revokeSessionByTokenHash(tokenHash: string) {
  const { error } = await requireSupabaseServerClient()
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (error) {
    throw error;
  }
}

export async function revokeAllUserSessions(userId: string) {
  const { error } = await requireSupabaseServerClient()
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) {
    throw error;
  }
}
