import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'

import { PageTransition } from '@/components/shared'

export default function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage(t.settings.passwordNotMatch)
      return
    }

    if (newPassword.length < 8) {
      setMessage(t.auth.passwordMinLength)
      return
    }

    setIsLoading(true)
    setMessage('')
    setIsSuccess(false)

    try {
      if (isSupabaseConfigured()) {
        // Verify current password before allowing change
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) throw new Error('No authenticated user')

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        })
        if (verifyError) {
          setMessage(t.auth.currentPasswordIncorrect || 'Current password is incorrect')
          setIsSuccess(false)
          setIsLoading(false)
          return
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
      }

      setIsLoading(false)
      setMessage(t.settings.changePasswordSuccess)
      setIsSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setIsLoading(false)
      setMessage(err instanceof Error ? err.message : t.settings.passwordChangeFailed)
    }
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <h1 className="text-xl font-semibold text-white">{t.settings.changePassword}</h1>
      </PageHeader>

      <div className="bg-white mt-2 px-5 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              {t.settings.currentPassword}
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-12 pr-10"
                placeholder={t.settings.enterCurrentPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              {t.settings.newPassword}
            </label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 pr-10"
                placeholder={t.settings.enterNewPassword}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              {t.settings.confirmPassword}
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12"
              placeholder={t.settings.enterConfirmPassword}
            />
          </div>

          {message && (
            <p className={`text-sm ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? t.settings.processing : t.settings.changePassword}
          </Button>
        </form>
      </div>
    </div>
    </PageTransition>
  )
}