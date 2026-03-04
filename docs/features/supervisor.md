# Supervisor Feature

Supervisor workspace UI for dashboard review, project listing, project creation, and project detail views.

## Routes

| Path | Component | Layout |
|------|-----------|--------|
| `/supervisor` | `SupervisorDashboardPage` | `SupervisorLayout` |
| `/supervisor/dashboard` | `SupervisorDashboardPage` | `SupervisorLayout` |
| `/supervisor/projects` | `SupervisorProjectsPage` | `SupervisorLayout` |
| `/supervisor/projects/new` | `CreateProjectPage` | `SupervisorLayout` |
| `/supervisor/projects/:projectId` | `ProjectDetailsPage` | `SupervisorLayout` |

## Alias Support

The supervisor tree also accepts prototype-compatible aliases:

- `/supervisor/project` → `/supervisor/projects`
- `/supervisor/project/new` → `/supervisor/projects/new`
- `/supervisor/project/:projectId` → same detail page

Global legacy aliases such as `/dashboard`, `/project`, `/project/new`, and `/projects/:projectId` redirect into supervisor routes when the stored user is a supervisor.

## Current UX Structure

- Shared app shell via `AppShell` and `TopBar`
- No left sidebar
- Top navigation contains persistent sections only
- Project creation lives in-page (`SupervisorProjectsPage` header + empty state), not in the top bar

## Key Files

| File | Purpose |
|------|---------|
| `src/features/supervisor/pages/SupervisorDashboardPage.tsx` | Supervisor overview and quick project access |
| `src/features/supervisor/pages/SupervisorProjectsPage.tsx` | API-backed project list, lifecycle filter, skeleton loading, and in-page create action |
| `src/features/supervisor/pages/CreateProjectPage.tsx` | API-backed create project flow with student lookup and milestone form |
| `src/features/supervisor/pages/ProjectDetailsPage.tsx` | API-backed trimmed project detail page |
| `src/features/supervisor/components/SupervisorProjectCard.tsx` | Summary card for backend-backed project list records |
| `src/features/supervisor/components/SupervisorProjectCardSkeleton.tsx` | Skeleton placeholder for project list loading |
| `src/features/supervisor/components/ProjectDetailsSkeleton.tsx` | Skeleton placeholder for project detail loading |
| `src/features/supervisor/api/supervisorApi.ts` | Supervisor API client for student search and project creation |
| `src/features/supervisor/hooks/useSupervisorProjects.ts` | API-backed supervisor project list hook |
| `src/features/supervisor/hooks/useSupervisorProject.ts` | API-backed supervisor project detail hook |
| `src/features/supervisor/hooks/useSupervisorWorkspace.ts` | Local mock-backed workspace hook |
| `src/features/supervisor/data/mockSupervisorWorkspace.ts` | UI mock data source |
| `src/features/supervisor/index.ts` | Barrel export for pages, hooks, data, and components |

## Projects Route

The `/supervisor/projects` route is now backed by `GET /api/supervisor/projects`.

### Current live data source

- `SupervisorProjectsPage` no longer reads from seeded/mock supervisor workspace data
- Data is loaded through `useSupervisorProjects`
- API calls are made through `supervisorApi.getProjects()`

### Current list record shape

The list route intentionally uses a smaller summary model instead of the full mock-only project shape.

Fields currently used by the list UI:

- `id`
- `title`
- `summary`
- `lifecycleStatus`
- `batch`
- `semester`
- `milestoneDate`
- `progressPercent`
- `healthNote`
- `memberCount`

### Loading and error handling

- While loading:
  - card skeletons are shown via `SupervisorProjectCardSkeleton`
- On failure:
  - shared `ErrorState` is shown
- On success with no records:
  - shared `EmptyState` is shown

### Development note

The project list hook deduplicates the initial request in development so React Strict Mode does not trigger duplicate `GET /api/supervisor/projects` calls during mount checks.

### Removed mock-only list concerns

The list route no longer depends on seeded fields that are not yet backed by the backend, including:

