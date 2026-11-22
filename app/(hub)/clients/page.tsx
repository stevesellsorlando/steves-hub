import { PeopleList } from "@/components/PeopleList";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const { q, stage } = await searchParams;
  return <PeopleList list="client" q={q} stage={stage} />;
}
