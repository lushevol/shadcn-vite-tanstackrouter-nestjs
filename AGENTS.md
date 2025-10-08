# Agents Guide

## Project Overview
- Shadcn Admin Dashboard built with Vite, React 19, TanStack Router, and TailwindCSS.
- Uses React Query for async data orchestration, Zustand (`src/stores/auth-store.ts`) for client auth state, and Clerk components for partial authentication flows.
- Route definitions are file-system based via the TanStack router plugin; the generated `src/routeTree.gen.ts` should not be edited manually.
- Global providers (theme, font, RTL direction) are assembled in `src/main.tsx` alongside QueryClient configuration and error handling.

## Repository Tour
- `src/routes`: Route entries; `_authenticated` hosts layouts/pages for signed-in flows, `(auth)` contains public auth pages, `(errors)` for 4xx/5xx screens. `__root.tsx` wires global error boundaries and devtools.
- `src/features`: Page-level modules (dashboard, users, apps, chats, tasks, etc.) containing screens, load functions, and domain-specific UI.
- `src/components`: Shared UI building blocks. `src/components/ui` holds forked Shadcn primitives with RTL tweaks—compare against upstream before replacing.
- `src/context`: React context providers for theme, typography, direction, layout, and command palette search.
- `src/lib`: Reusable utilities (Axios error normalization, cookie helpers, formatting helpers).
- `public/`: Static assets including the dashboard preview under `public/images/`.

## Tooling & Commands
- Package manager: pnpm (`pnpm install`).
- Local dev server: `pnpm dev` (Vite on port 5173 by default).
- Type checking & build: `pnpm build` (runs `tsc -b` then `vite build`).
- Linting: `pnpm lint` (ESLint 9 with React hooks and TanStack Query rules).
- Formatting: `pnpm format` and `pnpm format:check` (Prettier + Tailwind & import-sort plugins).
- Dead code scan: `pnpm knip`.

## Implementation Guidelines
- Respect the `@/*` path alias defined in `tsconfig.json`; keep relative imports short.
- When adding routes, rely on TanStack Router file conventions and let the plugin regenerate `routeTree.gen.ts`.
- For UI work, reuse components from `src/components` or Shadcn primitives first; document any RTL-related adjustments.
- Keep Query Client side-effects consistent with `src/main.tsx` (session reset on 401, toast notifications, navigation helpers).
- Maintain accessibility (ARIA roles, keyboard support) and RTL compatibility; test in both light/dark themes.
- Follow conventional commits (`cz_conventional_commits`) when preparing commit messages.

## Data & Integrations
- API interactions use Axios with centralized error handling in `src/lib/handle-server-error.ts`. Extend that helper when introducing new server-side error patterns.
- Auth state is local-only today; Clerk components are scaffolded, but backend hooks/auth guards may be stubs. Coordinate new auth flows with `useAuthStore`.
- Fake data and charts live within feature folders; prefer colocated mocks to avoid cross-feature coupling.

## Quality Checklist
- `pnpm lint` and `pnpm format:check` pass.
- New UI matches existing design tokens (`src/styles/index.css`, Tailwind config embedded in `tailwind.config` via `@tailwindcss/vite`).
- For routes/pages: verify navigation works via TanStack devtools, and preload settings do not regress.
- Update documentation (README, feature-specific MDX/notes) when changing UX flows or introducing new commands.

## Knowledge Handover
- Primary product documentation: `README.md`.
- Change history: `CHANGELOG.md`.
- Deployment: `netlify.toml` captures preview build settings (uses `pnpm build` by default).
- Reach out via project issues for clarifications on customized Shadcn components or planned Clerk integrations before large refactors.
