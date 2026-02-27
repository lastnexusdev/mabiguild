# Multi-tenant Community Platform

Next.js 14 App Router + TypeScript + Tailwind + Prisma + PostgreSQL + Docker Compose.

## Features
- Credentials auth with NextAuth session cookies (`/register`, `/login`, `/logout`).
- Subdomain multi-tenancy (`mysite.platform.localhost`) with middleware tenant detection.
- Platform routes on root domain (`/`, `/dashboard`, `/dashboard/sites/new`).
- Site public layout on subdomains:
  - header banner
  - nav menu
  - homepage widgets in 3 columns
- CMS pages with markdown:
  - create draft/published pages in admin
  - public slug routing `/p/[slug]`
  - drafts visible only to OWNER/ADMIN
- Tenant-scoped forums:
  - hierarchy: ForumCategory -> Forum -> Thread -> Post
  - create thread and reply
  - moderation: lock/unlock, pin/unpin, move, delete
  - post edit history (`PostEditHistory`)
  - search on forums index (`/forums?q=...`)
  - unread tracking with `ThreadReadState`
- Shoutbox widget:
  - polling fetch
  - post messages with rate limiting
  - delete by MODERATOR/ADMIN/OWNER
- Widget placement config in admin:
  - enable/disable
  - reorder by position
  - choose column (0, 1, 2)
  - widgets: Recent Threads, Online Members, Shoutbox, Site Stats
- Admin area on subdomains (`/admin`): settings, pages, menus, forums, widgets.
- Tenant isolation and RBAC:
  - all forum/page/menu/widget/shoutbox/admin queries scoped by `siteId`
  - admin/mod tools require membership role checks

## Data Models
- User, Site, SiteMembership, AuditLog
- Page, Menu
- ForumCategory, Forum, Thread, Post, PostEditHistory, ThreadReadState
- ShoutMessage, WidgetPlacement

## Local setup (Docker)
1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Start:
   ```bash
   docker compose up --build
   ```
3. Run migration + seed:
   ```bash
   docker compose exec web npx prisma migrate dev --name init
   docker compose exec web npm run prisma:seed
   ```
4. Open:
   - Root: `http://platform.localhost:3000`
   - Demo tenant: `http://demo.platform.localhost:3000`

## Local setup (without Docker)
```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

## Seed credentials
- Email: `admin@example.com`
- Password: `password123`
- Demo tenant: `demo.platform.localhost`

## Notes
- You need local wildcard subdomain resolution for localhost development (dnsmasq or hosts entries for each tested subdomain).
