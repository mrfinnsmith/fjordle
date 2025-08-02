'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language } from '@/types/game'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
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

    const t = (key: string): string => {
        const translations = {
            no: {
                'past_fjordles': 'Tidligere Fjordle',
                'about': 'Om',
                'how_to_play': 'Hvordan spille',
                'privacy': 'Personvern',
                'guesses': 'GJETNINGER',
                'enter_fjord_name': 'Skriv inn fjordnavn...',
                'loading': 'Laster...',
                'congratulations': 'Gratulerer!',
                'next_time': 'Neste gang!',
                'the_answer_was': 'Svaret var:',
                'played': 'Spilt',
                'win_percent': 'Vinn %',
                'current_streak': 'Nåværende rekke',
                'max_streak': 'Maks rekke',
                'share_results': 'Del resultatet ditt',
                'copied': 'Kopiert!',
                'site_title': 'Fjordle - Daglig fjordpuslespill',
                'site_description': 'Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder.',
                'site_keywords': 'fjordpuslespill, norge geografi, daglig puslespill, norske fjorder, puslespill, geografi, fjordle'
            },
            en: {
                'past_fjordles': 'Past Fjordles',
                'about': 'About',
                'how_to_play': 'How to Play',
                'privacy': 'Privacy',
                'guesses': 'GUESSES',
                'enter_fjord_name': 'Enter fjord name...',
                'loading': 'Loading...',
                'congratulations': 'Congratulations!',
                'next_time': 'Next Time!',
                'the_answer_was': 'The answer was:',
                'played': 'Played',
                'win_percent': 'Win %',
                'current_streak': 'Current Streak',
                'max_streak': 'Max Streak',
                'share_results': 'Share Your Results',
                'copied': 'Copied!',
                'site_title': 'Fjordle - Daily Norwegian Fjord Puzzle',
                'site_description': 'Daily Norwegian fjord puzzle game. Guess the fjord from its distinctive outline shape. New puzzle every day featuring Norwegian geography.',
                'site_keywords': 'fjord puzzle, norway geography, daily puzzle, fjord game, norwegian fjords, puzzle, game, geography, fjordle'
            }
        }

        return (translations[language] as Record<string, string>)?.[key] || (translations.en as Record<string, string>)[key] || key
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