# Student Feature

Student workspace for browsing assigned projects and reading project detail.

## Routes

| Path | Component | Layout |
|------|-----------|--------|
| `/student` | Redirect to `/student/projects` | `StudentLayout` |
| `/student/projects` | `StudentProjectsPage` | `StudentLayout` |
| `/student/projects/:projectId` | `StudentProjectDetailsPage` | `StudentLayout` |

## Route Behavior

- Protected by `RequireRole("STUDENT")`.
- Legacy aliases (`/project`, `/projects`, `/project/:projectId`) resolve into student routes for non-supervisor stored users.
- Guard behavior remains UI-level only; backend authorization is the security boundary.

---

## API Coverage

Student pages currently use:

- `GET /api/student/projects`
- `GET /api/student/projects/{projectId}`
- `GET /api/student/projects/{projectId}/github`
- `GET /api/student/projects/{projectId}/github/activity?page=...&size=...`
- `GET /api/student/projects/{projectId}/github/contributors?page=...&size=...`
- `GET /api/student/projects/{projectId}/jira/team-workload`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/features/student/pages/StudentProjectsPage.tsx` | API-backed list page with search + loading/error/empty states |
| `src/features/student/pages/StudentProjectDetailsPage.tsx` | API-backed detail page |
| `src/features/student/components/StudentProjectCard.tsx` | Clickable list card (full-card navigation) |
| `src/features/student/components/StudentProjectCardSkeleton.tsx` | List loading placeholder |
| `src/features/student/components/StudentProjectDetailsSkeleton.tsx` | Detail loading placeholder |
| `src/features/student/hooks/useStudentProjects.ts` | List hook |
| `src/features/student/hooks/useStudentProject.ts` | Detail hook |
| `src/features/student/api/studentApi.ts` | Student API client |
| `src/features/student/types.ts` | Student list/detail API models |
| `src/features/supervisor/components/ProjectDetail/TeamWorkloadSection.tsx` | Shared read-only Jira workload analytics panel reused by student view |

---

## Projects List (`/student/projects`)

### Data source

- Uses `useStudentProjects`
- Calls `GET /api/student/projects`

### Current card behavior

- Full card click opens `/student/projects/:projectId`
- Status + progress shown in compact top row
- Long text fields are truncated with tooltip fallback
- Legacy action footer buttons removed

### Search/filter behavior

- Local search by title/summary/supervisor/batch/semester
- Uses deferred query for responsive typing

### UX states

- Loading: `StudentProjectCardSkeleton`
- Error: `ErrorState` with retry
- Empty: `EmptyState` with clear/refresh action depending on filter state

---

## Project Detail (`/student/projects/:projectId`)

### Data source

- Uses `useStudentProject`
- Calls `GET /api/student/projects/{projectId}`

### Tabs

- `Overview`
- `Team`
- `Milestones`
- `GitHub`
- `Jira`

### Header chips

- Status chip aligned with milestone/team/progress pills
- Metadata chips are read-only for student role

### Detail sections

- Overview:
  - batch, semester, health note, primary milestone summary
- Team:
  - assigned member cards (name/email/member role/registration number)
- Milestones:
  - milestone list with sequence, status, due date, description
- GitHub (read-only shared dashboard):
  - uses same layout/components as supervisor GitHub tab
  - shows repository overview, activity summary, contributors preview, activity preview
  - supports paginated full-list modals for commits/contributors
  - no add/edit/remove/refresh controls are rendered for students
  - when no repository is linked, shows a read-only CTA to navigate to Overview tab guidance
- Jira (read-only shared workload analytics):
  - loads via `GET /api/student/projects/{projectId}/jira/team-workload`
  - reuses shared `TeamWorkloadSection` with no refresh controls
  - shows loading skeleton and retry action on fetch errors
  - when workload has no student rows, bar/table are hidden while unassigned warning remains visible
  - when Jira is not connected, shows read-only "Ask your supervisor to connect Jira" state

### UX states

- Loading: `StudentProjectDetailsSkeleton`
- API errors: `ErrorState`
- `NOT_FOUND`: dedicated project-not-found screen with back link

---

## Notes

- Student list and detail routes are backend-connected.
- Student mock project seed data is removed from active list/detail rendering.
- GitHub tab is always present in detail tabs, but displays role-safe empty state when no repository is linked.
