'use client'

import { Guess } from '@/types/game'

interface GuessHistoryProps {
    guesses: Guess[]
}

export default function GuessHistory({ guesses }: GuessHistoryProps) {
    if (guesses.length === 0) return null

    return (
        <div className="guess-history">
            {guesses.map((guess, index) => (
                <div
                    key={index}
                    className={`guess-row ${guess.isCorrect ? 'correct' : ''}`}
                >
                    <div className="guess-fjord">
                        {guess.fjordName}
                    </div>

                    {!guess.isCorrect && (
                        <>
                            <div className="guess-distance">
                                {guess.distance.toLocaleString()}km
                            </div>

                            <div className="guess-direction">
                                {guess.direction}
                            </div>

                            <div className="guess-proximity">
                                {guess.proximityPercent}%
                            </div>
                        </>
                    )}

                    {guess.isCorrect && (
                        <div className="guess-correct">
                            🎯 Correct!
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
} 