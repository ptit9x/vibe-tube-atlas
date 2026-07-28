import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import { analyzeKeyword } from '@/lib/youtube'
import type { KeywordMetrics, SavedKeyword, AnalyzeKeywordParams, SaveKeywordInput } from '@/types'

export function useAnalyzeKeyword(params: AnalyzeKeywordParams | null) {
  return useQuery({
    queryKey: ['keyword-analysis', params?.keyword],
    queryFn: () => analyzeKeyword(params!),
    enabled: !!params?.keyword?.trim(),
    staleTime: 30 * 60_000,  // 30 min cache — searches are expensive (100+ quota)
    gcTime: 60 * 60_000,
  })
}

export function useSavedKeywords() {
  return useQuery({
    queryKey: ['saved-keywords'],
    queryFn: async () => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_keywords')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as SavedKeyword[]
    },
    staleTime: 60_000,
  })
}

export function useSaveKeyword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveKeywordInput) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_keywords')
        .insert({
          user_id: user.id,
          keyword: input.keyword,
          metrics: input.metrics,
          note: input.note ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-keywords'] }),
  })
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_keywords')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-keywords'] }),
  })
}
