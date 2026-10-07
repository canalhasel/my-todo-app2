import { NextResponse } from "next/server";
import { getUserId, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TITLE_MAX_LENGTH, toTodoItem } from "@/lib/todos";

// ---- API の型（画面側は import type で使う） ----

export type TodoItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string; // ISO 8601
};

export type ApiError = { error: string };

export type GetTodosResponse = { todos: TodoItem[] };

export type CreateTodoRequest = { title: string };
export type CreateTodoResponse = { todo: TodoItem };

// ---- ハンドラー ----

// GET /api/todos : ログイン中ユーザーの TODO 一覧
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json<GetTodosResponse>({ todos: todos.map(toTodoItem) });
}

// POST /api/todos : TODO を追加
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = (await request.json().catch(() => null)) as Partial<CreateTodoRequest> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json<ApiError>({ error: "タイトルを入力してください" }, { status: 400 });
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json<ApiError>(
      { error: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください` },
      { status: 400 },
    );
  }

  const todo = await prisma.todo.create({ data: { userId, title } });

  return NextResponse.json<CreateTodoResponse>({ todo: toTodoItem(todo) }, { status: 201 });
}
