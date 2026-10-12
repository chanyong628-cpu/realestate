import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createAnalyticsClient() {
  const url = process.env.ANALYTICS_SUPABASE_URL;
  const publishableKey = process.env.ANALYTICS_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("통계 Supabase 환경변수가 설정되지 않았습니다.");
  }
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getAnalyticsSharedSecret() {
  const secret = process.env.ANALYTICS_SHARED_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("통계 공유 비밀키가 설정되지 않았습니다.");
  }
  return secret;
}
