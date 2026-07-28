import { cn } from '@/lib/utils'

interface LogoProps {
  /** Size of the logo mark in pixels (default 40) */
  size?: number
  /** Additional classes for the wrapper */
  className?: string
  /** Whether to show the wordmark text next to the icon */
  showText?: boolean
  /** Variant controls text color */
  variant?: 'light' | 'dark' | 'gradient'
}

/**
 * Vibe Tube Atlas brand logo.
 *
 * A rounded red gradient square with a white play button — clean YouTube-inspired mark.
 * Used in AuthLayout header, DesktopSidebar, and anywhere the brand needs to appear.
 */
export function Logo({ size = 40, className, showText = false, variant = 'dark' }: LogoProps) {
  const textClass =
    variant === 'gradient'
      ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent'
      : variant === 'light'
        ? 'text-white'
        : 'text-gray-900 dark:text-gray-100'

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        role="img"
        aria-label="Vibe Tube Atlas"
      >
        <defs>
          <linearGradient id="logo-mark-bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF4444" />
            <stop offset="0.5" stopColor="#E60000" />
            <stop offset="1" stopColor="#B30000" />
          </linearGradient>
          <filter id="logo-mark-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.18" />
          </filter>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#logo-mark-bg)" />
        <g filter="url(#logo-mark-shadow)">
          <path d="M208 168L352 256L208 344V168Z" fill="white" />
        </g>
        <path d="M208 168L352 256L208 344V168Z" fill="white" />
      </svg>
      {showText && (
        <span className={cn('text-lg font-bold tracking-tight', textClass)}>
          Vibe Tube Atlas
        </span>
      )}
    </div>
  )
}
