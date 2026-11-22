import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.png" alt="Royalty Real Estate Boutique" width={180} height={135} priority />
          <h1 className="mt-3 text-2xl font-bold text-gold">Steve&apos;s Hub</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
