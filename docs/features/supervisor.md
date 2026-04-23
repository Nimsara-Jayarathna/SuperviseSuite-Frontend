# Supervisor Feature

Supervisor workspace for dashboard monitoring, project listing, project creation, and project detail management.

Related major-fixes doc: `docs/branches/major-fixes-scrum-97-supervisor-ui-workflow.md`
Related GitHub integration doc: `docs/branches/major-fixes-scrum-80-github-dashboard-integration.md`
Related multi-repository doc: `docs/branches/major-fixes-scrum-81-multiple-github-repositories.md`
Related meetings doc: `docs/branches/major-fixes-meetings-tab-channel-management.md`
Related meeting records doc: `docs/branches/major-fixes-meetings-tab-records-management.md`

## Routes

| Path | Component | Layout |
|------|-----------|--------|
| `/supervisor` | `SupervisorDashboardPage` | `SupervisorLayout` |
| `/supervisor/dashboard` | `SupervisorDashboardPage` | `SupervisorLayout` |
| `/supervisor/projects` | `SupervisorProjectsPage` | `SupervisorLayout` |
| `/supervisor/projects/new` | `CreateProjectPage` | `SupervisorLayout` |
| `/supervisor/projects/:projectId` | `ProjectDetailsPage` | `SupervisorLayout` |
| `/github/request-access` | `RequestGitHubRepositoryAccessPage` | Public (no auth guard) |
| `/github/access-updated` | `GitHubAccessUpdatedPage` | Public (no auth guard) |

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
- `GET /api/supervisor/projects/{projectId}/github`
- `GET /api/supervisor/projects/{projectId}/github/activity?page=...&size=...`
- `GET /api/supervisor/projects/{projectId}/github/contributors?page=...&size=...`
- `GET /api/supervisor/projects/{projectId}/github/installations/{installationId}/repositories?page=...&size=...`
- `POST /api/supervisor/projects/{projectId}/github/link`
- `POST /api/supervisor/projects/{projectId}/github/access/remove`
- `POST /api/supervisor/projects/{projectId}/github/access-requests`
- `GET /api/supervisor/projects/{projectId}/github/access-requests/validate?token=...`
- `POST /api/supervisor/projects/{projectId}/github/access-requests/continue?token=...`
- `POST /api/supervisor/projects/{projectId}/github/refresh`
- `GET /api/supervisor/projects/{projectId}/jira/auth-url`
- `POST /api/supervisor/jira/oauth/complete`
- `POST /api/supervisor/projects/{projectId}/jira/disconnect`
- `GET /api/supervisor/projects/{projectId}/jira/health`
- `GET /api/supervisor/projects/{projectId}/jira/workload`
- `GET /api/supervisor/projects/{projectId}/jira/hierarchy`
- `POST /api/supervisor/projects/{projectId}/jira/refresh`
- `GET /api/supervisor/projects/{projectId}/meeting-channels`
- `POST /api/supervisor/projects/{projectId}/meeting-channels`
- `PATCH /api/supervisor/projects/{projectId}/meeting-channels/{channelId}`
- `DELETE /api/supervisor/projects/{projectId}/meeting-channels/{channelId}`
- `POST /api/supervisor/projects/{projectId}/meeting-channels/{channelId}/approve`
- `GET /api/supervisor/projects/{projectId}/meeting-records`
- `POST /api/supervisor/projects/{projectId}/meeting-records`
- `PATCH /api/supervisor/projects/{projectId}/meeting-records/{recordId}`
- `DELETE /api/supervisor/projects/{projectId}/meeting-records/{recordId}`
- `POST /api/supervisor/projects/{projectId}/meeting-records/{recordId}/approve`
- `GET /api/supervisor/projects/{projectId}/files`
- `POST /api/supervisor/projects/{projectId}/files/upload-url`
- `POST /api/supervisor/projects/{projectId}/files/confirm`
- `GET /api/supervisor/projects/{projectId}/files/{fileId}/download-url`
- `DELETE /api/supervisor/projects/{projectId}/files/{fileId}`
- `GET /api/github/access-requests/validate?token=...`
- `POST /api/github/access-requests/continue?token=...`
- `GET /api/github/access-updated/summary?token=...`
- `POST /api/github/access-updated/acknowledge?token=...`
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
| `src/features/supervisor/pages/ProjectDetailsPage.tsx` | API-backed detail page with overview edit, shared GitHub tab, team student-add flow, and milestone add/edit |
| `src/features/supervisor/pages/RequestGitHubRepositoryAccessPage.tsx` | Public request-access landing page that validates token and continues to backend-managed GitHub redirect |
| `src/features/supervisor/pages/GitHubAccessUpdatedPage.tsx` | Public callback result page that shows updated accessible repositories and acknowledges completion |
| `src/features/supervisor/components/ProjectDetail/RepositorySection.tsx` | Supervisor Overview repository management card (single-link action, remove action, GitHub App/manual link entrypoint) |
| `src/features/supervisor/components/ProjectDetail/RepositoryLinkModalContent.tsx` | Guided modal with method-first UX, installation repository selection, loading skeletons, and GitHub App/request-access actions |
| `src/features/supervisor/components/ProjectDetail/IntegrationsTabSection.tsx` | Integrations tab containing GitHub repository controls and Jira connect/disconnect actions |
| `src/features/supervisor/components/ProjectDetail/JiraTabSection.tsx` | Jira tab shell for Jira workspace context and Jira health overview rendering |
| `src/features/supervisor/components/ProjectDetail/MeetingsTabSection.tsx` | Meetings tab shell (`Channels`/`Records`) with Jira-style pill navigation |
| `src/features/meetings/components/SupervisorMeetingChannelsSection.tsx` | Supervisor meeting channels panel with add/edit/delete/approve actions |
| `src/features/meetings/hooks/useSupervisorMeetingChannelsState.ts` | Supervisor meetings state orchestration (load/mutations/request-state modal lifecycle) |
| `src/features/meetings/components/MeetingChannelsTable.tsx` | Shared table for channel listing/status display |
| `src/features/meetings/components/MeetingChannelFormModal.tsx` | Shared meeting channel create/edit modal form |
| `src/features/meetings/components/MeetingChannelDeleteConfirmModal.tsx` | Supervisor delete confirmation modal |
| `src/features/meetings/components/SupervisorMeetingRecordsSection.tsx` | Supervisor meeting records panel with add/edit/delete/approve actions |
| `src/features/meetings/hooks/useSupervisorMeetingRecordsState.ts` | Supervisor meeting records state orchestration (load/mutations/request-state modal lifecycle) |
| `src/features/meetings/components/MeetingRecordsTable.tsx` | Shared table for record listing/status display |
| `src/features/meetings/components/MeetingRecordFormModal.tsx` | Shared meeting record create/edit modal form |
| `src/features/meetings/components/MeetingRecordDeleteConfirmModal.tsx` | Supervisor delete confirmation modal |
| `src/features/meetings/components/MeetingRecordDetailsModal.tsx` | Shared meeting record details modal |
| `src/features/supervisor/components/ProjectDetail/FilesTabSection.tsx` | Files tab for upload, list, download, and soft-delete flows |
| `src/features/supervisor/components/ProjectDetail/jira/JiraHealthOverview.tsx` | Shared Jira analytics orchestrator (tab switcher, context bar, refresh action) |
| `src/features/supervisor/components/ProjectDetail/jira/workload/JiraWorkloadPanel.tsx` | Member workload comparison dashboard with imbalance alerts and unassigned warnings |
| `src/features/supervisor/components/ProjectDetail/jira/workload/JiraWorkloadTable.tsx` | Metric-rich team member workload list (open, overdue, story points, recency) |
| `src/features/supervisor/components/ProjectDetail/jira/workload/JiraWorkloadBarChart.tsx` | Blended bar chart showing hierarchical issue-type distribution per member |
| `src/features/supervisor/components/SupervisorProjectCard.tsx` | Clickable summary card (full-card navigation) with compact status/progress layout |
| `src/features/supervisor/components/SupervisorProjectCardSkeleton.tsx` | List loading placeholder |
| `src/features/supervisor/components/ProjectDetailsSkeleton.tsx` | Detail loading placeholder |
| `src/features/supervisor/api/supervisorApi.ts` | Supervisor API client for read + mutation endpoints |
| `src/features/supervisor/hooks/useJiraHealth.ts` | Shared Jira health hook used by supervisor/student Jira views |
| `src/features/supervisor/hooks/useJiraWorkload.ts` | Scalable workload analytics hook with support for imbalances and estimates |
| `src/features/supervisor/hooks/useSupervisorDashboard.ts` | Dashboard hook with loading/error/retry |
| `src/features/supervisor/hooks/useSupervisorProjects.ts` | Project list hook |
| `src/features/supervisor/hooks/useSupervisorProject.ts` | Project detail hook |
| `src/features/projectfiles/hooks/useSupervisorProjectFiles.ts` | Files tab state: lazy load, seed from project detail, upload/delete/download actions |
| `src/features/projectfiles/components/UploadFileModal.tsx` | Upload modal with file-picker UX, FE validation, and request-state lifecycle modal |
| `src/features/projectfiles/components/DeleteConfirmModal.tsx` | Supervisor-only delete confirmation modal |

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
  - optional project leader (`leaderStudentId`)
  - milestones array (`title`, `description`, `dueDate`)
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
- `Integrations`
- `Files`
- `GitHub`
- `Jira`
- `Meetings`

