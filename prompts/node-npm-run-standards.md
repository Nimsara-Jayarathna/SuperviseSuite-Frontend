You are a senior frontend engineer. Implement strict Node/NPM run standards for this repository (React + Vite + Tailwind). DO NOT add any CI pipelines or CI configs.

SCOPE (ONLY)
- Enforce consistent installs using npm and package-lock.json
- Standardize npm scripts (dev/build/preview/lint/format/typecheck)
- Add Node version guidance (nvmrc + package.json engines)
- Add environment variable standards (.env.example + docs)
- Add contribution rules for adding dependencies and running the project
- Add optional local guardrails (gitignore updates), but NO CI

RULES
- Do not introduce new frameworks or heavy tooling.
- Do not add CI workflows (GitHub Actions/GitLab/etc).
- Keep changes minimal and professional.
- If a file exists, update it carefully—do not delete existing content unless conflicting.

IMPLEMENT THESE 6 ITEMS

1) Package manager rule (npm only)
- Ensure package-lock.json is used and documented.
- Add note to avoid yarn/pnpm lockfiles.
- Update .gitignore to ignore node_modules, dist, .env.

2) Standard npm scripts
In package.json, ensure scripts exist:
- "dev": run Vite dev server
- "build": build production bundle
- "preview": preview build
- "lint": run ESLint across src with fail on error
- "format": run Prettier write on relevant files
- "typecheck": run tsc --noEmit
If scripts already exist, align names and keep existing behavior.

3) Node version standard
- Add .nvmrc with Node 20 (or the project's current Node if already specified).
- Add package.json "engines" field:
  { "node": ">=20" }
- Add a short note in README about using Node 20 LTS.

4) Environment standards
- Create/Update .env.example containing:
  VITE_API_BASE_URL=http://localhost:8080
- Ensure .env is gitignored.
- Document in README how to copy .env.example to .env.

5) Documentation (Runbook)
Update README.md with a short “Local Development” section including:
- prerequisites (Node version)
- install: npm ci
- run: npm run dev
- lint: npm run lint
- format: npm run format
- typecheck: npm run typecheck
- build/preview commands

6) Contribution rules for dependency changes
Create/Update CONTRIBUTING.md with:
- Always use npm (not yarn/pnpm)
- Use npm ci after pulling changes
- To add a dependency: npm install / npm install -D and commit package.json + package-lock.json
- Never commit .env
- Run lint and typecheck before opening a PR

DELIVERABLES
- Repository can be installed with “npm ci” and started with “npm run dev”.
- Lint/format/typecheck scripts exist and run.
- No CI is added.

Now apply these changes to the repository.
