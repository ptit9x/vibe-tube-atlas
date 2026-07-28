import { useState } from 'react'
import { PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { useApiKey, useSaveApiKey, useDeleteApiKey, useApiUsage } from '@/hooks/useApiKey'
import { formatCompactNumber } from '@/lib/youtube'
import { DEFAULT_QUOTA_LIMIT } from '@/constants/youtube'
import { toast } from 'sonner'
import { KeyRound, CheckCircle2, ExternalLink, Loader2, Trash2, Save, ListChecks } from 'lucide-react'

export default function ApiKeySettings() {
  const { t } = useI18n()
  const { data: apiKey, isLoading: keyLoading } = useApiKey()
  const { data: usage } = useApiUsage()
  const saveMutation = useSaveApiKey()
  const deleteMutation = useDeleteApiKey()

  const [inputKey, setInputKey] = useState('')

  const hasKey = !!apiKey?.is_active
  const quotaUsed = usage?.todayQuotaUsed ?? 0
  const quotaLimit = usage?.quotaLimit ?? DEFAULT_QUOTA_LIMIT
  const quotaPercent = Math.min(100, (quotaUsed / quotaLimit) * 100)

  const handleSave = () => {
    const key = inputKey.trim()
    if (!key) {
      toast.error(t.apiKey.enterKey)
      return
    }
    saveMutation.mutate(key, {
      onSuccess: () => {
        toast.success(t.apiKey.saveSuccess)
        setInputKey('')
      },
      onError: () => toast.error(t.common.error),
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => toast.success(t.apiKey.deleteSuccess),
      onError: () => toast.error(t.common.error),
    })
  }

  const steps = [t.apiKey.step1, t.apiKey.step2, t.apiKey.step3, t.apiKey.step4]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-bold text-white">{t.apiKey.title}</h1>
          <p className="text-sm text-white/80">{t.apiKey.subtitle}</p>
        </PageHeader>

        <div className="px-4 -mt-4 space-y-4">
          {keyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasKey ? (
            <>
              {/* Active Status */}
              <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.apiKey.keyActive}</div>
                      <div className="text-xs text-muted-foreground">{t.apiKey.freeQuota}</div>
                    </div>
                  </div>

                  {/* Quota usage */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.apiKey.quotaUsage}</span>
                      <span className="font-semibold">
                        {formatCompactNumber(quotaUsed)} / {formatCompactNumber(quotaLimit)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          quotaPercent > 80 ? 'bg-red-500' : quotaPercent > 50 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${quotaPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t.apiKey.quotaRemaining}: {formatCompactNumber(quotaLimit - quotaUsed)}</span>
                      <span>{t.apiKey.searchesToday}: {usage?.searchCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t.apiKey.delete}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Description */}
              <Card className="bg-blue-50 border-blue-200 rounded-xl">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-900">{t.apiKey.description}</p>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{t.apiKey.howToGet}</h2>
                  </div>
                  <ol className="space-y-2">
                    {steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t.apiKey.getApiKey}
                  </a>
                </CardContent>
              </Card>

              {/* Input */}
              <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t.apiKey.enterKey}
                  </label>
                  <Input
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={t.apiKey.apiKeyPlaceholder}
                    type="password"
                    autoComplete="off"
                  />
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !inputKey.trim()}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t.apiKey.save}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
