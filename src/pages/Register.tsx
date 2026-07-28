import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useRegister } from "@/hooks/useAuth"
import { useI18n } from "@/lib/i18n"

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { t } = useI18n()

  const register = useRegister()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !fullName) {
      toast.error(t.auth.pleaseFillInfo)
      return
    }

    if (password.length < 8) {
      toast.error(t.auth.passwordMinLength)
      return
    }

    try {
      await register.mutateAsync({ email, password, full_name: fullName })
      toast.success(t.auth.registerSuccess, { duration: 4000 })
      navigate("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.somethingWrong)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {t.registerPage.createAccount}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {t.registerPage.registerDescription}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2 block">
            {t.auth.fullName}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t.registerPage.enterFullName}
            className="clay-input w-full h-12 px-4 rounded-xl text-base focus:outline-none"
          />
        </div>

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
              placeholder={t.registerPage.atLeast6Chars}
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

        <button
          type="submit"
          disabled={register.isPending}
          className="clay-button-primary w-full h-12 text-white font-semibold text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {register.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
          {t.auth.register}
        </button>
      </form>

    </>
  )
}