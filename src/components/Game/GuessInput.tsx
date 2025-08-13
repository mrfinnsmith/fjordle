'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { FjordOption } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'

interface GuessInputProps {
    fjords: FjordOption[]
    onGuess: (fjordId: number, fjordName: string, coords: { lat: number; lng: number }) => void
    onInvalidGuess: () => void
    disabled: boolean
    attemptsUsed: number
    maxAttempts: number
}

export default function GuessInput({
    fjords,
    onGuess,
    onInvalidGuess,
    disabled,
    attemptsUsed,
    maxAttempts
}: GuessInputProps) {
    const { t } = useLanguage()
    const [inputValue, setInputValue] = useState('')
    const [filteredFjords, setFilteredFjords] = useState<FjordOption[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [selectedFjord, setSelectedFjord] = useState<FjordOption | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Filter fjords based on input
    useEffect(() => {
        if (inputValue.length > 0 && !disabled) {
            const filtered = fjords.filter(fjord =>
                fjord.name.toLowerCase().includes(inputValue.toLowerCase())
            )
            setFilteredFjords(filtered)
            setSelectedIndex(-1)

            // Check if input exactly matches a fjord
            const exactMatch = filtered.find(fjord =>
                fjord.name.toLowerCase() === inputValue.toLowerCase()
            )
            setSelectedFjord(exactMatch || null)
        } else if (showDropdown && !disabled) {
            // Show all fjords when focused but empty
            setFilteredFjords(fjords)
            setSelectedIndex(-1)
            setSelectedFjord(null)
        } else {
            setFilteredFjords([])
            setSelectedIndex(-1)
            setSelectedFjord(null)
        }
    }, [inputValue, fjords, disabled, showDropdown])

    const handleSubmit = (fjord?: FjordOption) => {
        const fjordToSubmit = fjord || selectedFjord

        if (fjordToSubmit) {
            onGuess(fjordToSubmit.id, fjordToSubmit.name, {
                lat: fjordToSubmit.center_lat,
                lng: fjordToSubmit.center_lng
            })
        } else {
            onInvalidGuess()
        }

        setInputValue('')
        setShowDropdown(false)
        setSelectedIndex(-1)
        setSelectedFjord(null)
    }

    const handleDropdownSelect = (fjord: FjordOption) => {
        handleSubmit(fjord)
    }

    const handleFocus = () => {
        if (!disabled) {
            setShowDropdown(true)
        }
    }

    const handleBlur = () => {
        // Delay hiding dropdown to allow clicks
        setTimeout(() => {
            setShowDropdown(false)
        }, 150)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || filteredFjords.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
            }
            return
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev =>
                prev < filteredFjords.length - 1 ? prev + 1 : 0
            )
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev =>
                prev > 0 ? prev - 1 : filteredFjords.length - 1
            )
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedIndex >= 0) {
                handleSubmit(filteredFjords[selectedIndex])
            } else {
                handleSubmit()
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false)
            setSelectedIndex(-1)
        }
    }

    return (
        <div className="guess-input-section">
            {/* Attempts counter */}
            <div className="attempts-display">
                <span className="attempts-text">
                    {t('guesses')} {attemptsUsed} / {maxAttempts}
                </span>
            </div>

            {/* Input field and button container */}
            <div className="guess-input-container">
                <div className="input-button-row">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={t('enter_fjord_name')}
                        disabled={disabled}
                        className="guess-input"
                    />

                    <button
                        onClick={() => handleSubmit()}
                        disabled={disabled}
                        className="guess-button game-button primary"
                    >
                        {t('guess_button')}
                    </button>
                </div>

                {/* Dropdown */}
                {showDropdown && filteredFjords.length > 0 && (
                    <div className="guess-dropdown">
                        {filteredFjords.map((fjord, index) => (
                            <button
                                key={fjord.id}
                                onMouseDown={() => handleDropdownSelect(fjord)}
                                className={`dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                            >
                                {fjord.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}