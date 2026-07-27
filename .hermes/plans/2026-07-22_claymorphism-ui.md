# Claymorphism UI — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Chuyển toàn bộ UI vibe-tube-atlas sang phong cách Claymorphism (soft 3D, puffy, inner/outer shadows, rounded-mega, pastel surfaces) thay cho flat/material hiện tại.

**Architecture:** Tạo một design-token layer + utility CSS classes trong `index.css` (Tailwind v4 `@theme` + `@layer`), rồi cập nhật lần lượt từng component. Không thay đổi logic/state/data-flow — chỉ thay đổi className + CSS variables.

**Tech Stack:** React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4 + Framer Motion + shadcn/ui

---

## Claymorphism Design Principles

Claymorphism (clay + morphism) đặc trưng bởi:

| Element | Key Property |
|---------|-------------|
| **Surface** | Màu pastel mềm, gradient nhẹ |
| **Shadows** | Dual shadow: outer-dark (drop) + outer-light (bottom-right glow) |
| **Inner shadow** | Highlight inset trên (top-left) tạo cảm giác "puffy"/phồng |
| **Border-radius** | Rất lớn: `rounded-2xl` → `rounded-3xl`, min `1.25rem` |
| **Border** | Transparent hoặc 1px cùng tông màu nền |
| **Buttons** | Nổi lên như nặn đất sét, khi active thì lõm xuống (inner shadow) |
| **Inputs** | Lõm xuống (inset) — ngược lại với buttons |

### Claymorphism Shadow Recipe (light mode)

```css
/* Card (puffy, nổi lên) */
box-shadow:
  -8px -8px 16px rgba(255, 255, 255, 0.9),    /* top-left highlight */
   8px  8px 16px rgba(174, 174, 192, 0.4);     /* bottom-right shadow */

/* Button (pressable) */
box-shadow:
  -4px -4px 8px rgba(255, 255, 255, 0.85),
   4px  4px 8px rgba(174, 174, 192, 0.35);

/* Input (inset/lõm) */
box-shadow:
  inset 4px 4px 8px rgba(174, 174, 192, 0.3),
  inset -4px -4px 8px rgba(255, 255, 255, 0.8);
```

### Claymorphism Shadow Recipe (dark mode)

```css
/* Card */
box-shadow:
  -8px -8px 16px rgba(0, 0, 0, 0.3),
   8px  8px 16px rgba(0, 0, 0, 0.6);

/* Input (inset) */
box-shadow:
  inset 4px 4px 8px rgba(0, 0, 0, 0.5),
  inset -4px -4px 8px rgba(255, 255, 255, 0.03);
```

---

## Phân tích hiện trạng

### Những gì đang dùng:
- `bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500` — gradient rực rỡ ở PageHeader, AuthLayout
- `shadow-sm`, `shadow-md`, `shadow-lg` — flat shadows
- `bg-white`, `bg-gray-50` — flat surfaces
- shadcn/ui Card (`rounded-xl border bg-card shadow`) — flat card
- Rounded sizes: `rounded-md` → `rounded-2xl` — chưa đủ mềm

### Files cần thay đổi (priority order):

#### Phase 1: Foundation (CSS + Design Tokens)
1. `src/index.css` — Add claymorphism CSS variables + utility classes
2. `src/App.css` — Remove Vite default styles

#### Phase 2: Core UI Components (shadcn/ui)
3. `src/components/ui/button.tsx` — Clay button (puffy + press)
4. `src/components/ui/input.tsx` — Clay input (inset)
5. `src/components/ui/card.tsx` — Clay card surface
6. `src/components/ui/badge.tsx` — Soft pill badge

#### Phase 3: Layout + Navigation
7. `src/layouts/AuthLayout.tsx` — Clay auth shell
8. `src/layouts/MainLayout.tsx` — Clay bottom nav + sidebar
9. `src/components/PageHeader.tsx` — Clay gradient → claymorphic header

