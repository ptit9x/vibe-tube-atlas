import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import type { SearchHistoryEntry } from '@/types'

export function useSearchHistory(limit = 50) {
  return useQuery({
    queryKey: ['search-history', limit],
    queryFn: async () => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as SearchHistoryEntry[]
    },
    staleTime: 30_000,
  })
}

export function useClearHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const user = await requireAuth()
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search-history'] }),
  })
}
