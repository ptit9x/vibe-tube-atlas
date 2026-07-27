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
const TransactionsPage = lazy(() => import('./pages/Transactions'))
const AddTransactionPage = lazy(() => import('./pages/AddTransaction'))
const EditTransactionPage = lazy(() => import('./pages/EditTransaction'))
const WalletsPage = lazy(() => import('./pages/Wallets'))
const ReportsPage = lazy(() => import('./pages/Reports'))
const ExpenseReportPage = lazy(() => import('./pages/ExpenseReport'))
const IncomeReportPage = lazy(() => import('./pages/IncomeReport'))
const DebtReportPage = lazy(() => import('./pages/DebtReport'))
const ProfilePage = lazy(() => import('./pages/Profile'))
const LanguageSettingsPage = lazy(() => import('./pages/LanguageSettings'))
const CurrencySettingsPage = lazy(() => import('./pages/CurrencySettings'))
const ExportDataPage = lazy(() => import('./pages/ExportData'))
const PasswordSettingsPage = lazy(() => import('./pages/PasswordSettings'))
const CategoriesPage = lazy(() => import('./pages/Categories'))
const SavingsPage = lazy(() => import('./pages/Savings'))
const NotificationsPage = lazy(() => import('./pages/Notifications'))
const FinancialHealthPage = lazy(() => import('./pages/FinancialHealth'))

// Error pages (lazy loaded)
const NotFound = lazy(() => import('./pages/NotFound'))
const ServerError = lazy(() => import('./pages/ServerError'))
const Forbidden = lazy(() => import('./pages/Forbidden'))

import { Toaster } from '@/components/ui/sonner'
import { useAuthListener } from '@/hooks/useAuth'
import { useOutboxSync } from '@/hooks/useOutboxSync'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'

/** Scroll to top on route change.
 *  The scrollable container is <main> (has overflow-y-auto), not window.
 *  Fallback to window for pages rendered outside MainLayout (auth/error pages). */
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
  useOutboxSync()

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Auth Routes - Shared mobile-first layout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Standalone route for email verification - no layout wrapper needed */}
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Main App Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/add-transaction" element={<AddTransactionPage />} />
            <Route path="/edit-transaction/:id" element={<EditTransactionPage />} />
            <Route path="/wallets" element={<WalletsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/expense" element={<ExpenseReportPage />} />
            <Route path="/reports/income" element={<IncomeReportPage />} />
            <Route path="/reports/debt" element={<DebtReportPage />} />
            <Route path="/settings/language" element={<LanguageSettingsPage />} />
            <Route path="/settings/currency" element={<CurrencySettingsPage />} />
            <Route path="/settings/export" element={<ExportDataPage />} />
            <Route path="/settings/password" element={<PasswordSettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/financial-health" element={<FinancialHealthPage />} />
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
