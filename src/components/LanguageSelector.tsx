import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { changeLanguage, currentLanguage, supportedLanguages } from '../i18n'

const names = { en: 'English', hi: 'हिंदी', mr: 'मराठी' } as const

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <label className={`language-selector${compact ? ' language-selector-compact' : ''}`}>
      <Languages size={14} aria-hidden="true" />
      {!compact && <span>{t('language')}</span>}
      <select
        aria-label={t('language')}
        value={currentLanguage()}
        onChange={event => void changeLanguage(event.target.value as typeof supportedLanguages[number])}
      >
        {supportedLanguages.map(language => <option key={language} value={language}>{names[language]}</option>)}
      </select>
    </label>
  )
}
