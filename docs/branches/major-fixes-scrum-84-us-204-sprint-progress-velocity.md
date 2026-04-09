# Frontend Major Fixes: SCRUM-84 US-204 - Sprint Progress & Velocity

## Scope

This story documents frontend consumption of refined Jira health/sprint analytics for the Jira tab.

## What was implemented

- Jira tab now reflects backend-configurable analytics rules for sprint/health signals.
- Frontend remains contract-driven and reads computed metrics from API responses.
- No frontend-side hardcoded sprint/velocity rule logic was introduced.

## Affected Jira tab behaviors

- Recent sprint window shown in UI follows backend rule.
- Backlog-growing indicator follows backend consecutive-weeks rule.
- High-priority and bug classification effects are reflected via backend health payload.

## Notes

- This story is Jira tab data scope only.
- Jira OAuth connect/disconnect/callback behavior remains unchanged.
