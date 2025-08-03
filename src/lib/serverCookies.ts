import { cookies } from 'next/headers'
import { Language } from '@/types/game'

const LANGUAGE_COOKIE_NAME = 'fjordle-language'

/**
 * Get the language from cookies (server-side)
 * Robust implementation with comprehensive error handling for production environments
 */
export function getLanguageFromCookies(): Language {
    // Always default to Norwegian for safety
    const defaultLanguage: Language = 'no'

    try {
        // Check if we're in a server context
        if (typeof window !== 'undefined') {
            console.warn('getLanguageFromCookies called in client context, using default')
            return defaultLanguage
        }

        // Check if cookies() function is available
        if (typeof cookies !== 'function') {
            console.warn('cookies() function not available, using default language')
            return defaultLanguage
        }

        const cookieStore = cookies()

        // Validate cookieStore exists and has required methods
        if (!cookieStore || typeof cookieStore.get !== 'function') {
            console.warn('Invalid cookieStore, using default language')
            return defaultLanguage
        }

        const languageCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)

        // Validate cookie value
        if (languageCookie?.value && (languageCookie.value === 'no' || languageCookie.value === 'en')) {
            console.log('Successfully read language cookie:', languageCookie.value)
            return languageCookie.value as Language
        }

        console.log('No valid language cookie found, using default')
        return defaultLanguage

    } catch (error) {
        // Comprehensive error handling for all edge cases
        console.error('Error reading language cookie:', error)
        console.warn('Falling back to default language due to error')
        return defaultLanguage
    }
} 