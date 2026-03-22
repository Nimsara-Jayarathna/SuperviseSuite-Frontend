# SuperviseSuite Frontend

React + Vite + Tailwind CSS frontend for SuperviseSuite.

This branch is now UI-complete enough to cover the public landing flow, auth screens, the student workspace, and the supervisor workspace. Core project flows are backend-connected, while some dashboard/advanced workflow sections still use local mock data and UI-only route guards.

## Local Development

### Prerequisites

- Node.js 20 LTS (see `.nvmrc`)
- npm (project standard package manager)

### Environment

1. Copy `.env.example` to `.env`.
2. Use backend-aligned local values.

Default example:

`VITE_API_BASE_URL=http://localhost:8081`

GitHub App install entrypoint example:

`VITE_GITHUB_APP_INSTALL_URL=https://github.com/apps/<your-app-slug>/installations/new`

Project-scoped "Request More Repository Access" flow does not use this frontend variable directly.
That flow uses backend-managed redirect via `GITHUB_APP_INSTALL_URL`.

Local auth/refresh reliability notes:

- Ensure backend `APP_PORT=8081` and frontend `VITE_API_BASE_URL` points to the same port.
- Ensure backend `CORS_ALLOWED_ORIGINS=http://localhost:5173`.
- Use `localhost` consistently in FE and BE (do not mix with `127.0.0.1`).

### Install and Run

1. `npm ci`
2. `npm run dev`

## Scripts

- `npm run dev` - Start the Vite dev server.
- `npm run build` - Run type checks and create production build.
- `npm run preview` - Preview production build.
- `npm run lint` - Run ESLint across `src` and fail on errors.
- `npm run format` - Format project files with Prettier.
- `npm run format:check` - Check formatting and fail if files are not formatted.
- `npm run typecheck` - Run TypeScript checks with no emit.
- `npm run verify` - Run `format:check`, `lint`, and `typecheck` in sequence.
- `npm test` - Run all unit tests with Vitest (single run).
- `npm run test:watch` - Run tests in watch mode.

### Common Commands

- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `npm run verify`
- `npm test`
- `npm run build`
- `npm run preview`

## Pre-PR Verification

Before commit/PR, run:

```
npm run verify
npm test
```

`verify` checks formatting, linting, and type safety. If formatting fails, run `npm run format` and rerun `npm run verify`. `npm test` runs the full unit test suite and must exit 0.

## Contributing / Workflow

For branching rules, PR expectations, and local verification steps, see `CONTRIBUTING.md`.

## Future: CI

CI is intentionally not configured yet. In a later phase, automated pipelines will enforce the same local checks (format, lint, typecheck, and verification) currently documented for developers.

## Package Manager Standard

- Use `npm` only.
- Commit `package-lock.json` with dependency changes.
- Do not add `yarn.lock`, `pnpm-lock.yaml`, or other lockfiles.

## Folder Structure

- `src/app` - App-level routing, shared layouts (`AppShell`, `PublicLayout`), providers, and guards.
- `src/features` - Feature-based modules (`landing`, `auth`, `student`, `supervisor`).
- `src/components` - Shared UI, brand, and feedback components.
- `src/services` - Shared service modules (for example, API client and token storage).
- `src/lib` - Shared utility modules.
- `src/styles` - Global styles and shared animation utilities.
- `src/types` - Shared types.

## Current UI Scope

- Public routes are implemented for `/`, `/login`, and `/register`.
- Student UI routes are implemented for `/student`, `/student/projects`, and `/student/projects/:projectId`.
- Supervisor UI routes are implemented for `/supervisor`, `/supervisor/dashboard`, `/supervisor/projects`, `/supervisor/projects/new`, and `/supervisor/projects/:projectId`.
- Legacy aliases (`/dashboard`, `/project`, `/project/new`, `/project/:projectId`, `/projects`, `/projects/new`, `/projects/:projectId`) redirect into the correct student or supervisor route based on the stored user.
- Student and supervisor routes share the same top-bar shell (`AppShell` + `TopBar`) and the same shared button system.
- Student project list/detail and supervisor dashboard/list/detail/create flows are backend-connected.
- Some advanced workflow panels (for example meetings/files/action-items as full modules) remain out of scope or partially mock-derived until dedicated APIs are added.
- Route guards support a UI-only cross-role preview mode in local development. This is not a security boundary and must be enforced by the backend.

## UI Architecture Notes

- `TopBar` is the single navigation shell for public and authenticated layouts.
- `Button.tsx` is the single source of truth for button variants, sizing, and states.
- `PageHeader`, `PageTabs`, `StatusBadge`, `Card`, and `EmptyState` are shared primitives used across landing, student, and supervisor pages.
- The landing page is treated as a public page inside the same design system, not a separate marketing site.

## Documentation

- Overview index: `docs/README.md`
- Feature guides: `docs/features/*.md`
- Shared UI notes: `docs/ui/*.md`

## Note

The repository standard is to keep local checks green before commit or PR. Run `npm run verify` after UI changes so formatting, linting, and type checks stay aligned with project expectations.
