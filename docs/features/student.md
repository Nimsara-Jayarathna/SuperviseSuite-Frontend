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
- `GET /api/student/projects/{projectId}/jira/health`
- `GET /api/student/projects/{projectId}/jira/sprint-progress`
- `GET /api/student/projects/{projectId}/jira/workload`
- `GET /api/student/projects/{projectId}/jira/hierarchy`
- `GET /api/student/projects/{projectId}/meeting-channels`
- `POST /api/student/projects/{projectId}/meeting-channels`
- `GET /api/student/projects/{projectId}/meeting-records`
- `POST /api/student/projects/{projectId}/meeting-records`
- `GET /api/student/projects/{projectId}/files`
- `POST /api/student/projects/{projectId}/files/upload-url`
- `POST /api/student/projects/{projectId}/files/confirm`
- `GET /api/student/projects/{projectId}/files/{fileId}/download-url`

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
| `src/features/student/components/StudentMeetingsTabSection.tsx` | Meetings inner tab shell (`Channels`/`Records`) with Jira-style pill navigation |
| `src/features/meetings/components/StudentMeetingChannelsSection.tsx` | Student meeting channels panel with add/list flow |
| `src/features/meetings/hooks/useStudentMeetingChannelsState.ts` | Student meetings state orchestration (load/add/refresh modal lifecycle) |
| `src/features/meetings/components/MeetingChannelsTable.tsx` | Shared table for channel listing/status display |
| `src/features/meetings/components/MeetingChannelFormModal.tsx` | Shared meeting channel create/edit modal form |
| `src/features/meetings/components/StudentMeetingRecordsSection.tsx` | Student meeting records panel with add/list/view flow |
| `src/features/meetings/hooks/useStudentMeetingRecordsState.ts` | Student meeting records state orchestration (load/add/refresh modal lifecycle) |
| `src/features/meetings/components/MeetingRecordsTable.tsx` | Shared table for record listing/status display |
| `src/features/meetings/components/MeetingRecordFormModal.tsx` | Shared meeting record create/edit modal form |
| `src/features/meetings/components/MeetingRecordDetailsModal.tsx` | Shared meeting record details modal |
| `src/features/student/components/StudentFilesTabSection.tsx` | Student files tab for upload/list/download (no delete) |
| `src/features/projectfiles/hooks/useStudentProjectFiles.ts` | Files tab state: lazy load, seed from project detail, upload/download actions |
| `src/features/projectfiles/components/UploadFileModal.tsx` | Shared upload modal with FE validation + request-state lifecycle |
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
- `Files`
- `GitHub`
- `Jira`
- `Meetings`

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
- Jira (read-only shared analytics view):
  - Renders the same `JiraHealthOverview` orchestrator used by supervisors.
  - Sub-tabs: Health, Sprint Progress (4 most recent), Team Workload, and Hierarchy.
  - Fetches data via `GET /api/student/projects/{projectId}/jira/*` endpoints.
  - No manual refresh or connect/disconnect actions are exposed for students.
  - When Jira is not connected, displays a read-only empty state.
- Meetings:
  - Inner sub-tabs use Jira-style pill navigation with `role="tablist"`:
    - `Channels`
    - `Records`
  - `Channels` fetches and renders `GET /api/student/projects/{projectId}/meeting-channels`.
  - Students can submit channels via `POST /api/student/projects/{projectId}/meeting-channels`.
  - Student-submitted channels are shown as pending until supervisor approval.
  - No student edit/delete/approve actions are exposed.
  - `Records` fetches and renders `GET /api/student/projects/{projectId}/meeting-records`.
  - Students can submit records via `POST /api/student/projects/{projectId}/meeting-records`.
  - Student-submitted records are shown as pending until supervisor approval.
  - Student records are view-only after submission (no edit/delete/approve actions are exposed).

### Files (student scope)

- Data source:
  - Primary seed from `GET /api/student/projects/{projectId}` via embedded `data.files`.
  - Refresh/list endpoint: `GET /api/student/projects/{projectId}/files`.
- Upload flow:
  - `POST /files/upload-url` -> direct S3 PUT -> `POST /files/confirm`.
  - On success, UI inserts returned file row without immediate list re-fetch.
- Download flow:
  - `GET /files/{fileId}/download-url`, then browser opens pre-signed URL.
- Delete behavior:
  - No student delete action is available in UI or API.
- Validation/config:
  - Uses backend-provided `files.config` (`maxFileSizeBytes`, `maxFileNameLength`, `allowedTypes`, `presignedUrlExpirySeconds`).

### Jira - Hierarchy tab

Displays all cached Jira issues in an expandable tree grouped by Epic -> Story/Task/Bug -> Subtask.

- Collapsed by default beyond depth 2.
- Each node shows: issue type badge, issue key, summary, status pill, assignee, and story points.
- "Unlinked Issues" section shows issues whose parent is outside the project's cache.
- Source: `GET /api/student/projects/{projectId}/jira/hierarchy`
- Hook: `useStudentJiraHierarchy`
- Components: `JiraHierarchyView`, `JiraHierarchyNode`, `JiraHierarchySkeleton`

Jira tab data rules come from backend analytics configuration (no student-side overrides).

### UX states

- Loading: `StudentProjectDetailsSkeleton`
- API errors: `ErrorState`
- `NOT_FOUND`: dedicated project-not-found screen with back link

---

## Notes

- Student list and detail routes are backend-connected.
- Student mock project seed data is removed from active list/detail rendering.
- GitHub tab is always present in detail tabs, but displays role-safe empty state when no repository is linked.
- Jira tab is always present in detail tabs and remains read-only for students.
