import { createBrowserClient } from "@supabase/ssr";

// ブラウザ（クライアントコンポーネント）用。セッションは Cookie に保存され、proxy.ts から読める
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
