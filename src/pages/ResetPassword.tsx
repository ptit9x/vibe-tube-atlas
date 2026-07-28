import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useI18n } from "@/lib/i18n"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isRecoverySession, setIsRecoverySession] = useState(false)

  // Check for recovery token from URL hash fragment (Supabase default)
  // and also listen for PASSWORD_RECOVERY auth event
  useEffect(() => {
    const checkRecovery = async () => {
      // 1. Check query params (explicit redirect)
      if ((searchParams.has("access_token") && searchParams.get("type") === "recovery") || searchParams.has("token")) {
        setIsRecoverySession(true)
        return
      }

      // 2. Check hash fragment (#access_token=...)
      const hash = window.location.hash.substring(1)
      if (hash.includes("access_token") || hash.includes("type=recovery")) {
        setIsRecoverySession(true)
        return
      }

      // 3. Check if Supabase already established a recovery session
      // NOTE: We do NOT set isRecoverySession just because a session exists.
      // Only the PASSWORD_RECOVERY auth event or recovery tokens in URL
      // indicate a legitimate password reset flow.
    }

    checkRecovery()

    // 4. Listen for PASSWORD_RECOVERY event (may fire after hash parsing)
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecoverySession(true)
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error(t.auth.pleaseFillInfo)
      return
    }

    if (password.length < 8) {
      toast.error(t.auth.passwordMinLength)
      return
    }

    if (password !== confirmPassword) {
      toast.error(t.resetPassword.passwordNotMatch)
      return
    }

    setIsLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      }

      setSuccess(true)
      toast.success(t.resetPassword.resetSuccess)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.somethingWrong)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isRecoverySession && !success) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t.resetPassword.invalidLink}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t.resetPassword.invalidLinkDescription}
        </p>
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium py-2 px-3 -mx-3"
        >
          {t.resetPassword.requestNewLink}
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t.resetPassword.resetSuccessTitle}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t.resetPassword.resetSuccessDescription}
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full max-w-xs h-12 bg-blue-500 text-white font-semibold text-base rounded-xl hover:bg-blue-600 transition-colors"
        >
          {t.auth.login}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center">
        {t.resetPassword.title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center">
        {t.resetPassword.description}
      </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              {t.resetPassword.newPassword}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.resetPassword.newPassword}
                className="w-full h-12 px-4 pr-12 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              {t.resetPassword.confirmNewPassword}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.resetPassword.confirmNewPassword}
                className="w-full h-12 px-4 pr-12 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-500 text-white font-semibold text-base rounded-xl hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {t.resetPassword.resetPassword}
          </button>
        </form>
    </div>
  )
}
