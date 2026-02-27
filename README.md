# MabiGuild (Enjin-style Multi-tenant Community Platform)

Next.js 14 + TypeScript + Prisma + PostgreSQL + Tailwind + NextAuth.

## Features
- Root domain (`platform.localhost`) for marketing/auth/dashboard.
- Subdomain tenants (`mysite.platform.localhost`) resolved in `middleware.ts`.
- Single-db tenancy with hard `siteId` scoping across site entities.
- Per-site membership roles (`OWNER`, `ADMIN`, `MODERATOR`, `MEMBER`) + permissions.
- CMS pages, forums/threads/posts, shoutbox with polling, members/profiles, admin panel sections.
- Audit log for administrative actions.
- Input validation via Zod, password hashing with bcrypt, cookie-backed sessions with NextAuth.

## Quick start (Docker)
1. Copy env values:
   ```bash
   cp .env.example .env
   ```
2. Start services:
   ```bash
   docker compose up --build
   ```
3. In another shell, run migrations + seed:
   ```bash
   docker compose exec web npx prisma migrate dev --name init
   docker compose exec web npm run prisma:seed
   ```
4. Open:
   - Root: `http://platform.localhost:3000`
   - Demo tenant after seed: `http://demo.platform.localhost:3000`

> You need local DNS mapping for wildcard subdomains in development (e.g. using `dnsmasq` or manual hosts for test subdomains).

## Local (without Docker)
```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

## Core architecture
- **Tenant resolution**: `middleware.ts` sets `x-tenant-subdomain`; `lib/tenant.ts` maps to `Site`.
- **Isolation**: all site data queries include `siteId` and scoped lookups (`findFirst` with `siteId`).
- **Auth**: NextAuth credentials provider + secure cookie sessions.
- **Rate limiting**: lightweight in-memory limiter for login/register/shoutbox.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run prisma:migrate`
- `npm run prisma:seed`
