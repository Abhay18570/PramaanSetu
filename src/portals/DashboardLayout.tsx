import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Building,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react'
import { Brand } from '../components/Shared'
import { useAuth } from '../auth/useAuth'
import { rolePath } from '../auth/model'
import { portalNavigation } from './data'
import LanguageSelector from '../components/LanguageSelector'
import { exitDemo,resetDemo } from '../demo/service'

export function Sidebar({ close,collapsed=false,onToggle,mobile=false }: { close?: () => void;collapsed?:boolean;onToggle?:()=>void;mobile?:boolean }) {
  const { user } = useAuth()
  if (!user) return null

  const isInstitution = user.role === 'INSTITUTION'

  return (
    <div className={`gov-sidebar-container ${collapsed&&!mobile?'is-collapsed':''}`}>
      <div className="gov-sidebar-brand-box">
        <Brand />
        <span className="gov-sidebar-portal-tag">
          {isInstitution ? 'INSTITUTION WORKBENCH' : 'SCRUTINY OFFICER WORKBENCH'}
        </span>
        {!mobile&&<button className="gov-sidebar-collapse" onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} title={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</button>}
      </div>

      <nav aria-label="Portal Navigation" className="gov-sidebar-nav">
        <span className="gov-sidebar-section-label">MAIN WORKSPACE</span>
        {portalNavigation[user.role].map(({ path, title, icon: Icon }) => (
          <NavLink
            key={path}
            to={`${rolePath(user.role)}/${path}`}
            onClick={close}
            className={({ isActive }) =>
              `gov-sidebar-link ${isActive ? 'gov-sidebar-link-active' : ''}`
            }
            title={collapsed&&!mobile?title:undefined}
            aria-label={collapsed&&!mobile?title:undefined}
          >
            <Icon size={18} />
            <span>{title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="gov-sidebar-footer">
        <Link
          className="gov-sidebar-user-card"
          to={`${rolePath(user.role)}/profile`}
          onClick={close}
          aria-label="View user profile"
        >
          <div className="gov-avatar-circle">
            {user.name
              .split(' ')
              .slice(0, 2)
              .map(word => word[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="gov-sidebar-user-info">
            <strong>{user.institutionName || user.name}</strong>
            <span>{isInstitution ? 'Institution Coordinator' : user.department || 'Regulatory Officer'}</span>
          </div>
        </Link>
        <SignOut onDone={close} />
        {user.isDemo&&<DemoActions close={close}/>} 
      </div>
    </div>
  )
}

function DemoActions({close}:{close?:()=>void}){const {user,startDemo}=useAuth();const navigate=useNavigate();if(!user?.isDemo)return null;return <div className="gov-demo-actions"><button onClick={async()=>{const role=user.role==='INSTITUTION'?'OFFICER':'INSTITUTION';await startDemo(role);close?.();navigate(`${rolePath(role)}/dashboard`)}} title="Switch Demo Role"><ArrowLeftRight size={16}/><span>Switch Demo Role</span></button><button onClick={()=>{if(confirm('Reset only the sample demo workspace?')){resetDemo();location.reload()}}} title="Reset Demo Data"><RotateCcw size={16}/><span>Reset Demo Data</span></button><button onClick={()=>{exitDemo();close?.();window.location.assign('/')}} title="Exit Demo"><LogOut size={16}/><span>Exit Demo</span></button></div>}

function SignOut({ onDone }: { onDone?: () => void }) {
  const { signOut,user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  return (
    <>
      <button
        type="button"
        className="gov-sidebar-logout-btn"
        onClick={async () => {
          try {
            await signOut()
            onDone?.()
            navigate(user?.isDemo?'/' : '/login', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not sign out.')
          }
        }}
      >
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
      {error && (
        <p className="gov-field-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

export function DashboardHeader({ openSidebar }: { openSidebar: () => void }) {
  const { user } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [])

  if (!user) return null

  const isInstitution = user.role === 'INSTITUTION'
  const activeNavItem = portalNavigation[user.role].find(item =>
    location.pathname.endsWith(`/${item.path}`)
  )

  return (
    <header
      className="gov-portal-header"
      ref={headerRef}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          buttonRef.current?.focus()
          setProfileOpen(false)
        }
      }}
    >
      <div className="gov-header-left">
        <button
          type="button"
          className="gov-portal-mobile-toggle"
          onClick={openSidebar}
          aria-label="Open sidebar navigation"
        >
          <Menu size={22} />
        </button>

        <div className="gov-portal-breadcrumbs">
          <Link to="/" className="gov-breadcrumb-home" title="Return to Portal Home">
            <Home size={15} />
            <span>PramaanSetu</span>
          </Link>
          <span className="gov-breadcrumb-separator">/</span>
          <span className="gov-breadcrumb-portal">
            {isInstitution ? 'Institution Portal' : 'Officer Scrutiny Console'}
          </span>
          <span className="gov-breadcrumb-separator">/</span>
          <span className="gov-breadcrumb-active">{activeNavItem?.title ?? 'Workspace'}</span>
        </div>
      </div>

      <div className="gov-header-right">
        {user.isDemo&&<span className="gov-demo-mode" title="You're exploring a sample workspace. Data and verification results are for demonstration.">Demo Mode</span>}
        <LanguageSelector compact />
        <div className="gov-portal-meta-badge">
          {isInstitution ? <Building size={14} /> : <Shield size={14} />}
          <span>{isInstitution ? 'Institution Workspace' : 'Scrutiny Officer'}</span>
        </div>

        <div className="gov-header-profile-menu">
          <button
            ref={buttonRef}
            type="button"
            className="gov-header-profile-btn"
            aria-label="User profile options"
            aria-expanded={profileOpen}
            aria-controls="gov-header-profile-popover"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="gov-portal-avatar-mini">
              {user.name
                .split(' ')
                .slice(0, 2)
                .map(word => word[0])
                .join('')
                .toUpperCase()}
            </span>
            <div className="gov-header-user-text">
              <strong>{user.institutionName || user.name}</strong>
              <small>{user.email}</small>
            </div>
            <ChevronDown size={14} className={`gov-profile-chevron ${profileOpen ? 'rotate' : ''}`} />
          </button>

          {profileOpen && (
            <div id="gov-header-profile-popover" className="gov-portal-popover" role="menu">
              <div className="gov-popover-user-block">
                <strong>{user.name}</strong>
                <p>{user.email}</p>
                <span className="gov-popover-role-tag">
                  {isInstitution ? 'Institution Coordinator' : user.department || 'Officer'}
                </span>
              </div>
              <div className="gov-popover-links">
                <Link
                  to={`${rolePath(user.role)}/profile`}
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  <User size={15} />
                  <span>Edit Profile</span>
                </Link>
                <Link to="/" role="menuitem" onClick={() => setProfileOpen(false)}>
                  <Home size={15} />
                  <span>Public Portal Home</span>
                </Link>
              </div>
              <div className="gov-popover-footer">
                <SignOut onDone={() => setProfileOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const location = useLocation()
  const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('pramaansetu_sidebar_collapsed_v1')==='true')
  const toggle=()=>setCollapsed(value=>{localStorage.setItem('pramaansetu_sidebar_collapsed_v1',String(!value));return !value})

  useEffect(() => {
    dialogRef.current?.close()
  }, [location.pathname])

  return (
    <div className={`gov-portal-shell ${collapsed?'sidebar-collapsed':''}`}>
      <a className="gov-skip-link" href="#portal-content">
        Skip to workspace content
      </a>

      {/* Desktop Sidebar */}
      <aside className="gov-portal-sidebar">
        <Sidebar collapsed={collapsed} onToggle={toggle}/>
      </aside>

      {/* Mobile Drawer */}
      <dialog
        ref={dialogRef}
        className="gov-mobile-sidebar-dialog"
        aria-label="Workspace navigation"
        onClick={event => {
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
      >
        <div className="gov-mobile-sidebar-wrapper">
          <button
            autoFocus
            type="button"
            className="gov-mobile-sidebar-close"
            style={{ zIndex: 5 }}
            aria-label="Close sidebar"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={22} />
          </button>
          <Sidebar mobile close={() => dialogRef.current?.close()} />
        </div>
      </dialog>

      {/* Main Workspace Area */}
      <div className="gov-portal-content-area">
        <DashboardHeader key={location.pathname} openSidebar={() => dialogRef.current?.showModal()} />
        <main className="gov-portal-main" id="portal-content">
          <Outlet />
        </main>
        <footer className="gov-portal-footer">
          <div className="gov-portal-footer-inner">
            <span>
              PramaanSetu · Institutional Verification System · Smart India Hackathon 2026 (SIH26261)
            </span>
            <span className="gov-portal-footer-note">
              Browser-scoped local prototype. Not an official Government of India or AICTE portal.
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
