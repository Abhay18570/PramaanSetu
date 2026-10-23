import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PramaanSetuLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pramaan-logo-svg"
      aria-hidden="true"
    >
      {/* Outer shield frame */}
      <rect x="2" y="2" width="40" height="40" rx="9" fill="#061D45" stroke="#0B4F92" strokeWidth="1.5" />
      {/* Saffron accent bar */}
      <path d="M6 7.5C6 5.567 7.567 4 9.5 4H34.5C36.433 4 38 5.567 38 7.5V9.5H6V7.5Z" fill="#F4A900" />
      {/* Bridge Arches (Setu) */}
      <path d="M8 33C12.5 24 17.5 24 22 33C26.5 24 31.5 24 36 33" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      {/* Central Spire */}
      <path d="M22 13V26" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      {/* Verification Shield Emblem */}
      <circle cx="22" cy="18" r="5" fill="#0B4F92" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M19.8 18L21.3 19.5L24.2 16.5" stroke="#F4A900" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/#home" className={`gov-brand ${light ? 'gov-brand-light' : ''}`} aria-label="PramaanSetu Home">
      <PramaanSetuLogo size={38} />
      <div className="gov-brand-meta">
        <div className="gov-brand-title">
          <span>Pramaan</span>
          <span className="gov-brand-accent">Setu</span>
        </div>
        <div className="gov-brand-subtitle">Application &amp; Compliance Verification</div>
      </div>
    </Link>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  centered = true,
}: {
  eyebrow?: string
  title: string
  text?: string
  centered?: boolean
}) {
  return (
    <div className={`gov-section-heading ${centered ? 'gov-text-center' : ''}`}>
      {eyebrow && <span className="gov-eyebrow">{eyebrow}</span>}
      <h2 className="gov-section-title">{title}</h2>
      <div className={`gov-heading-bar ${centered ? 'gov-bar-centered' : ''}`} />
      {text && <p className="gov-section-subtitle">{text}</p>}
    </div>
  )
}

export function StartButton({
  onClick,
  label = 'Access Portal',
  className = '',
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <button className={`gov-btn gov-btn-primary ${className}`} onClick={onClick}>
      <span>{label}</span>
      <ArrowRight size={16} />
    </button>
  )
}
