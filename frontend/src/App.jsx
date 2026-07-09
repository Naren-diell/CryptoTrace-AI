import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute    from './components/layout/ProtectedRoute'
import AppLayout         from './components/layout/AppLayout'

import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import DashboardPage      from './pages/DashboardPage'
import WalletSearchPage   from './pages/WalletSearchPage'
import WalletHistoryPage  from './pages/WalletHistoryPage'
import NetworkGraphPage   from './pages/NetworkGraphPage'
import AssistantPage      from './pages/AssistantPage'
import InvestigationsPage from './pages/InvestigationsPage'
import ReportsPage        from './pages/ReportsPage'
import AdminPage          from './pages/AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — all users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"      element={<DashboardPage />} />
              <Route path="/wallet-search"  element={<WalletSearchPage />} />
              <Route path="/wallet-history" element={<WalletHistoryPage />} />
              <Route path="/graph"          element={<NetworkGraphPage />} />
              <Route path="/assistant"      element={<AssistantPage />} />
              <Route path="/investigations" element={<InvestigationsPage />} />
              <Route path="/reports"        element={<ReportsPage />} />

              {/* Admin only */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
