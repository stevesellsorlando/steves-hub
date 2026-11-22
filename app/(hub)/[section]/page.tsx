import { notFound } from "next/navigation";
import { COMING_SOON } from "@/components/nav";

export default async function ComingSoon({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const s = COMING_SOON[section];
  if (!s) notFound();
  return (
    <div className="card mx-auto mt-6 max-w-xl text-center">
      <p className="text-5xl">{s.icon}</p>
      <h1 className="h1 mt-3">{s.label}</h1>
      <p className="mt-3 text-stone-600">{s.blurb}</p>
      <p className="mt-5 inline-block rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-gold-dark">Coming soon</p>
    </div>
  );
}
