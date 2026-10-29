import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Layers,
  LoaderCircle,
  PlayCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Brand, PramaanSetuLogo } from '../components/Shared'
import { FormField, LocalNotice, SubmitButton } from '../components/Forms'
import AccountFields from '../components/AccountFields'
import ConfirmAction from '../components/ConfirmAction'
import { useAuth } from '../auth/useAuth'
import { accountFields, dashboardPath, loginSchema, parseRole, registrationSchema } from '../auth/model'
import type { Registration, Role, User } from '../auth/model'
import { localAccountService } from '../auth/service'
import LanguageSelector from '../components/LanguageSelector'

export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { storageNotice, clearData } = useAuth()

  return (
    <div className="gov-auth-page">
      {/* Utility Top Ribbon */}
      <div className="gov-auth-top-ribbon">
        <div className="gov-container gov-auth-top-inner">
          <span className="gov-auth-top-title">
            <span className="gov-tricolor-dot" />
            PramaanSetu — Institutional Verification Portal (SIH 2026 Prototype)
          </span>
          <div className="language-header-group">
            <LanguageSelector compact />
            <Link to="/" className="gov-auth-home-link">
              <ArrowLeft size={14} />
              <span>Portal Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="gov-auth-header">
        <div className="gov-container gov-auth-header-inner">
          <Brand variant="auth" />
          <Link to="/" className="gov-btn gov-btn-outline-blue gov-btn-sm">
            <ArrowLeft size={14} />
            <span>Back to Portal Home</span>
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className={`gov-auth-container ${wide ? 'gov-auth-wide' : ''}`} id="portal-content">
        {storageNotice && (
          <div className="gov-storage-alert" role="alert">
            <p>{storageNotice}</p>
            <ConfirmAction
              label="Reset Prototype Data"
              title="Reset all local prototype data?"
              description="This removes all PramaanSetu accounts, sessions, applications and activity in this browser. It cannot be undone."
              onConfirm={clearData}
            />
          </div>
        )}
        {children}
      </main>

      {/* Institutional Footer */}
      <footer className="gov-auth-footer">
        <div className="gov-container">
          <p>
            PramaanSetu · Smart India Hackathon 2026 Prototype · Problem Statement SIH26261 · Not an official AICTE or
            Government of India service
          </p>
        </div>
      </footer>
    </div>
  )
}

function AuthHeading({ title, text, showLogo = true }: { title: string; text: string; showLogo?: boolean }) {
  return (
    <div className="gov-auth-heading">
      {showLogo && (
        <div className="gov-auth-heading-logo">
          <PramaanSetuLogo variant="auth-card" />
        </div>
      )}
      <h1>{title}</h1>
      <p>{text}</p>
      <div className="gov-heading-bar gov-bar-centered" />
    </div>
  )
}