### Files tab: attachment management

- Data source:
  - Primary seed from `GET /api/supervisor/projects/{projectId}` via embedded `data.files`.
  - Refresh/list endpoint: `GET /api/supervisor/projects/{projectId}/files`.
- Upload flow:
  - `POST /files/upload-url` -> direct S3 PUT -> `POST /files/confirm`.
  - On success, UI inserts returned file row without forcing an immediate list re-fetch.
- Delete flow:
  - Supervisor-only `DELETE /files/{fileId}` with confirmation modal.
  - On success, removed from local list immediately.
- Download flow:
  - `GET /files/{fileId}/download-url`, then browser opens pre-signed URL.
- Validation/config:
  - Uses backend-provided `files.config` (`maxFileSizeBytes`, `maxFileNameLength`, `allowedTypes`, `presignedUrlExpirySeconds`).
  - No FE hardcoded type/size/name limits.

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

- Repository card uses a single `Link repository` button.
- Clicking opens a guided modal:
  - Step 1: choose connection method (`Repository URL` or `GitHub App`)
  - Step 2: show only relevant content for selected method
- Repository URL method:
  - validates `https://github.com/{owner}/{repo}`
  - saves via `PATCH /api/supervisor/projects/{projectId}/repository`
- GitHub App method:
  - `Connect GitHub App` redirects to backend start endpoint:
    - `GET /api/supervisor/projects/{projectId}/github/setup/start`
    - backend generates project-aware `state` and redirects to GitHub install URL
  - `Request More Repository Access` creates short-lived project-scoped request link
  - modal success shows copyable access-request link (no direct auto-open)
