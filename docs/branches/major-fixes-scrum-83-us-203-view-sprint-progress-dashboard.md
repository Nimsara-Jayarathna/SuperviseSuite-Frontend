# Frontend Major Fixes: SCRUM-83 US-203 - View Sprint Progress Dashboard

## Scope

This story covers Jira tab dashboard rendering for sprint progress in supervisor/student project detail views.

## What was implemented

- Jira tab renders sprint progress dashboard data from backend endpoints.
- Dashboard includes:
  - active sprint card
  - recent sprint list/table
  - weekly velocity section
- Behavior remains read-only for students.

## UI components involved

- `JiraTabSection`
- `JiraHealthOverview`
- `JiraSprintProgressSection`

## API dependencies

- Supervisor: `GET /api/supervisor/projects/{projectId}/jira/sprint-progress`
- Student: `GET /api/student/projects/{projectId}/jira/sprint-progress`

## Notes

- Jira connection controls stay in Integrations tab.
- Jira OAuth flow is out of scope and unchanged.
