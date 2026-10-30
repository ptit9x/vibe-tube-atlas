---
name: react-components-patterns
description: >-
  React component architecture for modern apps: Server vs Client Components,
  composition, forwardRef, list keys, event delegation, and avoiding invalid
  HTML nesting. Use when building React/Next.js UI, fixing hydration errors,
  or structuring component folders.
---

# React Component Patterns

## Server vs Client (Next.js App Router)

| Use Server Component (default) | Use `"use client"` |
| --- | --- |
| Static markup, SEO hero, layout shells | Event handlers, useState, useEffect |
| Data fetch at build/request time | Browser APIs, Zustand, Recharts |
| No JS shipped for that subtree | Radix/shadcn interactive primitives |

**Composition pattern** — pass Server Components as `children` into Client wrappers:

```tsx
// page.tsx (server)
<ClientShell hero={<HeroSection />} />

// client-shell.tsx
"use client";
export function ClientShell({ hero }: { hero: React.ReactNode }) {
  return <>{hero}<InteractivePanel /></>;
}
```

## Folder conventions

```
components/
  ui/           → primitives (Button, Dialog) — mostly client
  layout/       → Header, Footer, SkipToMain
  {feature}/    → domain screens composed from ui/
```

One component per file; named export matching filename.

## forwardRef for primitives

Wrap Radix/DOM elements when parents need refs:

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn("...", className)} {...props} />
  )
);
Button.displayName = "Button";
```

## Invalid nesting — common fixes

| Problem | Fix |
| --- | --- |
| `<button>` inside `<button>` | Outer → `<div role="group">` + keyboard handler, or split actions |
| `<a>` inside `<a>` | One link wraps card; inner actions use `button` + `stopPropagation` |
| Block inside `<p>` | Use `<div>` for rich text blocks |

Guard delegated clicks:

```tsx
function isInteractiveChild(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, select, textarea"));
}
```

## Lists and keys

- Key = stable id, never array index for reorderable lists
- Extract row component when rows have state or handlers

## Props design

- Prefer narrow props over passing entire store
- `children` for layout slots; render props only when caller needs data back
- Colocate types: `interface FooProps` above component

## Loading and suspense

```tsx
const HeavyStep = lazy(() => import("./heavy-step"));

<Suspense fallback={<Skeleton />}>
  <HeavyStep />
</Suspense>
```

## Anti-patterns

- `"use client"` on entire pages when only a CTA needs interactivity
- Prop drilling 5+ levels — use context or client store instead
- Deriving state in render that should be `useMemo`
- Icon-only buttons without `aria-label`
