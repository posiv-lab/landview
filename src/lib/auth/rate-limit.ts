import "server-only";

import { requireSupabaseServerClient } from "@/lib/supabase/server";

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
) {
  const separatorIndex = key.indexOf(":");
  const action = separatorIndex > 0 ? key.slice(0, separatorIndex) : "request";
  const keyHash = separatorIndex > 0 ? key.slice(separatorIndex + 1) : key;
  const retryAfterSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const { data, error } = await requireSupabaseServerClient().rpc(
    "consume_auth_rate_limit",
    {
      p_action: action,
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: retryAfterSeconds,
    },
  );

  if (error) {
    throw error;
  }

  return {
    allowed: data === true,
    retryAfterSeconds,
  };
}
