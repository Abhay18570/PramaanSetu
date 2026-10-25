import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldCheck, X, Eye, HelpCircle, Check, MessageSquare, Building2 } from 'lucide-react'
import Navbar from './components/Navbar'
import {
  CTASection,
  ContactSection,
  FAQSection,
  FeaturesSection,
  Footer,
  HeroSection,
  HowItWorksSection,
  InstitutionalInfoSection,
  PlatformPreviewSection,
  PlatformUpdatesSection,
  QuickAccessSection,
} from './components/Sections'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { dashboardPath } from './auth/model'
import './demo/demo.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const {startDemo}=useAuth()
  const enterDemo=async(role:'INSTITUTION'|'OFFICER')=>{await startDemo(role);navigate(dashboardPath(role))}
  const [modalType, setModalType] = useState<'info' | 'accessibility' | 'help' | 'feedback' | null>(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalContent, setModalContent] = useState('')

  const dialog = useRef<HTMLDialogElement>(null)

  const openServiceModal = (name: string, link?: string) => {
    if (link) {
      navigate(link)
      return
    }
    if (name === 'Get Started') {
      navigate('/select-role')
      return
    }
    if (name === 'Login') {
      navigate('/login')
      return
    }

    setModalType('info')
    setModalTitle(name)
    setModalContent(
      `${name} is part of the verification pipeline designed for Problem SIH26261. Local accounts, application submission, document upload, and officer-triggered local document analysis are available. Regulatory compliance remains planned for Module 05.`
    )
  }

  const openAccessibilityModal = () => {
    setModalType('accessibility')
    setModalTitle('Accessibility Guide & Compliance')
    setModalContent('')
  }

  const openHelpModal = () => {
    setModalType('help')
    setModalTitle('PramaanSetu Prototype Guide')
    setModalContent('')
  }

  const openFeedbackModal = () => {
    setModalType('feedback')
    setModalTitle('Evaluator Feedback & Observations')
    setModalContent('')
  }

  useEffect(() => {
    if (!modalType) return
    const prev = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [modalType])

  const closeModal = () => {
    dialog.current?.close()
    setModalType(null)
  }

  return (
    <div className="gov-page-root">
      {/* Accessible skip link */}
      <a className="gov-skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* 3-Level Structured Header */}
      <Navbar
        open={openServiceModal}
        onOpenAccessibility={openAccessibilityModal}
        onOpenHelp={openHelpModal}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1}>
        <HeroSection open={() => navigate('/select-role')} />
        <section className="demo-entry" aria-labelledby="demo-entry-title"><div className="demo-entry-heading"><span>SIH 2026 EVALUATOR ACCESS</span><h2 id="demo-entry-title">Explore PramaanSetu — Live Demo</h2><p>Experience the platform from both institutional and regulatory perspectives. No registration required.</p></div><div className="demo-entry-grid"><article><Building2 size={30}/><div><h3>Institution Workspace</h3><p>Submit applications, upload documents and explore compliance guidance.</p></div><button className="demo-btn institution" onClick={()=>void enterDemo('INSTITUTION')}>Explore Institution Demo <ArrowRight size={17}/></button></article><article><ShieldCheck size={30}/><div><h3>Officer Workspace</h3><p>Review applications, inspect evidence and explore verification findings.</p></div><button className="demo-btn officer" onClick={()=>void enterDemo('OFFICER')}>Explore Officer Demo <ArrowRight size={17}/></button></article></div><small>Uses clearly labeled fictional sample data stored separately in this browser.</small></section>
        <QuickAccessSection onSelectAction={openServiceModal} />
        <PlatformUpdatesSection />
        <FeaturesSection onSelectService={openServiceModal} />
        <HowItWorksSection />
        <InstitutionalInfoSection />
        <PlatformPreviewSection />
        <FAQSection />
        <ContactSection onOpenFeedback={openFeedbackModal} />
        <CTASection open={() => navigate('/select-role')} />
      </main>

      {/* Structured Dark Navy Footer */}
      <Footer open={openServiceModal} />

      {/* Accessible Modal Dialog */}
      <dialog
        ref={dialog}
        className="gov-dialog"
        aria-labelledby="gov-dialog-title"
        onCancel={closeModal}
        onClick={event => {
          if (event.target === event.currentTarget) closeModal()
        }}
      >
        <div className="gov-dialog-card">
          <button className="gov-dialog-close" aria-label="Close dialog" onClick={closeModal}>
            <X size={20} />
          </button>

          {modalType === 'accessibility' ? (
            <div className="gov-dialog-body">
              <div className="gov-dialog-header">
                <span className="gov-dialog-icon">
                  <Eye size={24} />
                </span>
                <div>
                  <h2 id="gov-dialog-title">Accessibility Features</h2>
                  <p>Standard Government Portal Accessibility Standards (GIGW 3.0 &amp; WCAG 2.1 AA)</p>
                </div>
              </div>

              <div className="gov-dialog-features">
                <div className="gov-a11y-feature">
                  <Check size={16} />
                  <div>
                    <strong>Dynamic Text Sizing:</strong>
                    <p>Use the A-, A, A+ controls in the top utility bar to adjust font scaling across the entire portal without layout breakage.</p>
                  </div>
                </div>

                <div className="gov-a11y-feature">
                  <Check size={16} />
                  <div>
                    <strong>Skip to Content Navigation:</strong>
                    <p>Screen readers and keyboard navigators can press Tab to immediately jump directly to the primary page content.</p>
                  </div>
                </div>

                <div className="gov-a11y-feature">
                  <Check size={16} />
                  <div>
                    <strong>High Contrast Palette:</strong>
                    <p>Colors adhere to WCAG AAA contrast ratios with Primary Navy (#061D45) on light backgrounds (#F5F7FB) and White (#FFFFFF).</p>
                  </div>
                </div>

                <div className="gov-a11y-feature">
                  <Check size={16} />
                  <div>
                    <strong>Keyboard Navigable Forms:</strong>
                    <p>All inputs, dialogs, buttons and data tables feature explicit focus rings and full Escape/Enter accessibility.</p>
                  </div>
                </div>
              </div>

              <div className="gov-dialog-actions">
                <button type="button" className="gov-btn gov-btn-primary" onClick={closeModal}>
                  Close Guide
                </button>
              </div>
            </div>
          ) : modalType === 'help' ? (
            <div className="gov-dialog-body">
              <div className="gov-dialog-header">
                <span className="gov-dialog-icon">
                  <HelpCircle size={24} />
                </span>
                <div>
                  <h2 id="gov-dialog-title">Platform &amp; Prototype Guide</h2>
                  <p>Understanding PramaanSetu for Smart India Hackathon 2026</p>
                </div>
              </div>

              <div className="gov-help-steps">
                <div className="gov-help-item">
                  <span className="gov-help-num">1</span>
                  <div>
                    <strong>Zero-Password Local Testing:</strong>
                    <p>Accounts and sessions are stored in your browser’s localStorage. This password-free prototype does not provide secure authentication.</p>
                  </div>
                </div>

                <div className="gov-help-item">
                  <span className="gov-help-num">2</span>
                  <div>
                    <strong>Institution Portal vs. Officer Portal:</strong>
                    <p>Choose <em>Institution</em> to explore the application workspace or <em>Officer</em> to view the local review queue and run localhost document analysis. Regulatory compliance remains planned for Module 05.</p>
                  </div>
                </div>

                <div className="gov-help-item">
                  <span className="gov-help-num">3</span>
                  <div>
                    <strong>Data Reset &amp; Isolation:</strong>
                    <p>You can create multiple accounts, edit profiles, or clear local data at any time from your Profile page.</p>
                  </div>
                </div>
              </div>

              <div className="gov-dialog-actions">
                <button type="button" className="gov-btn gov-btn-primary" onClick={() => { closeModal(); navigate('/select-role') }}>
                  Select Portal Role
                  <ArrowRight size={16} />
                </button>
                <button type="button" className="gov-btn gov-btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          ) : modalType === 'feedback' ? (
            <div className="gov-dialog-body">
              <div className="gov-dialog-header">
                <span className="gov-dialog-icon">
                  <MessageSquare size={24} />
                </span>
                <div>
                  <h2 id="gov-dialog-title">Evaluator Feedback</h2>
                  <p>Smart India Hackathon 2026 Evaluation Notes</p>
                </div>
              </div>

              <p className="gov-dialog-desc">
                PramaanSetu is designed to fulfill all requirements of Problem Statement <strong>SIH26261</strong>.
                Local sessions, submission, upload, and explainable document analysis are available. Regulatory compliance checks remain planned for Module 05. Feedback submission is not connected.
              </p>

              <div className="gov-dialog-actions">
                <button type="button" className="gov-btn gov-btn-primary" onClick={closeModal}>
                  Acknowledge
                </button>
              </div>
            </div>
          ) : (
            <div className="gov-dialog-body">
              <div className="gov-dialog-header">
                <span className="gov-dialog-icon">
                  <ShieldCheck size={26} />
                </span>
                <div>
                  <span className="gov-dialog-tag">FEATURE INFORMATION</span>
                  <h2 id="gov-dialog-title">{modalTitle}</h2>
                </div>
              </div>

              <p className="gov-dialog-desc">{modalContent}</p>

              <div className="gov-dialog-actions">
                <a
                  className="gov-btn gov-btn-primary"
                  href="#platform-preview"
                  onClick={closeModal}
                >
                  Explore Platform Preview
                  <ArrowRight size={16} />
                </a>
                <button type="button" className="gov-btn gov-btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </div>
  )
}
