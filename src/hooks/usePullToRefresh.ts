import { useCallback, useRef, useState, type RefObject } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  /**
   * Pages live inside <main> in MainLayout, which is the real scroll
   * container — window.scrollY stays 0 there. We resolve the nearest
   * scrollable ancestor of this wrapper to know whether the user is
   * actually at the top before activating pull-to-refresh.
   */
  wrapperRef?: RefObject<HTMLDivElement | null>
}

function getScrollTop(wrapper: HTMLDivElement | null): number {
  let node: HTMLElement | null = wrapper?.parentElement ?? null
  while (node) {
    const style = window.getComputedStyle(node)
    const isScrollable =
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    if (isScrollable) return node.scrollTop
    node = node.parentElement
  }
  return window.scrollY
}

interface UsePullToRefreshReturn {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  wrapperRef,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const startY = useRef(0)
  const currentY = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when the scroll container is at the top
    if (getScrollTop(wrapperRef?.current ?? null) > 0) return
    startY.current = e.touches[0].clientY
    currentY.current = startY.current
  }, [wrapperRef])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      if (getScrollTop(wrapperRef?.current ?? null) > 0) {
        setIsPulling(false)
        setPullDistance(0)
        return
      }

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        setIsPulling(true)
        // Apply rubber-band resistance
        const resistance = 0.4
        const pulled = Math.min(distance * resistance, threshold * 1.5)
        setPullDistance(pulled)
      }
    },
    [isRefreshing, threshold, wrapperRef]
  )

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
        setIsPulling(false)
      }
    } else {
      setPullDistance(0)
      setIsPulling(false)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
