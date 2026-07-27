import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { AppNotification } from '@/types'

const NOTIFICATION_SELECT = 'id, user_id, title, body, type, is_read, link_url, created_at'

export function useAppNotifications() {
  return useQuery({
    queryKey: ['appNotifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      if (!isSupabaseConfigured()) return getMockNotifications()

      const user = await requireAuth()
      const { data, error } = await supabase
        .from('app_notifications')
        .select(NOTIFICATION_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    },
    staleTime: 30 * 1000, // 30s
    refetchInterval: 30 * 1000, // poll every 30s for unread badge
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!isSupabaseConfigured()) return

      const user = await requireAuth()
      const { error } = await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured()) return

      const user = await requireAuth()
      const { error } = await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!isSupabaseConfigured()) return

      const user = await requireAuth()
      const { error } = await supabase
        .from('app_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
    },
  })
}

// Mock data for development
function getMockNotifications(): AppNotification[] {
  return [
    {
      id: 'mock-1',
      user_id: 'mock',
      title: 'Chào mừng đến Vibe Tube Atlas!',
      body: 'Bạn đã sẵn sàng quản lý chi tiêu chưa?',
      type: 'info',
      is_read: false,
      link_url: '/dashboard',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      user_id: 'mock',
      title: 'Nhắc nhở ngân sách',
      body: 'Bạn đã chi tiêu 80% ngân sách tháng này.',
      type: 'budget_alert',
      is_read: false,
      link_url: '/reports',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]
}