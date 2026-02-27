# Multi-tenant Community Platform

Next.js 14 App Router + TypeScript + Tailwind + Prisma + MySQL + Docker Compose.

## Features
- Credentials auth with NextAuth session cookies (`/register`, `/login`, `/logout`).
- Subdomain multi-tenancy (`mysite.localhost`) with middleware tenant detection.
- Platform routes on root domain (`/`, `/dashboard`, `/dashboard/sites/new`).
- Site public layout on subdomains:
  - header banner
  - nav menu
  - homepage widgets in 3 columns
- Members and profiles:
  - members list at `/members`
  - per-site profile at `/u/[username]`
  - avatar upload (local storage in `/public/uploads`)
  - profile bio, join date, post count
  - lastSeen and online indicator
- Ranks:
  - role color labels for OWNER/ADMIN/MODERATOR/MEMBER
  - optional auto-rank by post count with per-site thresholds (site settings)
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
- Admin area on subdomains (`/admin`): settings, pages, menus, forums, widgets, members.
- Admin member tools:
  - assign membership roles
  - ban/unban members
- Tenant isolation and RBAC:
  - all forum/page/menu/widget/shoutbox/member/admin queries scoped by `siteId`
  - admin/mod tools require membership role checks

## Data Models
- User, Site, SiteMembership, AuditLog
- Page, Menu
- ForumCategory, Forum, Thread, Post, PostEditHistory, ThreadReadState
- ShoutMessage, WidgetPlacement, Ban

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
   - Root: `http://localhost:3000`
   - Demo tenant (subdomain): `http://demo.localhost:3000`
   - Demo tenant fallback (no subdomain setup): `http://localhost:3000/t/demo`

## Local setup (without Docker)
```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

## Non-Docker MySQL quick fix (P1001)
If you are **not using Docker**, do **not** use `@db:3306` in `DATABASE_URL`.
Use localhost/127.0.0.1 instead:

```env
DATABASE_URL="mysql://root:2342sk@127.0.0.1:3306/mabiguild"
```

Then run:
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

If you use Docker Compose, the app container uses `db:3306` automatically from `docker-compose.yml`.



## Laragon / no-subdomain fallback
If your Windows/Laragon setup does not route wildcard subdomains to Next.js, use path-based tenant access:

- `http://localhost:3000/t/<subdomain>`
- Example: `http://localhost:3000/t/demo`

This is a built-in dev fallback and behaves like `demo.localhost:3000`.

## Seed credentials
- Email: `admin@example.com`
- Password: `password123`
- Demo tenant: `demo.localhost` (or `http://localhost:3000/t/demo`)

## Notes
- If wildcard subdomains are unavailable, use the `/t/<subdomain>` fallback route in development.

## Database note
If you only have MySQL installed, this project runs against local MySQL for non-Docker (`127.0.0.1:3306`) and against `db:3306` only inside Docker Compose.
