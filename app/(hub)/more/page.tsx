import Link from "next/link";
import { COMING_SOON, SIDE_MENU } from "@/components/nav";

export default function More() {
  const extra = Object.entries(COMING_SOON).filter(([slug]) => !SIDE_MENU.some((m) => m.href === `/${slug}`));
  const phoneOnly = SIDE_MENU.filter((m) => !["/", "/calendar", "/clients", "/probates", "/more"].includes(m.href));
  return (
    <div>
      <h1 className="h1 mb-5">More</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 md:hidden">
        {phoneOnly.map((m) => (
          <Link key={m.href} href={m.href} className="card flex items-center gap-3 py-4 hover:border-gold">
            <span className="text-2xl">{m.icon}</span><span className="font-semibold">{m.label}</span>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {extra.map(([slug, s]) => (
          <Link key={slug} href={`/${slug}`} className="card flex items-center gap-3 py-4 hover:border-gold">
            <span className="text-2xl">{s.icon}</span><span className="font-semibold">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