- If installation is already authorized for the project and no repo is linked:
  - card shows `Existing GitHub Access Authorization` block
  - `Configure repository` opens explicit repository selection
  - `Remove access linkage` clears project-level authorization + cached linkage
- Repository selection step:
  - loads via `GET /api/supervisor/projects/{projectId}/github/installations/{installationId}/repositories`
  - supports backend pagination (`Load more`)
  - includes animated blocking skeleton while loading
  - list is single-select and always selectable
  - confirm links selected repo via `POST /api/supervisor/projects/{projectId}/github/link`
- Save calls `PATCH /api/supervisor/projects/{projectId}/repository`.
- When one repository is linked, `Link repository` is disabled (current one-repo scope).
- `Remove` action clears repository/app linkage from the project.

### Public request-access callback flow

- Route: `/github/request-access?token=...`
  - validates token through backend public endpoint
  - explains project-scoped GitHub access update before redirect
  - continues via backend endpoint that returns GitHub authorize/install URL
- Route: `/github/access-updated?token=...`
  - loads summary of installation repository scope after callback
  - shows current accessible repositories
  - acknowledges completion and returns to app root

### GitHub tab: shared read-only dashboard

- Uses the same `CommitActivitySection` component as student view.
- Preview data is sourced from project detail `github` block.
- Shows:
  - Repository overview (with last synced + refresh)
  - Activity summary
  - Contributors preview
  - Activity feed preview
- Opens shared paginated modals:
  - full activity
  - full contributors
- Refresh action:
  - supervisor-only
  - calls `POST /api/supervisor/projects/{projectId}/github/refresh`
  - then re-fetches project detail payload

### Integrations tab: GitHub + Jira connection controls

- Shows GitHub integration controls via repository management card.
- Shows Jira integration card with current workspace state.
- Jira actions in this tab:
  - connect Jira (OAuth start)
  - disconnect Jira workspace
- Jira connect/disconnect is intentionally isolated to Integrations tab.

### Jira tab: health and productivity monitoring

The Jira tab contains multiple insights sub-tabs for comprehensive project monitoring. Data is updated via the **Refresh** action in the header.

**Sub-tabs:**

