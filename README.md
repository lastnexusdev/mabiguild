# Multi-tenant Community Platform

Next.js 14 App Router + TypeScript + Tailwind + Prisma + PostgreSQL + Docker Compose.

## Features
- Credentials auth with NextAuth session cookies (`/register`, `/login`, `/logout`).
- Subdomain multi-tenancy (`mysite.platform.localhost`) with middleware tenant detection.
- Platform routes on root domain (`/`, `/dashboard`, `/dashboard/sites/new`).
- Site public layout on subdomains:
  - header banner
  - nav menu
  - 3-column homepage widgets/sections
- CMS pages with markdown editor support:
  - create draft/published pages in admin
  - public slug routing `/p/[slug]`
  - drafts only visible to OWNER/ADMIN
- Admin area on subdomains (`/admin`):
  - site settings
  - pages
  - menus
- Tenant isolation and RBAC:
  - all site-scoped queries filtered by `siteId`
  - admin routes require `ADMIN` (or `OWNER`) site membership
- Audit logs for admin actions.

## Data Models
- `User`
- `Site`
- `SiteMembership`
- `AuditLog`
- `Page`
- `Menu`

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
