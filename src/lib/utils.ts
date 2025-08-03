import { Language } from '@/types/game'

/**
 * Format a date according to the specified language
 * @param date - The date to format
 * @param language - The language to use for formatting
 * @param options - Additional formatting options
 * @returns Formatted date string
 */
export const formatDate = (
    date: Date,
    language: Language,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
): string => {
    // Only format on client-side to prevent hydration mismatch
    if (typeof window === 'undefined') {
        return date.toISOString().split('T')[0] // Safe server fallback: YYYY-MM-DD
    }
    
    const locale = language === 'no' ? 'no-NO' : 'en-US'
    const defaultOptions = {
        timeZone: 'Europe/Oslo', // Consistent timezone
        ...options
    }
    
    return date.toLocaleDateString(locale, defaultOptions)
}

/**
 * Format a number according to the specified language
 * @param number - The number to format
 * @param language - The language to use for formatting
 * @returns Formatted number string
 */
export const formatNumber = (number: number, language: Language): string => {
    // Only format on client-side to prevent hydration mismatch
    if (typeof window === 'undefined') {
        return number.toString() // Safe server fallback
    }
    
    const locale = language === 'no' ? 'no-NO' : 'en-US'
    return number.toLocaleString(locale)
} 