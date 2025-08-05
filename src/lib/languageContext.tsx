'use client'

import { createContext, useContext, ReactNode, useState } from 'react'
import { Language, TranslationKey } from '@/types/game'
import { translations } from './translations'
import { setLanguageCookie } from './cookies'

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
    }

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