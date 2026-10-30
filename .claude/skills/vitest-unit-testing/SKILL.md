---
name: vitest-unit-testing
description: >-
  Unit testing with Vitest for TypeScript libs: pure functions, Zod schemas,
  env helpers, and API utilities. Use when adding unit tests, testing business
  logic, or validating schemas without a browser.
---

# Vitest Unit Testing

## Install

```bash
npm install -D vitest
```

## Scripts

```json
"test": "vitest run",
"test:watch": "vitest"
```

Optional `vitest.config.ts` if aliases needed:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

## What to unit test

| Layer | Examples |
| --- | --- |
| Pure utils | formatters, parsers, date math |
| Schemas | Zod `.safeParse` valid/invalid cases |
| Calculations | totals, percentages, projections |
| Env helpers | feature flags with `vi.stubEnv` |
| Normalizers | migration/persist merge logic |

Skip trivial UI unless logic is extracted.

## Test file convention

Colocate: `format.test.ts` next to `format.ts`, or `__tests__/` folder.

## Patterns

```ts
import { describe, it, expect, afterEach, vi } from "vitest";

describe("parseAmount", () => {
  it("strips currency symbols", () => {
    expect(parseAmount("₹1,50,000")).toBe(150000);
  });
});
```

### Env stubbing

```ts
afterEach(() => vi.unstubAllEnvs());

it("defaults when unset", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
  expect(getSiteUrl()).toBe("http://localhost:3000");
});
```

### Schema tests

```ts
it("rejects missing email", () => {
  const r = feedbackSchema.safeParse({ name: "A", message: "hi" });
  expect(r.success).toBe(false);
});
```

### Table-driven cases

```ts
it.each([
  [0, "0"],
  [150000, "1,50,000"],
])("formats %i as %s", (input, expected) => {
  expect(formatAmount(input)).toBe(expected);
});
```

## Mocking fetch (route handlers)

Extract handler logic to pure function; test function directly. For integration, use `fetch` against dev server or MSW sparingly.

## CI

```yaml
- run: npm run test
```

Fast suite should complete in seconds — keep hundreds of tests, not thousands of DOM tests here (use Playwright for those).

## Anti-patterns

- Testing implementation details (private function names)
- Snapshot testing large objects without meaningful assertions
- Duplicating E2E flows in Vitest with jsdom
- Forgetting to reset env/mocks in `afterEach`

Pair with: `playwright-e2e-testing`, `nextjs-api-routes`.
