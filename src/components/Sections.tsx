import { useState } from 'react'
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Scale,
  ChevronDown,
  Info,
  ChevronRight,
  Bell,
  Mail,
  HelpCircle,
} from 'lucide-react'
import {
  fourSteps,
  institutionalBenefits,
  platformServices,
  platformUpdates,
  quickAccessCards,
  faqs,
} from '../data/content'
import { Brand, SectionHeading, StartButton } from './Shared'
import { Reveal } from './Reveal'
import Dashboard from './Dashboard'
import HeroCarousel from './HeroCarousel'
import { Link } from 'react-router-dom'

export function HeroSection({
  open,
}: {
  open: () => void
}) {
  return (
    <section id="home" className="gov-hero-section">
      <HeroCarousel>
        <div className="gov-container gov-hero-layout">
          <Reveal className="gov-hero-copy">
          <div className="gov-sih-badge">
            <span className="gov-tricolor-dot" />
            <span>SMART INDIA HACKATHON 2026 · PROBLEM SIH26261</span>
          </div>

          <h1 className="gov-hero-heading">
            Smarter Application Verification.
            <br />
            <span className="gov-hero-subheading">Stronger Regulatory Compliance.</span>
          </h1>

          <p className="gov-hero-description">
            Explore the planned workflow for application validation, document review and compliance checks.
          </p>

          <div className="gov-hero-actions">
            <StartButton onClick={open} label="Access Portal" />
            <a className="gov-btn gov-btn-secondary-hero" href="#services">
              <span>Explore Services</span>
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="gov-hero-trust-bar">
            <div className="gov-trust-pill">
              <ShieldCheck size={16} />
              <span>Document Integrity Checks (Planned)</span>
            </div>
            <div className="gov-trust-pill">
              <Scale size={16} />
              <span>Rule-Based Compliance Checks (Planned)</span>
            </div>
            <div className="gov-trust-pill">
              <CheckCircle2 size={16} />
              <span>Human-in-the-Loop Scrutiny</span>
            </div>
          </div>
          </Reveal>
        </div>
      </HeroCarousel>
    </section>
  )
}

