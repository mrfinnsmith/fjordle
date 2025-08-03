'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, TranslationKey } from '@/types/game'
import { translations } from './translations'
import { getLanguageFromCookiesClient, setLanguageCookie } from './cookies'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
    children: ReactNode
    initialLanguage?: Language
}

export function LanguageProvider({ children, initialLanguage = 'no' }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>(initialLanguage)

    useEffect(() => {
        // On client-side, read from cookies and update if different from initial
        const cookieLanguage = getLanguageFromCookiesClient()
        if (cookieLanguage !== initialLanguage) {
            setLanguageState(cookieLanguage)
        }
    }, [initialLanguage])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        setLanguageCookie(lang)
    }

    const t = (key: TranslationKey): string => {
        const translation = translations[language]?.[key] || translations.en[key]

        if (!translation) {
            console.warn(`Missing translation for key: "${key}" in language: "${language}"`)
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