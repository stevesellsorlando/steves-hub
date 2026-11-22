import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">We couldn&apos;t find that page.</h1>
      <Link href="/" className="btn-gold">Go to Home</Link>
    </div>
  );
}
