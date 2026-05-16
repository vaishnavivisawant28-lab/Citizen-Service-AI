# CitizenConnect — Government Citizen Service Portal

An AI-powered government citizen service portal where citizens can update their profile information (mobile, email, address) through a verified request flow, and an admin dashboard where officers can approve or reject those requests.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/citizen-portal run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React 19 + Vite + TailwindCSS + shadcn/ui
- Auth: Clerk (dev keys provisioned)
- AI: Google Gemini via Replit AI integration

## Where things live

- `lib/db/src/schema/` — all DB tables (citizens, update_requests, audit_logs, knowledge_base, otp_codes, chat_history)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks
- `lib/api-zod/src/generated/` — auto-generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (profile, requests, otp, admin, chatbot)
- `artifacts/citizen-portal/src/` — React frontend (pages, components, hooks)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas; no manual typing
- Admin role check: `citizens.role === 'admin'` in DB; assign via direct DB update for now
- OTP is demo-mode: code is logged to server console and returned in response for demo purposes (no real SMS/email)
- RAG chatbot: keyword-based retrieval from `knowledge_base` table (no pgvector); Gemini Gemini-3 Flash generates answers only from retrieved policy chunks
- Clerk proxy: mounted at `/api/__clerk`; only active in production

## Product

- **Landing page**: Marketing landing page with CTAs to sign up/sign in
- **Citizen dashboard**: Overview stats, profile card with Aadhaar, recent requests
- **New request flow**: 3-step form — choose field → OTP verification (mobile/email only) → confirm → submit
- **My requests**: List and detail view with cancel support
- **AI chatbot**: Floating chat widget, answers policy questions from seeded knowledge base only
- **Admin dashboard**: Stats overview, recent activity
- **Admin requests**: Approve/reject requests with admin notes, filters, pagination
- **Admin citizens**: View all registered citizens
- **Admin audit logs**: Full audit trail of all actions

## Setting up admin access

To make a user an admin, run this SQL after they first sign in:
```sql
UPDATE citizens SET role = 'admin' WHERE email = 'your@email.com';
```

## User preferences

- Government blue color scheme (`hsl(221 83% 30%)`) with amber accent
- Sidebar navigation layout with mobile sheet drawer
- Keep OTP demo-friendly (show OTP in response messages)

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck`
- The Gemini model name used is `gemini-3-flash-preview` — check the integration lib if this changes
- `@google/genai`, `p-limit`, `p-retry` must be listed as direct deps in `api-server/package.json` because esbuild externalizes `@google/*`
- Clerk v5+ required on both frontend and backend; `@clerk/themes` v2.x works with Clerk React v6

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