#### Phase 4: Shared Components
10. `src/components/shared/AnimatedFAB.tsx` — Clay FAB
11. `src/components/shared/TransactionRow.tsx` — Clay transaction row
12. `src/components/shared/EmptyState.tsx` — Clay empty state
13. `src/components/shared/SkeletonLoader.tsx` — Clay skeleton

#### Phase 5: Feature Components
14. `src/components/dashboard/SummaryCards.tsx` — Clay summary cards
15. `src/components/wallets/WalletCard.tsx` — Clay wallet card
16. `src/components/wallets/TotalBalanceCard.tsx` — Clay balance header
17. `src/components/ui/bottom-sheet.tsx` — Clay bottom sheet

#### Phase 6: Auth Pages
18. `src/pages/Login.tsx` — Clay login form
19. `src/pages/Register.tsx` — Clay register form

---

## Task 1: Add Claymorphism Design Tokens + Utility Classes

**Objective:** Tạo foundation CSS cho toàn bộ claymorphism system trong `index.css`.

**Files:**
- Modify: `src/index.css` (thêm section mới sau `@theme`)

**Step 1: Thêm CSS variables vào `@theme` block**

Thêm vào `@theme {}` trong `src/index.css` (sau `--radius: 0.5rem;`):

```css
  /* Claymorphism shadows */
  --clay-shadow-light: rgba(255, 255, 255, 0.9);
  --clay-shadow-dark: rgba(174, 174, 192, 0.4);

  /* Dark mode clay shadows */
  --clay-dark-shadow-light: rgba(45, 50, 80, 0.15);
  --clay-dark-shadow-dark: rgba(0, 0, 0, 0.5);

  /* Clay surface colors (pastel) */
  --color-clay-base: hsl(230 25% 95%);
  --color-clay-surface: hsl(230 30% 96%);
  --color-clay-elevated: hsl(0 0% 100%);

  /* Dark clay surfaces */
  --color-clay-dark-base: hsl(224 30% 10%);
  --color-clay-dark-surface: hsl(224 28% 13%);
  --color-clay-dark-elevated: hsl(224 26% 16%);

  /* Radius */
  --radius-clay: 1.5rem;
  --radius-clay-lg: 2rem;
  --radius-clay-xl: 2.5rem;
```

**Step 2: Thêm utility classes**

Thêm vào cuối `src/index.css` (sau `.scrollbar-hide` block, trước `/* Safe area */`):

