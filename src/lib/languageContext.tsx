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

    console.log('[DEBUG] LanguageProvider render - mounted:', mounted)
    console.log('[DEBUG] LanguageProvider render - language:', language)

    useEffect(() => {
        console.log('[DEBUG] LanguageProvider useEffect - reading language from cookies')
        const savedLanguage = getLanguageFromCookiesClient()
        console.log('[DEBUG] Saved language from cookies:', savedLanguage)
        setLanguageState(savedLanguage)
        setMounted(true)
        console.log('[DEBUG] LanguageProvider mounted with language:', savedLanguage)
    }, [])

    const setLanguage = (lang: Language) => {
        console.log('[DEBUG] setLanguage called with:', lang)
        setLanguageState(lang)
        setLanguageCookie(lang)
        console.log('[DEBUG] Language updated to:', lang)
    }

    const t = (key: TranslationKey): string => {
        const translation = translations[language]?.[key] || translations.en[key]

        if (!translation) {
            console.warn(`Missing translation for key: "${key}" in language: "${language}"`)
            return key
        }

        return translation
    }

    console.log('[DEBUG] LanguageProvider providing context:', { language, setLanguage: '(function)', t: '(function)', mounted })

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