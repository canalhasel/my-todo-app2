import { NextResponse } from "next/server";
import { getUserId, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toTodoItem } from "@/lib/todos";
import type { ApiError, TodoItem } from "../route";

// ---- API の型（画面側は import type で使う） ----

export type UpdateTodoRequest = { isCompleted: boolean };
export type UpdateTodoResponse = { todo: TodoItem };

export type DeleteTodoResponse = { id: string };

// ---- 共通 ----

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound() {
  return NextResponse.json<ApiError>({ error: "TODO が見つかりません" }, { status: 404 });
}

// ---- ハンドラー ----

// PATCH /api/todos/:id : 完了状態を切り替え
export async function PATCH(request: Request, ctx: RouteContext<"/api/todos/[id]">) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return notFound();

  const body = (await request.json().catch(() => null)) as Partial<UpdateTodoRequest> | null;
  if (typeof body?.isCompleted !== "boolean") {
    return NextResponse.json<ApiError>({ error: "isCompleted は true / false で指定してください" }, { status: 400 });
  }

  // user_id でも絞り込むので、他人の TODO は更新されない
  const [todo] = await prisma.todo.updateManyAndReturn({
    where: { id, userId },
    data: { isCompleted: body.isCompleted },
  });
  if (!todo) return notFound();

  return NextResponse.json<UpdateTodoResponse>({ todo: toTodoItem(todo) });
}

// DELETE /api/todos/:id : TODO を削除
export async function DELETE(_request: Request, ctx: RouteContext<"/api/todos/[id]">) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return notFound();

  const { count } = await prisma.todo.deleteMany({ where: { id, userId } });
  if (count === 0) return notFound();

  return NextResponse.json<DeleteTodoResponse>({ id });
}
