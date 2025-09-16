'use client'

import { UserStats, HintUsageStats } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'

interface StatsOverviewProps {
  stats: UserStats
  hintStats: HintUsageStats
  averageGuesses: number
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  className?: string
}

function StatCard({ title, value, subtitle, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg p-6 border border-gray-200 ${className}`}>
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-2 page-text">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600 page-text">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1 page-text">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StatsOverview({ stats, hintStats, averageGuesses }: StatsOverviewProps) {
  const { t } = useLanguage()

  // Calculate win rate
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0

  // Format average guesses
  const formattedAverageGuesses = stats.gamesWon > 0 
    ? (averageGuesses).toFixed(1)
    : '—'

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 page-text">{t('statistics_overview')}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title={t('games_played')}
          value={stats.gamesPlayed}
        />
        
        <StatCard
          title={t('win_rate')}
          value={`${winRate}%`}
          subtitle={`${stats.gamesWon}/${stats.gamesPlayed} ${t('completed_games')}`}
        />
        
        <StatCard
          title={t('average_guesses')}
          value={formattedAverageGuesses}
          subtitle={stats.gamesWon > 0 ? t('winning_games_only') : ''}
        />
        
        <StatCard
          title={t('current_streak')}
          value={stats.currentStreak}
          subtitle={t('consecutive_wins')}
        />
        
        <StatCard
          title={t('max_streak')}
          value={stats.maxStreak}
          subtitle={t('max_consecutive')}
        />
        
        <StatCard
          title={t('games_without_hints')}
          value={hintStats.gamesWithoutHints}
          subtitle={`${Math.round((hintStats.gamesWithoutHints / Math.max(stats.gamesPlayed, 1)) * 100)}%`}
        />
      </div>
    </div>
  )
}