export function QuickAccessSection({
  onSelectAction,
}: {
  onSelectAction: (name: string, link?: string) => void
}) {
  return (
    <section className="gov-quick-access-section" aria-label="Quick Access Services">
      <div className="gov-container">
        <div className="gov-quick-access-banner">
          <div className="gov-quick-access-label">
            <span className="gov-quick-accent" />
            <strong>QUICK ACCESS SERVICES</strong>
            <span>Direct institutional and regulatory shortcuts</span>
          </div>
        </div>

        <div className="gov-quick-grid">
          {quickAccessCards.map(card => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                className="gov-quick-card"
                onClick={() => onSelectAction(card.title, 'link' in card ? card.link : undefined)}
              >
                <div className="gov-quick-card-top">
                  <div className="gov-quick-icon">
                    <Icon size={22} />
                  </div>
                  <span className="gov-quick-badge">{card.badge}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="gov-quick-arrow">
                  <span>Open Service</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function PlatformUpdatesSection() {
  return (
    <section id="updates" className="gov-section gov-updates-section">
      <div className="gov-container">
        <div className="gov-notice-board">
          <div className="gov-notice-header">
            <div className="gov-notice-title">
              <Bell size={18} />
              <h2>Platform Updates</h2>
            </div>
            <span className="gov-notice-sub">Project milestones and deployment schedule for SIH 2026</span>
          </div>

          <div className="gov-notice-list">
            {platformUpdates.map(update => (
              <div key={update.title} className="gov-notice-item">
                <div className="gov-notice-meta">
                  <span className="gov-notice-date">{update.date}</span>
                  <span className={`gov-notice-tag ${update.tag.toLowerCase().replace(' ', '-')}`}>
                    {update.tag}
                  </span>
                </div>
                <div className="gov-notice-body">
                  <h3>{update.title}</h3>
                  <p>{update.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeaturesSection({
  onSelectService,
}: {
  onSelectService: (service: string) => void
}) {
  return (
    <section id="services" className="gov-section gov-services-section">
      <div className="gov-container">
        <Reveal>
          <SectionHeading
            eyebrow="REGULATORY CAPABILITIES"
            title="Our Services"
            text="Comprehensive digital verification services designed for institutional transparency and regulatory scrutiny."
          />
        </Reveal>

        <div className="gov-services-grid">
          {platformServices.map(service => {
            const Icon = service.icon
            return (
              <Reveal key={service.id} className="gov-service-card">
                <div className="gov-service-top">
                  <div className="gov-service-icon">
                    <Icon size={24} />
                  </div>
                  <span className="gov-service-status-pill">{service.status}</span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <button
                  type="button"
                  className="gov-service-action-btn"
                  onClick={() => onSelectService(service.title)}
                >
                  <span>Learn about {service.title}</span>
                  <ArrowRight size={14} />
                </button>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="gov-section gov-how-it-works-section">
      <div className="gov-container">
        <Reveal>
          <SectionHeading
            eyebrow="WORKFLOW TIMELINE"
            title="How It Works"
            text="A structured four-step regulatory verification lifecycle with complete audit traceability."
          />
        </Reveal>

        <div className="gov-steps-timeline">
          {fourSteps.map((item, index) => {
            const Icon = item.icon
            return (
              <Reveal key={item.step} className="gov-timeline-step">
                <div className="gov-step-number-pill">{item.step}</div>
                <div className="gov-step-card">
                  <div className="gov-step-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="gov-step-detail-tag">{item.detail}</span>
                </div>
                {index < fourSteps.length - 1 && <div className="gov-step-connector" />}
              </Reveal>
            )
          })}
        </div>

        <div className="gov-workflow-disclaimer">
          <Info size={16} />
          <p>
            <strong>Note on Prototype Scope:</strong> Application submission and document upload are available in Module 03.
            Local document analysis (Module 04) is available; regulatory compliance evaluation (Module 05) remains planned. Final
            approvals remain strictly with authorized human officers.
          </p>
        </div>
      </div>
    </section>
  )
}

export function InstitutionalInfoSection() {
  return (
    <section id="about" className="gov-section gov-info-section">
      <div className="gov-container">
        <Reveal>
          <SectionHeading
            eyebrow="INSTITUTIONAL INTEGRITY"
            title="Built for Transparent Verification"
            text="Designed to address complex institutional approval verification without creating black-box decisions."
          />
        </Reveal>

        <div className="gov-benefits-grid">
          {institutionalBenefits.map(item => {
            const Icon = item.icon
            return (
              <Reveal key={item.title} className="gov-benefit-card">
                <div className="gov-benefit-icon">
                  <Icon size={26} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Reveal>
            )
          })}
        </div>

        <div className="gov-sih-box">
          <div className="gov-sih-box-header">
            <Building2 size={20} />
            <div>
              <h3>Smart India Hackathon 2026 · Problem Statement SIH26261</h3>
              <p>AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification</p>
            </div>
          </div>
          <div className="gov-sih-box-content">
            <p>
              PramaanSetu is an independent student innovation prototype developed for Smart India Hackathon 2026. It
              bridges the operational gap between technical institutes submitting annual extension dossiers and regulatory
              scrutiny officers evaluating statutory compliance.
            </p>
            <div className="gov-sih-tags">
              <span>Local Prototype Session</span>
              <span>Zero-Password Architecture</span>
              <span>Document Analysis · Available Module 04</span>
              <span>Compliance Reports · Planned Module 05</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PlatformPreviewSection() {
  return (
    <section id="platform-preview" className="gov-section gov-preview-section">
      <div className="gov-container">
        <Reveal>
          <SectionHeading
            eyebrow="SCRUTINY WORKBENCH"
            title="Platform Preview"
            text="An illustrative overview of the officer review console and institutional compliance checks."
          />
          <Dashboard />
          <p className="gov-preview-disclaimer">
            Illustrative design preview. Application submission and officer-triggered local document analysis are available; compliance evaluation (Module 05) remains planned.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faqs" className="gov-section gov-faq-section">
      <div className="gov-container">
        <Reveal>
          <SectionHeading
            eyebrow="COMMON QUESTIONS"
            title="Frequently Asked Questions"
            text="Key details regarding the PramaanSetu prototype, local storage model, and regulatory architecture."
          />
        </Reveal>

        <div className="gov-faq-accordion">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.q} className={`gov-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="gov-faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`gov-faq-chevron ${isOpen ? 'rotate' : ''}`} />
                </button>
                {isOpen && (
                  <div className="gov-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ContactSection({ onOpenFeedback }: { onOpenFeedback: () => void }) {
  return (
    <section id="contact" className="gov-section gov-contact-section">
      <div className="gov-container">
        <div className="gov-contact-card">
          <div className="gov-contact-left">
            <span className="gov-eyebrow">PROJECT INQUIRIES</span>
            <h2>Smart India Hackathon Prototype Support</h2>
            <p>
              For inquiries, evaluation feedback or technical reviews regarding Problem Statement SIH26261, reach out
              through our prototype feedback channel.
            </p>
            <div className="gov-contact-details">
              <div className="gov-contact-item">
                <Mail size={16} />
                <span>prototype-feedback@pramaansetu.internal</span>
              </div>
              <div className="gov-contact-item">
                <HelpCircle size={16} />
                <span>SIH 2026 Evaluation Portal · Prototype Helpdesk</span>
              </div>
            </div>
          </div>

          <div className="gov-contact-right">
            <button type="button" className="gov-btn gov-btn-primary" onClick={onOpenFeedback}>
              <span>Submit Evaluator Feedback</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CTASection({ open }: { open: () => void }) {
  return (
    <section className="gov-cta-section">
      <div className="gov-container">
        <div className="gov-cta-card">
          <div className="gov-cta-content">
            <div className="gov-cta-badge">
              <ShieldCheck size={16} />
              <span>TEST WORKSPACE READY</span>
            </div>
            <h2>Explore PramaanSetu Workspaces</h2>
            <p>
              Create a persistent local workspace as an Institution or Review Officer to experience the complete
              application dashboard.
            </p>
            <div className="gov-cta-actions">
              <StartButton onClick={open} label="Access Portal" />
              <a href="#platform-preview" className="gov-btn gov-btn-secondary">
                <span>View Scrutiny Workbench</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer({
  open,
}: {
  open: (name: string) => void
}) {
  return (
    <footer className="gov-footer" role="contentinfo">
      {/* Top Footer with navigation */}
      <div className="gov-footer-main">
        <div className="gov-container gov-footer-grid">
          {/* Brand Col */}
          <div className="gov-footer-brand-col">
            <Brand light />
            <p className="gov-footer-tagline">
              AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification.
            </p>
            <div className="gov-footer-sih-tag">
              <span>SMART INDIA HACKATHON 2026</span>
              <strong>PROBLEM STATEMENT: SIH26261</strong>
            </div>
          </div>

          {/* Quick Links */}
          <div className="gov-footer-nav-col">
            <h3>Portal Navigation</h3>
            <ul>
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#about">About Platform</a>
              </li>
              <li>
                <a href="#services">Verification Services</a>
              </li>
              <li>
                <a href="#how-it-works">How It Works</a>
              </li>
              <li>
                <a href="#updates">Platform Updates</a>
              </li>
            </ul>
          </div>

          {/* Verification Resources */}
          <div className="gov-footer-nav-col">
            <h3>Verification Services</h3>
            <ul>
              <li>
                <button type="button" onClick={() => open('Application Validation')}>
                  Application Validation
                </button>
              </li>
              <li>
                <button type="button" onClick={() => open('Document Authentication')}>
                  Document Authentication
                </button>
              </li>
              <li>
                <button type="button" onClick={() => open('Regulatory Compliance')}>
                  Regulatory Compliance
                </button>
              </li>
              <li>
                <button type="button" onClick={() => open('Verification Reports')}>
                  Verification Reports
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="gov-footer-nav-col">
            <h3>Resources &amp; Support</h3>
            <ul>
              <li>
                <a href="#faqs">Frequently Asked Questions</a>
              </li>
              <li>
                <a href="#contact">Contact &amp; Feedback</a>
              </li>
              <li>
                <Link to="/select-role">Choose Portal Role</Link>
              </li>
              <li>
                <Link to="/login">Local Workspace Login</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Official Disclaimer Strip */}
      <div className="gov-footer-disclaimer-strip">
        <div className="gov-container">
          <p className="gov-disclaimer-text">
            <strong>DISCLAIMER:</strong> Independent Smart India Hackathon 2026 prototype. Not an official Government of
            India or AICTE portal. Does not provide official statutory approvals or legal clearances.
          </p>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="gov-footer-bottom">
        <div className="gov-container gov-footer-bottom-inner">
          <span>&copy; 2026 PramaanSetu · Problem Statement SIH26261 · Prototype Version 0.2.1</span>
          <div className="gov-footer-bottom-links">
            <button type="button" onClick={() => open('Privacy Statement')}>
              Privacy Notice
            </button>
            <span className="gov-footer-bullet">&bull;</span>
            <button type="button" onClick={() => open('Terms of Prototype')}>
              Terms of Use
            </button>
            <span className="gov-footer-bullet">&bull;</span>
            <button type="button" onClick={() => open('Accessibility Statement')}>
              Accessibility
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
