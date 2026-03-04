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
- Project list page with `PageHeader`, inline search, compact project cards, loading skeletons, `ErrorState`, and `EmptyState`
- Project detail page with:
  - metadata badges
  - metric row from backend-backed fields
  - shared `PageTabs`
  - tabbed sections for `overview`, `team`, and `milestones`

## Key Files

| File | Purpose |
|------|---------|
| `src/features/student/pages/StudentProjectsPage.tsx` | API-backed student project list + search + empty/error states |
| `src/features/student/pages/StudentProjectDetailsPage.tsx` | API-backed student project detail view |
| `src/features/student/components/StudentProjectCard.tsx` | Compact list card used on `/student/projects` |
| `src/features/student/components/StudentProjectCardSkeleton.tsx` | Skeleton placeholder for project list loading |
| `src/features/student/components/StudentProjectDetailsSkeleton.tsx` | Skeleton placeholder for detail page loading |
| `src/features/student/hooks/useStudentProjects.ts` | API-backed list hook with cache and request dedupe |
| `src/features/student/hooks/useStudentProject.ts` | API-backed detail hook with per-project cache |
| `src/features/student/api/studentApi.ts` | Student API client for list and detail endpoints |
| `src/features/student/types.ts` | Feature-local API models and detail-tab types |

## API Coverage

### List route

`/student/projects` is backed by:

- `GET /api/student/projects`

Current list-card fields used by UI:

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

### Detail route

`/student/projects/:projectId` is backed by:

- `GET /api/student/projects/:projectId`

Current detail fields used by UI:

- `id`
- `title`
- `summary`
- `status`
- `batch`
- `semester`
- `milestoneDate`
- `lastActivityAt`
- `progressPercent`
- `healthNote`
- `members[]`
- `milestones[]`

## Detail Tabs

The live student detail page currently exposes only backend-backed tabs:

- `overview`
- `team`
- `milestones`

Tabs for activity, meetings, action items, and files are intentionally not shown until backend endpoints are available.

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

## Loading and Error Handling

- List loading: `StudentProjectCardSkeleton`
- Detail loading: `StudentProjectDetailsSkeleton`
- API failures: shared `ErrorState`
- `404` on detail route: dedicated "Project not found" state with back navigation

## Notes

- Student project list and detail routes are backend-connected.
- Student mock project seed data has been removed from the feature module.
- Route guards remain UI-level only and are not a backend security boundary.
