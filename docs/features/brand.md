# Brand Feature

Logo component and optimized static brand assets used across the application.

## Asset

| File | Purpose |
|------|---------|
| `public/logo.webp` | Primary logo asset — served at `/logo.webp`; used by the `LogoMark` component |
| `public/favicon.ico` | Browser favicon asset served at `/favicon.ico` |
| `index.html` | References `/favicon.ico` as `<link rel="icon" type="image/x-icon">` |

**Asset note:** logo is intentionally optimized for transfer size and rendered as a square mark.

---

## Components (`src/components/brand/Logo.tsx`)

### `LogoMark`

Renders the logo mark at a given size.

```tsx
import { LogoMark } from '@/components/brand/Logo';

<LogoMark size={40} />                          // default
<LogoMark size={28} className="opacity-80" />   // nav bar
<LogoMark size={52} />                          // auth pages
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `40` | Render size in px (square mark) |
| `className` | `string` | — | Additional Tailwind classes |

### `Logo`

Renders `LogoMark` with an optional wordmark beside it.

```tsx
import { Logo } from '@/components/brand/Logo';

<Logo size={40} showWordmark />     // mark + "SuperviseSuite" text
<Logo size={32} />                  // mark only (same as <LogoMark>)
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `40` | Height of the mark in px |
| `showWordmark` | `boolean` | `false` | Renders "SuperviseSuite" text beside the mark |
| `className` | `string` | — | Applied to the wrapping `<span>` |

---

## Usage by Feature

| Location | Component | Size |
|----------|-----------|------|
| `TopBar` (public + private) | `Logo` | `38` |
| `HeroSection` | `LogoMark` | larger decorative hero usage |
| `LoginPage` | `LogoMark` wrapped in `<Link to="/">` | `52` |
| `RegisterPage` | `LogoMark` wrapped in `<Link to="/">` | `52` |
| `index.html` | Static `/favicon.ico` | favicon |

Clicking the logo in the top bar and auth pages navigates back to the appropriate route.
