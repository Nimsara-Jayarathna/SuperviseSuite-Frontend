# Frontend Major Fixes: SCRUM-81 Multiple GitHub Repositories

Branch: `feat/SCRUM-81-multiple-github-repositories`  
Compared against: `dev`  
Merge reference: `e66e5dc` (PR #31 into `dev`)

## Scope

SCRUM-81 finalized the supervisor-side flow for GitHub App authorization with explicit repository selection, and aligned student/supervisor GitHub activity UI contracts with the backend v2 model.

This branch does not introduce multi-select repository linking in UI. It introduces the data model and UX flow required for installation-level access and explicit single-repository project linkage.

## Major Changes

## 1. Guided repository linking flow in supervisor project details

### Why this was needed

- GitHub App installation and project repository linking are separate concerns.
- Supervisors needed a clear sequence: authorize app access, then choose repository to link.

### What changed

- Reworked overview repository actions into a guided modal flow:
  - `RepositoryLinkModalContent.tsx`
  - `RepositoryManagementModalContent.tsx`
  - `RepositoryRenameModal.tsx`
  - `RepositorySection.tsx`
- Added method-first linking path:
  - `Repository URL`
  - `GitHub App`
- Added explicit repository listing/selection after authorization:
  - reads from installation repositories endpoint
  - supports pagination (`Load more`)
  - blocks interactions with loading skeleton state

## 2. Project-scoped request-access callback UX

### Why this was needed

- Supervisors needed a safe way to request additional repository access after initial installation.
- The flow required public callback pages to complete and acknowledge updated access.

### What changed

- Added public flow pages:
  - `RequestGitHubRepositoryAccessPage.tsx`
  - `GitHubAccessUpdatedPage.tsx`
- Added hooks/services to support access source and setup flow:
  - `useGitHubAccessSources.ts`
  - `useGitHubSetupFlow.ts`
  - `useAvailableRepositories.ts`
  - `useProjectRepositories.ts`
  - `useRepositorySelection.ts`
- Updated supervisor API client for access-request and installation-repository APIs.

## 3. Shared GitHub activity components aligned with repo-link model

### Why this was needed

- Student and supervisor pages share the same dashboard components.
- Activity and contributors views needed to remain consistent while repository-linking behavior changed.

### What changed

- Updated shared project GitHub components:
  - `CommitActivitySection.tsx`
  - `GithubActivityModalContent.tsx`
  - `GithubContributorsModalContent.tsx`
  - `GithubDetailsModal.tsx`
- Updated shared/request state helpers:
  - `RequestStateModal.tsx`
  - `TimeAgo.tsx`

## 4. Type and API contract alignment

### What changed

- Updated FE types and DTO mappings to backend v2 contracts:
  - `src/features/projects/types.ts`
  - `src/features/student/types.ts`
  - `src/features/supervisor/types.ts`
- Updated student and supervisor API clients:
  - `src/features/student/api/studentApi.ts`
  - `src/features/supervisor/api/supervisorApi.ts`

## Changed Files (SCRUM-81 branch diff)

- `src/components/ui/RequestStateModal.tsx`
- `src/components/ui/TimeAgo.tsx`
- `src/features/projects/components/CommitActivitySection.tsx`
- `src/features/projects/components/GithubActivityModalContent.tsx`
- `src/features/projects/components/GithubContributorsModalContent.tsx`
- `src/features/projects/components/GithubDetailsModal.tsx`
- `src/features/projects/types.ts`
- `src/features/student/api/studentApi.ts`
- `src/features/student/pages/StudentProjectDetailsPage.tsx`
- `src/features/student/types.ts`
- `src/features/supervisor/api/supervisorApi.ts`
- `src/features/supervisor/components/ProjectDetail/MilestonesTabSection.tsx`
- `src/features/supervisor/components/ProjectDetail/OverviewTabSection.tsx`
- `src/features/supervisor/components/ProjectDetail/RepositoryLinkModalContent.tsx`
- `src/features/supervisor/components/ProjectDetail/RepositoryManagementModalContent.tsx`
- `src/features/supervisor/components/ProjectDetail/RepositoryRenameModal.tsx`
- `src/features/supervisor/components/ProjectDetail/RepositoryRowSkeleton.tsx`
- `src/features/supervisor/components/ProjectDetail/RepositorySection.tsx`
- `src/features/supervisor/components/ProjectDetail/TeamTabSection.tsx`
- `src/features/supervisor/hooks/useAvailableRepositories.ts`
- `src/features/supervisor/hooks/useGitHubAccessSources.ts`
- `src/features/supervisor/hooks/useGitHubSetupFlow.ts`
- `src/features/supervisor/hooks/useProjectRepositories.ts`
- `src/features/supervisor/hooks/useRepositorySelection.ts`
- `src/features/supervisor/index.ts`
- `src/features/supervisor/pages/GitHubAccessUpdatedPage.tsx`
- `src/features/supervisor/pages/ProjectDetailsPage.tsx`
- `src/features/supervisor/pages/RequestGitHubRepositoryAccessPage.tsx`
- `src/features/supervisor/types.ts`
- `src/features/supervisor/utils/githubRepositoryUrl.test.ts`
- `src/features/supervisor/utils/githubRepositoryUrl.ts`