```css
/* ==================== CLAYMORPHISM SYSTEM ==================== */

/* --- Clay Surface (background) --- */
body {
  background-color: var(--color-clay-base);
}

.dark body {
  background-color: var(--color-clay-dark-base);
}

/* --- Clay Card (puffy, raised surface) --- */
.clay-card {
  background: linear-gradient(145deg, var(--color-clay-elevated), var(--color-clay-surface));
  border-radius: var(--radius-clay);
  box-shadow:
    -8px -8px 16px var(--clay-shadow-light),
     8px  8px 16px var(--clay-shadow-dark);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dark .clay-card {
  background: linear-gradient(145deg, var(--color-clay-dark-elevated), var(--color-clay-dark-surface));
  border-radius: var(--radius-clay);
  box-shadow:
    -6px -6px 14px rgba(45, 50, 80, 0.12),
     6px  6px 14px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* --- Clay Button (raised, pressable) --- */
.clay-button {
  background: linear-gradient(145deg, var(--color-clay-elevated), var(--color-clay-surface));
  border-radius: 1rem;
  box-shadow:
    -4px -4px 8px var(--clay-shadow-light),
     4px  4px 8px var(--clay-shadow-dark);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.clay-button:hover {
  box-shadow:
    -2px -2px 6px var(--clay-shadow-light),
     2px  2px 6px var(--clay-shadow-dark);
}

.clay-button:active,
.clay-button.pressed {
  box-shadow:
    inset 4px 4px 8px var(--clay-shadow-dark),
    inset -4px -4px 8px var(--clay-shadow-light);
}

.dark .clay-button {
  background: linear-gradient(145deg, var(--color-clay-dark-elevated), var(--color-clay-dark-surface));
  box-shadow:
    -4px -4px 8px rgba(45, 50, 80, 0.1),
     4px  4px 8px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.dark .clay-button:active,
.dark .clay-button.pressed {
  box-shadow:
    inset 4px 4px 8px rgba(0, 0, 0, 0.45),
    inset -4px -4px 8px rgba(45, 50, 80, 0.1);
}

/* --- Clay Button Primary (colored gradient clay) --- */
.clay-button-primary {
  background: linear-gradient(145deg, hsl(243 75% 65%), hsl(243 75% 53%));
  border-radius: 1rem;
  box-shadow:
    -4px -4px 8px var(--clay-shadow-light),
     4px  4px 8px rgba(99, 102, 241, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.2s ease;
}

.clay-button-primary:hover {
  box-shadow:
    -2px -2px 6px var(--clay-shadow-light),
     2px  2px 6px rgba(99, 102, 241, 0.3);
}

.clay-button-primary:active {
  box-shadow:
    inset 4px 4px 8px rgba(67, 56, 202, 0.4),
    inset -4px -4px 8px rgba(165, 180, 252, 0.2);
}

.dark .clay-button-primary {
  background: linear-gradient(145deg, hsl(243 60% 55%), hsl(243 65% 43%));
  box-shadow:
    -4px -4px 8px rgba(45, 50, 80, 0.15),
     4px  4px 8px rgba(79, 70, 229, 0.4);
}

/* --- Clay Input (inset, concave) --- */
.clay-input {
  background: var(--color-clay-surface);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    inset 4px 4px 8px var(--clay-shadow-dark),
    inset -4px -4px 8px var(--clay-shadow-light);
  transition: all 0.2s ease;
}

.clay-input:focus {
  box-shadow:
    inset 4px 4px 8px var(--clay-shadow-dark),
    inset -4px -4px 8px var(--clay-shadow-light),
    0 0 0 3px rgba(99, 102, 241, 0.15);
}

.dark .clay-input {
  background: var(--color-clay-dark-surface);
  border: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow:
    inset 4px 4px 8px rgba(0, 0, 0, 0.45),
    inset -4px -4px 8px rgba(45, 50, 80, 0.1);
}

/* --- Clay Badge (pill) --- */
.clay-badge {
  background: var(--color-clay-surface);
  border-radius: 9999px;
  box-shadow:
    -2px -2px 4px var(--clay-shadow-light),
     2px  2px 4px var(--clay-shadow-dark);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.dark .clay-badge {
  background: var(--color-clay-dark-surface);
  box-shadow:
    -2px -2px 4px rgba(45, 50, 80, 0.1),
     2px  2px 4px rgba(0, 0, 0, 0.4);
}

/* --- Clay FAB (floating action button) --- */
.clay-fab {
  background: linear-gradient(145deg, hsl(243 75% 65%), hsl(263 75% 55%));
  border-radius: 9999px;
  box-shadow:
    -6px -6px 14px var(--clay-shadow-light),
     6px  6px 14px rgba(99, 102, 241, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.clay-fab:active {
  box-shadow:
    inset 4px 4px 10px rgba(67, 56, 202, 0.4),
    inset -4px -4px 10px rgba(165, 180, 252, 0.2);
}

.dark .clay-fab {
  box-shadow:
    -6px -6px 14px rgba(45, 50, 80, 0.15),
     6px  6px 14px rgba(79, 70, 229, 0.5);
}

/* --- Clay Navbar (bottom nav) --- */
.clay-navbar {
  background: linear-gradient(145deg, var(--color-clay-elevated), var(--color-clay-surface));
  box-shadow:
    -6px -6px 14px var(--clay-shadow-light),
     6px  6px 14px var(--clay-shadow-dark);
  border-top: 1px solid rgba(255, 255, 255, 0.5);
}

.dark .clay-navbar {
  background: linear-gradient(145deg, var(--color-clay-dark-elevated), var(--color-clay-dark-surface));
  box-shadow:
    -4px -4px 10px rgba(45, 50, 80, 0.12),
     4px  4px 10px rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

/* --- Clay Nav Item Active (puffy pill) --- */
.clay-nav-active {
  background: linear-gradient(145deg, hsl(243 75% 93%), hsl(243 75% 88%));
  border-radius: 1rem;
  box-shadow:
    -3px -3px 6px var(--clay-shadow-light),
     3px  3px 6px var(--clay-shadow-dark);
}

.dark .clay-nav-active {
  background: linear-gradient(145deg, hsl(243 30% 20%), hsl(243 30% 15%));
  box-shadow:
    -3px -3px 6px rgba(45, 50, 80, 0.12),
     3px  3px 6px rgba(0, 0, 0, 0.4);
}

/* --- Clay Header (page top) --- */
.clay-header {
  background: linear-gradient(145deg, hsl(243 75% 68%), hsl(263 65% 60%));
  border-radius: 0 0 var(--radius-clay-xl) var(--radius-clay-xl);
  box-shadow:
    -6px 6px 14px var(--clay-shadow-dark),
     6px 6px 14px rgba(99, 102, 241, 0.25);
}

.dark .clay-header {
  background: linear-gradient(145deg, hsl(243 50% 40%), hsl(263 45% 32%));
  box-shadow:
    -4px 4px 10px rgba(45, 50, 80, 0.15),
     4px 4px 10px rgba(0, 0, 0, 0.5);
}

/* --- Clay Inset (for list items, "pressed" area) --- */
.clay-inset {
  background: var(--color-clay-surface);
  border-radius: var(--radius-clay);
  box-shadow:
    inset 3px 3px 6px var(--clay-shadow-dark),
    inset -3px -3px 6px var(--clay-shadow-light);
}

.dark .clay-inset {
  background: var(--color-clay-dark-surface);
  box-shadow:
    inset 3px 3px 6px rgba(0, 0,  0, 0.4),
    inset -3px -3px 6px rgba(45, 50, 80, 0.1);
}

/* --- Clay Icon Container --- */
.clay-icon {
  background: linear-gradient(145deg, var(--color-clay-elevated), var(--color-clay-surface));
  border-radius: 0.875rem;
  box-shadow:
    -3px -3px 6px var(--clay-shadow-light),
     3px  3px 6px var(--clay-shadow-dark);
}

.dark .clay-icon {
  background: linear-gradient(145deg, var(--color-clay-dark-elevated), var(--color-clay-dark-surface));
  box-shadow:
    -3px -3px 6px rgba(45, 50, 80, 0.1),
     3px  3px 6px rgba(0, 0, 0, 0.4);
}

/* --- Clay Divider (soft) --- */
.clay-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--clay-shadow-dark), transparent);
}

.dark .clay-divider {
  background: linear-gradient(to right, transparent, rgba(45, 50, 80, 0.3), transparent);
}
```

