import { redirect } from "next/navigation";

// "To-Do" is now "Tasks"
export default async function OldTodo({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  redirect(type ? `/tasks?type=${encodeURIComponent(type)}` : "/tasks");
}
