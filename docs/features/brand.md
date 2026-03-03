# Brand Feature

Logo component and static SVG asset used across the application.

## Asset

| File | Purpose |
|------|---------|
| `public/logo.svg` | Primary brand asset — served at `/logo.svg`; used as favicon and logo `<img>` source |
| `index.html` | References `/logo.svg` as `<link rel="icon" type="image/svg+xml">` |

**SVG spec:** 1024 × 890 viewBox, transparent background, multi-path raster-traced mark.

---

## Components (`src/components/brand/Logo.tsx`)

### `LogoMark`

Renders the logo mark at a given height. Width auto-scales using the native 1024:890 aspect ratio.

```tsx
import { LogoMark } from '@/components/brand/Logo';

<LogoMark size={40} />                          // default
<LogoMark size={28} className="opacity-80" />   // nav bar
<LogoMark size={52} />                          // auth pages
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `40` | Height in px; width scales proportionally |
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
| `LandingNav` | `LogoMark` | `28` |
| `LoginPage` | `LogoMark` wrapped in `<Link to="/">` | `52` |
| `RegisterPage` | `LogoMark` wrapped in `<Link to="/">` | `52` |
| `index.html` | Static `/logo.svg` | favicon |

Clicking the logo on auth pages navigates back to `/`.
