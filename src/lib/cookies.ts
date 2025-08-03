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
 * Set the language cookie (client-side)
 */
export function setLanguageCookie(language: Language): void {
  if (typeof document === 'undefined') {
    return
  }

  // Set cookie to expire in 1 year
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
} 