# Contributing

## Package Manager and Node

- Always use `npm` (do not use Yarn or pnpm).
- Use Node 20 LTS (see `.nvmrc`).
- After pulling changes, run `npm ci` to install exact locked dependencies.

## Dependency Changes

- Add runtime dependencies with `npm install <package>`.
- Add development dependencies with `npm install -D <package>`.
- Commit both `package.json` and `package-lock.json` for any dependency change.

## Branch Naming

Use one of these prefixes:

- `feat/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`

## Pull Request Checklist

- [ ] Branch name follows convention.
- [ ] Placeholder-only scope is preserved unless explicitly expanded.
- [ ] `npm ci` was run after syncing latest changes.
- [ ] `npm run verify` passes before opening PR.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `.env` was not committed.
- [ ] Updated docs if structure changes.

## Local Verification Gate

Before commit/PR, run `npm run verify`.

- `verify` runs `format:check`, `lint`, and `typecheck`.
- If formatting check fails, run `npm run format`, then rerun `npm run verify`.
