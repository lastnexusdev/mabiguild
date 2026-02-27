# Multi-tenant Community Platform

Next.js 14 App Router + TypeScript + Tailwind + Prisma + PostgreSQL + Docker Compose.

## Implemented scope
- Auth: register/login/logout with NextAuth session cookies.
- Multi-tenancy via subdomain middleware:
  - root domain serves platform routes
  - subdomain serves tenant site routes
- Models: `User`, `Site`, `SiteMembership`, `AuditLog`.
- Platform dashboard:
  - list all sites the current user belongs to
  - create site wizard (`name` + `subdomain`)
  - subdomain validation + reserved words + uniqueness checks
- Site creation automatically creates OWNER membership for creator.
- Tenant isolation helpers used by site-scoped queries.
- Seed data: one demo user + one demo site.

## Routes
### Platform routes (root domain)
- `/` marketing page
- `/register`
- `/login`
- `/logout`
- `/dashboard`
- `/dashboard/sites/new`

### Site routes (subdomain)
- `/` tenant site homepage (site info + site members)

## Tenant isolation design
- Middleware extracts subdomain and forwards it in `x-tenant-subdomain`.
- `getSiteFromRequest()` resolves current `Site` from host/subdomain.
- `requireSiteMembership()` resolves current user membership **for current site only**.
- Site-scoped data access always includes `where: { siteId: currentSite.id }`.

## Local setup (Docker)
1. Copy environment file
   ```bash
   cp .env.example .env
   ```
2. Start services
   ```bash
   docker compose up --build
   ```
3. Run migration and seed
   ```bash
   docker compose exec web npx prisma migrate dev --name init
   docker compose exec web npm run prisma:seed
   ```
4. Open root domain
   - `http://platform.localhost:3000`
5. Demo subdomain (after seed)
   - `http://demo.platform.localhost:3000`

> You need local DNS mapping for wildcard localhost subdomains (for example dnsmasq), or explicit hosts entries for subdomains you test.

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
- Demo site: `demo.platform.localhost`
