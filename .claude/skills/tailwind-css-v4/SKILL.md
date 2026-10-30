---
name: tailwind-css-v4
description: >-
  Tailwind CSS v4 setup and patterns: @theme tokens, dark mode, responsive
  layouts, sr-only utilities, print styles, and prefers-reduced-motion. Use
  when styling React/Next.js apps with Tailwind v4 or migrating from v3 config.
---

# Tailwind CSS v4

## Setup (Next.js)

```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

PostCSS uses `@tailwindcss/postcss` — no separate `tailwind.config.js` required for tokens.

## Theme tokens (`@theme`)

Define design system once:

```css
@theme inline {
  --color-brand-50: #f0f4f8;
  --color-brand-900: #0a1929;
  --color-accent-400: #e6c35c;
  --font-sans: var(--font-dm-sans), system-ui, sans-serif;
}
```

Use in components: `bg-brand-900`, `text-accent-400`, `font-sans`.

## CSS variables for runtime theming

```css
:root {
  --background: #f8fafc;
  --foreground: #0a1929;
}
.dark {
  --background: #0a1929;
  --foreground: #f0f4f8;
  color-scheme: dark;
}
```

Map in `@theme`: `--color-background: var(--background)`.

## Dark mode

Pair with `next-themes` — class strategy on `<html>`:

```tsx
<html suppressHydrationWarning>
```

Use `dark:` variants: `dark:bg-brand-900 dark:text-slate-100`.

## Responsive patterns

Mobile-first breakpoints: `sm:`, `md:`, `lg:`.

```tsx
<div className="flex flex-col gap-4 sm:flex-row lg:grid lg:grid-cols-3">
```

Common dashboard: stack on mobile, grid on `lg:`.

## Accessibility utilities

```tsx
<span className="sr-only">Loading</span>
<a className="sr-only focus:not-sr-only focus:fixed focus:z-[100] ...">Skip to main</a>
```

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Print styles

```css
@media print {
  @page { size: A4 landscape; margin: 0.5cm; }
  .print\:hidden { /* use print:hidden in JSX */ }
}
```

## cn() helper

Always merge conditional classes:

```ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Anti-patterns

- Arbitrary hex in every component — use `@theme` tokens
- `!important` everywhere — fix specificity with data attributes for export/print overrides
- Inline `style={{}}` for static values Tailwind can express
- Forgetting explicit height on chart/chart-like containers
