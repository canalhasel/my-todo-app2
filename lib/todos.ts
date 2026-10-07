import type { TodoItem } from "@/app/api/todos/route";

export const TITLE_MAX_LENGTH = 200;

// Prisma の Todo を API レスポンス用（日時は ISO 文字列）に変換する
export function toTodoItem(todo: {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}): TodoItem {
  return {
    id: todo.id,
    title: todo.title,
    isCompleted: todo.isCompleted,
    createdAt: todo.createdAt.toISOString(),
  };
}
