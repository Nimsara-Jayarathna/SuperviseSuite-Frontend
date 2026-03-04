# Student Feature

Student workspace UI for browsing assigned projects and reviewing project details.

## Routes

| Path | Component | Layout |
|------|-----------|--------|
| `/student` | Redirects to `/student/projects` | `StudentLayout` |
| `/student/projects` | `StudentProjectsPage` | `StudentLayout` |
| `/student/projects/:projectId` | `StudentProjectDetailsPage` | `StudentLayout` |

## Route Behaviour

- Protected by `RequireRole("STUDENT")`.
- In the current local preview setup, authenticated users can still inspect the student shell even if their stored role is not `STUDENT`.
- Legacy aliases such as `/project`, `/projects`, and `/project/:projectId` resolve into student routes when the stored user is not a supervisor.

## Current UX Structure

- Shared app shell via `AppShell` and `TopBar`
- Student list page with:
  - `PageHeader`
  - inline search
  - API-backed project cards
  - loading skeletons
  - shared error/empty states
- Student detail page currently remains mock-backed and keeps the previous tabbed workspace UI

## Key Files

| File | Purpose |
|------|---------|
| `src/features/student/pages/StudentProjectsPage.tsx` | API-backed student project list + search + loading/error/empty states |
| `src/features/student/pages/StudentProjectDetailsPage.tsx` | Student project workspace (currently mock-backed) |
| `src/features/student/components/StudentProjectCard.tsx` | Summary card for backend-backed student list records |
| `src/features/student/components/StudentProjectCardSkeleton.tsx` | Skeleton placeholder for student project list loading |
| `src/features/student/api/studentApi.ts` | Student API client for project list reads |
| `src/features/student/hooks/useStudentProjectSummaries.ts` | API-backed student project list hook |
| `src/features/student/hooks/useStudentProjects.ts` | Local mock-backed project access hook (currently used by detail route) |
| `src/features/student/data/mockStudentProjects.ts` | UI mock data source |
| `src/features/student/types.ts` | Feature-local summary/detail/tab types |

## Projects Route

The `/student/projects` route is now backed by `GET /api/student/projects`.

### Current live data source

- `StudentProjectsPage` no longer reads from seeded/mock student list data.
- Data is loaded through `useStudentProjectSummaries`.
- API calls are made through `studentApi.getProjects()`.

### Current list record shape

The list route intentionally uses a summary model instead of the full older mock detail shape.

Fields currently used by the list UI:

- `id`
- `title`
- `summary`
- `status`
- `batch`
- `semester`
- `milestoneDate`
- `lastActivityAt`
- `progressPercent`
- `supervisorName`

### Loading and error handling

- While loading:
  - card skeletons are shown via `StudentProjectCardSkeleton`
- On failure:
  - shared `ErrorState` is shown
- On success with no records:
  - shared `EmptyState` is shown

### Removed mock-only list concerns

The list route no longer depends on seeded detail-only data that is not yet backed by the student list API, including:

- `metrics[]`
- action-item counts
- integration status records
- full team member arrays
- detail-oriented artifacts (activity/meetings/files)

## Project Detail Route

`/student/projects/:projectId` is intentionally unchanged in this phase.

### Current state

- still uses `useStudentProjects` (mock-backed hook)
- still renders the richer tabbed workspace:
  - `overview`
  - `team`
  - `activity`
  - `meetings`
  - `action-items`
  - `files`

### Why

The student detail endpoint has not been implemented in the backend yet. The student list was moved to real API data first to avoid mixing list and detail API scope in one sprint.

## Empty State

`StudentProjectsPage` uses the shared `EmptyState` component.

- Base empty case: no visible projects
- Copy: "No projects found"
- Description: "You don’t have any assigned projects matching your filters yet."
- Action:
  - `Clear filters` when a search query is active
  - `Refresh` (re-fetch via hook reload) when the list is empty without an active query

## Notes

- `/student/projects` is backend-connected for list reads.
- `/student/projects/:projectId` is still mock-backed in this phase.
- Route guards currently allow UI-only cross-role preview during local development. Real authorization must be enforced by the backend.
