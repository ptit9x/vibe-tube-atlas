---
name: web-accessibility-wcag
description: >-
  Web accessibility (WCAG 2.1 AA): landmarks, skip links, ARIA labels, chart
  text alternatives, keyboard navigation, reduced motion, and axe Playwright CI.
  Use when fixing a11y issues, adding accessibility tests, or preparing for
  WCAG compliance.
---

# Web Accessibility (WCAG)

## Landmarks & skip link

```tsx
// layout.tsx — first focusable element in body
<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] ...">
  Skip to main content
</a>

// each route
<main id="main">...</main>
```

One `<main>` per page. Header nav: `aria-label="Main navigation"`.

## Icon buttons & forms

```tsx
<button type="button" aria-label="Close dialog"><X /></button>
<Label htmlFor="email">Email</Label>
<Input id="email" aria-describedby="email-hint" />
```

Dialogs: require visible `DialogTitle` (Radix handles focus trap).

## Progress bars

```tsx
<Progress
  value={67}
  aria-label="Setup progress: step 3 of 5"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={67}
/>
```

## Charts — WCAG 1.1.1 text alternative

Recharts/SVG charts need non-visual fallback:

```tsx
<table className="sr-only">
  <caption>Asset allocation breakdown</caption>
  <thead><tr><th scope="col">Category</th><th scope="col">Share</th></tr></thead>
  <tbody>{rows.map(r => <tr key={r.label}><td>{r.label}</td><td>{r.value}</td></tr>)}</tbody>
</table>
<div aria-hidden="true"><ResponsiveContainer>...</ResponsiveContainer></div>
```

Also provide visible legend when possible.

## Keyboard & focus

- Interactive rows: avoid wrapping in `<button>` if children contain buttons — use `role="group"` + Enter/Space
- Visible focus rings: `focus-visible:ring-2 focus-visible:ring-offset-2`
- Don't remove outline without replacement

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Color contrast

- Text on colored backgrounds: aim 4.5:1 (AA)
- Chart slices: don't rely on color alone — labels in legend/tooltip/table

## Automated testing (axe + Playwright)

```bash
npm install -D @axe-core/playwright
```

```ts
import AxeBuilder from "@axe-core/playwright";

const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  .analyze();
expect(results.violations).toEqual([]);
```

Run on public routes in CI: `/`, `/login`, marketing pages.

## Checklist

```
- [ ] Skip link → #main works
- [ ] All images/icons have alt or aria-label
- [ ] Charts have sr-only table or summary
- [ ] Form errors linked to fields
- [ ] axe scan passes in CI
- [ ] prefers-reduced-motion respected
```

## Anti-patterns

- Tooltip-only data with no other access path
- `tabIndex={0}` on non-interactive divs without role
- Auto-playing motion without reduced-motion fallback
- Nested interactive elements (button in button)
