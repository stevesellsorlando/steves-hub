import { PeopleList } from "@/components/PeopleList";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; page?: string }> }) {
  const { q, stage, page } = await searchParams;
  return <PeopleList list="expired" q={q} stage={stage} page={Number(page) || 1} />;
}
