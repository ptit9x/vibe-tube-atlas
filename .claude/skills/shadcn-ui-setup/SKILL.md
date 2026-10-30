---
name: shadcn-ui-setup
description: >-
  Initializes and extends shadcn/ui in Next.js: init command, essential
  components, Tooltip/Dialog providers, form wiring, and reusable UI patterns.
  Use when adding shadcn, Radix primitives, component libraries, tooltips,
  dialogs, selects, or building form-heavy UIs.
---

# shadcn/ui Setup

## Init (new project)

```bash
npx shadcn@latest init
```

Defaults: New York style, zinc/slate base, CSS variables, `@/components`, `@/lib/utils`.

## Install components upfront

Add these before feature work — most apps need them:

```bash
npx shadcn@latest add button input label textarea select dialog sheet \
  dropdown-menu tooltip popover separator badge card progress tabs
```

For forms:

```bash
npx shadcn@latest add form checkbox radio-group switch
npm install react-hook-form @hookform/resolvers zod
```

For dates (calendar popover):

```bash
npx shadcn@latest add calendar
npm install date-fns react-day-picker
```

## cn() utility

Ensure `src/lib/utils.ts` exports:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Global providers

Wrap app once in root layout:

```tsx
import { TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider delayDuration={300}>
  {children}
</TooltipProvider>
```

For shadcn forms, no extra provider needed.

## Help tooltip pattern

Reusable contextual help (keeps copy out of JSX):

```tsx
// components/ui/help-tooltip.tsx
export function HelpTooltip({ content, ariaLabel = "More info" }: { content: React.ReactNode; ariaLabel?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={ariaLabel} className="text-muted-foreground">
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">{content}</TooltipContent>
    </Tooltip>
  );
}
```

Centralize copy in `lib/help-text.ts` keyed by field/feature.

## Form pattern (RHF + Zod + shadcn Form)

```tsx
const schema = z.object({ email: z.string().email(), name: z.string().min(1) });
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", name: "" } });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="email" render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit">Save</Button>
  </form>
</Form>
```

## Dialog for create/edit flows

Use Dialog (not page navigation) for inline CRUD:

- List view shows items + "Add" card
- Dialog hosts form; `onOpenChange` resets form state
- Primary action validates before close

## Select with groups

Wrap shadcn Select for app-specific API:

```tsx
interface AppSelectProps {
  options?: { value: string; label: string }[];
  groups?: { label: string; options: { value: string; label: string }[] }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

Use grouped options for year/decade pickers and long lists.

## Component conventions

- `"use client"` only on interactive components
- Primitives in `components/ui/`; feature components in `components/{feature}/`
- Use `cva` for variants on repeated patterns (badges, buttons)
- Icons: `lucide-react`, consistent `h-4 w-4` in buttons

## Accessibility defaults

- Every icon-only button needs `aria-label`
- Dialog: focus trap handled by Radix; provide `DialogTitle`
- Form fields: associate `<Label htmlFor>` with input `id`
- Never nest `<button>` inside `<button>` — use `role="group"` row pattern (see `react-components-patterns`)

## Related skills

- `tailwind-css-v4` — theme tokens and `cn()`
- `specialized-form-inputs` — currency/DOB beyond shadcn defaults
- `web-accessibility-wcag` — landmarks, axe testing
