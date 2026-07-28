import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import type { ApiUsageSummary } from '@/types'
import { DEFAULT_QUOTA_LIMIT } from '@/constants/youtube'

export function useApiKey() {
  return useQuery({
    queryKey: ['api-key'],
    queryFn: async () => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, provider, is_active, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('provider', 'youtube')
        .maybeSingle()

      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function useSaveApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const user = await requireAuth()
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          provider: 'youtube',
          api_key_encrypted: apiKey,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' })

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-key'] }),
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const user = await requireAuth()
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'youtube')
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-key'] }),
  })
}

export function useApiUsage() {
  return useQuery({
    queryKey: ['api-usage'],
    queryFn: async (): Promise<ApiUsageSummary | null> => {
      const user = await requireAuth()
      const today = new Date().toISOString().slice(0, 10)
      const todayStart = `${today}T00:00:00Z`

      const { data, error } = await supabase
        .from('api_usage')
        .select('quota_cost, created_at')
        .eq('user_id', user.id)
        .gte('created_at', todayStart)

      if (error) throw error

      const todayQuotaUsed = (data || []).reduce((sum, r) => sum + (r.quota_cost || 0), 0)

      return {
        totalQuotaUsed: todayQuotaUsed,
        quotaLimit: DEFAULT_QUOTA_LIMIT,
        remainingQuota: Math.max(0, DEFAULT_QUOTA_LIMIT - todayQuotaUsed),
        searchCount: (data || []).filter(r => r.quota_cost >= 100).length,
        todayQuotaUsed,
      }
    },
    staleTime: 30_000,
  })
}
