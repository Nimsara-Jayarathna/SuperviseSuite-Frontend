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
- `npm run typecheck` - Run TypeScript checks with no emit.

### Common Commands

- `npm run lint`
- `npm run format`
- `npm run typecheck`
- `npm run build`
- `npm run preview`

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
