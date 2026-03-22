# Frontend Major Fixes: SCRUM-80 GitHub Dashboard Integration

Branch: `feat/SCRUM-80-display-github-activity`  
Compared against: `dev`  
Commit range: `432ec4c` -> `9c1d20a`

## Fix 1: Shared Read-Only GitHub Dashboard for Student + Supervisor

### Why this fix was needed

- GitHub section needed one consistent read-only UX for both roles.
- Previous flow was repository-link focused and not dashboard-oriented.

### What was changed

- Refactored shared GitHub section to dashboard layout in `CommitActivitySection`:
  - Repository Overview
  - Activity Summary
  - Contributors Preview
  - Activity Feed
- Added empty-state CTA behavior:
  - when no repository exists, users are directed to Overview tab to link repository.
- Kept tab name as `GitHub` and preserved role-neutral read-only rendering.

## Fix 2: Modal Architecture + Paginated Full Lists

### Why this fix was needed

- Preview cards are intentionally short; users needed expandable, scroll-safe full lists.
- Both roles needed the same modal system without duplicated UI logic.

### What was changed

- Introduced shared modal wrapper:
  - `GithubDetailsModal`
- Added focused modal content components:
  - `GithubActivityModalContent`
  - `GithubContributorsModalContent`
- Added paginated modal data flow:
  - fetch page 1 on open
  - load-more appends data (no replacement)
  - local state tracks `page`, `items`, `hasMore`, loading vs loading-more
- Added animated skeletons:
  - initial list skeletons
  - bottom skeleton loader for load-more

## Fix 3: API-Layer Pagination Utilities + Env-Driven Page Size

### Why this fix was needed

- Modal pagination had to use backend APIs and consistent page sizing.
- Page size needed environment-level control instead of hardcoding.

### What was changed

- Added shared pagination utility:
  - `src/features/projects/api/githubPagination.ts`
- Extended both role API clients for GitHub paginated reads.
- Added env config support:
  - `VITE_GITHUB_PAGE_SIZE`
  - consumed via `src/app/config/env.ts`

## Fix 4: Supervisor Overview Repository Management UX

### Why this fix was needed

- Repository linking belongs in Overview tab, not in GitHub dashboard tab.
- Needed one clean entrypoint for manual link and GitHub App setup.

### What was changed

- Reworked supervisor repository card:
  - single `Link repository` action
  - disabled when one repository is already linked
  - explicit `Remove` action beside linked URL
- Added dedicated modal content component:
  - `RepositoryLinkModalContent`
  - manual URL save path + GitHub App connect action in one flow
- Integrated request-state modal feedback for save/remove/connect errors.

## Fix 5: Activity Feed and Modal UI Robustness

### Why this fix was needed

- Long commit messages could break card balance and metadata alignment.
- Commit type badges needed consistent detection and placement.

### What was changed

- Improved commit cards:
  - two-line message clamp with tooltip fallback
  - stable metadata row (author/time/sha)
  - top-right commit type badge alignment
- Expanded commit-type detection robustness:
  - merge, feat, fix, refactor, chore, docs, ci, test, perf, build, revert, style
- Applied the same card behavior in activity preview and activity modal.

## Post-Branch Updates (2026-03-22): Project-Scoped GitHub Access + Explicit Repo Selection

### Why this follow-up was needed

- GitHub App installation authorization and project-to-repository linkage had to be separated.
- Supervisors needed explicit repository selection under authorized installations.
- Requesting more GitHub repository access needed a backend-verified project-scoped flow.

### What was changed

- Added public callback/request routes:
  - `/github/request-access?token=...`
  - `/github/access-updated?token=...`
- Updated supervisor overview repository UX:
  - guided method-first linking modal (`Repository URL` vs `GitHub App`)
  - explicit installation repository selection screen with single-select behavior
  - pagination-aware repository list + `Load more`
  - animated loading skeleton for repository selection state
- Added request-access modal flow:
  - creates project-scoped access request link
  - presents copyable link in success modal
  - callback summary modal confirms updated repository visibility
- Added project-level access-authorization management block in repository card when installation is already authorized:
  - configure repository
  - remove access linkage

## Changed Files (`dev...HEAD`)

- `.env.example`
- `README.md`
- `src/app/config/env.ts`
- `src/features/projects/api/githubPagination.ts`
- `src/features/projects/components/CommitActivitySection.tsx`
- `src/features/projects/components/GithubActivityModalContent.tsx`
- `src/features/projects/components/GithubContributorsModalContent.tsx`
- `src/features/projects/components/GithubDetailsModal.tsx`
- `src/features/projects/types.ts`
- `src/features/student/api/studentApi.ts`
- `src/features/student/hooks/useStudentProjectCommits.ts`
- `src/features/student/pages/StudentProjectDetailsPage.tsx`
- `src/features/student/types.ts`
- `src/features/supervisor/api/supervisorApi.ts`
- `src/features/supervisor/components/ProjectDetail/RepositoryLinkModalContent.tsx`
- `src/features/supervisor/components/ProjectDetail/RepositorySection.tsx`
- `src/features/supervisor/hooks/useSupervisorProjectCommits.ts`
- `src/features/supervisor/pages/ProjectDetailsPage.tsx`
- `src/features/supervisor/projectDetails.shared.ts`
- `src/features/supervisor/types.ts`