**Step 3: Cập nhật background của `body`**

Thay block `body` ở line 71-76:

```css
body {
  background-color: var(--color-clay-base);
  color: var(--color-foreground);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Thay block `.dark` ở line 79-101, thêm:

```css
.dark {
  /* ... existing vars ... */
  background-color: var(--color-clay-dark-base);
  color: var(--color-dark-foreground);
}
```

**Step 4: Verif;y CSS loads**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas
npm run dev  # Check console for CSS errors, visit localhost:5173
```

Expected: App loads, background là màu pastel clay-base. Chưa thấy thay đổi component vì chưa apply classes.

**Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): add claymorphism design tokens and utility classes"
```

---

## Task 2: Update Card Component (Clay Card)

**Objective:** shadcn/ui `Card` component trở thành clay card mặc định.

**Files:**
- Modify: `src/components/ui/card.tsx`

**Step 1: Update Card className**

Thay `Card` component:

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "clay-card p-6 text-card-foreground",
      className
    )}
    {...props}
  />
))
```

**Step 2: Verif;y build**

```bash
npm run build
```

Expected: Build pass, no type errors.

---

## Task 3: Update Button Component (Clay Button)

**Objective:** Button variants dùng clay shadows thay vì flat shadow-sm.

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Update buttonVariants**

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "clay-button-primary",
        destructive:
          "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[4px_4px_8px_rgba(239,68,68,0.3),-4px_-4px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(185,28,28,0.4),inset_-4px_-4px_8px_rgba(254,202,202,0.2)]",
        outline:
          "clay-button bg-transparent hover:bg-accent/50",
        secondary:
          "clay-button",
        ghost: "hover:bg-accent/60 rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Step 2: Verify build**

