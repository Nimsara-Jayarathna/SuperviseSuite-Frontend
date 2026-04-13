# Documentation

Technical notes, architecture summaries, and feature guides for the SuperviseSuite frontend.

## Index

### Features

| File | Description |
|------|-------------|
| [features/landing.md](features/landing.md) | Landing page route, shell, hero composition, and CTA behaviour |
| [features/auth.md](features/auth.md) | Auth pages, forms, `useAuth`, `tokenStorage`, and guard behaviour |
| [features/student.md](features/student.md) | Student routes, API-backed project list/detail flows, read-only GitHub/Jira, and student file upload/download tab behavior |
| [features/supervisor.md](features/supervisor.md) | Supervisor routes, dashboard, projects, detail views, Jira analytics, guided GitHub linking, and full project file management (upload/list/download/delete) |
| [features/brand.md](features/brand.md) | Logo component and SVG asset usage |

### Major Fixes

| File | Description |
|------|-------------|
| [branches/major-fixes-scrum-83-us-203-view-sprint-progress-dashboard.md](branches/major-fixes-scrum-83-us-203-view-sprint-progress-dashboard.md) | SCRUM-83 story notes for Jira tab sprint progress dashboard rendering and API integration |
| [branches/major-fixes-scrum-84-us-204-sprint-progress-velocity.md](branches/major-fixes-scrum-84-us-204-sprint-progress-velocity.md) | SCRUM-84 story notes for Jira tab sprint/velocity analytics behavior from backend-computed rules |
| [branches/major-fixes-scrum-97-supervisor-ui-workflow.md](branches/major-fixes-scrum-97-supervisor-ui-workflow.md) | Major frontend fixes for supervisor workflow: guided creation, milestone UX, leader management, and landing card interaction stabilization |
| [branches/major-fixes-scrum-80-github-dashboard-integration.md](branches/major-fixes-scrum-80-github-dashboard-integration.md) | GitHub dashboard integration plus follow-up updates for explicit repo selection, project-scoped request-access flow, and callback summary UX |
| [branches/major-fixes-scrum-81-multiple-github-repositories.md](branches/major-fixes-scrum-81-multiple-github-repositories.md) | Dedicated SCRUM-81 record for supervisor GitHub App authorization, explicit installation repository selection, and access-request callback flow alignment |
| [branches/major-fixes-scrum-106-auth-blocking-rate-limit.md](branches/major-fixes-scrum-106-auth-blocking-rate-limit.md) | SCRUM-106 notes for auth blocking-error UX, registration-config hard guard, and rate-limit handling parity |

### UI

| File | Description |
|------|-------------|
| [ui/button-system.md](ui/button-system.md) | Shared button contract and variant guidance |

### API

| File | Description |
|------|-------------|
| [api/error-handling.md](api/error-handling.md) | Frontend API envelope/error handling — `apiClient` normalization, `ApiError` types, refresh/retry rules |
