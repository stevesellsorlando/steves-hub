"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SIDE_MENU, PHONE_BAR } from "./nav";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SideMenu({ lastUpdated, children }: { lastUpdated: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-charcoal text-stone-200 md:flex">
      <Link href="/" className="flex flex-col items-center border-b border-charcoal-lighter px-4 py-5">
        <Image src="/logo.png" alt="Royalty Real Estate Boutique" width={120} height={90} priority />
        <span className="mt-2 text-lg font-bold tracking-wide text-gold">Steve&apos;s Hub</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SIDE_MENU.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition ${
                active ? "bg-gold text-charcoal" : "hover:bg-charcoal-lighter hover:text-gold-light"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-charcoal-lighter px-4 py-3 text-xs text-stone-400">
        {children}
        <p className="mt-2">Last updated: {lastUpdated}</p>
      </div>
    </aside>
  );
}

export function PhoneBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-charcoal-lighter bg-charcoal pb-[env(safe-area-inset-bottom)] md:hidden">
      {PHONE_BAR.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-2 text-xs font-medium ${active ? "text-gold" : "text-stone-300"}`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
