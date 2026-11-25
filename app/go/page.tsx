import type { Metadata } from "next";
import Image from "next/image";
import { LandingForm } from "./LandingForm";

export const metadata: Metadata = {
  title: "Royalty Real Estate Boutique · Buy or Sell in Orlando",
  description: "Buying or selling a home in the Orlando area? Tell us how to reach you and Steve will call you.",
  openGraph: { title: "Buying or selling in Orlando?", description: "Talk with Steve at Royalty Real Estate Boutique.", images: ["/logo.png"] },
};

// Public landing page for ads and QR codes: /go?src=facebook, /go?src=instagram, /go?src=qr
export default async function Landing({ searchParams }: { searchParams: Promise<{ src?: string; utm_source?: string }> }) {
  const sp = await searchParams;
  const src = sp.src ?? sp.utm_source ?? "";
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <Image src="/logo.png" alt="Royalty Real Estate Boutique" width={220} height={166} priority className="h-auto w-40 sm:w-56" />
        <h1 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">
          Buying or selling <span className="text-gold">in Orlando?</span>
        </h1>
        <p className="mt-3 text-lg text-stone-300">Tap one to get started. It only takes a minute.</p>
        <div className="mt-8 w-full">
          <LandingForm src={src} />
        </div>
        <footer className="mt-12 space-y-1 text-sm text-stone-500">
          <p>Royalty Real Estate Boutique</p>
          <p>
            <a href="https://royaltyreb.com" className="text-gold hover:underline">royaltyreb.com</a> · <a href="/privacy" className="hover:underline">Privacy</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
