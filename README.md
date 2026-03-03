# SuperviseSuite Frontend

React + Vite + Tailwind CSS frontend for SuperviseSuite.

The current implementation is still frontend-first, but it now includes working UI flows for public auth screens and the student project workspace. Backend data integration is still incomplete, so some features remain mock-backed or placeholder-only.

## Local Development

### Prerequisites

- Node.js 20 LTS (see `.nvmrc`)
- npm (project standard package manager)

### Environment

1. Copy `.env.example` to `.env`.
2. Update values as needed for local development.

Default example:

`VITE_API_BASE_URL=http://localhost:8080`

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

### Common Commands

- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`
- `npm run verify`
- `npm run build`
- `npm run preview`

## Pre-PR Verification

Before commit/PR, run:

`npm run verify`

This command checks formatting, linting, and type safety. If formatting fails, run `npm run format` and rerun `npm run verify`.

## Contributing / Workflow

For branching rules, PR expectations, and local verification steps, see `CONTRIBUTING.md`.

## Future: CI

CI is intentionally not configured yet. In a later phase, automated pipelines will enforce the same local checks (format, lint, typecheck, and verification) currently documented for developers.

## Package Manager Standard

- Use `npm` only.
- Commit `package-lock.json` with dependency changes.
- Do not add `yarn.lock`, `pnpm-lock.yaml`, or other lockfiles.

## Folder Structure

- `src/app` - App-level routing, layouts, providers, and config.
- `src/features` - Feature-based modules (`landing`, `auth`, `student`, plus placeholder `projects` and `dashboard` areas).
- `src/components` - Shared UI, brand, and feedback components.
- `src/services` - Shared service modules (for example, API client and token storage).
- `src/lib` - Shared utility modules.
- `src/styles` - Global styles.
- `src/types` - Shared types.

## Current UI Scope

- Public routes are implemented for `/`, `/login`, and `/register`.
- Student UI routes are implemented for `/student`, `/student/projects`, and `/student/projects/:projectId`.
- Legacy student aliases (`/project`, `/project/:id`, `/projects`, `/projects/:id`) redirect into the student workspace.
- The student workspace currently uses local mock data for UI rendering only.
- Supervisor dashboard and shared `projects` feature modules still contain placeholder implementations.

## Note

The repository standard is to keep local checks green before commit or PR. Run `npm run verify` after UI changes so formatting, linting, and type checks stay aligned with project expectations.
