import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase, isSupabaseConfigured, isMockAuthAllowed, requireAuth } from '@/lib/supabase'
import type { AuthUser, LoginInput, RegisterInput } from '@/types'
import { getMockUsers } from '@/mocks/mockAuth'

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async (): Promise<AuthUser | null> => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error || !user) return null

          // Check if email is confirmed
          // Email confirmation is disabled — all users are treated as confirmed

          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, full_name')
            .eq('id', user.id)
            .single()

          return {
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || user.user_metadata?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            confirmed: true,
          }
        } catch {
          if (import.meta.env.DEV) console.warn('Supabase auth failed, using mock auth')
        }
      }

      // Fallback to mock auth from localStorage (dev only)
      if (!isMockAuthAllowed()) return null

      const token = localStorage.getItem('token')
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token === 'mock-jwt-token') {
        return {
          id: 'dev-user',
          email: 'dev@example.com',
          full_name: 'Dev User',
          avatar_url: null,
          confirmed: true,
        }
      }
      return null
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Listen to Supabase auth state changes for realtime session sync
export function useAuthListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: LoginInput): Promise<AuthUser> => {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Email confirmation disabled — login grants immediate access

        return {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || null,
          avatar_url: null,
          confirmed: true,
        }
      }

      // Mock login for development only
      if (!isMockAuthAllowed()) {
        throw new Error('Authentication service unavailable')
      }

      const mockUser = getMockUsers()[email as string]
      if (mockUser && mockUser.password === password) {
        localStorage.setItem('token', 'mock-jwt-token')
        return {
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          avatar_url: null,
          confirmed: true,
        }
      }
      throw new Error('Invalid email or password')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password, full_name }: RegisterInput): Promise<AuthUser> => {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name },
          },
        })

        if (error) throw error
        if (!data.user) throw new Error('Registration failed')

        // Profile and default wallet are created by DB triggers on auth.users insert
        // No manual API calls needed here

        return {
          id: data.user.id,
          email: data.user.email || '',
          full_name: full_name,
          avatar_url: null,
          confirmed: true,
        }
      }

      // Mock register for development only
      if (!isMockAuthAllowed()) {
        throw new Error('Authentication service unavailable')
      }

      const mockUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        full_name,
        avatar_url: null,
        confirmed: true, // Mock always confirmed
      }
      localStorage.setItem('token', 'mock-jwt-token')
      return mockUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }
      localStorage.removeItem('token')
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: { currency?: string; full_name?: string; avatar_url?: string }) => {
      if (!isSupabaseConfigured()) {
        return { success: true }
      }

      const user = await requireAuth()

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}
