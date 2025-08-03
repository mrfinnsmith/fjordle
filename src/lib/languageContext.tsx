'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, TranslationKey } from '@/types/game'
import { translations } from './translations'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('no')

    useEffect(() => {
        const saved = localStorage.getItem('fjordle-language') as Language
        if (saved && (saved === 'no' || saved === 'en')) {
            setLanguageState(saved)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('fjordle-language', lang)
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