"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/app/_components/auth-form";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  return (
    <AuthForm
      title="新規登録"
      submitLabel="登録する"
      pendingLabel="登録中..."
      passwordAutoComplete="new-password"
      footer={{ text: "すでにアカウントをお持ちの方は", linkLabel: "ログイン", href: "/login" }}
      onSubmit={async (email, password) => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) {
          return {
            error:
              error.code === "user_already_exists"
                ? "このメールアドレスはすでに登録されています。"
                : error.code === "weak_password"
                  ? "パスワードが弱すぎます。6文字以上で設定してください。"
                  : error.message,
          };
        }
        // メール確認が無効な設定ならその場でログイン済みになる
        if (data.session) {
          router.replace("/");
          router.refresh();
          return;
        }
        return {
          info: "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。",
        };
      }}
    />
  );
}