- integration filters
- integration issue counts
- action item counts
- action-item shortcut buttons
- seeded member chip previews

## Project Detail Route

The `/supervisor/projects/:projectId` route is now backed by `GET /api/supervisor/projects/:projectId`.

### Current live data source

- `ProjectDetailsPage` no longer reads from seeded/mock supervisor workspace data
- Data is loaded through `useSupervisorProject`
- API calls are made through `supervisorApi.getProjectById()`

### Current detail record shape

The detail route intentionally uses a smaller backend-backed detail model instead of the older mock-heavy project shape.

Fields currently used by the detail UI:

- `id`
- `title`
- `summary`
- `lifecycleStatus`
- `batch`
- `semester`
- `milestoneDate`
- `progressPercent`
- `healthNote`
- `lastActivityAt`
- `members[]`
- `milestones[]`

### Current tabs

The live detail page currently exposes only tabs supported by the backend response:

- `overview`
- `team`
- `milestones`

### Loading and error handling

- While loading:
  - `ProjectDetailsSkeleton` is shown
- On failure:
  - shared `ErrorState` is shown
- On `404`:
  - a dedicated “Project not found” state is shown

### Removed mock-only detail concerns

The live detail route no longer depends on seeded fields that are not yet backed by the backend, including:

- activity timeline
- contribution analytics
- meetings
- action items
- files
- integration panels
- quick-link sections for external tools

## Create Project Flow

`CreateProjectPage` is no longer the older multi-step UI draft. It now submits a real backend request for the first project creation use case.

### Current input scope

- `title`
- `summary`
- `batch`
- `semester`
- one initial milestone:
  - `milestoneTitle`
  - `milestoneDescription`
  - `milestoneDueDate`
- one or more student assignments selected from backend search results

### Student assignment lookup

- Student lookup calls `GET /api/supervisor/students/search?q=...`
- Search starts after 3 typed characters
- Search currently targets registered student emails
- Result items show:
  - full name
  - email
  - registration number
- Empty result state is explicit:
  - `No registered student found.`
- Duplicate student selections are prevented in the UI

### Submit behavior

- Project creation calls `POST /api/supervisor/projects`
- The page sends one request containing:
  - project basics
  - selected `studentIds`
  - one initial milestone
- The page displays backend success and error messages directly in the request-state modal
- On success, closing the success modal redirects to `/supervisor/projects`

## Request Feedback UI

The supervisor create flow now uses two loading patterns:

- Inline loading:
  - `BlockingState`
  - Used only for local UI segments such as the student search results area
- Full-screen blocking request modal:
  - `RequestStateModal`
  - Used for major write actions such as project creation
  - Covers the full viewport through a React portal
  - Supports:
    - `loading`
    - `success`
    - `error`

When project creation succeeds and the modal is closed, the page redirects to `/supervisor/projects`.

## Form Limits

Applied input limits in the current create form:

- `Project title`: 40 characters (limit enforced, counter hidden)
- `Summary`: 250 characters (limit enforced, counter visible)
- `Milestone title`: 40 characters (limit enforced, counter hidden)
- `Milestone description`: 250 characters (limit enforced, counter visible)
- `Batch`: 32 characters (limit enforced, counter hidden)
- `Semester`: 32 characters (limit enforced, counter hidden)

## Empty State

`SupervisorProjectsPage` uses the shared `EmptyState` component when filters return zero visible projects.

- Title: "No projects found"
- Description: "No supervised projects match your current filters."
- Primary action: `Create new project`
- Secondary action: `Clear filters` (only when a filter or search query is active)

## Notes

- `SupervisorProjectsPage` is backend-connected for list reads.
- `ProjectDetailsPage` is backend-connected for detail reads.
- `CreateProjectPage` is backend-connected for student search and project creation.
- `SupervisorDashboardPage` still relies on mock-backed workspace data.
- Route guards currently allow UI-only cross-role preview during local development. Real authorization must be enforced by the backend.
