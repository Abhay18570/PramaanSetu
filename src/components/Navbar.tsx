import { useEffect, useState } from 'react'
import {
  Menu,
  X,
  HelpCircle,
  Eye,
  LogIn,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { navigation } from '../data/content'
import { Brand } from './Shared'
import { useAuth } from '../auth/useAuth'
import { dashboardPath } from '../auth/model'
import { Link } from 'react-router-dom'
import LanguageSelector from './LanguageSelector'

interface NavbarProps {
  open: (name: string) => void
  onOpenAccessibility: () => void
  onOpenHelp: () => void
}

export type TextSize = 'sm' | 'md' | 'lg'

export default function Navbar({ open, onOpenAccessibility, onOpenHelp }: NavbarProps) {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [textSize, setTextSize] = useState<TextSize>(() => {
    return (typeof window !== 'undefined' && (localStorage.getItem('pramaansetu_text_size') as TextSize)) || 'md'
  })

  // Synchronize text size on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize)
  }, [textSize])

  const handleTextSize = (size: TextSize) => {
    setTextSize(size)
    localStorage.setItem('pramaansetu_text_size', size)
  }

  // Active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -55% 0px' }
    )

    navigation.forEach(([, id]) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <header className="gov-header-wrapper">
      {/* LEVEL 1: Utility Bar */}
      <div className="gov-utility-bar">
        <div className="gov-container gov-utility-inner">
          <div className="gov-utility-left">
            <span className="gov-sih-tag">
              <span className="gov-tricolor-dot" />
              PramaanSetu — SIH 2026 Prototype (Problem SIH26261)
            </span>
          </div>

          <div className="gov-utility-right">
            <LanguageSelector />
            <span className="gov-utility-divider" />
            <a href="#main-content" className="gov-utility-link gov-skip-target">
              Skip to Content
            </a>
            <span className="gov-utility-divider" />

            <div className="gov-text-controls" role="group" aria-label="Text size controls">
              <span className="gov-text-controls-label">Text Size:</span>
              <button
                type="button"
                className={`gov-text-btn ${textSize === 'sm' ? 'active' : ''}`}
                onClick={() => handleTextSize('sm')}
                aria-label="Decrease text size (A-)"
                aria-pressed={textSize === 'sm'}
              >
                A-
              </button>
              <button
                type="button"
                className={`gov-text-btn ${textSize === 'md' ? 'active' : ''}`}
                onClick={() => handleTextSize('md')}
                aria-label="Default text size (A)"
                aria-pressed={textSize === 'md'}
              >
                A
              </button>
              <button
                type="button"
                className={`gov-text-btn ${textSize === 'lg' ? 'active' : ''}`}
                onClick={() => handleTextSize('lg')}
                aria-label="Increase text size (A+)"
                aria-pressed={textSize === 'lg'}
              >
                A+
              </button>
            </div>
            <span className="gov-utility-divider" />

            <button
              type="button"
              className="gov-utility-action-btn"
              onClick={onOpenAccessibility}
              aria-label="Open accessibility options"
            >
              <Eye size={13} />
              <span>Accessibility</span>
            </button>
            <span className="gov-utility-divider" />

            <button
              type="button"
              className="gov-utility-action-btn"
              onClick={onOpenHelp}
              aria-label="Open help and support guide"
            >
              <HelpCircle size={13} />
              <span>Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* LEVEL 2: Main Branding Header */}
      <div className="gov-brand-header">
        <div className="gov-container gov-brand-header-inner">
          <div className="gov-brand-left">
            <Brand />
            <div className="gov-brand-separator" />
            <div className="gov-brand-slogan">
              <span className="gov-slogan-line1">SMART REGULATORY ASSURANCE</span>
              <span className="gov-slogan-line2">Institutional Approval &amp; Scrutiny Workbench</span>
            </div>
          </div>

          <div className="gov-brand-right">
            <div className="gov-header-auth-actions">
              {user ? (
                <Link to={dashboardPath(user.role)} className="gov-btn gov-btn-outline-blue">
                  <Layers size={15} />
                  <span>Open {user.role === 'INSTITUTION' ? 'Institution' : 'Officer'} Portal</span>
                  <ChevronRight size={14} />
                </Link>
              ) : (
                <button
                  type="button"
                  className="gov-btn gov-btn-outline-blue"
                  onClick={() => open('Login')}
                >
                  <LogIn size={15} />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="gov-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen}
              aria-controls="gov-main-nav"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* LEVEL 3: Navigation Bar */}
      <nav id="gov-main-nav" className="gov-nav-bar" aria-label="Main Navigation">
        <div className="gov-container gov-nav-bar-inner">
          <ul className="gov-nav-list" role="menubar">
            {navigation.map(([label, id]) => (
              <li key={id} role="none" className="gov-nav-item">
                <a
                  href={`#${id}`}
                  role="menuitem"
                  className={`gov-nav-link ${activeSection === id ? 'active' : ''}`}
                  aria-current={activeSection === id ? 'location' : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="gov-nav-right">
            <button
              type="button"
              className="gov-nav-access-btn"
              onClick={() => open('Get Started')}
            >
              <Shield size={14} />
              <span>Access Portal</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="gov-mobile-drawer" role="dialog" aria-label="Mobile Navigation Menu">
          <div className="gov-mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="gov-mobile-drawer-content">
            <div className="gov-mobile-drawer-header">
              <Brand />
              <button
                type="button"
                className="gov-mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="gov-mobile-utility">
              <span className="gov-mobile-util-title">Text Size</span>
              <div className="gov-text-controls">
                <button
                  type="button"
                  className={`gov-text-btn ${textSize === 'sm' ? 'active' : ''}`}
                  onClick={() => handleTextSize('sm')}
                >
                  A-
                </button>
                <button
                  type="button"
                  className={`gov-text-btn ${textSize === 'md' ? 'active' : ''}`}
                  onClick={() => handleTextSize('md')}
                >
                  A
                </button>
                <button
                  type="button"
                  className={`gov-text-btn ${textSize === 'lg' ? 'active' : ''}`}
                  onClick={() => handleTextSize('lg')}
                >
                  A+
                </button>
              </div>
            </div>
            <div className="gov-mobile-utility">
              <LanguageSelector />
            </div>

            <nav className="gov-mobile-nav-links">
              {navigation.map(([label, id]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`gov-mobile-nav-link ${activeSection === id ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{label}</span>
                  <ChevronRight size={16} />
                </a>
              ))}
            </nav>

            <div className="gov-mobile-actions">
              {user ? (
                <Link
                  to={dashboardPath(user.role)}
                  className="gov-btn gov-btn-primary gov-btn-block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Layers size={16} />
                  <span>Go to {user.role === 'INSTITUTION' ? 'Institution' : 'Officer'} Portal</span>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className="gov-btn gov-btn-primary gov-btn-block"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      open('Get Started')
                    }}
                  >
                    <Shield size={16} />
                    <span>Access Portal</span>
                  </button>
                  <button
                    type="button"
                    className="gov-btn gov-btn-secondary gov-btn-block"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      open('Login')
                    }}
                  >
                    <LogIn size={16} />
                    <span>Sign In to Local Workspace</span>
                  </button>
                </>
              )}
            </div>

            <div className="gov-mobile-footer">
              <button
                type="button"
                className="gov-mobile-util-item"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenAccessibility()
                }}
              >
                <Eye size={15} />
                <span>Accessibility Guide</span>
              </button>
              <button
                type="button"
                className="gov-mobile-util-item"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenHelp()
                }}
              >
                <HelpCircle size={15} />
                <span>Help &amp; Prototype Guide</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
