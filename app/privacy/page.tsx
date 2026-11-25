import Link from "next/link";

export const metadata = { title: "Privacy · Royalty Real Estate Boutique" };

// Plain-language privacy notice for the landing page. Have the broker review the wording.
export default function Privacy() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-stone-200">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold text-gold">Privacy</h1>
        <p>When you fill out our form, we collect your name, phone number and email address, and whether you&apos;re buying or selling.</p>
        <p>We use this only to contact you about buying or selling real estate. We don&apos;t sell your information.</p>
        <p>We may keep it in our customer records so we can follow up with you. You can ask us to stop contacting you, or to delete your information, at any time by replying to any message or contacting us through our website.</p>
        <p>
          <a href="https://royaltyreb.com" className="text-gold underline">royaltyreb.com</a>
        </p>
        <p><Link href="/go" className="text-gold underline">← Back</Link></p>
      </div>
    </main>
  );
}
