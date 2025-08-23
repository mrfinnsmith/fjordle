import { cookies } from 'next/headers'
import { Language } from '@/types/game'

const LANGUAGE_COOKIE_NAME = 'fjordle-language'

export function getLanguageFromCookies(): Language {
    const defaultLanguage: Language = 'no'

    try {
        // We're in a server context, proceed to read cookies

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