import { Language } from '@/types/game'

const LANGUAGE_COOKIE_NAME = 'fjordle-language'

/**
 * Get the language from cookies (client-side)
 */
export function getLanguageFromCookiesClient(): Language {
  if (typeof document === 'undefined') {
    return 'no'
  }

  const cookies = document.cookie.split(';')
  const languageCookie = cookies.find(cookie =>
    cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`)
  )

  if (languageCookie) {
    const value = languageCookie.split('=')[1]?.trim()
    if (value === 'no' || value === 'en') {
      return value as Language
    }
  }

  return 'no' // Default to Norwegian
}

/**
 * Whether a language cookie is present (client-side).
 *
 * Distinct from getLanguageFromCookiesClient(), which returns 'no' both when the
 * cookie is absent and when it explicitly says 'no'. Detecting presence lets us
 * tell a first-time visitor apart from someone who deliberately chose Norwegian.
 */
export function hasLanguageCookieClient(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  return document.cookie
    .split(';')
    .some(cookie => {
      const value = cookie.trim().split('=')[1]?.trim()
      return cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`) &&
        (value === 'no' || value === 'en')
    })
}

/**
 * Set the language cookie (client-side)
 */
export function setLanguageCookie(language: Language): void {
  if (typeof document === 'undefined') {
    return
  }

  // Set cookie to expire in 1 year
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  const cookieValue = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  document.cookie = cookieValue
} 