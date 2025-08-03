'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, TranslationKey } from '@/types/game'
import { translations } from './translations'
import { getLanguageFromCookiesClient, setLanguageCookie } from './cookies'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
    mounted: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
    children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [mounted, setMounted] = useState(false)
    const [language, setLanguageState] = useState<Language>('no') // Safe default

    useEffect(() => {
        // Read language preference from cookies after hydration
        const savedLanguage = getLanguageFromCookiesClient()
        setLanguageState(savedLanguage)
        setMounted(true)
    }, [])

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
        <LanguageContext.Provider value={{ language, setLanguage, t, mounted }}>
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