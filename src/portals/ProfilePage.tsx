import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, User, Database, LogOut } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { accountFields, registrationSchema } from '../auth/model'
import type { Registration } from '../auth/model'
import { SubmitButton } from '../components/Forms'
import AccountFields from '../components/AccountFields'
import ConfirmAction from '../components/ConfirmAction'

export default function ProfilePage() {
  const { user } = useAuth()
  return <ProfileForm key={user?.id} />
}

function ProfileForm() {
  const { user, updateProfile, signOut, deleteAccount, clearData } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const role = user?.role ?? 'INSTITUTION'
  const isInstitution = role === 'INSTITUTION'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Registration>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { ...accountFields(user), role },
  })

  return (
    <div className="gov-dashboard-view">
      <div className="gov-page-header">
        <div className="gov-page-title-block">
          <div className="gov-page-eyebrow">ACCOUNT SETTINGS</div>
          <h1>Workspace Profile</h1>
          <p className="gov-page-subtitle">
            {isInstitution ? 'Institution Profile & Coordinator Details' : 'Scrutiny Officer Designation & Profile'}
          </p>
        </div>
      </div>

      <section className="gov-card gov-profile-card">
        <div className="gov-card-header">
          <div className="gov-card-title-group">
            <User size={18} />
            <h2>Profile Information</h2>
          </div>
          <span className="gov-profile-role-pill">
            {isInstitution ? 'Institution Account' : 'Officer Account'}
          </span>
        </div>

        <form
          noValidate
          onChange={() => setSaved(false)}
          onSubmit={handleSubmit(async data => {
            setError('')
            try {
              await updateProfile(data)
              reset(data)
              setSaved(true)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not save your profile.')
            }
          })}
        >
          <AccountFields role={role} register={register} errors={errors} />

          {error && (
            <p className="gov-form-error mt-4" role="alert">
              {error}
            </p>
          )}

          {saved && (
            <div className="gov-success-banner mt-4" role="status">
              <div className="gov-banner-content">
                <CheckCircle2 size={18} />
                <span>Profile changes updated and saved to local storage.</span>
              </div>
            </div>
          )}

          <div className="gov-profile-actions">
            <SubmitButton busy={isSubmitting} className="gov-btn-auto">
              Save Profile Changes
            </SubmitButton>
            <button
              className="gov-btn gov-btn-secondary"
              type="button"
              disabled={!isDirty || isSubmitting}
              onClick={() => {
                reset({ ...accountFields(user), role })
                setSaved(false)
                setError('')
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>

      {/* Local Prototype Data Management Card */}
      <section className="gov-card gov-danger-zone-card">
        <div className="gov-card-header">
          <div className="gov-card-title-group text-danger">
            <Database size={18} />
            <h2>Local Prototype Storage Management</h2>
          </div>
        </div>

        <p className="gov-danger-desc">
          All accounts, sessions, applications and audit events are stored strictly in this browser’s local storage.
          You can sign out, delete this specific account, or wipe all prototype records.
        </p>

        <div className="gov-danger-actions">
          <button
            type="button"
            className="gov-btn gov-btn-secondary"
            onClick={async () => {
              try {
                await signOut()
                navigate('/login', { replace: true })
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not sign out.')
              }
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <ConfirmAction
            label="Delete My Account"
            title="Delete this local account?"
            description="Your account, submitted applications and personal activity records will be deleted from this browser. Other local accounts will remain intact."
            onConfirm={async () => {
              await deleteAccount()
              navigate('/login', { replace: true })
            }}
          />

          <ConfirmAction
            label="Clear All Prototype Data"
            title="Clear all local data in this browser?"
            description="This wipes every PramaanSetu account, session, application, and activity record across all roles in this browser. This cannot be undone."
            onConfirm={async () => {
              await clearData()
              navigate('/login', { replace: true })
            }}
          />
        </div>
      </section>
    </div>
  )
}
