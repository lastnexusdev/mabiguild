import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";

export async function PlatformNav() {
  const { user } = await getCurrentSession();
  return (
    <header className="border-b border-zinc-800 p-4 flex justify-between">
      <Link href="/" className="font-bold text-lg">platform.com</Link>
      <nav className="flex gap-4">
        {user ? (
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
    </header>
  );
}
