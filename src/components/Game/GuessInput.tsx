'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { FjordOption } from '@/types/game'

interface GuessInputProps {
    fjords: FjordOption[]
    onGuess: (fjordId: number, fjordName: string, coords: { lat: number; lng: number }) => void
    disabled: boolean
    attemptsUsed: number
    maxAttempts: number
}

export default function GuessInput({
    fjords,
    onGuess,
    disabled,
    attemptsUsed,
    maxAttempts
}: GuessInputProps) {
    const [inputValue, setInputValue] = useState('')
    const [filteredFjords, setFilteredFjords] = useState<FjordOption[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)

    // Filter fjords based on input
    useEffect(() => {
        if (inputValue.length > 0 && !disabled) {
            const filtered = fjords.filter(fjord =>
                fjord.name.toLowerCase().includes(inputValue.toLowerCase())
            )
            setFilteredFjords(filtered)
            setShowDropdown(true)
            setSelectedIndex(-1)
        } else {
            setFilteredFjords([])
            setShowDropdown(false)
            setSelectedIndex(-1)
        }
    }, [inputValue, fjords, disabled])

    const handleSubmit = (fjord: FjordOption) => {
        onGuess(fjord.id, fjord.name, { lat: fjord.center_lat, lng: fjord.center_lng })
        setInputValue('')
        setShowDropdown(false)
        setSelectedIndex(-1)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || filteredFjords.length === 0) return

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
                    GUESSES {attemptsUsed} / {maxAttempts}
                </span>
            </div>

            {/* Input field */}
            <div className="guess-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter fjord name..."
                    disabled={disabled}
                    className="guess-input"
                />

                {/* Dropdown */}
                {showDropdown && filteredFjords.length > 0 && (
                    <div className="guess-dropdown">
                        {filteredFjords.map((fjord, index) => (
                            <button
                                key={fjord.id}
                                onClick={() => handleSubmit(fjord)}
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