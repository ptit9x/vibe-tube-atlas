import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import type { DiscoveredKeyword, ScanSettings } from '@/types'

// ===== Scan settings =====

export function useScanSettings() {
  return useQuery({
    queryKey: ['scan-settings'],
    queryFn: async () => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('scan_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return data as ScanSettings | null
    },
    staleTime: 60_000,
  })
}

export interface UpdateScanSettingsInput {
  enabled: boolean
  industries: string[]
  markets: string[]
  minNicheScore: number
  maxKeywordsPerRun: number
}

export function useUpdateScanSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateScanSettingsInput) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('scan_settings')
        .upsert(
          {
            user_id: user.id,
            enabled: input.enabled,
            industries: input.industries,
            markets: input.markets,
            min_niche_score: input.minNicheScore,
            max_keywords_per_run: input.maxKeywordsPerRun,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select()
        .single()

      if (error) throw error
      return data as ScanSettings
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scan-settings'] }),
  })
}

// ===== Discovered keywords =====

export interface DiscoveredFilters {
  market: string | null
  industry: string | null
  category: string | null
  days: number
}

export function useDiscoveredKeywords(filters: DiscoveredFilters) {
  return useQuery({
    queryKey: ['discovered-keywords', filters],
    queryFn: async () => {
      const user = await requireAuth()
      const since = new Date(Date.now() - filters.days * 24 * 60 * 60_000).toISOString()

      let query = supabase
        .from('discovered_keywords')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ok')
        .gte('discovered_at', since)
        .order('niche_score', { ascending: false })
        .limit(200)

      if (filters.market) query = query.eq('market', filters.market)
      if (filters.industry) query = query.eq('industry', filters.industry)
      if (filters.category) query = query.eq('category', filters.category)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as DiscoveredKeyword[]
    },
    staleTime: 5 * 60_000,
  })
}

// ===== Save a discovered keyword into saved_keywords =====

export function useSaveDiscovered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: DiscoveredKeyword) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_keywords')
        .insert({
          user_id: user.id,
          keyword: item.keyword,
          metrics: {
            resultCount: Number(item.estimated_results ?? 0),
            avgViews: Number(item.avg_views ?? 0),
            nicheScore: item.niche_score,
            difficultyScore: item.difficulty_score,
            viewsPerDayTop: item.views_per_day_top ?? 0,
            market: item.market,
            estRpm: Number(item.est_rpm ?? 0),
            source: 'daily-scan',
          },
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-keywords'] }),
  })
}

// ===== Delete discovered keyword =====

export function useDeleteDiscovered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discovered_keywords')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discovered-keywords'] }),
  })
}