```bash
npm run build
```

---

## Task 4: Update Input Component (Clay Input)

**Objective:** Input fields có inset shadow (lõm xuống như clay).

**Files:**
- Modify: `src/components/ui/input.tsx`

**Step 1: Update Input className**

```tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "clay-input flex h-12 w-full px-4 py-1 text-base transition-all placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:shadow-[inset_4px_4px_8px_rgba(239,68,68,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Step 2: Verify build**

```bash
npm run build
```

---

## Task 5: Update PageHeader (Clay Header)

**Objective:** PageHeader từ gradient rực rỡ → claymorphic header với soft gradient + bottom-rounded.

**Files:**
- Modify: `src/components/PageHeader.tsx`

**Step 1: Replace component**

```tsx
import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

type PageHeaderProps = {
  children: ReactNode
  className?: string
}

export default function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={cn(
      "clay-header relative overflow-hidden px-5 pt-6 pb-8 rounded-b-[2rem] lg:rounded-br-[2.5rem]",
      className
    )}>
      {/* Soft glow accents */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute top-12 right-20 w-24 h-24 bg-violet-200/15 rounded-full blur-2xl" />
      {/* Subtle inner highlight (top edge) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
```

---

## Task 6: Update Bottom Nav + Desktop Sidebar (Clay Nav)

**Objective:** Bottom nav bar và sidebar dùng clay surfaces.

**Files:**
- Modify: `src/layouts/MainLayout.tsx`

**Step 1: Update bottom nav container**

Thay className của bottom nav `<nav>` → `<div>` bên trong:

```tsx
// Bottom Nav container - thay:
<div className="bg-white dark:bg-[hsl(224,30%,11%)] backdrop-blur-2xl border-t border-gray-200/40 dark:border-[hsl(224,25%,18%)]/40">

// Bằng:
<div className="clay-navbar">
```

**Step 2: Update active pill in bottom nav**

Thay className của active pill `motion.div`:

```tsx
// Thay:
className="absolute inset-0 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/20"

// Bằng:
className="absolute inset-0 clay-nav-active"
```

**Step 3: Update Plus button (clay FAB)**

```tsx
<motion.div
  className="clay-fab flex h-14 w-14 items-center justify-center"
  whileTap={{ scale: 0.88 }}
  whileHover={{ scale: 1.05 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  <Icon className="h-7 w-7 text-white" />
</motion.div>
```

**Step 4: Update DesktopSidebar**

Thay `<aside>` className:

```tsx
<aside className="hidden lg:flex shrink-0 fixed left-0 top-0 h-full w-64 flex-col clay-navbar border-r">
```

**Step 5: Update sidebar active item**

```tsx
{isActive && (
  <motion.div
    layoutId="sidebarPill"
    className="absolute inset-0 rounded-xl clay-button-primary"
    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
  />
)}
```

**Step 6: Update logo area border**

```tsx
// Thay:
<div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">

// Bằng:
<div className="flex h-16 items-center justify-between px-6 clay-divider">
```

---

## Task 7: Update AuthLayout (Clay Auth Shell)

**Objective:** Auth layout background + card dùng clay style.

**Files:**
- Modify: `src/layouts/AuthLayout.tsx`

**Step 1: Update loading state + main background**

```tsx
// Loading state:
<div className="min-h-screen bg-[var(--color-clay-base)] dark:bg-[var(--color-clay-dark-base)] flex items-center justify-center">
  <div className="animate-spin h-10 w-10 border-4 border-indigo-400 border-t-transparent rounded-full" />
</div>
```

**Step 2: Update main container**

```tsx
// Thay:
<div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 md:p-8">

// Bằng:
<div className="min-h-screen bg-[var(--color-clay-base)] dark:bg-[var(--color-clay-dark-base)] flex items-center justify-center p-4 md:p-8">
```

**Step 3: Update branding icon**

```tsx
// Thay:
<div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">

// Bằng:
<div className="w-12 h-12 clay-icon flex items-center justify-center bg-gradient-to-br from-indigo-400/20 to-purple-400/20">
```

**Step 4: Update auth card**

```tsx
// Thay:
<div className="bg-white dark:bg-[hsl(224,30%,11%)] rounded-2xl md:rounded-3xl shadow-2xl md:shadow-xl px-6 py-8 md:px-8 md:py-10">

// Bằng:
<div className="clay-card px-6 py-8 md:px-8 md:py-10 rounded-[2rem]">
```

**Step 5: Update footer links**

```tsx
// Update footer text color từ white/70 → muted-foreground:
<span className="text-muted-foreground">
  {isLogin ? t.auth.dontHaveAccount : t.auth.alreadyHaveAccount}
</span>
```

---

## Task 8: Update SummaryCards (Clay Summary Cards)

**Objective:** Income/Expense cards dùng clay style với colored gradients + clay shadows.

**Files:**
- Modify: `src/components/dashboard/SummaryCards.tsx`

**Step 1: Replace card classNames**

```tsx
{/* Income card */}
<motion.div
  custom={0}
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  className="relative overflow-hidden rounded-3xl p-4
    bg-gradient-to-br from-emerald-300 to-emerald-500
    shadow-[-6px_-6px_14px_rgba(255,255,255,0.9),6px_6px_14px_rgba(16,185,129,0.35)]
    border border-white/40"
>
  <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/15 rounded-full blur-lg" />
  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center backdrop-blur-sm shadow-inner">
        <ArrowUpRight className="h-4 w-4 text-white" />
      </div>
      <span className="text-xs font-medium text-white/90">{t.dashboard.income}</span>
    </div>
    <p className="text-lg font-bold text-white leading-snug">
      {formatMoney(income, showBalance, currency.symbol, formatCurrency)}
    </p>
  </div>
</motion.div>

{/* Expense card */}
<motion.div
  custom={1}
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  className="relative overflow-hidden rounded-3xl p-4
    bg-gradient-to-br from-rose-300 to-rose-500
    shadow-[-6px_-6px_14px_rgba(255,255,255,0.9),6px_6px_14px_rgba(244,63,94,0.35)]
    border border-white/40"
>
  <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/15 rounded-full blur-lg" />
  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center backdrop-blur-sm shadow-inner">
        <ArrowDownRight className="h-4 w-4 text-white" />
      </div>
      <span className="text-xs font-medium text-white/90">{t.dashboard.expense}</span>
    </div>
    <p className="text-lg font-bold text-white leading-snug">
      {formatMoney(expense, showBalance, currency.symbol, formatDesignCurrency)}
    </p>
  </div>
</motion.div>
```

---

## Task 9: Update WalletCard (Clay Wallet Card)

**Objective:** Wallet card dùng clay-card surface với clay shadow.

**Files:**
- Modify: `src/components/wallets/WalletCard.tsx`

**Step 1: Replace card className**

```tsx
// Thay:
<div className="relative overflow-hidden bg-white rounded-2xl shadow-sm transition-all hover:shadow-md group cursor-pointer"

// Bằng:
<div className="relative overflow-hidden clay-card rounded-3xl transition-all group cursor-pointer hover:shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_10px_rgba(174,174,192,0.3)]"
```

**Step 2: Update wallet icon container**

```tsx
// Thay:
<div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
  style={{ backgroundColor: wallet.color + '15' }}>

// Bằng:
<div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 clay-icon"
  style={{ background: `linear-gradient(145deg, ${wallet.color}25, ${wallet.color}10)` }}>
```

**Step 3: Update action divider**

```tsx
// Thay:
<div className="flex items-center gap-1 px-4 pb-3 pt-1 border-t border-gray-100/50"

// Bằng:
<div className="flex items-center gap-1 px-4 pb-3 pt-2 mx-4 clay-inset rounded-xl"
  style={{ boxShadow: 'inset 2px 2px 4px rgba(174,174,192,0.15), inset -2px -2px 4px rgba(255,255,255,0.7)' }}
```

---

## Task 10: Update TotalBalanceCard

**Objective:** Balance card trong clay header style.

**Files:**
- Modify: `src/components/wallets/TotalBalanceCard.tsx`

**Step 1: Update eye toggle button**

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.15),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] hover:bg-white/30 shrink-0"
  onClick={onToggleBalance}
  aria-label={showBalance ? 'Hide balance' : 'Show balance'}
>
```

---

## Task 11: Update TransactionRow (Clay Transaction Card)

**Objective:** Transaction row default variant dùng clay card.

**Files:**
- Modify: `src/components/shared/TransactionRow.tsx`

**Step 1: Update default variant className**

```tsx
// Thay (isCompact=false branch):
'p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all bg-white'

// Bằng:
'p-4 rounded-3xl border-0 transition-all clay-card hover:shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_10px_rgba(174,174,192,0.3)]'
```

**Step 2: Update category icon container**

```tsx
// Thay:
className={cn(
  'rounded-xl flex items-center justify-center shrink-0',
  isCompact ? 'w-9 h-9 text-base' : 'w-10 h-10 text-lg'
)}

// Bằng:
className={cn(
  'rounded-xl flex items-center justify-center shrink-0 clay-icon',
  isCompact ? 'w-9 h-9 text-base' : 'w-10 h-10 text-lg'
)}
```

---

## Task 12: Update AnimatedFAB (Clay FAB)

**Objective:** FAB dùng clay-fab class thay vì gradient + flat shadow.

**Files:**
- Modify: `src/components/shared/AnimatedFAB.tsx`

**Step 1: Replace motion.div**

```tsx
<motion.div
  className="clay-fab relative flex items-center justify-center w-14 h-14"
  whileTap={{ scale: 0.85 }}
  whileHover={{ scale: 1.08 }}
  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
>
  {/* Idle pulse ring */}
  <motion.div
    className="absolute inset-0 rounded-full bg-indigo-400/20"
    animate={{
      scale: [1, 1.4, 1],
      opacity: [0.3, 0, 0.3],
    }}
    transition={{
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
  <Plus className="relative z-10 h-7 w-7 text-white" />
</motion.div>
```

---

## Task 13: Update EmptyState (Clay Empty State)

**Files:**
- Modify: `src/components/shared/EmptyState.tsx`

**Step 1: Add clay-icon container around emoji**

```tsx
export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 clay-icon">
        {icon}
      </div>
      <p className="text-gray-700 font-medium mb-1">{title}</p>
      {description && <p className="text-gray-400 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
```

---

## Task 14: Update BottomSheet (Clay Bottom Sheet)

**Files:**
- Modify: `src/components/ui/bottom-sheet.tsx`

**Step 1: Update sheet container**

```tsx
// Thay:
<div className="absolute bottom-20 left-0 right-0 bg-white dark:bg-[hsl(224,30%,11%)] rounded-t-3xl animate-slide-up flex flex-col"

// Bằng:
<div className="absolute bottom-20 left-0 right-0 clay-card rounded-t-[2rem] rounded-b-3xl animate-slide-up flex flex-col mx-2"
```

**Step 2: Update handle bar**

```tsx
<div className="w-10 h-1.5 bg-gray-300/50 dark:bg-gray-600/50 rounded-full" />
```

**Step 3: Update close button**

```tsx
<button
  onClick={handleClose}
  className="p-2 clay-button rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
  aria-label="Close"
>
  <X className="h-5 w-5" />
</button>
```

**Step 4: Update submit button area**

```tsx
{submitLabel && onSubmit && (
  <div className="px-5 pb-6 pt-3 shrink-0">
    <Button
      type="submit"
      onClick={onSubmit}
      disabled={submitDisabled || isPending}
      className="w-full h-12 text-base font-semibold"
    >
      {isPending ? "Saving..." : submitLabel}
    </Button>
  </div>
)}
```

---

## Task 15: Update Login Page (Clay Form)

**Files:**
- Modify: `src/pages/Login.tsx`

**Step 1: Replace input classNames**

```tsx
// Thay:
className="w-full h-12 px-4 bg-gray-50/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-base focus:outline-none focus:ring-2 focus:border-indigo-400 focus:ring-indigo-400/20"

// Bằng:
className="clay-input w-full h-12 px-4 rounded-xl text-base focus:outline-none"
```

**Step 2: Replace submit button**

```tsx
// Thay:
<button type="submit" disabled={isLoading}
  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
>

// Bằng:
<button type="submit" disabled={isLoading}
  className="clay-button-primary w-full h-12 text-white font-semibold text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
>
```

**Step 3: Update forgot password link**

```tsx
<button type="button" onClick={() => navigate('/forgot-password')}
  className="text-sm text-indigo-500 hover:text-indigo-600 font-medium">
```

---

## Task 16: Update SkeletonLoader

**Files:**
- Modify: `src/components/shared/SkeletonLoader.tsx` (verify content first)

**Step 1: Read current SkeletonLoader**

```bash
cat src/components/shared/SkeletonLoader.tsx
```

**Step 2: Replace `animate-pulse bg-gray-200` patterns**

Replace `bg-gray-200 dark:bg-white/10` with `clay-inset opacity-50`.

---

## Task 17: Final Build + Visual QA

**Objective:** Verify everything compiles and looks right.

**Step 1: Production build**

```bash
cd /home/vmo/vibe-coding/vibe-tube-atlas
npm run build
```

Expected: Build pass, no TS errors, no ESLint errors.

**Step 2: Dev server visual check**

```bash
npm run dev
```

Visit `http://localhost:5173`, kiểm tra:
- [ ] Login page: clay background, clay card, clay inputs
- [ ] Dashboard: clay summary cards, clay header, clay transaction rows
- [ ] Wallets: clay wallet cards
- [ ] Bottom nav: clay navbar, active pill raised
- [ ] FAB: clay floating button
- [ ] Dark mode: clay shadows adapts

**Step 3: Dark mode toggle**

Toggle dark mode, verify:
- Background chuyển sang `clay-dark-base`
- Cards có dark clay shadows
- Inputs vẫn inset
- No flat shadows leaked

**Step 4: Commit all**

```bash
git add -A
git commit -m "feat(ui): migrate entire app to claymorphism design system"
```

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Clay shadows có thể trông "nặng" trên màn hình nhỏ | Dùng shadow values nhỏ hơn cho mobile (`-4px` thay vì `-8px`) |
| Dark mode clay shadows khó cân bằng | Test kỹ dark mode, có thể cần tinh chỉnh opacity values |
| Một số component có gradient riêng (SummaryCards) | Giữ gradient nhưng thêm clay shadow layers |
| Performance: nhiều shadow layers có thể chậm trên thiết bị cũ | Chỉ dùng clay shadows cho interactive elements, không áp dụng cho mọi div |
| Button `active:scale-[0.97]` + clay shadow có thể xung đột | Test trên FAB và nav items |

## Open Questions

1. **Có muốn toggle clay/neumorphism intensity không?** Có thể thêm CSS variable `--clay-intensity` (0-1) để user chỉnh độ "puffy".
2. **Font weight có cần tăng không?** Clay shadows có thể làm text trông mảnh hơn. Có thể cân nhắc `font-weight: 500` → `600`.
3. **PageHeader có nên giữ gradient màu hay chuyển sang clay header monochrome?** Plan hiện tại giữ gradient indigo→purple nhưng add clay shadow.

---

## Files NOT Changed (no visual impact)

- `src/stores/*` — Zustand stores (logic only)
- `src/hooks/*` — TanStack Query hooks (data fetching)
- `src/types/*` — TypeScript types
- `src/lib/*` — Utilities (except potentially i18n)
- `src/mocks/*` — Mock data
- `supabase/*` — Backend
