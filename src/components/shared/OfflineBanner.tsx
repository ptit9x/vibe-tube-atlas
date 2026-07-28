import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useI18n } from '@/lib/i18n'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const { t } = useI18n()

  if (isOnline) return null

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500"
      role="status"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t.common.offlineMode}</span>
    </div>
  )
}
