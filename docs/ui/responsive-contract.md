# Responsive Contract

This document defines the baseline responsive behavior for the frontend. All new UI should follow these rules by default.

## Breakpoints

- `mobile`: `< 768px` (phone-first baseline)
- `tablet`: `>= 768px`
- `desktop`: `>= 1024px`
- `wide`: `>= 1280px`

## Layout Rules

- Build mobile-first. Add larger breakpoint variants only when needed.
- Avoid fixed-width content containers on mobile. Use fluid width with safe horizontal padding.
- Keep touch targets at least `40x40` px for icon actions and interactive controls.
- Page-level actions should stack or wrap on mobile, never overflow.
- Long text must wrap or truncate with a `title` tooltip fallback where needed.

## Shared Primitive Rules

- `TopBar`:
  - Mobile uses compact header + expandable navigation/actions.
  - Desktop keeps the full horizontal navigation.
- `PageHeader`:
  - Title/subtitle stack vertically on small screens.
  - Actions must be full-width friendly on mobile and wrap cleanly.
- `PageTabs`:
  - Tabs must remain usable on mobile via horizontal scrolling.
  - Tab labels must not wrap to multiple lines.
- Modals and overlays:
  - Keep side padding on mobile and avoid fixed positions that clip off-screen.
  - Dropdown/popover content should anchor inside viewport bounds.

## Data Display Rules (Table Fallback)

- Prefer desktop/tablet table view for dense datasets.
- On phone widths, fallback to card/list rows that preserve:
  - all critical fields
  - all role-based actions
  - status/metadata visibility
- Never rely on horizontal page scroll for primary task completion on mobile.

## QA Baseline

Validate at widths: `360`, `390`, `414`, `768`, `1024`, `1280`.

For each screen verify:

- no horizontal page overflow
- readable typography and spacing
- tap targets are usable
- no clipped dropdown/modal content
- role-based action visibility remains correct
