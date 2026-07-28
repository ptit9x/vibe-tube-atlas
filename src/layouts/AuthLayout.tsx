import { Outlet, Link, useLocation, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useI18n } from "@/lib/i18n"
import { Logo } from "@/components/Logo"

export default function AuthLayout() {
  const location = useLocation()
  const { data: user, isLoading } = useAuth()
  const pathname = location.pathname
  const isLogin = pathname === "/login"
  const isRegister = pathname === "/register"
  const isForgot = pathname === "/forgot-password"
  const isReset = pathname === "/reset-password"
  const { t } = useI18n()

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-clay-base)] dark:bg-[var(--color-clay-dark-base)] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  // If user is already logged in, redirect to dashboard
  if (user && !isForgot && !isReset) {
    return <Navigate to="/dashboard" replace />
  }

  // Determine subtitle based on page
  const getSubtitle = () => {
    if (isLogin) return t.loginPage.welcomeBack
    if (isRegister) return t.registerPage.createAccount
    if (isForgot) return t.forgotPassword.description
    if (isReset) return t.resetPassword.description
    return ""
  }

  // Determine footer content based on page
  const renderFooter = () => {
    if (isForgot || isReset) {
      return (
        <div className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="text-indigo-500 font-medium hover:text-indigo-600 underline underline-offset-2 inline-block py-2"
          >
            {t.forgotPassword.backToLogin}
          </Link>
        </div>
      )
    }
    return (
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">
          {isLogin ? t.auth.dontHaveAccount : t.auth.alreadyHaveAccount}
        </span>{" "}
        <Link
          to={isLogin ? "/register" : "/login"}
          className="text-indigo-500 font-medium hover:text-indigo-600 underline underline-offset-2"
        >
          {isLogin ? t.auth.registerNow : t.auth.login}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-clay-base)] dark:bg-[var(--color-clay-dark-base)] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        {/* Branding - visible on all screens */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <Logo size={44} />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              {t.app.appName}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm hidden md:block">
            {getSubtitle()}
          </p>
        </div>

        {/* Auth Card */}
        <div className="clay-card px-6 py-8 md:px-8 md:py-10 rounded-[2rem]">
          <Outlet />
        </div>

        {/* Footer */}
        {renderFooter()}
      </div>
    </div>
  )
}
