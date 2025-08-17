'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/languageContext'
import { TranslationKey } from '@/types/game'

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
}

interface OnboardingStep {
    titleKey: TranslationKey
    textKey: TranslationKey
}

const steps: OnboardingStep[] = [
    {
        titleKey: 'onboarding_step1_title',
        textKey: 'onboarding_step1_text'
    },
    {
        titleKey: 'onboarding_step2_title',
        textKey: 'onboarding_step2_text'
    },
    {
        titleKey: 'onboarding_step3_title',
        textKey: 'onboarding_step3_text'
    },
    {
        titleKey: 'onboarding_step4_title',
        textKey: 'onboarding_step4_text'
    }
]

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const { t, language, setLanguage } = useLanguage()
    const [currentStep, setCurrentStep] = useState(0)

    if (!isOpen) return null

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onClose()
        }
    }

    const currentStepData = steps[currentStep]

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Language Toggle */}
                <div className="text-center mb-4">
                    {language === 'no' ? (
                        <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm text-gray-600">{t('onboarding_need_english')}</span>
                            <button
                                onClick={() => setLanguage('en')}
                                className="text-2xl hover:scale-110 transition-transform"
                            >
                                🇬🇧
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm text-gray-600">{t('onboarding_need_norwegian')}</span>
                            <button
                                onClick={() => setLanguage('no')}
                                className="text-2xl hover:scale-110 transition-transform"
                            >
                                🇳🇴
                            </button>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    {t('welcome_to_fjordle')}
                </h2>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        {t(currentStepData.titleKey)}
                    </h3>
                    <p className="text-gray-600">
                        {t(currentStepData.textKey)}
                    </p>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
                            >
                                ← {t('onboarding_back')}
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        {currentStep === steps.length - 1 ? t('onboarding_got_it') : '→'}
                    </button>
                </div>
            </div>
        </div>
    )
}