export function RoleSelectionCard({ role }: { role: Role }) {
  const isInstitution = role === 'INSTITUTION'
  const Icon = isInstitution ? Building2 : ShieldCheck
  const { t } = useTranslation()
  const { startDemo } = useAuth()
  const navigate = useNavigate()
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoError, setDemoError] = useState('')

  async function openDemo() {
    if (demoBusy) return
    setDemoBusy(true)
    setDemoError('')
    try {
      await startDemo(role)
      navigate(dashboardPath(role))
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : t('demoLogin.error'))
      setDemoBusy(false)
    }
  }

  return (
    <div className={`gov-role-card ${isInstitution ? 'role-institution' : 'role-officer'}`}>
      <div className="gov-role-card-header">
        <div className="gov-role-icon-box">
          <Icon size={30} />
        </div>
        <span className="gov-role-category">{isInstitution ? 'APPLICANT PORTAL' : 'SCRUTINY PORTAL'}</span>
      </div>

      <h2>{isInstitution ? 'Institution Portal' : 'Officer Portal'}</h2>
      <p>
        {isInstitution
          ? 'For technical institutes, colleges, and polytechnics to submit annual extension approvals, upload statutory clearances, and track scrutiny findings.'
          : 'For authorized scrutiny committee members and regulatory officers to review submitted institutional dossiers, inspect flags, and record audit observations.'}
      </p>

      <div className="gov-role-features">
        {isInstitution ? (
          <>
            <div>
              <CheckCircle2 size={14} />
              <span>Submit &amp; track approval dossiers</span>
            </div>
            <div>
              <CheckCircle2 size={14} />
              <span>Upload infrastructure &amp; faculty data</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <CheckCircle2 size={14} />
              <span>Inspect central scrutiny queue</span>
            </div>
            <div>
              <CheckCircle2 size={14} />
              <span>Review rule compliance &amp; flagged cases</span>
            </div>
          </>
        )}
      </div>

      <div className="gov-role-actions">
        <Link className="gov-btn gov-btn-primary gov-btn-block" to={`/register?role=${role}`}>
          <span>Create {isInstitution ? 'Institution' : 'Officer'} Account</span>
          <ArrowRight size={16} />
        </Link>
        <Link className="gov-role-login-link" to={`/login?role=${role}`}>
          <span>Already registered? Access workspace</span>
          <ArrowRight size={13} />
        </Link>
        <div className="gov-role-demo-access">
          <button
            type="button"
            className="gov-role-demo-button"
            disabled={demoBusy}
            onClick={() => void openDemo()}
          >
            {demoBusy ? <LoaderCircle className="gov-spin" size={17} /> : <PlayCircle size={17} />}
            <span>{demoBusy ? t('demoLogin.opening') : t(isInstitution ? 'demoLogin.institution' : 'demoLogin.officer')}</span>
          </button>
          <small>{t('demoLogin.supporting')}</small>
          {demoError && <span className="gov-role-demo-error" role="alert">{demoError}</span>}
        </div>
      </div>
    </div>
  )
}

export function RoleSelectionPage() {
  const { user } = useAuth()

  return (
    <AuthLayout wide>
      <AuthHeading
        title="Select Your Portal Role"
        text="Choose your operational workspace to proceed to PramaanSetu."
      />

      {user ? (
        <div className="gov-auth-card gov-active-session-card">
          <span className="gov-session-badge">Active Session Detected</span>
          <h2>You are already signed in</h2>
          <p className="gov-session-user">{user.institutionName || user.name}</p>
          <span className="gov-session-role">
            Role: <strong>{user.role === 'INSTITUTION' ? 'Institution Coordinator' : 'Scrutiny Officer'}</strong>
          </span>

          <div className="gov-session-actions">
            <Link to={dashboardPath(user.role)} className="gov-btn gov-btn-primary">
              <Layers size={16} />
              <span>Open My Workspace</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="gov-role-selection-grid">
          {(['INSTITUTION', 'OFFICER'] as const).map(role => (
            <RoleSelectionCard key={role} role={role} />
          ))}
        </div>
      )}

      <LocalNotice />
    </AuthLayout>
  )
}

