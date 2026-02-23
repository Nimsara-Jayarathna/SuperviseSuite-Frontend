# Landing Page Feature

Public-facing marketing page served at `/`.

## Route

| Path | Component | Layout |
|------|-----------|--------|
| `/`  | `LandingPage` | `PublicLayout` |

## Component Tree

```
LandingPage
├── LandingNav          — fixed top bar, Login / Register actions (stubs)
├── HeroSection         — headline, subtitle, CTA buttons (stubs)
└── FeaturesSection     — 3-column feature cards grid
    └── FeatureCard     — icon badge + title + description
```

## Stubs / Pending Wiring

The following handlers in `LandingPage` are empty stubs to be replaced in `feat/auth-forms`:

- `handleLogin` → open auth modal (login tab)
- `handleRegister` → open auth modal (register tab)
- `handleStudentPortal` → navigate to student dashboard or trigger login
- `handleSupervisorAccess` → navigate to supervisor dashboard or trigger login

## Shared Infrastructure Added by This Feature

### Button variants (`src/components/ui/Button.tsx`)

| Variant | Usage |
|---------|-------|
| `default` | Standard action button |
| `nav` | Ghost-style nav link button |
| `nav-primary` | Filled primary nav button |
| `hero` | Large filled CTA button |
| `hero-outline` | Large outlined CTA button |

Size prop accepts: `sm` \| `md` (default) \| `lg`

### CSS Design Tokens (`src/styles/globals.css`)

| Token | Value | Purpose |
|-------|-------|---------|
| `--primary` | `217 91% 60%` | Brand blue |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--background` | `210 20% 98%` | Page background |
| `--foreground` | `222 47% 11%` | Body text |
| `--muted` | `210 20% 96%` | Subtle backgrounds |
| `--muted-foreground` | `215 16% 47%` | Secondary text |
| `--card` | `0 0% 100%` | Card background |
| `--border` | `214 32% 91%` | Border color |
| `--nav-height` | `64px` | Fixed nav bar height |

The `.gradient-text` utility class applies the brand gradient:
`hsl(217 91% 60%) → hsl(250 80% 65%)`.

All tokens are consumed via Tailwind's extended color config (`tailwind.config.ts`).

## Dependencies Added

| Package | Reason |
|---------|--------|
| `lucide-react` | Icons used in `FeaturesSection` |
| `react-router-dom` | Client-side routing (`BrowserRouter`, `Routes`, `Route`) |
