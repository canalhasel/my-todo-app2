"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type {
  ApiError,
  CreateTodoRequest,
  CreateTodoResponse,
  GetTodosResponse,
  TodoItem,
} from "@/app/api/todos/route";
import type {
  DeleteTodoResponse,
  UpdateTodoRequest,
  UpdateTodoResponse,
} from "@/app/api/todos/[id]/route";
import { createClient } from "@/lib/supabase/client";
import { TITLE_MAX_LENGTH } from "@/lib/todos";

class UnauthorizedError extends Error {}

// API を呼び出し、失敗時は ApiError のメッセージで例外を投げる
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401) throw new UnauthorizedError("ログインが必要です");
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error ?? `エラーが発生しました（${res.status}）`);
  }
  return res.json() as Promise<T>;
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setErrorMessage] = useState("");

  // セッション切れならログイン画面へ、それ以外はメッセージを表示
  function handleError(e: unknown) {
    if (e instanceof UnauthorizedError) {
      router.replace("/login");
      return;
    }
    setErrorMessage(e instanceof Error ? e.message : String(e));
  }

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));

    api<GetTodosResponse>("/api/todos")
      .then((data) => setTodos(data.todos))
      .catch((e) => {
        if (e instanceof UnauthorizedError) router.replace("/login");
        else setErrorMessage((e as Error).message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setErrorMessage("");
    setAdding(true);
    try {
      const body: CreateTodoRequest = { title: trimmed };
      const { todo } = await api<CreateTodoResponse>("/api/todos", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTodos((prev) => [todo, ...prev]);
      setTitle("");
    } catch (e) {
      handleError(e);
    } finally {
      setAdding(false);
    }
  }

  // 画面を先に更新し、失敗したら元に戻す
  async function handleToggle(target: TodoItem) {
    const isCompleted = !target.isCompleted;
    setErrorMessage("");
    setTodos((prev) => prev.map((t) => (t.id === target.id ? { ...t, isCompleted } : t)));
    try {
      const body: UpdateTodoRequest = { isCompleted };
      const { todo } = await api<UpdateTodoResponse>(`/api/todos/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
    } catch (e) {
      setTodos((prev) => prev.map((t) => (t.id === target.id ? target : t)));
      handleError(e);
    }
  }

  async function handleDelete(target: TodoItem) {
    setErrorMessage("");
    const snapshot = todos;
    setTodos((prev) => prev.filter((t) => t.id !== target.id));
    try {
      await api<DeleteTodoResponse>(`/api/todos/${target.id}`, { method: "DELETE" });
    } catch (e) {
      setTodos(snapshot);
      handleError(e);
    }
  }

  const remaining = todos.filter((t) => !t.isCompleted).length;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/60">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <h1 className="shrink-0 text-lg font-semibold text-zinc-50">My TODO App</h1>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-zinc-400 sm:inline">{email}</span>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-60"
            >
              {signingOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </div>
        {/* スマホではメールアドレスを 2 行目に表示 */}
        {email && (
          <p className="truncate px-4 pb-2 text-xs text-zinc-500 sm:hidden">{email}</p>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/40 sm:p-6">
          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="やることを入力"
              aria-label="新しい TODO"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              type="submit"
              disabled={adding || !title.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "追加中..." : "追加"}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-500">読み込み中...</p>
            ) : todos.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                TODO はまだありません。上のフォームから追加しましょう。
              </p>
            ) : (
              <>
                <ul className="divide-y divide-zinc-800">
                  {todos.map((todo) => (
                    <li key={todo.id} className="flex items-center gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={todo.isCompleted}
                        onChange={() => handleToggle(todo)}
                        aria-label={`「${todo.title}」を完了にする`}
                        className="size-5 shrink-0 cursor-pointer accent-indigo-500"
                      />
                      <span
                        className={`min-w-0 flex-1 break-words ${
                          todo.isCompleted ? "text-zinc-500 line-through" : "text-zinc-100"
                        }`}
                      >
                        {todo.title}
                      </span>
                      <button
                        onClick={() => handleDelete(todo)}
                        aria-label={`「${todo.title}」を削除`}
                        className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-right text-xs text-zinc-500">
                  残り {remaining} 件 / 全 {todos.length} 件
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
