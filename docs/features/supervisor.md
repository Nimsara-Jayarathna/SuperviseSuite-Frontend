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
| `src/features/supervisor/pages/CreateProjectPage.tsx` | Multi-step UI draft for new project setup |
| `src/features/supervisor/pages/ProjectDetailsPage.tsx` | Project workspace detail page |
| `src/features/supervisor/components/SupervisorProjectCard.tsx` | Compact supervisor list card |
| `src/features/supervisor/hooks/useSupervisorWorkspace.ts` | Local mock-backed workspace hook |
| `src/features/supervisor/data/mockSupervisorWorkspace.ts` | UI mock data source |
| `src/features/supervisor/index.ts` | Barrel export for pages, hooks, data, and components |

## Empty State

`SupervisorProjectsPage` uses the shared `EmptyState` component when filters return zero visible projects.

- Title: "No projects found"
- Description: "No supervised projects match your current filters."
- Primary action: `Create new project`
- Secondary action: `Clear filters` (only when a filter or search query is active)

## Notes

- This feature is currently mock-data-backed for UI work.
- Route guards currently allow UI-only cross-role preview during local development. Real authorization must be enforced by the backend.
