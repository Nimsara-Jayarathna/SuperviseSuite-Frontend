# SuperviseSuite Frontend

Structure-only scaffold for a React + Vite + Tailwind CSS frontend.

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

## Package Manager Standard

- Use `npm` only.
- Commit `package-lock.json` with dependency changes.
- Do not add `yarn.lock`, `pnpm-lock.yaml`, or other lockfiles.

## Folder Structure

- `src/app` - App-level placeholders (routes, layouts, providers, config).
- `src/features` - Feature-based placeholder modules (`auth`, `projects`, `dashboard`).
- `src/components` - Shared placeholder UI and feedback components.
- `src/services` - Placeholder service modules.
- `src/lib` - Placeholder utility modules.
- `src/styles` - Global styles.
- `src/types` - Shared types.
- `prompts` - Prompt history for reproducibility.

## Note

This is a structure-only scaffold. No business logic, auth logic, routing behavior, API behavior, integrations, or feature workflows are implemented.
