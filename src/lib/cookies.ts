import { Language } from '@/types/game'

const LANGUAGE_COOKIE_NAME = 'fjordle-language'

/**
 * Get the language from cookies (client-side)
 */
export function getLanguageFromCookiesClient(): Language {
  console.log('[DEBUG] getLanguageFromCookiesClient called')
  console.log('[DEBUG] typeof document:', typeof document)
  console.log('[DEBUG] document.cookie:', document?.cookie)

  if (typeof document === 'undefined') {
    console.log('[DEBUG] Document undefined, returning default no')
    return 'no'
  }

  const cookies = document.cookie.split(';')
  console.log('[DEBUG] Parsed cookies:', cookies)

  const languageCookie = cookies.find(cookie =>
    cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`)
  )

  if (languageCookie) {
    const value = languageCookie.split('=')[1]?.trim()
    console.log('[DEBUG] Found language cookie value:', value)
    if (value === 'no' || value === 'en') {
      const lang = value as Language
      console.log('[DEBUG] Valid language cookie found:', lang)
      return lang
    }
  }

  console.log('[DEBUG] No valid language cookie found, returning default no')
  return 'no' // Default to Norwegian
}

/**
 * Set the language cookie (client-side)
 */
export function setLanguageCookie(language: Language): void {
  console.log('[DEBUG] setLanguageCookie called with:', language)

  if (typeof document === 'undefined') {
    console.log('[DEBUG] Document undefined, cannot set cookie')
    return
  }

  // Set cookie to expire in 1 year
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  const cookieValue = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  console.log('[DEBUG] Setting cookie:', cookieValue)
  document.cookie = cookieValue
  console.log('[DEBUG] Cookie set, document.cookie now:', document.cookie)
} 