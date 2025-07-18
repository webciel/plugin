import { Logger } from '#framework/logger'

const logger = new Logger('locale')

export interface Locale {
  [key: string]: string | Locale
}

let registeredLocales: Record<string, Locale> = {}
let fallbackLocale: string = 'en'

/**
 * Register supported locales from the host project.
 */
export function registerLocales(locales: Record<string, Locale>, fallback: string = 'en'): void {
  registeredLocales = locales
  fallbackLocale = fallback
  logger.log('registerLocales', Object.keys(locales), 'Fallback:', fallback)
}

/**
 * Detects the best-matching browser language, or falls back to default.
 */
export function getLocale(): string {
  const raw = chrome.i18n.getUILanguage?.() || fallbackLocale
  const lang = raw.split('-')[0]
  return registeredLocales[lang] ? lang : fallbackLocale
}

/**
 * Gets the translation object for the active language.
 */
export function useLocale(): Locale {
  const locale = getLocale()
  return registeredLocales[locale] || {}
}

export function getNestedValue(locale: Locale, key: string): string | undefined {
  const parts = key.split('.')

  let current: unknown = locale

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Locale)[part]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}


/**
 * Replace all {{ locale.key }} placeholders in HTML with translations.
 */
export function applyTranslations(html: string): string {
  const intl = useLocale()
  return html.replace(/{{\s*locale\.([\w\d_.]+)\s*}}/g, (_, key) => {
    const value = getNestedValue(intl, key)
    if (typeof value === 'string') return value
    logger.warn('registerLocales', `Missing translation: locale.${key}`)
    return `locale.${key}`
  })
}
