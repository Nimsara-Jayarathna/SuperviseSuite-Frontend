# Frontend Feature Conventions

This repo is organized with a **feature-sliced** structure:

- `src/features/<feature>`: user-facing feature modules (UI + feature-level hooks/types)
- `src/components/ui`: shared, reusable UI primitives (no feature/business knowledge)
- `src/services`: cross-cutting infrastructure (HTTP client, storage, cache helpers)

## API modules

Guidelines:

- Feature API modules should do **HTTP calls + minimal caching** only.
- UI state (loading flags, open/close state, optimistic UI) lives in hooks/components.
- Prefer shared helpers for duplicated role-based patterns.

Examples:

- `src/features/shared/api/createRoleProjectApi.ts` provides role-based project API helpers:
  - GitHub dashboard + pagination + fallback logic
  - Jira cached reads
  - Meeting channels/records cached reads + mutations
- `src/services/apiCacheUtils.ts` contains small pure cache utilities used by API modules.

