import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, requireAuth } from '@/lib/supabase'
import { searchVideos } from '@/lib/youtube'
import type { YouTubeVideo, SavedVideo, SearchVideosParams, SaveVideoInput } from '@/types'

export function useVideoSearch(params: SearchVideosParams | null) {
  return useQuery({
    queryKey: ['video-search', params?.keyword, params?.order, params?.regionCode],
    queryFn: () => searchVideos(params!),
    enabled: !!params?.keyword?.trim(),
    staleTime: 10 * 60_000,
  })
}

export function useSavedVideos() {
  return useQuery({
    queryKey: ['saved-videos'],
    queryFn: async () => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as SavedVideo[]
    },
    staleTime: 60_000,
  })
}

export function useSaveVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveVideoInput) => {
      const user = await requireAuth()
      const { data, error } = await supabase
        .from('saved_videos')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-videos'] }),
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_videos')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-videos'] }),
  })
}

export function isVideoSaved(savedVideos: SavedVideo[] | undefined, videoId: string): boolean {
  return savedVideos?.some(v => v.video_id === videoId) ?? false
}
