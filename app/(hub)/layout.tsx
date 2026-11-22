import Image from "next/image";
import Link from "next/link";
import { SideMenu, PhoneBar } from "@/components/SideMenu";
import { signOut } from "@/app/actions";
import { QUICK_LINKS } from "@/lib/constants";
import { TZ } from "@/lib/dates";

const lastUpdated = new Date(process.env.NEXT_PUBLIC_BUILD_TIME ?? Date.now()).toLocaleString("en-US", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SideMenu lastUpdated={lastUpdated}>
        <p className="mb-1 font-semibold uppercase tracking-wide text-stone-500">Quick links</p>
        <div className="mb-3 grid grid-cols-2 gap-1">
          {QUICK_LINKS.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 hover:bg-charcoal-lighter hover:text-gold-light">
              {l.label} ↗
            </a>
          ))}
        </div>
        <form action={signOut}>
          <button className="text-stone-400 underline hover:text-gold-light">Sign out</button>
        </form>
      </SideMenu>

      {/* Phone header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-charcoal px-4 py-2 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={40} height={30} />
          <span className="font-bold text-gold">Steve&apos;s Hub</span>
        </Link>
      </header>

      <main className="px-4 pb-28 pt-5 md:ml-60 md:px-10 md:pb-12 md:pt-8">
        <div className="mx-auto max-w-5xl">{children}</div>
        <p className="mt-10 text-center text-xs text-stone-400 md:hidden">Last updated: {lastUpdated}</p>
      </main>
      <PhoneBar />
    </div>
  );
}
