import { useRef } from 'react'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
}

export function PullToRefreshWrapper({ onRefresh, children, className }: PullToRefreshWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { isRefreshing, pullDistance, handlers } = usePullToRefresh({ onRefresh, wrapperRef })

  return (
    <div ref={wrapperRef} className={className} {...handlers}>
      {/* Pull indicator - icon only */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0, opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <svg
          aria-hidden="true"
          className={`w-5 h-5 text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      {children}
    </div>
  )
}
