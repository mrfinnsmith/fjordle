import { cookies } from 'next/headers'
import { Language } from '@/types/game'

const LANGUAGE_COOKIE_NAME = 'fjordle-language'

/**
 * Get the language from cookies (server-side)
 */
export function getLanguageFromCookies(): Language {
    try {
        const cookieStore = cookies()
        const languageCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)

        if (languageCookie?.value && (languageCookie.value === 'no' || languageCookie.value === 'en')) {
            return languageCookie.value as Language
        }
    } catch (error) {
        // Fallback if cookies() is not available (e.g., during build)
        console.warn('Could not read cookies:', error)
    }

    return 'no' // Default to Norwegian
} 