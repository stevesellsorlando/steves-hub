import { headers } from "next/headers";
import QRCode from "qrcode";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

const LINKS = [
  { key: "qr", label: "QR code", use: "Signs, flyers, open house sheets, business cards", src: "qr" },
  { key: "facebook", label: "Facebook ads", use: "Paste this as the website link in your Facebook ad", src: "facebook" },
  { key: "instagram", label: "Instagram ads", use: "Paste this as the website link in your Instagram ad or bio", src: "instagram" },
  { key: "plain", label: "Everything else", use: "Emails, texts, your website", src: "" },
];

export default async function Marketing() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const base = `https://${host}/go`;
  const items = await Promise.all(
    LINKS.map(async (l) => {
      const url = l.src ? `${base}?src=${l.src}` : base;
      const png = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      return { ...l, url, png };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">📣 Marketing</h1>
        <p className="text-stone-500">Your landing page for ads and QR codes. Every lead lands in your hub and Follow Up Boss, labeled with where it came from.</p>
      </div>

      <section className="card space-y-3">
        <h2 className="text-lg font-bold">Your landing page</h2>
        <div className="flex flex-wrap items-center gap-3">
          <a href={base} target="_blank" rel="noreferrer" className="btn-gold">Open it ↗</a>
          <code className="rounded-lg bg-stone-100 px-3 py-2">{base}</code>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((i) => (
          <section key={i.key} className="card space-y-3">
            <h2 className="text-lg font-bold">{i.label}</h2>
            <p className="text-sm text-stone-500">{i.use}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 break-all rounded-lg bg-stone-100 px-3 py-2 text-sm">{i.url}</code>
              <CopyButton text={i.url} />
            </div>
            {i.key === "qr" && (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.png} alt="QR code for your landing page" className="h-56 w-56 rounded-xl border border-stone-200" />
                <a href={i.png} download="royalty-landing-page-qr.png" className="btn-dark">⬇️ Download QR code</a>
                <p className="text-sm text-stone-500">Point your phone&apos;s camera at it to test. Print it at least 1 inch wide.</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