1.  **Health**: Status breakdown donut, issue type distribution bar chart (hierarchical), and project quality signals (bug ratio with risk zones).
2.  **Sprint Progress**: Multi-sprint analysis window:
    - Supports selecting from the **4 most recent sprints**.
    - Shows completion rings (Issues vs. Story Points).
    - Story point distribution bars (Done / In Progress / Open).
    - Weekly pulse metrics (Created vs. Resolved issues).
    - Sprint velocity historical chart.
3.  **Team Workload**: Member-wise productivity tracking:
    - **Workload Imbalance Alert**: Auto-detects and warns if one member has >3× the open issues compared to another.
    - **Comparison Table**: Sortable list showing open issues, completion rate, overdue items, and last activity date.
    - **Unassigned Issues**: Highlights issues without assignees to prevent slippage.
    - **Issue Type Distribution**: Member-level bar charts showing the breakdown of Story, Task, Bug, and Sub-task assignments.
4.  **Hierarchy**: Expandable issue tree:
    - Epic -> Story/Task/Bug -> Subtask structure from cached Jira issues.
    - Collapsed by default beyond depth 2.
    - Unlinked issues section for nodes whose parent is outside the project cache.

Jira data rules are backend-configurable:

- recent sprint window size
- backlog-growing consecutive week threshold
- priority names treated as high priority
- issue types treated as bugs (Bug, Critical, etc.)
- overdue estimation (7-day activity threshold when due dates are missing)

Scope note:

- Jira tab remains data/monitoring focused.
- OAuth connect/disconnect controls remain in Integrations tab.

### Meetings tab: channel management

- Inner sub-tabs use Jira-style pill navigation with `role="tablist"`:
  - `Channels`
  - `Records` (placeholder state)
- `Channels` data/actions:
  - list channels: `GET /api/supervisor/projects/{projectId}/meeting-channels`
  - add channel: `POST /api/supervisor/projects/{projectId}/meeting-channels`
  - update channel: `PATCH /api/supervisor/projects/{projectId}/meeting-channels/{channelId}`
  - delete channel: `DELETE /api/supervisor/projects/{projectId}/meeting-channels/{channelId}`
  - approve pending channel: `POST /api/supervisor/projects/{projectId}/meeting-channels/{channelId}/approve`
- Status behavior:
  - supervisor-created channels are approved immediately
  - student-created channels appear as pending until approved

- `Records` data/actions:
  - list records: `GET /api/supervisor/projects/{projectId}/meeting-records`
  - add record: `POST /api/supervisor/projects/{projectId}/meeting-records`
  - update record: `PATCH /api/supervisor/projects/{projectId}/meeting-records/{recordId}`
  - delete record: `DELETE /api/supervisor/projects/{projectId}/meeting-records/{recordId}`
  - approve pending record: `POST /api/supervisor/projects/{projectId}/meeting-records/{recordId}/approve`
  - supervisor-created records are approved immediately
  - student-created records appear as pending until approved

### Jira - Hierarchy tab

Displays all cached Jira issues in an expandable tree grouped by Epic -> Story/Task/Bug -> Subtask.

- Collapsed by default beyond depth 2.
- Each node shows: issue type badge, issue key, summary, status pill, assignee, and story points.
- "Unlinked Issues" section shows issues whose parent is outside the project's cache.
- Source: `GET /api/supervisor/projects/{projectId}/jira/hierarchy`
- Hook: `useJiraHierarchy`
- Components: `JiraHierarchyView`, `JiraHierarchyNode`, `JiraHierarchySkeleton`

### Team tab: add-student management (add-only)

- `Manage students` mode supports:
  - email search
  - select/remove pending additions locally
  - submit selected additions
- Submit calls `POST /api/supervisor/projects/{projectId}/members`.
- Existing member deletion is intentionally not in scope.
- Project leader assignment:
  - shows current leader (if available)
  - supports assigning/changing leader from currently assigned student members
  - persists leader change via `PATCH /api/supervisor/projects/{projectId}` using `leaderStudentId`

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
- Quick status update:
  - milestone rows include direct status dropdown for one-click status changes
  - updates are persisted through `PATCH /api/supervisor/projects/{projectId}/milestones/{milestoneId}`
  - UI applies status-based color coding for readability

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
- File name: backend-configured via `files.config.maxFileNameLength` (default `50`)

Summary and milestone description show visible counters where applicable in create flow.

---

## Notes

- Supervisor dashboard, projects list, create flow, and detail management are all backend-connected.
- GitHub tab is intentionally read-only; repository management remains in Overview card.
- Jira tab is intentionally health/read-only oriented; connect/disconnect remains in Integrations tab.
- Route guards are still UI-level and not a backend security boundary.
