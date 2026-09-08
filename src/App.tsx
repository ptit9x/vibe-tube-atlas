import { useEffect } from 'react'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'

// Auth pages (lazy loaded)
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// Vibe Tube Atlas pages (lazy loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const KeywordExplorer = lazy(() => import('./pages/KeywordExplorer'))
const TrendingPage = lazy(() => import('./pages/Trending'))
const VideoAnalyzer = lazy(() => import('./pages/VideoAnalyzer'))
const ChannelAnalyzer = lazy(() => import('./pages/ChannelAnalyzer'))
const SavedItems = lazy(() => import('./pages/SavedItems'))
const NicheRadar = lazy(() => import('./pages/NicheRadar'))
const SearchHistoryPage = lazy(() => import('./pages/SearchHistory'))
const ApiKeySettings = lazy(() => import('./pages/ApiKeySettings'))
const ProfilePage = lazy(() => import('./pages/Profile'))
const LanguageSettingsPage = lazy(() => import('./pages/LanguageSettings'))
const PasswordSettingsPage = lazy(() => import('./pages/PasswordSettings'))

// Error pages (lazy loaded)
const NotFound = lazy(() => import('./pages/NotFound'))
const ServerError = lazy(() => import('./pages/ServerError'))
const Forbidden = lazy(() => import('./pages/Forbidden'))

import { Toaster } from '@/components/ui/sonner'
import { useAuthListener } from '@/hooks/useAuth'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'

/** Scroll to top on route change. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    const main = document.querySelector('main')
    if (main) {
      main.scrollTo({ top: 0 })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])
  return null
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  )
}

function AppContent() {
  useAuthListener()

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Standalone route for email verification */}
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Main App Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/keywords" element={<KeywordExplorer />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/videos" element={<VideoAnalyzer />} />
            <Route path="/channels" element={<ChannelAnalyzer />} />
            <Route path="/saved" element={<SavedItems />} />
            <Route path="/niche-radar" element={<NicheRadar />} />
            <Route path="/history" element={<SearchHistoryPage />} />
            <Route path="/settings/api-key" element={<ApiKeySettings />} />
            <Route path="/settings/language" element={<LanguageSettingsPage />} />
            <Route path="/settings/password" element={<PasswordSettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Error Pages */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  )
}

export default App
