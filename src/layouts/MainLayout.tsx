import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, useLogout } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { useAppNotifications } from '@/hooks/useAppNotifications'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Wallet,
  Plus,
  BarChart3,
  Menu,
  LogOut,
  Bell,
} from 'lucide-react'

import { Avatar, OfflineBanner } from '@/components/shared'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { icon: LayoutDashboard, labelKey: 'nav.home', href: '/dashboard' },
  { icon: Wallet, labelKey: 'nav.account', href: '/wallets' },
  { icon: Plus, labelKey: 'nav.add', href: '/add-transaction', isPlus: true },
  { icon: BarChart3, labelKey: 'nav.report', href: '/reports' },
  { icon: Menu, labelKey: 'nav.profile', href: '/profile' },
]

export default function MainLayout() {
  const location = useLocation()
  const { data: user, isLoading } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.confirmed) {
    return <Navigate to="/verify-email" replace />
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom))] max-w-3xl">
          <AnimatePresence mode="wait">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Bottom Nav (mobile) ── */}
      <nav role="navigation" aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="clay-navbar">
          <div className="flex h-[72px] items-center justify-around px-2">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              const Icon = item.icon

              if (item.isPlus) {
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="relative -mt-8 z-10"
                  >
                    <motion.div
                      className="clay-fab flex h-14 w-14 items-center justify-center"
                      whileTap={{ scale: 0.88 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </motion.div>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px]"
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavPill"
                      className="absolute inset-0 clay-nav-active"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <motion.div
                      animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-indigo-600 stroke-[2.5]" : "text-zinc-400 dark:text-zinc-500"
                      )} />
                    </motion.div>
                    <span className={cn(
                      "text-xs leading-tight transition-colors",
                      isActive ? "font-semibold text-indigo-600" : "font-medium text-zinc-400 dark:text-zinc-500"
                    )}>
                      {t.nav[item.labelKey.split('.')[1] as keyof typeof t.nav]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <DesktopSidebar user={user} />
    </div>
  )
}

function DesktopSidebar({ user }: { user: import('@/types').AuthUser }) {
  const location = useLocation()
  const { t } = useI18n()
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: notifications } = useAppNotifications()
  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <aside className="hidden lg:flex shrink-0 fixed left-0 top-0 h-full w-64 flex-col clay-navbar border-r z-40">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
        <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          💰 Vibe Tube Atlas
        </span>
        <Link
          to="/notifications"
          className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label={t.notifications.title}
        >
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          {unreadCount && unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-white/5"
              )}
            >
              {/* Active gradient bg */}
              {isActive && (
                <motion.div
                  layoutId="sidebarPill"
                  className="absolute inset-0 rounded-xl clay-button-primary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className={cn("h-4 w-4 relative z-10", isActive ? "text-white" : "")} />
              <span className="relative z-10">{t.nav[item.labelKey.split('.')[1] as keyof typeof t.nav]}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <Avatar src={user.avatar_url} name={user.full_name || user.email?.split('@')[0]} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {user.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut className="h-4 w-4" />
          {t.auth.logout}
        </button>
      </div>
    </aside>
  )
}
