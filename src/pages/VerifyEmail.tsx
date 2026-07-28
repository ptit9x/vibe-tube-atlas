import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const logout = useLogout()
  const [resending, setResending] = useState(false)
  const { t } = useI18n()

  const handleResend = async () => {
    if (!user?.email) return

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (error) throw error
      toast.success(t.verifyEmail.emailSent)
    } catch {
      toast.error(t.verifyEmail.cannotResend)
    } finally {
      setResending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch (error) {
      // Logout errors are non-critical, user is redirecting anyway
      if (import.meta.env.DEV) console.error('Logout error:', error)
    }
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">{t.verifyEmail.title}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white dark:bg-[hsl(224,30%,11%)] rounded-t-3xl px-5 py-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-blue-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t.verifyEmail.emailNotConfirmed}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.verifyEmail.subtitle}<br />
            <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email}</span>
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            {t.verifyEmail.instruction}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full h-12 bg-blue-500 text-white font-semibold text-base rounded-xl hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              {resending ? t.verifyEmail.resending : t.verifyEmail.resendEmail}
            </button>

            <button
              onClick={handleLogout}
              className="w-full h-12 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium text-base rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
            >
              {t.verifyEmail.logout}
            </button>
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-green-800">{t.verifyEmail.tip}</p>
                <p className="text-xs text-green-600 mt-1">
                  {t.verifyEmail.tipText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}