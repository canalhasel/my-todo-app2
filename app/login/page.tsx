"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/app/_components/auth-form";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  // useSearchParams を使うため Suspense で囲む
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();

  // 確認メールのリンク処理に失敗したとき /api/auth/callback から ?error= 付きで戻ってくる
  const confirmFailed = useSearchParams().get("error") === "confirm_failed";

  return (
    <AuthForm
      title="ログイン"
      submitLabel="ログイン"
      pendingLabel="ログイン中..."
      passwordAutoComplete="current-password"
      footer={{ text: "アカウントをお持ちでない方は", linkLabel: "新規登録", href: "/signup" }}
      initialError={confirmFailed ? "メール確認に失敗しました。もう一度お試しください。" : undefined}
      onSubmit={async (email, password) => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return {
            error:
              error.code === "invalid_credentials"
                ? "メールアドレスまたはパスワードが正しくありません。"
                : error.code === "email_not_confirmed"
                  ? "メールアドレスの確認が完了していません。届いたメールのリンクを開いてください。"
                  : error.message,
          };
        }
        router.replace("/");
        router.refresh();
      }}
    />
  );
}
