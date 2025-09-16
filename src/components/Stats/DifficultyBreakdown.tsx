'use client'

import { useEffect, useRef } from 'react'
import { DifficultyStats } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'

interface DifficultyBreakdownProps {
  difficultyStats: DifficultyStats
}

// Chart types handled in PerformanceTrends.tsx

export default function DifficultyBreakdown({ difficultyStats }: DifficultyBreakdownProps) {
  const { t, language } = useLanguage()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const initChart = () => {
      if (typeof window !== 'undefined' && window.Chart) {
        // Destroy existing chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        if (!chartRef.current) return
        const ctx = chartRef.current.getContext('2d')
        if (!ctx) return
        
        // Calculate win rates for each difficulty
        const easyWinRate = difficultyStats.easy.total > 0 
          ? (difficultyStats.easy.won / difficultyStats.easy.total) * 100 
          : 0
        const mediumWinRate = difficultyStats.medium.total > 0 
          ? (difficultyStats.medium.won / difficultyStats.medium.total) * 100 
          : 0
        const hardWinRate = difficultyStats.hard.total > 0 
          ? (difficultyStats.hard.won / difficultyStats.hard.total) * 100 
          : 0

        const data = [easyWinRate, mediumWinRate, hardWinRate]
        const labels = [t('easy'), t('medium'), t('hard')]
        
        // Only show chart if there's data
        const hasData = data.some(value => value > 0)
        
        if (!hasData) {
          return
        }

        chartInstanceRef.current = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',   // Green for easy
                'rgba(255, 193, 7, 0.8)',   // Yellow for medium  
                'rgba(239, 68, 68, 0.8)'    // Red for hard
              ],
              borderColor: [
                'rgb(34, 197, 94)',
                'rgb(255, 193, 7)',
                'rgb(239, 68, 68)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: t('win_rate_by_difficulty'),
                font: {
                  size: 16,
                  weight: 'bold'
                }
              },
              legend: {
                display: true,
                position: 'bottom' as const
              },
              tooltip: {
                callbacks: {
                  label: function(context: { label: string; parsed: number }) {
                    const label = context.label || ''
                    const value = Math.round(context.parsed * 10) / 10
                    return `${label}: ${value}%`
                  }
                }
              }
            }
          }
        })
      } else {
        // Retry after a short delay
        setTimeout(initChart, 100)
      }
    }

    initChart()

    // Cleanup
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [difficultyStats, t, language])

  // Check if there's any data to display
  const totalGames = difficultyStats.easy.total + difficultyStats.medium.total + difficultyStats.hard.total
  
  if (totalGames === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 page-text">{t('difficulty_breakdown')}</h3>
        <div className="text-center py-8 text-gray-500 page-text">
          {t('no_difficulty_data')}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold mb-4 page-text">{t('difficulty_breakdown')}</h3>
      
      {/* Chart */}
      <div className="relative h-80 mb-6">
        <canvas ref={chartRef}></canvas>
      </div>
      
      {/* Stats Table */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700 mb-1">
            {difficultyStats.easy.total > 0 
              ? Math.round((difficultyStats.easy.won / difficultyStats.easy.total) * 100)
              : 0}%
          </div>
          <div className="text-sm font-medium text-green-600 page-text">{t('easy')}</div>
          <div className="text-xs text-green-500 page-text">
            {difficultyStats.easy.won}/{difficultyStats.easy.total}
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700 mb-1">
            {difficultyStats.medium.total > 0 
              ? Math.round((difficultyStats.medium.won / difficultyStats.medium.total) * 100)
              : 0}%
          </div>
          <div className="text-sm font-medium text-yellow-600 page-text">{t('medium')}</div>
          <div className="text-xs text-yellow-500 page-text">
            {difficultyStats.medium.won}/{difficultyStats.medium.total}
          </div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700 mb-1">
            {difficultyStats.hard.total > 0 
              ? Math.round((difficultyStats.hard.won / difficultyStats.hard.total) * 100)
              : 0}%
          </div>
          <div className="text-sm font-medium text-red-600 page-text">{t('hard')}</div>
          <div className="text-xs text-red-500 page-text">
            {difficultyStats.hard.won}/{difficultyStats.hard.total}
          </div>
        </div>
      </div>
    </div>
  )
}