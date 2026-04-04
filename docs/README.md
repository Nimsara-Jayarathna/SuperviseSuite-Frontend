# Documentation

Technical notes, architecture summaries, and feature guides for the SuperviseSuite frontend.

## Index

### Features

| File | Description |
|------|-------------|
| [features/landing.md](features/landing.md) | Landing page route, shell, hero composition, and CTA behaviour |
| [features/auth.md](features/auth.md) | Auth pages, forms, `useAuth`, `tokenStorage`, and guard behaviour |
| [features/student.md](features/student.md) | Student routes, API-backed project list/detail flows, GitHub and Jira read-only tabs, and empty state behavior |
| [features/supervisor.md](features/supervisor.md) | Supervisor routes, dashboard, projects, detail views, guided GitHub linking, Jira workload analytics tab, and project-scoped request-access callbacks |
| [features/brand.md](features/brand.md) | Logo component and SVG asset usage |

### Major Fixes

| File | Description |
|------|-------------|
| [branches/major-fixes-scrum-97-supervisor-ui-workflow.md](branches/major-fixes-scrum-97-supervisor-ui-workflow.md) | Major frontend fixes for supervisor workflow: guided creation, milestone UX, leader management, and landing card interaction stabilization |
| [branches/major-fixes-scrum-80-github-dashboard-integration.md](branches/major-fixes-scrum-80-github-dashboard-integration.md) | GitHub dashboard integration plus follow-up updates for explicit repo selection, project-scoped request-access flow, and callback summary UX |
| [branches/major-fixes-scrum-81-multiple-github-repositories.md](branches/major-fixes-scrum-81-multiple-github-repositories.md) | Dedicated SCRUM-81 record for supervisor GitHub App authorization, explicit installation repository selection, and access-request callback flow alignment |

### UI

| File | Description |
|------|-------------|
| [ui/button-system.md](ui/button-system.md) | Shared button contract and variant guidance |

### API

| File | Description |
|------|-------------|
| [api/error-handling.md](api/error-handling.md) | Frontend API envelope/error handling — `apiClient` normalization, `ApiError` types, refresh/retry rules |
