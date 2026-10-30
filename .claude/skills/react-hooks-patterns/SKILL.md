---
name: react-hooks-patterns
description: >-
  React hooks best practices: useEffect dependencies, useMemo/useCallback,
  custom hooks, hydration guards, and store selectors. Use when writing React
  hooks, fixing stale closures, infinite loops, or SSR hydration mismatches.
---

# React Hooks Patterns

## Rules of hooks

- Only call hooks at top level (not in conditions/loops)
- Custom hooks must start with `use`
- ESLint `react-hooks/exhaustive-deps` — fix deps, don't disable blindly

## useEffect — when and how

| Good use | Avoid |
| --- | --- |
| Sync to URL, analytics, subscriptions | Deriving display state from props |
| Redirect after hydration | Replacing event handlers |
| Fetch on mount (client-only) | Whole-form validation on every keystroke via effect |

```tsx
useEffect(() => {
  if (!hydrated) return;
  if (!isAuthed) router.replace("/login");
}, [hydrated, isAuthed, router]);
```

## Hydration guard (persisted client state)

Zustand/localStorage differs server vs client — gate UI until rehydrated:

```tsx
const hydrated = useStoreHydrated(); // onRehydrateStorage sets flag
if (!hydrated) return <LoadingSkeleton />;
```

Never read `localStorage` during initial render on server.

## useMemo / useCallback

```tsx
const metrics = useMemo(() => computeMetrics(data), [data]);
const handleSave = useCallback(() => save(data), [data, save]);
```

Use when:
- Expensive pure computation
- Stable reference needed for memoized child deps

Skip when computation is trivial — premature memoization adds noise.

## Custom hook template

```tsx
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
```

Colocate in `hooks/` or next to the feature using it.

## Store selectors (Zustand)

Narrow subscriptions — avoid re-render on unrelated slice changes:

```tsx
const name = useStore((s) => s.profile.name);
// not: const store = useStore() then store.profile.name in render
```

Extract selector hooks for repeated access:

```tsx
export const useProfile = () => useStore((s) => s.data.profile);
```

## Refs for DOM / mutable values

```tsx
const exportRef = useRef<HTMLDivElement>(null);
const ranOnce = useRef(false);

useEffect(() => {
  if (ranOnce.current) return;
  ranOnce.current = true;
  trackEvent("page_view");
}, []);
```

## Anti-patterns

- `useEffect` to sync prop → state without clear reason (prefer key remount or derived value)
- Missing cleanup on intervals/subscriptions
- `useCallback` on every handler "just in case"
- Reading external mutable refs during render for UI decisions
