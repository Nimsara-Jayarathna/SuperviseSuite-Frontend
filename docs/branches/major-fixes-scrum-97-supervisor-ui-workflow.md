# Frontend Major Fixes: SCRUM-97 Supervisor Workflow

Branch: `feature/scrum-97-ui-workflow-improvements`  
Compared against: `dev`  
Commit range: `e33bc64` -> `4fac0aa`

## Fix 1: Guided 3-Step Project Creation Flow

### Why this fix was needed

- The old create flow was too dense for supervisors to complete reliably in one pass.
- Student assignment and milestone planning needed clearer ordering and validation gates.

### What was changed

- Reworked `CreateProjectPage` into 3 explicit steps:
  - project basics
  - student assignment + optional leader selection
  - milestone planning and final submit
- Added step-level validation before progressing.
- Added request-state modal feedback for create operation.
- Updated create payload usage to support:
  - `leaderStudentId`
  - `milestones[]` instead of a single milestone.

## Fix 2: Milestone Authoring Usability Improvements

### Why this fix was needed

- Milestone setup was error-prone with weak visual state and limited editing flow.
- Users needed better handling for multiple milestones before final create.

### What was changed

- Added dynamic multi-milestone editor with add/remove support.
- Added expand/collapse milestone cards for compact editing.
- Added completeness indicators and incomplete count hints before submit.
- Added auto-scroll to newly created milestone entry.
- Improved milestone card layout/spacing and readability in both expanded and collapsed states.

## Fix 3: Project Details Milestone Workflow Modernization

### Why this fix was needed

- Updating milestone status required full edit interactions.
- Read mode lacked strong visual separation of status and milestone metadata.

### What was changed

- Added quick milestone status change directly in milestone rows.
- Added status-based visual styling for milestone cards and pills.
- Refactored milestone row composition (title, due date, status, edit action).
- Kept full edit form available for full-field milestone changes.

## Fix 4: Project Leader Management in UI

### Why this fix was needed

- Leader assignment became part of the backend contract and needed first-class UI support.
- Team management needed clear visibility and update controls for leader role.

### What was changed

- Added leader display in project details team tab.
- Added assign/change leader controls from current student members.
- Added leader selection in create flow (optional at creation time).
- Added FE type contract updates for `leader` data in:
  - detail payload
  - create request/response
  - update request.

## Fix 5: Landing Card Hover Behavior Stabilization

### Why this fix was needed

- Animated hover scale/shadow on landing cards introduced visual noise.
- Static behavior was preferred for cleaner and more predictable interaction.

### What was changed

- Removed hover scale and shadow effects from `FeatureCard`.
- Removed icon hover color transition behavior.

## Changed Files (`dev..HEAD`)

- `src/features/supervisor/pages/CreateProjectPage.tsx`
- `src/features/supervisor/components/ProjectStepper.tsx`
- `src/features/supervisor/pages/ProjectDetailsPage.tsx`
- `src/features/supervisor/types.ts`
- `src/features/landing/components/FeatureCard.tsx`
