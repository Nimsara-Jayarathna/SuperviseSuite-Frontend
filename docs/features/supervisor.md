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
| `src/features/supervisor/pages/SupervisorProjectsPage.tsx` | Project list, filters, and in-page create action |
| `src/features/supervisor/pages/CreateProjectPage.tsx` | API-backed create project flow with student lookup and milestone form |
| `src/features/supervisor/pages/ProjectDetailsPage.tsx` | Project workspace detail page |
| `src/features/supervisor/components/SupervisorProjectCard.tsx` | Compact supervisor list card |
| `src/features/supervisor/api/supervisorApi.ts` | Supervisor API client for student search and project creation |
| `src/features/supervisor/hooks/useSupervisorWorkspace.ts` | Local mock-backed workspace hook |
| `src/features/supervisor/data/mockSupervisorWorkspace.ts` | UI mock data source |
| `src/features/supervisor/index.ts` | Barrel export for pages, hooks, data, and components |

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

- `SupervisorProjectsPage` and `ProjectDetailsPage` are still mock-data-backed for list/detail display.
- `CreateProjectPage` is now backend-connected for student search and project creation.
- Route guards currently allow UI-only cross-role preview during local development. Real authorization must be enforced by the backend.
