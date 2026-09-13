# PathFolio — Design System (simple, single-app scale)

Tokens are CSS custom properties defined once in
`apps/web/src/app/globals.css` under `:root`. Every page's CSS module
(`*.module.css`) should reference them (`var(--color-accent)`), never a
literal hex — that's what this file exists to keep everyone honest about.

This isn't a component library — just a shared vocabulary of color/radius
values, since PathFolio has one frontend app (apps/web) with a handful of
pages, not a design system product in its own right.

## Color

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f7f7f5` | Page background |
| `--color-surface` | `#ffffff` | Card/panel background |
| `--color-border` | `#e5e5e2` | Card borders |
| `--color-border-muted` | `#ddd` | Input/button borders, disabled states |
| `--color-text` | `#16211c` | Primary text |
| `--color-text-secondary` | `#444` | Secondary text (labels, captions) |
| `--color-text-muted` | `#666` | De-emphasized text |
| `--color-text-faint` | `#999` | Axis labels, chevrons, the quietest text |
| `--color-accent` | `#2f6f5e` | Brand green — buttons, links, primary chart series |
| `--color-accent-soft` | `#eef7f4` | Light green background (selected states) |
| `--color-positive` | `#2f6f5e` | Gains — same as accent, reused deliberately |
| `--color-negative` | `#b3261e` | Losses / danger actions |
| `--color-negative-soft` | `#e6bcb8` | Light red background/border |
| `--color-draft` / `-border` / `-soft` | amber trio | Draft status badge |
| `--color-active-border` | `#8fc4b3` | Active status badge border |
| `--color-track` | `#f2f2f0` | Progress bar / diverging-bar tracks |
| `--color-gridline` | `#eee` | Chart gridlines, table row dividers |

Multi-series charts (the `/compare` comparison chart) use a **separate**
fixed categorical array (`SERIES_COLORS` in `compare/page.tsx`) — one
color per portfolio, assigned by position, never cycled. Not tokenized
globally because it's a small, chart-local concern, not a page-chrome color.

## Radius

| Token | Value | Use |
|---|---|---|
| `--radius-card` | `14px` | Cards, the onboarding/dashboard panels |
| `--radius-control` | `10px` | Buttons, inputs, option rows |
| `--radius-pill` | `999px` | Status badges |

## Semantic color rule

`--color-positive`/`--color-negative` mean **direction of change**
(gain/loss), never asset identity — a holding's color in a table or a
diverging bar is never "this is Stocks," only "this went up/down." Asset
class identity is carried by its text label, not a color, everywhere in
the app (see `docs/diagrams` for why — this matches the dataviz skill's
"color follows the entity, never a redundant encoding" rule applied when
building the performance breakdown UI).

## How to extend this

Adding a new page: reuse these tokens first. Only add a new token when an
existing one is genuinely the wrong value (not "close enough") — check
this file before hardcoding a new hex value into a `.module.css` file.
