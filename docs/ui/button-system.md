# Button System

Shared button contract for the frontend UI.

## Source of Truth

`src/components/ui/Button.tsx`

All application buttons should use either:

- `Button` for native button actions
- `buttonStyles()` for `Link` / `a` elements that should visually match buttons

Page code should not define button colors manually with one-off `bg-*`, `text-*`, `border-*`, `ring-*`, or custom hover color classes.

## Supported Variants

| Variant | Usage |
|---------|-------|
| `primary` | Main action on a screen |
| `secondary` | Supporting action with bordered surface |
| `outline` | Stronger bordered secondary action |
| `ghost` | Low-emphasis utility action |
| `danger` | Destructive action |
| `link` | Text-only action |

## Supported Sizes

| Size | Typical Usage |
|------|----------------|
| `sm` | Inline utility actions, compact card actions |
| `md` | Default action size |
| `lg` | Large CTA or high-emphasis form actions |

## Shared Behaviour

- Consistent radius (`rounded-2xl`)
- Consistent focus ring
- Shared disabled state
- Shared icon spacing via `leftIcon` / `rightIcon`

## Notes

- Legacy aliases (`default`, `nav`, `nav-primary`, `hero`, `hero-outline`) still exist for compatibility during refactors, but new code should prefer the canonical variants above.
- The landing page, auth flows, student workspace, and supervisor workspace should all use this same component contract.
