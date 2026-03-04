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

### UX states

- Loading: `StudentProjectDetailsSkeleton`
- API errors: `ErrorState`
- `NOT_FOUND`: dedicated project-not-found screen with back link

---

## Notes

- Student list and detail routes are backend-connected.
- Student mock project seed data is removed from active list/detail rendering.
