import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import { searchChannelsByKeyword } from '@/lib/youtube'
import type { YouTubeChannel, SavedChannel, SaveChannelInput } from '@/types'

export function useChannelSearch(keyword: string | null, maxResults = 10, regionCode = 'VN', relevanceLanguage = 'vi') {
  return useQuery({
    queryKey: ['channel-search', keyword, maxResults, regionCode],
    queryFn: () => searchChannelsByKeyword(keyword!, maxResults, regionCode, relevanceLanguage),
    enabled: !!keyword?.trim(),
    staleTime: 15 * 60_000,
  })
}

export function useSavedChannels() {
  return useQuery({
    queryKey: ['saved-channels'],
    queryFn: async () => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as SavedChannel[]
    },
    staleTime: 60_000,
  })
}

export function useSaveChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveChannelInput) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_channels')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-channels'] }),
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_channels')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-channels'] }),
  })
}
