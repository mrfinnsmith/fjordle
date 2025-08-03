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
    const locale = language === 'no' ? 'no-NO' : 'en-US'
    return date.toLocaleDateString(locale, options)
}

/**
 * Format a number according to the specified language
 * @param number - The number to format
 * @param language - The language to use for formatting
 * @returns Formatted number string
 */
export const formatNumber = (number: number, language: Language): string => {
    const locale = language === 'no' ? 'no-NO' : 'en-US'
    return number.toLocaleString(locale)
} 