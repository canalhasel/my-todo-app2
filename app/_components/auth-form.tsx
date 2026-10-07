"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Props = {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  footer: { text: string; linkLabel: string; href: string };
  // エラーメッセージを返すと表示、成功メッセージは info で返す
  onSubmit: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; info?: string } | void>;
  initialError?: string;
};

export function AuthForm({
  title,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
  footer,
  onSubmit,
  initialError,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setPending(true);
    const result = await onSubmit(email, password);
    setPending(false);
    if (result?.error) setError(result.error);
    if (result?.info) setInfo(result.info);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/40">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-50">
          {title}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-zinc-300">
            メールアドレス
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-zinc-300">
            パスワード
            <input
              type="password"
              required
              minLength={6}
              autoComplete={passwordAutoComplete}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {footer.text}{" "}
          <Link href={footer.href} className="font-medium text-indigo-400 hover:text-indigo-300">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
