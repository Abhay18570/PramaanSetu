import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { messages, type Language } from './catalog'
import { currentLanguage } from '.'

const originals = new WeakMap<Node, string>()
const attributes = ['aria-label', 'title', 'placeholder'] as const
const sourceToKey = new Map<string, string>(Object.entries(messages).map(([key, value]) => [value.en, key]))

function localizeText(value: string, language: Language) {
  const leading = value.match(/^\s*/)?.[0] ?? ''
  const trailing = value.match(/\s*$/)?.[0] ?? ''
  const source = value.trim()
  const key = sourceToKey.get(source)
  return key ? `${leading}${messages[key as keyof typeof messages][language]}${trailing}` : value
}

function localize(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const parent = node.parentElement
    if (parent && !parent.closest('[data-i18n-ignore]') && !['SCRIPT', 'STYLE'].includes(parent.tagName)) {
      const source = originals.get(node) ?? node.textContent ?? ''
      if (!originals.has(node)) originals.set(node, source)
      const next = localizeText(source, language)
      if (node.textContent !== next) node.textContent = next
    }
    node = walker.nextNode()
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll<HTMLElement>('*')] : [...root.querySelectorAll<HTMLElement>('*')]
  for (const element of elements) for (const attribute of attributes) {
    const current = element.getAttribute(attribute)
    if (!current || element.closest('[data-i18n-ignore]')) continue
    const marker = `data-i18n-original-${attribute}`
    const source = element.getAttribute(marker) ?? current
    if (!element.hasAttribute(marker)) element.setAttribute(marker, source)
    element.setAttribute(attribute, localizeText(source, language))
  }
}

export default function DocumentLocalizer() {
  const { i18n } = useTranslation()
  useEffect(() => {
    const language = currentLanguage()
    document.documentElement.lang = language
    document.documentElement.dataset.language = language
    localize(document.body, language)
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.parentNode) localize(node.parentNode, language)
        else if (node instanceof Element) localize(node, language)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [i18n.resolvedLanguage])
  return null
}
