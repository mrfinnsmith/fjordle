'use client'

import { useState, useRef, useEffect } from 'react'
import { FjordOption } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'

interface GuessInputProps {
    fjords: FjordOption[]
    onGuess: (fjordId: number, fjordName: string, coords: { lat: number; lng: number }) => void
    disabled: boolean
    attemptsUsed: number
    maxAttempts: number
    onHintClick: () => void
}

export default function GuessInput({
    fjords,
    onGuess,
    disabled,
    attemptsUsed,
    maxAttempts,
    onHintClick
}: GuessInputProps) {
    const { t } = useLanguage()
    const [query, setQuery] = useState('')
    const [selectedFjord, setSelectedFjord] = useState<FjordOption | null>(null)
    const [filteredFjords, setFilteredFjords] = useState<FjordOption[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (query.length >= 2) {
            const filtered = fjords
                .filter(fjord =>
                    fjord.name.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 10)
            setFilteredFjords(filtered)
            setShowDropdown(filtered.length > 0)
            setSelectedIndex(-1)
        } else {
            setFilteredFjords([])
            setShowDropdown(false)
            setSelectedIndex(-1)
        }
    }, [query, fjords])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (disabled || !selectedFjord) return

        onGuess(selectedFjord.id, selectedFjord.name, {
            lat: selectedFjord.center_lat,
            lng: selectedFjord.center_lng
        })

        // Reset form
        setQuery('')
        setSelectedFjord(null)
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev < filteredFjords.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedIndex >= 0 && selectedIndex < filteredFjords.length) {
                selectFjord(filteredFjords[selectedIndex])
            } else if (filteredFjords.length === 1) {
                selectFjord(filteredFjords[0])
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false)
            setSelectedIndex(-1)
        }
    }

    const selectFjord = (fjord: FjordOption) => {
        setSelectedFjord(fjord)
        setQuery(fjord.name)
        setShowDropdown(false)
        setSelectedIndex(-1)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)

        // Clear selected fjord if user is typing something different
        if (selectedFjord && value !== selectedFjord.name) {
            setSelectedFjord(null)
        }

        // Auto-select if exact match
        const exactMatch = fjords.find(fjord =>
            fjord.name.toLowerCase() === value.toLowerCase()
        )
        if (exactMatch) {
            setSelectedFjord(exactMatch)
        }
    }

    const handleInputBlur = () => {
        // Delay hiding dropdown to allow for clicks
        setTimeout(() => {
            setShowDropdown(false)
            setSelectedIndex(-1)
        }, 200)
    }

    const handleInputFocus = () => {
        if (query.length >= 2 && filteredFjords.length > 0) {
            setShowDropdown(true)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto mb-6">
            <form onSubmit={handleSubmit}>
                <div className="guess-input-container">
                    <div className="input-button-row">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onBlur={handleInputBlur}
                                onFocus={handleInputFocus}
                                placeholder={t('enter_fjord_name')}
                                className="guess-input w-full"
                                disabled={disabled}
                                autoComplete="off"
                            />

                            {showDropdown && (
                                <div ref={dropdownRef} className="guess-dropdown">
                                    {filteredFjords.map((fjord, index) => (
                                        <button
                                            key={fjord.id}
                                            type="button"
                                            className={`dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                                            onClick={() => selectFjord(fjord)}
                                        >
                                            {fjord.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onHintClick}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                                type="button"
                                title={t('get_hint')}
                            >
                                🛟
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedFjord || disabled}
                                className="game-button primary flex-1"
                            >
                                {t('guess_button')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="text-center text-sm text-gray-600 mt-2">
                {attemptsUsed}/{maxAttempts} {t('guesses').toLowerCase()}
            </div>
        </div>
    )
}