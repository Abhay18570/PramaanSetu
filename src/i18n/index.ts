import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { messages, type Language, type MessageKey } from './catalog'

export const LANGUAGE_KEY = 'pramaansetu_language'
export const supportedLanguages = ['en', 'hi', 'mr'] as const
export const languageLocales: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' }

export function normalizeLanguage(value: unknown): Language {
  return typeof value === 'string' && supportedLanguages.includes(value as Language) ? value as Language : 'en'
}

const initialLanguage = normalizeLanguage(typeof window === 'undefined' ? 'en' : localStorage.getItem(LANGUAGE_KEY))
if (typeof window !== 'undefined' && localStorage.getItem(LANGUAGE_KEY) && localStorage.getItem(LANGUAGE_KEY) !== initialLanguage) {
  localStorage.setItem(LANGUAGE_KEY, initialLanguage)
}
const resources = Object.fromEntries(supportedLanguages.map(language => [language, {
  translation: Object.fromEntries(Object.entries(messages).map(([key, value]) => [key, value[language]])),
}]))

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  keySeparator: false,
  supportedLngs: [...supportedLanguages],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export async function changeLanguage(language: Language) {
  localStorage.setItem(LANGUAGE_KEY, language)
  await i18n.changeLanguage(language)
}

export function currentLanguage(): Language {
  return normalizeLanguage(i18n.resolvedLanguage || i18n.language)
}

export function translate(key: MessageKey) {
  return i18n.t(key)
}

export function formatDate(value: string | number | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(languageLocales[currentLanguage()], options ?? { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(languageLocales[currentLanguage()], options).format(value)
}

export default i18n
