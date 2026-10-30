---
name: html-semantic-markup
description: >-
  Semantic HTML patterns: landmarks, headings, lists, tables, forms, and
  accessible document structure for React/Next.js. Use when writing page markup,
  fixing SEO structure, or replacing div soup with proper HTML elements.
---

# Semantic HTML

## Page skeleton

```html
<body>
  <a href="#main" class="skip-link">Skip to main content</a>
  <header>...</header>
  <nav aria-label="Main">...</nav>
  <main id="main">...</main>
  <footer>...</footer>
</body>
```

One `<h1>` per page (Server Component hero is ideal for SEO).

## Heading hierarchy

Don't skip levels for styling — use CSS for size:

```tsx
<h1>Page title</h1>
<section>
  <h2>Section</h2>
  <h3>Subsection</h3>
</section>
```

## Lists

Use `<ul>`/`<ol>` for navigation groups, feature lists, steps — not nested divs.

```tsx
<ol>
  {steps.map((step, i) => (
    <li key={step.id}>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </li>
  ))}
</ol>
```

## Tables — data vs layout

**Data tables** (cash flow, comparisons):

```tsx
<table>
  <caption className="sr-only">Monthly breakdown</caption>
  <thead>
    <tr><th scope="col">Item</th><th scope="col">Amount</th></tr>
  </thead>
  <tbody>...</tbody>
</table>
```

**Chart fallback tables**: `className="sr-only"` with caption — see `web-accessibility-wcag`.

Never use `<table>` purely for CSS grid layout.

## Forms

```tsx
<form onSubmit={...}>
  <label htmlFor="name">Name</label>
  <input id="name" name="name" type="text" autoComplete="name" required />
</form>
```

Group related fields with `<fieldset>` + `<legend>` when appropriate.

## Interactive elements

| Element | Use for |
| --- | --- |
| `<button type="button">` | Actions (open dialog, toggle) |
| `<button type="submit">` | Form submit |
| `<a href="...">` | Navigation to URL |
| `<Link href="...">` | Next.js client navigation |

Don't use `<div onClick>` for primary actions without role + keyboard support.

## JSON-LD & meta

Structured data via `<script type="application/ld+json">` in Server Components — see `nextjs-seo-metadata`.

## Anti-patterns

- Multiple `<main>` elements
- `<p>` wrapping block-level components
- Placeholder `<div>` buttons instead of `<button>`
- Missing `<th scope>` in data tables

Pair with: `web-accessibility-wcag`, `react-components-patterns`.
