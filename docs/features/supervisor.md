# Supervisor Feature

Supervisor workspace for dashboard monitoring, project listing, project creation, and project detail management.

## Routes

| Path | Component | Layout |
|------|-----------|--------|
| `/supervisor` | `SupervisorDashboardPage` | `SupervisorLayout` |
| `/supervisor/dashboard` | `SupervisorDashboardPage` | `SupervisorLayout` |
| `/supervisor/projects` | `SupervisorProjectsPage` | `SupervisorLayout` |
| `/supervisor/projects/new` | `CreateProjectPage` | `SupervisorLayout` |
| `/supervisor/projects/:projectId` | `ProjectDetailsPage` | `SupervisorLayout` |

## Alias Support

Supported aliases:

- `/supervisor/project` -> `/supervisor/projects`
- `/supervisor/project/new` -> `/supervisor/projects/new`
- `/supervisor/project/:projectId` -> `/supervisor/projects/:projectId`

Global legacy aliases (`/dashboard`, `/project`, `/project/new`, `/projects/:projectId`) redirect to supervisor routes when stored user role is supervisor.

## API Coverage Summary

Supervisor feature currently uses these APIs:

- `GET /api/supervisor/dashboard`
- `GET /api/supervisor/projects`
- `GET /api/supervisor/projects/{projectId}`
- `GET /api/supervisor/students/search?q=...`
- `POST /api/supervisor/projects`
- `PATCH /api/supervisor/projects/{projectId}`
- `PATCH /api/supervisor/projects/{projectId}/status`
- `PATCH /api/supervisor/projects/{projectId}/repository`
- `POST /api/supervisor/projects/{projectId}/members`
- `POST /api/supervisor/projects/{projectId}/milestones`
- `PATCH /api/supervisor/projects/{projectId}/milestones/{milestoneId}`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/features/supervisor/pages/SupervisorDashboardPage.tsx` | API-backed supervisor dashboard with project-health search table and client-side pagination (5 rows/page) |
| `src/features/supervisor/pages/SupervisorProjectsPage.tsx` | API-backed project list with lifecycle filter and skeleton/error/empty states |
| `src/features/supervisor/pages/CreateProjectPage.tsx` | API-backed project creation with student lookup and request-state modal |
| `src/features/supervisor/pages/ProjectDetailsPage.tsx` | API-backed detail page with overview edit, team student-add flow, and milestone add/edit |
| `src/features/supervisor/components/ProjectDetail/RepositorySection.tsx` | GitHub repository link add/edit/remove section with validation and request feedback |
| `src/features/supervisor/components/SupervisorProjectCard.tsx` | Clickable summary card (full-card navigation) with compact status/progress layout |
| `src/features/supervisor/components/SupervisorProjectCardSkeleton.tsx` | List loading placeholder |
| `src/features/supervisor/components/ProjectDetailsSkeleton.tsx` | Detail loading placeholder |
| `src/features/supervisor/api/supervisorApi.ts` | Supervisor API client for read + mutation endpoints |
| `src/features/supervisor/hooks/useSupervisorDashboard.ts` | Dashboard hook with loading/error/retry |
| `src/features/supervisor/hooks/useSupervisorProjects.ts` | Project list hook |
| `src/features/supervisor/hooks/useSupervisorProject.ts` | Project detail hook |

---

## Dashboard (`/supervisor/dashboard`)

### Data source

- Uses `useSupervisorDashboard`
- Calls `GET /api/supervisor/dashboard`

### Current behavior

- Stats cards from backend aggregates:
  - total projects
  - active
  - at risk
  - behind
  - upcoming milestones
- Project health table:
  - backend project summary rows
  - local search by title/summary
  - FE-only pagination at 5 rows per page
- Attention and upcoming sections:
  - derived from dashboard `projects[]` payload on FE

### UX states

- Loading: skeleton cards/rows
- Error: `ErrorState` with retry
- Empty results: `EmptyState` or fallback text blocks

---

## Projects List (`/supervisor/projects`)

### Data source

- Uses `useSupervisorProjects`
- Calls `GET /api/supervisor/projects`

### Card behavior

- Entire card is clickable to open project detail.
- "Open workspace" footer button removed.
- Status badge and progress appear in top row for compact vertical layout.
- Long text uses truncation with title tooltip fallback.

### Filtering

- Query filter by title/summary/batch/semester
- Lifecycle dropdown filter

---

## Create Project (`/supervisor/projects/new`)

### Current scope

- Fields:
  - title
  - summary
  - batch
  - semester
  - initial milestone (`title`, `description`, `dueDate`)
  - selected `studentIds`

### Student lookup flow

- Search after 3+ characters
- Calls `GET /api/supervisor/students/search?q=...`
- Shows full name, email, registration number
- Prevents duplicate selection

### Submit flow

- Calls `POST /api/supervisor/projects`
- On success:
  - shows success modal
  - invalidates project list cache
  - redirects to `/supervisor/projects`

### Request feedback UI

- Inline search loading uses `BlockingState`
- Major action feedback uses full-screen `RequestStateModal`

---

## Project Detail (`/supervisor/projects/:projectId`)

### Data source

- Uses `useSupervisorProject`
- Calls `GET /api/supervisor/projects/{projectId}`

### Tabs

- `Overview`
- `Team`
- `Milestones`

### Header status control

- Lifecycle status is editable from the top chip row dropdown.
- Calls `PATCH /api/supervisor/projects/{projectId}/status`.
- On failure, UI reverts to previous status and shows inline error.

### Overview tab: core edit mode

- `Edit details` toggles inline form.
- Editable fields:
  - title
  - summary
  - batch
  - semester
  - lifecycle status
  - health note
- Save calls `PATCH /api/supervisor/projects/{projectId}`.
- Cancel resets form to latest loaded data.

### Overview tab: GitHub repository link management

- Dedicated repository section supports add/edit/remove.
- Save calls `PATCH /api/supervisor/projects/{projectId}/repository`.
- Client-side validation allows only `https://github.com/{owner}/{repo}`.
- Empty input is treated as remove (`repositoryUrl = null`).

### Team tab: add-student management (add-only)

- `Manage students` mode supports:
  - email search
  - select/remove pending additions locally
  - submit selected additions
- Submit calls `POST /api/supervisor/projects/{projectId}/members`.
- Existing member deletion is intentionally not in scope.

### Milestones tab: add + edit

- `Add milestone` form:
  - title
  - description
  - due date
  - calls `POST /api/supervisor/projects/{projectId}/milestones`
- Milestone inline edit form:
  - title
  - description
  - due date
  - status
  - calls `PATCH /api/supervisor/projects/{projectId}/milestones/{milestoneId}`

### Error/empty handling

- Loading: `ProjectDetailsSkeleton`
- API errors: `ErrorState`
- `NOT_FOUND`: dedicated project-not-found state with back link

---

## Form Limits (current)

- Project title: `40`
- Summary: `250`
- Batch: `32`
- Semester: `32`
- Milestone title: `40`
- Milestone description: `250`

Summary and milestone description show visible counters where applicable in create flow.

---

## Notes

- Supervisor dashboard, projects list, create flow, and detail management are all backend-connected.
- Route guards are still UI-level and not a backend security boundary.
