import Link from "next/link";
import { auth } from "@/lib/auth";

export async function PlatformNav() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-800 p-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-white">platform.com</Link>
        <nav className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/logout">Logout</Link>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
