import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useLogin } from "@/hooks/useAuth"
import { useI18n } from "@/lib/i18n"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { t } = useI18n()

  const login = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error(t.auth.pleaseFillInfo)
      return
    }

    if (password.length < 8) {
      toast.error(t.auth.passwordMinLength)
      return
    }

    try {
      await login.mutateAsync({ email, password })
      toast.success(t.auth.loginSuccess)
      navigate("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.somethingWrong)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {t.loginPage.welcomeBack}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {t.loginPage.loginDescription}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2 block">
            {t.auth.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="clay-input w-full h-12 px-4 rounded-xl text-base focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2 block">
            {t.auth.password}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.loginPage.enterPassword}
              className="clay-input w-full h-12 px-4 pr-12 rounded-xl text-base focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? t.loginPage.hidePassword : t.loginPage.showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-indigo-500 hover:text-indigo-600 py-1">
            {t.auth.forgotPassword}
          </button>
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="clay-button-primary w-full h-12 text-white font-semibold text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {login.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
          {t.auth.login}
        </button>
      </form>

    </>
  )
}