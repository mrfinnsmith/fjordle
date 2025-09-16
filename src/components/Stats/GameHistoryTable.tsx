'use client'

import { useMemo } from 'react'
import { PuzzleResult } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'

interface GameHistoryTableProps {
  puzzleHistory: PuzzleResult[]
}

export default function GameHistoryTable({ puzzleHistory }: GameHistoryTableProps) {
  const { t, language } = useLanguage()

  // Simple reverse chronological sort (newest first)
  const sortedData = useMemo(() => {
    return [...puzzleHistory].sort((a, b) => b.puzzleId - a.puzzleId)
  }, [puzzleHistory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Difficulty functions removed - difficulty comes from Supabase difficulty_tier, not day of week

  if (puzzleHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 page-text">{t('game_history')}</h3>
        <div className="text-center py-8 text-gray-500 page-text">
          {t('no_game_history')}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold mb-4 sm:mb-0 page-text">{t('game_history')}</h3>
      </div>

      {/* Card View Only */}
      <div className="space-y-4">
        {sortedData.map((puzzle) => (
          <div key={puzzle.puzzleId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold page-text">#{puzzle.puzzleId}</div>
                <div className="text-sm text-gray-600 page-text">{formatDate(puzzle.date)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  puzzle.won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {puzzle.won ? '🎯' : '❌'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 page-text">{t('attempts')}:</span>
                <span className="ml-1 font-medium">{puzzle.attemptsUsed}/6</span>
              </div>
              <div>
                <span className="text-gray-600 page-text">{t('hints')}:</span>
                <span className="ml-1 font-medium">{puzzle.totalHintsUsed}</span>
              </div>
            </div>
            
            {puzzle.totalHintsUsed > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600 page-text mb-1">{t('hints_used')}:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(puzzle.hintsUsed).map(([hint, used]) => used && (
                    <span key={hint} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {t(hint as keyof typeof puzzle.hintsUsed)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}