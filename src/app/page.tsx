import Link from "next/link";
import { validateRequest } from "@/lib/auth";

export default async function HomePage() {
  const { user } = await validateRequest();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            🛡️ MabiGuild
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-slate-300 hover:text-white text-sm">
                  Dashboard
                </Link>
                <Link href="/logout" className="btn-secondary btn-sm btn">
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-white text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn-primary btn-sm btn">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-32 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
          Your Community,{" "}
          <span className="text-blue-400">Your Platform</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Create a fully-featured guild or community site in minutes. Forums,
          CMS pages, member profiles, shoutbox, and more — all under your own
          subdomain.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3 btn">
            Create Your Site Free
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3 btn">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="card p-6 bg-slate-800/50 border-slate-700">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} MabiGuild Community Platform
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "🗣️",
    title: "Full Forums",
    desc: "Categories, threads, replies, pinning, locking, moderation, and unread tracking.",
  },
  {
    icon: "📄",
    title: "CMS Pages",
    desc: "Rich-text pages with custom slugs. Keep drafts private or publish to members.",
  },
  {
    icon: "👥",
    title: "Member System",
    desc: "Profiles, ranks, roles, online indicators, post counts, and banning.",
  },
  {
    icon: "💬",
    title: "Shoutbox",
    desc: "Live chat widget that polls in real-time. Moderated and rate-limited.",
  },
  {
    icon: "🔧",
    title: "Admin Panel",
    desc: "Manage everything from one place: pages, menus, widgets, forums, and members.",
  },
  {
    icon: "🎨",
    title: "Customizable",
    desc: "Set a banner, logo, theme, and layout widgets to make the site your own.",
  },
];
