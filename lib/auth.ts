import { createClient } from "@/lib/supabase/server";

// Route Handler 用：Cookie のセッション（JWT）を検証し、ログイン中のユーザー ID を返す
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  return data.claims.sub;
}

export function unauthorized() {
  return Response.json({ error: "ログインが必要です" }, { status: 401 });
}
