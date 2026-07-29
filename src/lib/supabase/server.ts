import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  if (!supabaseServerClient) {
    supabaseServerClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseServerClient;
}

export function requireSupabaseServerClient(): SupabaseClient {
  const client = getSupabaseServerClient();

  if (!client) {
    throw new Error("Supabase 서버 환경변수가 설정되지 않았습니다.");
  }

  return client;
}
