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
- Project list page with `PageHeader`, inline search, compact project cards, and `EmptyState`
- Project detail page with:
  - metadata badges
  - metric row
  - shared `PageTabs`
  - tabbed sections for `overview`, `team`, `activity`, `meetings`, `action-items`, and `files`

## Key Files

| File | Purpose |
|------|---------|
| `src/features/student/pages/StudentProjectsPage.tsx` | Student project list + search + empty state |
| `src/features/student/pages/StudentProjectDetailsPage.tsx` | Student project workspace |
| `src/features/student/components/StudentProjectCard.tsx` | Compact list card used on `/student/projects` |
| `src/features/student/hooks/useStudentProjects.ts` | Local mock-backed project access hook |
| `src/features/student/data/mockStudentProjects.ts` | UI mock data source |
| `src/features/student/types.ts` | Feature-local project and tab types |

## Empty States

`StudentProjectsPage` uses the shared `EmptyState` component.

- Base empty case: no visible projects
- Copy: "No projects found"
- Description: "You don’t have any assigned projects matching your filters yet."
- Action:
  - `Clear filters` when a search query is active
  - `Refresh` when the list is empty without an active query

## Notes

- This feature is currently UI-only and mock-data-backed.
- The detail page uses consistent minimum-height tab panels so short tabs do not collapse the page layout too aggressively when switching views.
