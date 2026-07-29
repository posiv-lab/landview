import "server-only";

import { requireSupabaseServerClient } from "@/lib/supabase/server";

export type ActionTokenPurpose =
  | "verify_email"
  | "reset_password"
  | "change_email";

export async function replaceActionToken(input: {
  userId: string;
  purpose: ActionTokenPurpose;
  tokenHash: string;
  expiresAt: string;
}) {
  const supabase = requireSupabaseServerClient();
  const { error: invalidateError } = await supabase
    .from("user_action_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", input.userId)
    .eq("purpose", input.purpose)
    .is("used_at", null);

  if (invalidateError) {
    throw invalidateError;
  }

  const { error } = await supabase.from("user_action_tokens").insert({
    user_id: input.userId,
    purpose: input.purpose,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
  });

  if (error) {
    throw error;
  }
}

export async function consumeActionToken(
  tokenHash: string,
  purpose: ActionTokenPurpose,
) {
  const supabase = requireSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_action_tokens")
    .select("id,user_id,expires_at,used_at")
    .eq("token_hash", tokenHash)
    .eq("purpose", purpose)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const { data: consumed, error: consumeError } = await supabase
    .from("user_action_tokens")
    .update({ used_at: now })
    .eq("id", data.id)
    .is("used_at", null)
    .select("user_id")
    .maybeSingle();

  if (consumeError) {
    throw consumeError;
  }

  return consumed ? { userId: String(consumed.user_id) } : null;
}
