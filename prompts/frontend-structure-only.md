You are a senior frontend engineer. The current repository directory is EMPTY. Scaffold ONLY the folder structure and minimal placeholder files for “SuperviseSuite Frontend” using React + Vite + Tailwind CSS.

CRITICAL RULES (MUST FOLLOW)
- DO NOT implement any business logic, auth logic, routing logic, API logic, guards, or real feature behavior.
- Keep all .tsx/.ts files as minimal placeholders (exports only) so developers can implement later.
- The app must still start without errors with “npm install” then “npm run dev”, but pages can show only simple placeholder text.
- No integrations (GitHub/Jira).
- Create prompt storage in repo (no secrets).

TECH STACK
- React (TypeScript)
- Vite
- Tailwind CSS
- React Router must NOT be fully implemented. If needed for compilation, keep routes minimal (e.g., render a single placeholder App).
- Avoid extra libraries.

PROJECT STRUCTURE (must match exactly)
src/
  app/
    routes/
      routes.tsx
      route-guards.tsx
    layout/
      SupervisorLayout.tsx
      StudentLayout.tsx
      PublicLayout.tsx
    providers/
      AppProviders.tsx
    config/
      env.ts
      constants.ts
  features/
    auth/
      pages/
        LoginPage.tsx
      components/
        LoginForm.tsx
      api/
        authApi.ts
      hooks/
        useAuth.ts
      types.ts
      index.ts
    projects/
      pages/
        SupervisorProjectsPage.tsx
        StudentProjectsPage.tsx
        ProjectDetailsPage.tsx
        CreateProjectPage.tsx
      components/
        ProjectCard.tsx
        ProjectForm.tsx
      api/
        projectsApi.ts
      hooks/
        useProjects.ts
      types.ts
      index.ts
    dashboard/
      pages/
        SupervisorDashboardPage.tsx
      components/
        StatsCard.tsx
      api/
        dashboardApi.ts
      hooks/
        useDashboard.ts
      types.ts
      index.ts
  components/
    ui/
      Button.tsx
      Input.tsx
      Card.tsx
      Loader.tsx
    feedback/
      EmptyState.tsx
      ErrorState.tsx
  services/
    apiClient.ts
    tokenStorage.ts
  lib/
    cn.ts
    validators.ts
    formatters.ts
  styles/
    globals.css
  assets/
  types/
    index.ts
  main.tsx
  index.css
  App.tsx

PROMPT STORAGE (must be added)
prompts/
  README.md
  frontend-structure-only.md
- frontend-structure-only.md must include this exact prompt text (for reproducibility).
- prompts/README.md must include rules: no secrets/tokens, why prompts are stored, naming convention.

MINIMAL PLACEHOLDER IMPLEMENTATION REQUIREMENTS
1) Vite + React + Tailwind must be properly configured so the project runs.
2) main.tsx should mount <App />.
3) App.tsx should render a simple placeholder page (e.g., “SuperviseSuite Frontend Scaffold”).
4) All files listed in the structure must exist and compile.
   - For TS/TSX files: export minimal placeholders (e.g., empty components returning a <div>Placeholder</div>, or empty functions/types).
   - No real logic: no auth workflows, no route guards, no API requests.
5) Create .env.example with:
   VITE_API_BASE_URL=http://localhost:8080
6) Provide basic ESLint + Prettier configs and npm scripts:
   - dev, build, preview, lint, format
7) Add path alias “@” -> “src” in vite config + tsconfig.

DOCUMENTATION (create these files)
- README.md: setup steps, scripts, folder structure explanation, and “structure-only scaffold” note.
- CONTRIBUTING.md: branch naming, PR checklist, and “store prompts in /prompts”.
- PULL_REQUEST_TEMPLATE.md: includes checkbox “Updated /prompts if AI was used”.

DELIVERABLES
- Repository contains all folders/files above.
- “npm install” then “npm run dev” works without errors.
- No feature logic is implemented beyond placeholder components.

Now generate all files and content accordingly.
