# MabiGuild – Multi-Tenant Community Platform

A classic Enjin-style community website platform where users can sign up, create their own community sites (guilds), and manage them under custom subdomains.

## Features

- **Multi-tenancy**: Each community has its own subdomain (`myguild.platform.com`)
- **Auth**: Lucia Auth with session cookies, argon2 password hashing
- **Forums**: Categories → Forums → Threads → Posts, with pinning, locking, moderation
- **CMS Pages**: Rich-text pages with TipTap editor, draft/publish workflow
- **Member Profiles**: Avatars, bio, post count, online status, join date
- **Roles & Ranks**: Per-site RBAC (Owner, Admin, Moderator, Member) + custom roles
- **Shoutbox**: Real-time polling chat widget with rate limiting
- **Admin Panel**: Full management of site settings, pages, menus, widgets, forums, members, roles
- **Audit Log**: Every admin action is recorded
- **Security**: Rate limiting, input validation (Zod), XSS sanitization (DOMPurify), secure headers

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** + MySQL
- **Tailwind CSS**
- **Lucia Auth** v3 (session cookies)
- **TipTap** (rich text editor)
- **Argon2** (password hashing)
- **Zod** (validation)

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+ (or use Docker)

### 1. Clone & Install

```bash
git clone <repo>
cd mabiguild
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/mabiguild"
NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SESSION_SECRET="your-long-random-secret-here"
```

### 3. Database

**With Docker:**
```bash
docker compose up db -d
```

**Or use an existing MySQL instance** and update `DATABASE_URL`.

### 4. Prisma

```bash
# Generate client
npm run db:generate

# Push schema (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

### 5. Seed

```bash
npm run db:seed
```

This creates:
- Admin: `admin@example.com` / `admin1234`
- Demo user: `demo@example.com` / `demo1234`
- Demo site at `demoguild.localhost:3000`

### 6. Run Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000` for the platform homepage.

## Multi-Tenancy in Development

Since you can't use real subdomains on localhost easily, there are two approaches:

### Option A: `/etc/hosts` entries (Recommended)

Add these to `/etc/hosts`:
```
127.0.0.1   localhost
127.0.0.1   demoguild.localhost
```

Then visit `http://demoguild.localhost:3000`.

### Option B: Caddy / nginx reverse proxy

Use Caddy as a local proxy:
```
{
  http_port 80
}

*.localhost:80 {
  reverse_proxy localhost:3000
}
```

## Production Deployment

### With Docker Compose

```bash
# Copy and edit env
cp .env.example .env
# Edit DATABASE_URL, SESSION_SECRET, NEXT_PUBLIC_ROOT_DOMAIN

# Build and start
docker compose up -d

# Run migrations
docker compose exec app npm run db:migrate

# Seed (optional)
docker compose exec app npm run db:seed
```

### Without Docker

1. Set up MySQL
2. Configure `.env`
3. `npm install && npm run db:generate && npm run db:push && npm run build`
4. `npm start`

### DNS Setup (Production)

Point a wildcard DNS record to your server:
```
*.platform.com  A  <server-ip>
platform.com    A  <server-ip>
```

Set `NEXT_PUBLIC_ROOT_DOMAIN=platform.com` in your `.env`.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, logout
│   ├── (platform)/      # Dashboard, account (root domain)
│   ├── api/             # REST API routes
│   ├── sites/[subdomain]/ # All site routes (rewritten by middleware)
│   │   ├── page.tsx     # Site homepage
│   │   ├── forums/      # Forums & threads
│   │   ├── thread/      # Thread view
│   │   ├── members/     # Member list
│   │   ├── u/[username] # User profile
│   │   ├── p/[slug]     # CMS pages
│   │   └── admin/       # Admin panel
│   ├── layout.tsx
│   └── page.tsx         # Marketing homepage
├── components/
│   ├── RichEditor.tsx   # TipTap editor
│   └── site/            # Site-specific components
├── lib/
│   ├── auth.ts          # Lucia Auth setup
│   ├── db.ts            # Prisma client
│   ├── tenant.ts        # Subdomain detection
│   ├── permissions.ts   # RBAC helpers
│   ├── audit.ts         # Audit log helper
│   ├── rateLimit.ts     # In-memory rate limiter
│   └── utils.ts         # Utilities
├── middleware.ts         # Tenant routing middleware
prisma/
├── schema.prisma
└── seed.ts
```

## Data Models

See `prisma/schema.prisma` for the full schema. Key models:

| Model | Purpose |
|-------|---------|
| `User` | Global platform account |
| `Session` | Lucia Auth sessions |
| `Site` | A community site (tenant) |
| `SiteMembership` | User ↔ Site with role |
| `SiteRole` | Custom per-site roles |
| `RolePermission` | Permissions attached to roles |
| `Page` | CMS pages |
| `ForumCategory` | Forum categories |
| `Forum` | Forums within categories |
| `Thread` | Forum threads |
| `Post` | Posts within threads |
| `ShoutMessage` | Shoutbox messages |
| `Ban` | Site bans |
| `AuditLog` | Admin action log |

## Security Notes

- Passwords are hashed with Argon2
- Sessions use httpOnly secure cookies (SameSite=Lax)
- All user HTML is sanitized with DOMPurify
- All inputs validated with Zod
- Rate limiting on login (10/15min), register (5/hr), shoutbox (10/min)
- Tenant isolation enforced on every query via `siteId`
- Reserved subdomains blocked (admin, api, www, etc.)
- Secure HTTP headers set (X-Content-Type-Options, X-Frame-Options, etc.)

## Admin Panel

Access at `http://yoursite.domain.com/admin`. Requires OWNER or ADMIN role.

Features:
- **Overview**: Stats and recent activity
- **Settings**: Name, description, banner, logo, theme
- **Pages**: CRUD for CMS pages with rich editor
- **Menus**: Manage navigation menu items
- **Widgets**: Configure homepage widget columns
- **Forums**: Create/delete categories and forums
- **Members**: Ban/unban, assign custom roles
- **Roles**: Create roles, assign permissions
- **Audit Log**: View all admin actions

## License

MIT
