import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import pramaanLogo from '../../PramaanSetu Verification Platform Logo.png'

export type LogoVariant =
  | 'header'
  | 'sidebar'
  | 'sidebar-collapsed'
  | 'auth'
  | 'auth-card'
  | 'footer'
  | 'emblem'
  | 'default'

export interface PramaanSetuLogoProps {
  variant?: LogoVariant
  size?: number | string
  className?: string
  alt?: string
  light?: boolean
}

export function PramaanSetuLogo({
  variant = 'default',
  size,
  className = '',
  alt = 'PramaanSetu - AI-Powered Application Validation & Regulatory Compliance',
  light = false,
}: PramaanSetuLogoProps) {
  // Collapsed sidebar / emblem variant: clean CSS crop of the top emblem
  if (variant === 'sidebar-collapsed' || variant === 'emblem') {
    const emblemSize = size ?? (variant === 'sidebar-collapsed' ? 44 : 26)
    return (
      <span
        className={`pramaan-logo-emblem-badge ${variant === 'sidebar-collapsed' ? 'pramaan-logo-sidebar-collapsed' : ''} ${className}`}
        style={size ? { width: emblemSize, height: emblemSize } : undefined}
        title="PramaanSetu"
        aria-label="PramaanSetu emblem"
      >
        <span className="pramaan-logo-emblem">
          <img
            src={pramaanLogo}
            alt={alt}
            className="pramaan-logo-img"
            loading="eager"
            decoding="async"
          />
        </span>
      </span>
    )
  }

  // Sidebar variant: full logo inside a clean white badge card against navy background
  if (variant === 'sidebar') {
    return (
      <span className={`pramaan-logo-sidebar ${className}`} title="PramaanSetu">
        <img
          src={pramaanLogo}
          alt={alt}
          className="pramaan-logo-img"
          loading="eager"
          decoding="async"
          style={size ? { maxWidth: size } : undefined}
        />
      </span>
    )
  }

  // Auth card centered variant
  if (variant === 'auth-card') {
    return (
      <span className={`pramaan-logo-auth-card ${className}`} title="PramaanSetu">
        <img
          src={pramaanLogo}
          alt={alt}
          className="pramaan-logo-img"
          loading="eager"
          decoding="async"
          style={size ? { width: size, height: size } : undefined}
        />
      </span>
    )
  }

  // Footer variant: white rounded badge on dark navy footer
  if (variant === 'footer') {
    return (
      <span className={`pramaan-logo-footer ${className}`} title="PramaanSetu">
        <img
          src={pramaanLogo}
          alt={alt}
          className="pramaan-logo-img"
          loading="eager"
          decoding="async"
          style={size ? { width: size, height: size } : undefined}
        />
      </span>
    )
  }

  // Header / Auth header / Default variant
  const headerSize = size ?? (variant === 'auth' ? 52 : 58)
  return (
    <span
      className={`pramaan-logo-${variant === 'auth' ? 'auth' : 'header'} ${light ? 'pramaan-logo-light' : ''} ${className}`}
      style={size ? { width: headerSize, height: headerSize } : undefined}
      title="PramaanSetu"
    >
      <img
        src={pramaanLogo}
        alt={alt}
        className="pramaan-logo-img"
        loading="eager"
        decoding="async"
        style={size ? { width: headerSize, height: headerSize } : undefined}
      />
    </span>
  )
}

export function Brand({
  light = false,
  variant = 'header',
  to = '/#home',
  className = '',
  showMeta = false,
}: {
  light?: boolean
  variant?: LogoVariant
  to?: string
  className?: string
  showMeta?: boolean
}) {
  return (
    <Link
      to={to}
      className={`gov-brand ${light ? 'gov-brand-light' : ''} gov-brand-${variant} ${className}`}
      aria-label="PramaanSetu Home"
    >
      <PramaanSetuLogo variant={variant} light={light} />
      {showMeta && (
        <div className="gov-brand-meta">
          <div className="gov-brand-title">
            <span>Pramaan</span>
            <span className="gov-brand-accent">Setu</span>
          </div>
          <div className="gov-brand-subtitle">Application &amp; Compliance Verification</div>
        </div>
      )}
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
