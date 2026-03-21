# Branch Implementation Notes: `feature/scrum-97-ui-workflow-improvements`

This document captures frontend work implemented on branch `feature/scrum-97-ui-workflow-improvements` (compared to `dev`), plus local in-progress edits currently present in the working tree.

## Branch Scope

- Focus area: Supervisor workflow UX for project creation and project details.
- Secondary area: Landing page card interaction polish.
- Commit window: `2026-03-21` (`e33bc64` → `4fac0aa`).

## Files Changed vs `dev`

| File | Change Type | Summary |
|------|-------------|---------|
| `src/features/supervisor/pages/CreateProjectPage.tsx` | Modified | Rebuilt into a 3-step guided flow with multi-milestone creation and optional leader selection. |
| `src/features/supervisor/components/ProjectStepper.tsx` | Added | New reusable visual stepper used by project creation. |
| `src/features/supervisor/pages/ProjectDetailsPage.tsx` | Modified | Added leader assignment controls, milestone quick-status updates, and milestone UI refactor. |
| `src/features/supervisor/types.ts` | Modified | Added `leader` shape and changed create payload/response to support milestone arrays + leader assignment. |
| `src/features/landing/components/FeatureCard.tsx` | Modified | Removed hover scale/shadow and hover color transition behavior. |

## Implemented Behavior

### 1) Create Project Flow (`CreateProjectPage`)

- Replaced single-form creation with a 3-step flow:
  - Step 1: Project basics (`title`, `summary`, `batch`, `semester`)
  - Step 2: Student assignment + optional project leader
  - Step 3: Milestones (multiple, created in one final request)
- Introduced per-step validation:
  - Step 1 requires `title` + `summary`
  - Step 2 requires at least one selected student
  - Step 3 requires every milestone to include required fields
- Student assignment improvements:
  - Search debounce and minimum query length
  - Duplicate prevention in selected members
  - Leader selection constrained to selected students
- Milestone authoring improvements:
  - Dynamic add/remove milestone cards
  - Expand/collapse milestone editors
  - Inline completeness cues and incomplete count hint before submission
  - Auto-scroll to newly added milestone editor
- API payload changed from single `milestone` to `milestones[]` and supports optional `leaderStudentId`.
- Submission feedback uses `RequestStateModal` with loading/success/error states.

### 2) Reusable Stepper (`ProjectStepper`)

- New component for step navigation visuals:
  - Active, completed, and pending states
  - Numeric step markers with check state for completed items
  - Bottom segmented progress indicator
  - Optional click-back to previous steps

### 3) Project Details Enhancements (`ProjectDetailsPage`)

- Team tab:
  - Added leader display card.
  - Added assign/change leader controls backed by project update API.
  - Maintains leader draft state and prevents no-op updates.
- Milestones tab:
  - Added quick status update dropdown directly in milestone row.
  - Added status-based card/pill styling by milestone status.
  - Refactored milestone row layout for tighter title/date/status/edit alignment.
  - Preserved full edit form for title/date/status/description when needed.
- Status and mutation feedback:
  - Unified modal flow for loading/success/error across project status, overview edits, member add, leader update, and milestone mutations.

### 4) Supervisor Type Contract Updates (`types.ts`)

- Added `SupervisorProjectLeader`.
- `SupervisorProjectDetail` now includes:
  - `leader: SupervisorProjectLeader | null`
- Create request now includes:
  - `leaderStudentId?: string | null`
  - `milestones: Array<{ title; description; dueDate }>`
- Create response now includes:
  - `leader`
  - `milestones[]` (instead of a single `milestone`)
- Project update request now optionally supports:
  - `leaderStudentId?: string | null`

### 5) Landing Page Card Interaction (`FeatureCard`)

- Removed hover-scale, hover-shadow, and icon hover color transitions from landing `FeatureCard`.
- Result: card behavior is visually stable on hover while keeping click behavior for actionable cards.

## Commit Timeline (`dev..HEAD`)

| Commit | Message |
|--------|---------|
| `e33bc64` | `style(ui): Remove hover effects from FeatureCard` |
| `463fc63` | `feat(supervisor): Implement multi-step project creation` |
| `4907e37` | `feat(milestones): Implement collapsible milestone editor` |
| `ceea630` | `feat(project-creation): Introduce ProjectStepper component` |
| `eb24200` | `style(supervisor): Enhance milestone form appearance and layout` |
| `621abee` | `feat(project): Enhance milestone creation UI with expand/collapse` |
| `480261c` | `style(ui): Adjust milestone form layout and spacing` |
| `fd4afc7` | `feat(milestones): Allow quick status updates and status-based styling` |
| `064c1eb` | `refactor(ui): Revamp milestone detail display` |
| `4fac0aa` | `feat(supervisor): Implement project leader assignment` |

## Local In-Progress (Uncommitted) Changes

Current working tree includes additional edits not yet committed:

- `src/features/supervisor/pages/ProjectDetailsPage.tsx`
- `src/features/supervisor/pages/CreateProjectPage.tsx`
- `src/features/supervisor/components/ProjectStepper.tsx`

These primarily continue the supervisor workflow refinement and are not part of the `dev..HEAD` committed diff yet.
