# Shadcn Admin Monorepo

Admin Dashboard UI crafted with Shadcn and Vite with a companion NestJS API. The repository is now a Turborepo-powered monorepo so both the frontend and backend can be developed together with a single toolchain.

![Shadcn Admin Dashboard](apps/web/public/images/shadcn-admin.png)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Repository structure

```
apps/
  api/   # NestJS backend
  web/   # Vite + React dashboard
packages/
  tsconfig/ # Shared TypeScript base config
```

Turborepo orchestrates tasks across workspaces. Global scripts (e.g. `pnpm dev`) delegate to Turborepo, which in turn runs the package-level commands for each app.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `apps/web/src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Authentication & Mock Database

The NestJS API now exposes JWT authentication backed by a Drizzle-powered SQLite database. A seed script provisions demo users so the dashboard can be exercised without external services.

### Seeding demo data

```bash
pnpm --filter api db:seed
```

This command recreates `apps/api/src/db/mock.sqlite` with the latest schema and inserts two demo users:

| Email               | Password     | Roles           |
| ------------------- | ------------ | --------------- |
| `admin@example.com` | `password123` | `admin`, `user` |
| `user@example.com`  | `password123` | `user`          |

### Running locally

1. Install dependencies with `pnpm install` (from the repository root).
2. Seed the database using the command above (repeat whenever you need to reset credentials).
3. Start both applications: `pnpm dev`.

The web client authenticates against `http://localhost:3000` by default. Adjust `VITE_API_URL` if your API runs elsewhere.

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Backend:** [NestJS](https://nestjs.com/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)

## Getting started

Clone the project:

```bash
git clone https://github.com/satnaing/shadcn-admin.git
```

Change into the project directory:

```bash
cd shadcn-admin
```

Install dependencies for all workspaces:

```bash
pnpm install
```

### Run everything

Start the dashboard and API concurrently:

```bash
pnpm dev
```

Turborepo will run `pnpm --filter web dev` and `pnpm --filter api dev` in parallel. The web app is available on [http://localhost:5173](http://localhost:5173) by default, and the API listens on port `3000` unless `PORT` is set.

### Work on a single app

Frontend only:

```bash
pnpm --filter web dev
```

Backend only:

```bash
pnpm --filter api dev
```

### Other scripts

| Command | Description |
| --- | --- |
| `pnpm build` | Runs `turbo run build` to compile both apps (Vite build + NestJS build). |
| `pnpm lint` | Lints all packages. |
| `pnpm format` | Formats all packages that expose a `format` script. |
| `pnpm format:check` | Runs Prettier in check mode across the repo. |
| `pnpm --filter web knip` | Performs dead-code analysis for the frontend. |

## Environment variables

The frontend expects a Clerk publishable key.

```bash
cp apps/web/.env.example apps/web/.env
```

Populate the `.env` file and restart the dev server.

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [contact@satnaing.dev](mailto:contact@satnaing.dev).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - for backing the implementation of Clerk in this project

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
