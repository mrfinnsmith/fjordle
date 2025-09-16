'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { getEnhancedUserStats, getDataCorruptionReport, clearDataCorruptionReport } from '@/lib/localStorage'
import { EnhancedUserStats } from '@/types/game'
import { createMockStatsData } from '@/lib/mockStatsData'
import StatsOverview from '@/components/Stats/StatsOverview'
import DailyProgress from '@/components/Stats/DailyProgress'
import GameHistoryTable from '@/components/Stats/GameHistoryTable'

export default function StatsPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<EnhancedUserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCorruptionWarning, setShowCorruptionWarning] = useState(false)

  useEffect(() => {
    // Load Chart.js from CDN
    const loadChartJS = () => {
      if (typeof window !== 'undefined' && !window.Chart) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
        script.async = true
        document.head.appendChild(script)
      }
    }

    const loadStats = async () => {
      try {
        const enhancedStats = await getEnhancedUserStats()
        setStats(enhancedStats)
        
        // Check for data corruption
        const corruptionReport = getDataCorruptionReport()
        if (corruptionReport && (corruptionReport.corruptedKeys.length > 0 || corruptionReport.invalidEntries > 0)) {
          setShowCorruptionWarning(true)
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
        // Set empty stats as fallback
        setStats({
          gamesPlayed: 0,
          gamesWon: 0,
          currentStreak: 0,
          maxStreak: 0,
          lastPlayedDate: '',
          puzzleHistory: [],
          hintAnalytics: {
            totalHintsUsed: 0,
            byType: {},
            averagePerGame: 0,
            gamesWithoutHints: 0
          },
          performanceData: [],
          difficultyBreakdown: {
            easy: { won: 0, total: 0 },
            medium: { won: 0, total: 0 },
            hard: { won: 0, total: 0 }
          },
          lastUpdated: new Date()
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadChartJS()
    loadStats()

    // Development helper - expose test data function to console
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as { loadTestStats?: () => void }).loadTestStats = () => {
        setStats(createMockStatsData())
        console.log('✅ Test stats data loaded! Refresh page to reset.')
      }
      console.log('💡 Development tip: Run loadTestStats() in console to see stats with data')
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen page-container">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 page-text">{t('loading_stats')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen page-container">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 page-text">{t('statistics')}</h1>
            <p className="text-red-600 page-text">{t('error_loading_stats')}</p>
            <Link 
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t('back_to_game')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate average guesses for winning games
  const averageGuesses = stats.puzzleHistory.length > 0 
    ? stats.puzzleHistory
        .filter(puzzle => puzzle.won)
        .reduce((sum, puzzle) => sum + puzzle.attemptsUsed, 0) / Math.max(stats.gamesWon, 1)
    : 0

  // Progressive disclosure based on games played
  const showBasicStats = stats.gamesPlayed >= 0
  const showDetailedHistory = stats.gamesPlayed >= 1

  return (
    <div className="min-h-screen page-container">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 page-text">{t('statistics')}</h1>
              <p className="text-gray-600 page-text">
                {t('stats_description')}
              </p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t('back_to_game')}
            </Link>
          </div>
        </div>

        {/* Data Corruption Warning */}
        {showCorruptionWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="text-2xl mr-3">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Data Integrity Warning
                </h3>
                <p className="text-yellow-800 mb-3">
                  Some of your game data appears to be corrupted or invalid. This may affect the accuracy of your statistics.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      clearDataCorruptionReport()
                      setShowCorruptionWarning(false)
                    }}
                    className="px-3 py-1 bg-yellow-200 text-yellow-900 text-sm rounded hover:bg-yellow-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Games */}
        {stats.gamesPlayed === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold mb-4 page-text">{t('welcome_to_stats')}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto page-text">
              {t('no_games_played_yet')}
            </p>
            <div className="text-sm text-gray-500 page-text">
              {t('click_back_to_game_to_start')}
            </div>
          </div>
        )}

        {/* Basic Stats - 1+ games */}
        {showBasicStats && stats.gamesPlayed > 0 && (
          <StatsOverview 
            stats={stats}
            hintStats={stats.hintAnalytics}
            averageGuesses={averageGuesses}
          />
        )}

        {/* Limited Data Message - 1-4 games */}
        {stats.gamesPlayed > 0 && stats.gamesPlayed < 5 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2 page-text">
                  {t('more_data_needed')}
                </h3>
                <p className="text-blue-700 page-text">
                  {t('play_more_games_for_trends').replace('{count}', (5 - stats.gamesPlayed).toString())}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Progress Chart - 3+ games */}
        {stats.gamesPlayed >= 3 && (
          <DailyProgress puzzleHistory={stats.puzzleHistory} />
        )}

        {/* Game History - 1+ games */}
        {showDetailedHistory && (
          <GameHistoryTable puzzleHistory={stats.puzzleHistory} />
        )}

        {/* Footer Info */}
        {stats.gamesPlayed > 0 && (
          <div className="text-center text-sm text-gray-500 mt-8 page-text">
            {t('stats_last_updated')}: {stats.lastUpdated.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}