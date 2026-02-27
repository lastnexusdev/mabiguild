import Link from "next/link";
import { Site } from "@prisma/client";

export function SiteShell({ site, children }: { site: Site; children: React.ReactNode }) {
  return (
    <main>
      <div className="h-40 bg-gradient-to-r from-purple-700 to-sky-700 p-6">
        <h1 className="text-3xl font-bold">{site.name}</h1>
        <p>{site.description}</p>
      </div>
      <nav className="border-b border-zinc-800 p-3 flex gap-5 bg-zinc-900">
        <Link href="/">Home</Link>
        <Link href="/forums">Forums</Link>
        <Link href="/members">Members</Link>
        <Link href="/admin">Admin</Link>
      </nav>
      <div className="p-6">{children}</div>
    </main>
  );
}