export function LoginPage() {
  const [params] = useSearchParams()
  const role = parseRole(params.get('role'))
  const { user, signIn, clearData } = useAuth()
  const navigate = useNavigate()

  const [match, setMatch] = useState<User | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(loginSchema) })

  if (user) return <Navigate to={dashboardPath(user.role)} replace />

  return (
    <AuthLayout>
      <AuthHeading
        title="Access Your Workspace"
        text="Enter the registered email of any account previously created in this browser."
      />

      <div className="gov-auth-card">
        <LocalNotice />

        <form
          noValidate
          onSubmit={handleSubmit(async data => {
            setError('')
            setMatch(null)
            setNotFound(false)
            try {
              const found = await localAccountService.findAccount(data.email)
              setMatch(found)
              setNotFound(!found)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to read local accounts.')
            }
          })}
        >
          <FormField id="email" label="Registered Official Email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`gov-input ${errors.email ? 'gov-input-error' : ''}`}
              placeholder="e.g. coordinator@college.edu.in"
              {...register('email', {
                onChange: () => {
                  setMatch(null)
                  setNotFound(false)
                  setError('')
                },
              })}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </FormField>

          <SubmitButton busy={isSubmitting}>Find Local Account</SubmitButton>
        </form>

        {match && (
          <div className="gov-account-match-card">
            <div className="gov-match-header">
              <CheckCircle2 size={18} className="text-green" />
              <strong>Account Verified in Local Storage</strong>
            </div>

            <div className="gov-match-details">
              <h4>{match.institutionName || match.name}</h4>
              <p>{match.email}</p>
              <span className="gov-match-role-badge">
                {match.role === 'INSTITUTION' ? 'Institution Coordinator' : 'Review Officer'}
              </span>
            </div>

            <button
              type="button"
              className="gov-btn gov-btn-primary gov-btn-block"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError('')
                try {
                  const current = await signIn(match.id)
                  navigate(dashboardPath(current.role), { replace: true })
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not open the workspace.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              <span>{busy ? 'Opening Workspace…' : 'Continue to Local Workspace'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {notFound && (
          <div className="gov-account-not-found" role="status">
            <p>No local account found with this email in this browser.</p>
            <Link to={`/register?role=${role}`} className="gov-btn gov-btn-secondary gov-btn-sm">
              <span>Create New Account</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {error && (
          <div className="gov-storage-alert" role="alert">
            <p>{error}</p>
            <ConfirmAction
              label="Reset Prototype Data"
              title="Reset all local data?"
              description="Delete all PramaanSetu data in this browser, including every local account and application? This cannot be undone."
              onConfirm={async () => {
                await clearData()
                setError('')
                setMatch(null)
              }}
            />
          </div>
        )}

        <div className="gov-auth-switch">
          <span>Need a new account? </span>
          <Link to={`/register?role=${role}`}>Register local account</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const [params] = useSearchParams()
  const role = parseRole(params.get('role'))
  return <RegistrationForm key={role} role={role} />
}

function RegistrationForm({ role }: { role: Role }) {
  const { user, register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Registration>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { ...accountFields(), role },
  })

  if (user) return <Navigate to={dashboardPath(user.role)} replace />

  return (
    <AuthLayout wide>
      <AuthHeading
        title={`Create ${role === 'INSTITUTION' ? 'Institution' : 'Officer'} Account`}
        text={
          role === 'INSTITUTION'
            ? 'Set up your local institution workspace to prepare and track approval applications.'
            : 'Set up a scrutiny officer workspace. (Independent SIH prototype · Does not grant official AICTE authority).'
        }
      />

      <div className="gov-auth-card">
        <div className="gov-auth-back-row">
          <Link className="gov-back-link" to="/select-role">
            <ArrowLeft size={14} />
            <span>Switch Role / Portal</span>
          </Link>
          <span className="gov-auth-role-tag">
            {role === 'INSTITUTION' ? 'Institution Registration' : 'Officer Registration'}
          </span>
        </div>

        <LocalNotice />

        <form
          noValidate
          onSubmit={handleSubmit(async data => {
            setError('')
            try {
              const next = await createAccount(data)
              navigate(dashboardPath(next.role), { replace: true, state: { registered: true } })
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Account could not be saved.')
            }
          })}
        >
          <AccountFields role={role} register={register} errors={errors} />

          <p className="gov-form-disclaimer">
            Data is stored strictly in your browser's local memory. Do not input real confidential or production credentials.
          </p>

          {error && (
            <p className="gov-form-error" role="alert">
              {error}
            </p>
          )}

          <SubmitButton busy={isSubmitting}>
            Create Local Account
            <ArrowRight size={16} />
          </SubmitButton>
        </form>

        <div className="gov-auth-switch">
          <span>Already registered in this browser? </span>
          <Link to={`/login?role=${role}`}>Access your workspace</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="gov-auth-card gov-active-session-card">
        <span className="gov-session-badge">Password-Free Prototype</span>
        <h2>No password needed</h2>
        <p>
          PramaanSetu prototype utilizes password-free local email indexing. Simply enter your registered email to find
          and resume your workspace.
        </p>
        <div className="gov-session-actions">
          <Link className="gov-btn gov-btn-primary" to="/login">
            <span>Access Your Workspace</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
