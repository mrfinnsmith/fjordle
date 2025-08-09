'use client'

import { useLanguage } from '@/lib/languageContext'
import Link from 'next/link'
import { TranslationKey } from '@/types/game'

interface FAQItem {
    question: TranslationKey
    answer: TranslationKey
}

export default function FAQ() {
    const { t } = useLanguage()

    const faqItems: FAQItem[] = [
        {
            question: 'faq_what_is_fjordle',
            answer: 'faq_what_is_fjordle_answer'
        },
        {
            question: 'faq_arrows_distances',
            answer: 'faq_arrows_distances_answer'
        },
        {
            question: 'faq_proximity_percentage',
            answer: 'faq_proximity_percentage_answer'
        },
        {
            question: 'faq_previous_puzzles',
            answer: 'faq_previous_puzzles_answer'
        },
        {
            question: 'faq_share_results',
            answer: 'faq_share_results_answer'
        },
        {
            question: 'faq_data_source',
            answer: 'faq_data_source_answer'
        }
    ]

    const renderAnswer = (item: FAQItem) => {
        if (item.answer === 'faq_previous_puzzles_answer') {
            const answerText = t('faq_previous_puzzles_answer')
            const linkText = t('past_fjordles').toLowerCase()

            if (answerText.includes('past puzzles page')) {
                return (
                    <>
                        Yes! You can find all previous puzzles on our{' '}
                        <Link href="/past" className="text-blue-600 hover:text-blue-800 underline">
                            {linkText}
                        </Link>
                        {' '}page.
                    </>
                )
            } else {
                return (
                    <>
                        Ja! Du finner alle{' '}
                        <Link href="/past" className="text-blue-600 hover:text-blue-800 underline">
                            {linkText}
                        </Link>
                        {' '}på tidligere puslespill-siden.
                    </>
                )
            }
        }

        if (item.answer === 'faq_data_source_answer') {
            return (
                <>
                    {t('faq_data_source_answer').split('Fjordkatalogen')[0]}
                    <a
                        href="https://kartkatalog.miljodirektoratet.no/Dataset/Details/501"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Fjordkatalogen
                    </a>
                    {t('faq_data_source_answer').split('Fjordkatalogen')[1]}
                </>
            )
        }

        return t(item.answer)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {t('faq_title')}
                    </h1>
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        ← {t('back_to_today')}
                    </Link>
                </div>

                <div className="space-y-6">
                    {faqItems.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">
                                {t(item.question)}
                            </h2>
                            <div className="text-gray-700 leading-relaxed">
                                {renderAnswer(item)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}