import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import Link from "next/link";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-blue-600">
            🛡️ MabiGuild
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              My Sites
            </Link>
            <Link
              href="/account"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Account
            </Link>
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {(user.displayName ?? user.username)[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block">
                {user.displayName ?? user.username}
              </span>
            </div>
            <Link href="/logout" className="btn-secondary btn-sm btn">
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <main className="py-6">{children}</main>
    </div>
  );
}
