# Landing Page Feature

Public-facing home page served at `/`.

## Route

| Path | Component | Layout |
|------|-----------|--------|
| `/`  | `LandingPage` | `PublicLayout` |

## Component Tree

```
LandingPage
├── PublicLayout        — shared top bar shell in public mode
├── HeroSection         — headline, subtitle, primary/secondary role-switch CTAs
└── FeaturesSection     — 3-column feature cards grid
    └── FeatureCard     — icon badge + title + description
```

## Wired Handlers

The following handlers in `LandingPage` navigate to the auth pages:

- `onLogin` → `/login`
- `onRegister` → `/register`
- `onStudentPortal` → `/register`
- `onSupervisorAccess` → `/login`

## Current UX Notes

- Uses the same `TopBar` component as authenticated pages, but in `public` mode.
- Reuses the shared app container width and spacing system.
- Hero CTAs use the shared button component.
- The landing page is intentionally kept inside the same design system as student and supervisor pages.

## Shared UI References

### Button system (`src/components/ui/Button.tsx`)

| Variant | Usage |
|---------|-------|
| `primary` | Primary CTA |
| `secondary` | Secondary CTA / supporting action |
| `ghost` | Public top bar utility action |

See `docs/ui/button-system.md` for the canonical shared button contract.

### CSS Design Tokens (`src/styles/globals.css`)

| Token | Value | Purpose |
|-------|-------|---------|
| `--primary` | `217 91% 60%` | Brand blue |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `222 47% 11%` | Body text |
| `--muted` | `210 40% 96%` | Subtle backgrounds |
| `--muted-foreground` | `215 16% 47%` | Secondary text |
| `--card` | `0 0% 100%` | Card background |
| `--border` | `214 32% 91%` | Border color |
| `--nav-height` | `64px` | Fixed nav bar height |

- `.gradient-text` applies the brand headline gradient.
- Hero animation utilities such as `.hero-float-in` and `.hero-gentle-float` are defined here.

All tokens are consumed via Tailwind's extended color config (`tailwind.config.ts`).
