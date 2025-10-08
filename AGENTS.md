# Agents Guide

## Project Overview
- Monorepo managed with pnpm workspaces and Turbo; apps live under `apps/` and share config from `packages/`.
- `apps/web` hosts the Shadcn admin dashboard built with Vite, React 19, TanStack Router, and TailwindCSS.
- React Query orchestrates async data, Zustand (`apps/web/src/stores/auth-store.ts`) keeps client auth state, and Clerk components cover partial auth flows.
- Route definitions in `apps/web/src/routes` are file-system based via the TanStack Router plugin; the generated `apps/web/src/routeTree.gen.ts` should not be edited manually.
- Global providers (theme, font, RTL direction) reside in `apps/web/src/main.tsx` alongside QueryClient configuration and error handling.
- `apps/api` contains the NestJS service layer (controllers, modules, services) that will back new dashboard features.

## Repository Tour
- `apps/web/src/routes`: Route entries; `_authenticated` hosts layouts/pages for signed-in flows, `(auth)` contains public auth pages, `(errors)` for 4xx/5xx screens. `__root.tsx` wires global error boundaries and devtools.
- `apps/web/src/features`: Page-level modules (dashboard, users, apps, chats, tasks, etc.) containing screens, load functions, and domain-specific UI.
- `apps/web/src/components`: Shared UI building blocks. `apps/web/src/components/ui` holds forked Shadcn primitives with RTL tweaks—compare against upstream before replacing.
- `apps/web/src/context`: React context providers for theme, typography, direction, layout, and command palette search.
- `apps/web/src/lib`: Reusable utilities (Axios error normalization, cookie helpers, formatting helpers).
- `apps/web/public`: Static assets including the dashboard preview under `apps/web/public/images/`.
- `apps/api/src`: NestJS application entry (`main.ts`), root module (`app.module.ts`), controller, and service scaffolding for backend endpoints.
- `packages/tsconfig`: Shared TypeScript project references consumed by both apps.

## Tooling & Commands
- Package manager: pnpm (`pnpm install`).
- Task runner: Turbo (`turbo.json`) orchestrates workspace scripts.
- Local dev: `pnpm dev` runs `web` (Vite on 5173) and `api` (Nest on 3000) in parallel. Use `pnpm --filter web dev` or `pnpm --filter api dev` to focus on a single app.
- Builds: `pnpm build` runs both app builds; run `pnpm --filter web build` or `pnpm --filter api build` when isolating failures.
- Linting: `pnpm lint` fans out through Turbo; app-specific lint via `pnpm --filter web lint` or `pnpm --filter api lint`.
- Formatting: `pnpm format` / `pnpm format:check` (Prettier + Tailwind & import-sort plugins).
- Static analysis: `pnpm --filter web knip` scans for dead code in the dashboard.

## Implementation Guidelines
- Respect the `@/*` path alias configured in `apps/web/tsconfig.app.json`; keep relative imports short.
- When adding routes to `apps/web/src/routes`, rely on TanStack Router file conventions and let the plugin regenerate `apps/web/src/routeTree.gen.ts`.
- For UI work, reuse `apps/web/src/components` or Shadcn primitives first; document any RTL-related adjustments.
- Keep Query Client side-effects consistent with `apps/web/src/main.tsx` (session reset on 401, toast notifications, navigation helpers).
- Maintain accessibility (ARIA roles, keyboard support) and RTL compatibility; test in both light/dark themes for the web app.
- Server modules should expose typed DTOs/guards from `apps/api/src` and align with axios error normalization in the web client.
- Follow conventional commits (`cz_conventional_commits`) when preparing commit messages.

## Data & Integrations
- API interactions use Axios with centralized error handling at `apps/web/src/lib/handle-server-error.ts`; extend it when introducing new server error patterns surfaced by Nest.
- Auth state remains local-only; Clerk components are scaffolded, but backend hooks/auth guards may be stubs. Coordinate new auth flows with `apps/web/src/stores/use-auth-store`.
- Fake data and charts live within feature folders; prefer colocated mocks to avoid cross-feature coupling.
- Nest endpoints originate from `apps/api/src/app.controller.ts`; expand modules/services there when APIs mature, and document new contracts for the web client.

## Quality Checklist
- `pnpm lint` and `pnpm format:check` pass; double-check `pnpm --filter api lint` after server changes.
- New UI matches design tokens (`apps/web/src/styles/index.css`, Tailwind config via `@tailwindcss/vite`).
- For routes/pages: verify navigation through TanStack devtools, and ensure preload settings stay intact.
- API changes compile (`pnpm --filter api build`) and align with web client expectations.
- Update documentation (README, feature-specific MDX/notes) when changing UX flows or introducing new commands/endpoints.

## Knowledge Handover
- Primary product documentation: `README.md`.
- Change history: `CHANGELOG.md`.
- SPA deploys target Netlify via `netlify.toml` (`pnpm build` pipeline). Document API deploy steps when Nest moves beyond local dev.
- Reach out via project issues for clarifications on customized Shadcn components or planned Clerk/Nest integrations before large refactors.
