import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
const LandingPage = lazy(() => import('./LandingPage'))
import { ForgotPasswordPage, LoginPage, RegisterPage, RoleSelectionPage } from './pages/AuthPages'
import { NotFoundPage } from './pages/ComingSoonPage'
import DashboardLayout from './portals/DashboardLayout'
import { ApplicationsPage, ComplianceReportsPage, InstitutionDashboard, OfficerDashboard } from './portals/DashboardPages'
import ApplicationWizard from './applications/ApplicationWizard'
import ApplicationDetails from './applications/ApplicationDetails'
import FileRecovery from './documents/FileRecovery'
import './applications/applications.css'
import ProfilePage from './portals/ProfilePage'
import './App.css'
import './portals/portal.css'
import DocumentLocalizer from './i18n/DocumentLocalizer'
const IntelligencePage = lazy(() => import('./intelligence/IntelligencePage'))
const EvidenceInspector = lazy(() => import('./evidence/EvidenceInspector'))
const SimulatorPage = lazy(() => import('./simulator/SimulatorPage'))
const CopilotPage = lazy(() => import('./copilot/CopilotPage'))
function RouteEffects() {
  const { pathname, hash } = useLocation()
  const previous = useRef(pathname)
  useEffect(() => {
    const page = pathname.split('/').filter(Boolean).at(-1) ?? 'Home'
    document.title = `${page.replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase())} | PramaanSetu`
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' }))
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
      if (previous.current !== pathname) {
        const heading = document.querySelector<HTMLElement>('main h1')
        heading?.setAttribute('tabindex', '-1')
        heading?.focus({ preventScroll: true })
      }
    }
    previous.current = pathname
  }, [pathname, hash])
  return null
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DocumentLocalizer />
        <RouteEffects />
        <FileRecovery />
        <Suspense fallback={<div className="portal-page empty-state" role="status">Loading PramaanSetu…</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/select-role" element={<RoleSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<ProtectedRoute role="INSTITUTION" />}>
              <Route path="/institution" element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<InstitutionDashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="applications" element={<ApplicationsPage mode="institution" />} />
                <Route path="new-application" element={<Navigate to="/institution/applications/new" replace />} />
                <Route path="applications/new" element={<ApplicationWizard key="new" />} />
                <Route path="applications/:id/edit" element={<ApplicationWizard key="edit" />} />
                <Route path="applications/:id" element={<ApplicationDetails />} />
                <Route path="applications/:id/compliance" element={<ApplicationDetails />} />
                <Route path="applications/:id/simulator" element={<SimulatorPage />} />
                <Route path="applications/:id/assistant" element={<CopilotPage />} />
                <Route path="documents" element={<Navigate to="/institution/applications" replace />} />
                <Route
                  path="reports"
                  element={<ComplianceReportsPage />}
                />
              </Route>
            </Route>
            <Route element={<ProtectedRoute role="OFFICER" />}>
              <Route path="/officer" element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OfficerDashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="intelligence" element={<IntelligencePage />} />
                <Route path="applications/:id" element={<ApplicationDetails />} />
                <Route path="applications/:id/compliance" element={<ApplicationDetails />} />
                <Route path="applications/:id/evidence" element={<EvidenceInspector />} />
                <Route path="applications/:id/assistant" element={<CopilotPage />} />
                <Route path="review-queue" element={<ApplicationsPage mode="queue" />} />
                <Route path="flagged" element={<ApplicationsPage mode="flagged" />} />
                <Route
                  path="findings"
                  element={<ComplianceReportsPage />}
                />
                <Route
                  path="reports"
                  element={<ComplianceReportsPage />}
                />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
