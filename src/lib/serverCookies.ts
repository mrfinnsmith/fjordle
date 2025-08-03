import { cookies } from 'next/headers'
import { Language } from '@/types/game'

const LANGUAGE_COOKIE_NAME = 'fjordle-language'

export function getLanguageFromCookies(): Language {
    const defaultLanguage: Language = 'no'

    try {
        // Check if we're in a server context
        if (typeof window !== 'undefined') {
            return defaultLanguage
        }

        const cookieStore = cookies()
        const languageCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)

        if (languageCookie?.value && (languageCookie.value === 'no' || languageCookie.value === 'en')) {
            return languageCookie.value as Language
        }

        return defaultLanguage
    } catch {
        return defaultLanguage
    }
} 