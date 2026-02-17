You are a senior frontend engineer. Add a strict local “verify” gate to this React + Vite + Tailwind (TypeScript) repository. DO NOT add any CI workflows/pipelines.

GOAL
Create a single command developers must run before commit/PR:
- npm run verify

verify must run:
- format:check
- lint
- typecheck

RULES
- Keep changes minimal and professional.
- Do not introduce new frameworks.
- If scripts already exist, align them to the required names and behavior.
- Ensure commands work on macOS/Linux/Windows (avoid bash-only syntax when possible).
- Do NOT auto-format on verify; verify should CHECK only.

IMPLEMENTATION REQUIREMENTS

1) package.json scripts
Ensure these scripts exist and work:
- "format": runs Prettier in write mode on the codebase
- "format:check": runs Prettier in check mode on the codebase (fails if not formatted)
- "lint": runs ESLint on src (fails on error)
- "typecheck": runs TypeScript typecheck with no emit (tsc --noEmit)
- "verify": runs format:check + lint + typecheck in sequence (fails fast if any step fails)

If you need a runner for sequential scripts, prefer:
- npm built-in chaining with &&  (cross-platform enough for npm scripts)
Example verify:
  "verify": "npm run format:check && npm run lint && npm run typecheck"

2) Ensure required dev dependencies exist
- prettier
- eslint (and appropriate TS/React plugins/config already present or add minimal required ones)
- typescript
If repo already has them, do not duplicate.

3) Documentation
Update README.md and/or CONTRIBUTING.md to include:
- “Before commit/PR, run: npm run verify”
- Explain what verify checks (format, lint, typecheck)
- Note: If verify fails, run npm run format to auto-fix formatting, then rerun verify.

4) Optional but recommended
Update PULL_REQUEST_TEMPLATE.md checklist to include:
- [ ] I ran npm run verify

DELIVERABLES
- npm run format formats the repo.
- npm run format:check fails if formatting is off.
- npm run lint works and fails on lint errors.
- npm run typecheck works.
- npm run verify runs all three checks and returns non-zero if any fail.
- No CI added.

Now implement these changes in the repository.
