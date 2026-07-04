'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { Language, TranslationKey } from '@/types/game'
import { translations } from './translations'
import { setLanguageCookie, hasLanguageCookieClient } from './cookies'
import { shouldAutoSwitchToEnglish } from './localeDetection'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
    children: ReactNode
    initialLanguage: Language
}

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>(initialLanguage)

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        setLanguageCookie(lang)
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang
        }
    }

    // First-visit only: show the existing English UI to non-Norwegian visitors so
    // they never fall back on the browser's bad machine translation of Norwegian.
    // Runs after hydration, so crawlers and the first server render stay Norwegian.
    useEffect(() => {
        if (hasLanguageCookieClient()) {
            return
        }

        const locales = navigator.languages?.length
            ? navigator.languages
            : [navigator.language].filter(Boolean)

        if (shouldAutoSwitchToEnglish({
            hasCookie: false,
            userAgent: navigator.userAgent,
            locales,
        })) {
            setLanguage('en')
        }
    }, [])

    const t = (key: TranslationKey): string => {
        const translation = translations[language]?.[key] || translations.en[key]

        if (!translation) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Missing translation for key: "${key}" in language: "${language}"`)
            }
            return key
        }

        return translation
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}