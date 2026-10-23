import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './HeroCarousel.css'

const heroSlides = [
  {
    id: 'document-verification',
    image: '/assets/carousel/document-verification.webp',
  },
  {
    id: 'higher-education',
    image: '/assets/carousel/higher-education.webp',
  },
  {
    id: 'document-analysis',
    image: '/assets/carousel/document-analysis.webp',
  },
  {
    id: 'compliance-review',
    image: '/assets/carousel/compliance-review.webp',
  },
  {
    id: 'digital-governance',
    image: '/assets/carousel/digital-governance.webp',
  },
] as const

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

export default function HeroCarousel({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(() => new Set())
  const reducedMotion = useReducedMotion()
  const paused = hovered || focusInside || reducedMotion
  const last = heroSlides.length - 1

  const previous = useCallback(() => setCurrent(index => (index === 0 ? last : index - 1)), [last])
  const next = useCallback(() => setCurrent(index => (index === last ? 0 : index + 1)), [last])

  useEffect(() => {
    if (paused) return
    const interval = window.setInterval(next, 4500)
    return () => window.clearInterval(interval)
  }, [next, paused])

  return (
    <div
      className={`hero-carousel${reducedMotion ? ' hero-carousel-reduced-motion' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="PramaanSetu platform highlights"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false)
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          previous()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          next()
        }
      }}
    >
      <div className="hero-carousel-viewport" aria-hidden="true">
        {heroSlides.map((slide, index) => {
          const active = index === current
          const failed = failedImages.has(slide.id)
          return (
            <div
              key={slide.id}
              className={`hero-carousel-slide${active ? ' is-active' : ''}`}
            >
              {!failed ? (
                <img
                  src={slide.image}
                  alt=""
                  width="1280"
                  height="720"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  onError={() =>
                    setFailedImages(existing => {
                      const nextFailures = new Set(existing)
                      nextFailures.add(slide.id)
                      return nextFailures
                    })
                  }
                />
              ) : (
                <div className="hero-carousel-fallback" />
              )}
            </div>
          )
        })}
      </div>

      <div className="hero-carousel-overlay" aria-hidden="true" />
      <div className="hero-carousel-content">{children}</div>

      <button type="button" className="hero-carousel-arrow hero-carousel-previous" aria-label="Previous slide" onClick={previous}>
        <ChevronLeft size={22} />
      </button>
      <button type="button" className="hero-carousel-arrow hero-carousel-next" aria-label="Next slide" onClick={next}>
        <ChevronRight size={22} />
      </button>

      <div className="hero-carousel-pagination" aria-label="Choose a background image">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === current ? 'is-active' : ''}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === current ? 'true' : undefined}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  )
}
