# UI/UX Improvement — 2026-10-30

Project: vibe-tube-atlas (React 19 + Vite 8 SPA + Tailwind v4 + shadcn, claymorphism, YouTube keyword research, vi/en)

## Audit findings

1. **Performance:** end of `src/index.css` had `html *, html *::before, html *::after { transition: background/color/border/box-shadow 0.3s }` — every element animated on every theme/render change.
2. **IA / Navigation:** both mobile bottom nav and the desktop sidebar showed only 5 destinations. Whole features had NO nav entry: Channels (`/channels`), Niche Radar, Saved, History, API Key settings.
3. **Layout:** desktop content `max-w-3xl` stuck to the left (not centred) next to the 256px sidebar.
4. **Accessibility:** no global `:focus-visible`, no `prefers-reduced-motion` handling, `--color-muted-foreground` at 46% lightness (low contrast), icon-only center FAB link had no accessible name, nav links had no `aria-current`, quota bar was a plain div.
5. **Design-system drift (Dashboard):** page `bg-gray-50`, every Card `bg-white`, `divide-gray-100`, `hover:bg-gray-50` hardcoded — kept alive only by the `.dark` override block in index.css.

## Changes made

| File | Change |
|---|---|
| `src/index.css` | Global `html *` transition removed → scoped to `html, body`; added global `:focus-visible` ring + `prefers-reduced-motion` block; `--color-muted-foreground` 46% → `hsl(220 12% 38%)` |
| `src/layouts/MainLayout.tsx` | Content centred `w-full max-w-[880px] mx-auto`; desktop sidebar gains an **Explore** section (Channels, Niche Radar, Saved, History, API Key) with the same active-pill style; `aria-current` on nav links (mobile + desktop); center FAB link gets `aria-label` |
| `src/lib/i18n/translations.ts` | New keys `nav.{explore,channels,saved,nicheRadar,history,apiKey}` in the type + vi + en |
| `src/pages/Dashboard.tsx` | `bg-gray-50` → `bg-background`; all Cards drop `bg-white` (semantic `bg-card`); quota bar is `role="progressbar"` with aria values and `bg-muted` track; recent-search rows `divide-border` / `hover:bg-muted` / muted icon chip; saved-count label 10px → 11px |
| `CLAUDE.md` | New “UI/UX rules” section so future sessions keep these invariants |

No changes to routes, hooks, Supabase calls, stores, or query logic.

## Also done the same day — project skills

21 skills installed into `.claude/skills/` via the `skills` CLI (`-a claude-code`), selected against the real stack (no Next/RN/Recharts): ui-ux-pro-max, design, design-system, ui-styling, vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines, deploy-to-vercel, vercel-cli-with-tokens, vercel-optimize, frontend-design, shadcn, shadcn-ui-setup, tailwind-css-v4, vitest-unit-testing, zustand-persist-state, react-components-patterns, react-hooks-patterns, html-semantic-markup, web-accessibility-wcag, git-repo-privacy-audit. Test-installed on a scratch project first (21 dirs = 21 lock entries). Optional extras available in `../vibe-expense/.agents/skills/`: `frontend-security-coder`, `react-doctor` (not in the 5 public sources).

## Verify (run on the Mac — Muse has no shell there)

```bash
cd ~/vibe-coding/vibe-tube-atlas
npm run build   # tsc must accept the new nav keys + sidebar items
npm run dev     # desktop: check Explore section + centred content; mobile: bottom nav unchanged
```

## Backlog

- Migrate hardcoded gray/white in the remaining pages (KeywordExplorer, NicheRadar, SavedItems…) to semantic tokens, then delete the matching `.dark` overrides from index.css.
- Skeleton/EmptyState consistency pass on list pages (shared components already exist).
- Copy `frontend-security-coder` + `react-doctor` skills from vibe-expense if wanted (would make 23).
