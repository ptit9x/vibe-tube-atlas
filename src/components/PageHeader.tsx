import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

type PageHeaderProps = {
  children: ReactNode
  className?: string
}

/**
 * Page header with claymorphism gradient background.
 *
 * Design notes:
 * - Uses `overflow-hidden` so the single decorative glow is clipped to the
 *   header bounds — it cannot bleed onto content below.
 * - `pointer-events-none` on every decorative layer so they never intercept
 *   clicks meant for header content (buttons, links, avatar upload, etc.).
 * - `pb-10` gives enough breathing room for the `-mt-4` content overlap used
 *   across pages, so cards sit cleanly over the header's bottom edge.
 */
export default function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <header className={cn(
      "clay-header relative overflow-hidden px-5 pt-6 pb-10 rounded-b-3xl lg:rounded-br-[2rem]",
      className
    )}>
      {/* Subtle top-edge highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      {/* Single soft radial glow — on-brand white, clipped by overflow-hidden */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </header>
  )
}
