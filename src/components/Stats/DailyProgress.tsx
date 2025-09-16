'use client'

import { useEffect, useRef, useState } from 'react'
import { PuzzleResult } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'
import { getDailyPuzzleHistory } from '@/lib/localStorage'

interface DailyProgressProps {
  puzzleHistory: PuzzleResult[]
}

// Simple chart types
interface ChartInstance {
  destroy: () => void
}

export default function DailyProgress({ puzzleHistory }: DailyProgressProps) {
  const { t, language } = useLanguage()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<ChartInstance | null>(null)
  const [dailyHistory, setDailyHistory] = useState<PuzzleResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDailyHistory = async () => {
      try {
        // If we have mock data (puzzleHistory has 3+ items), use it directly
        // Otherwise, fetch filtered daily puzzle history
        if (puzzleHistory.length >= 3) {
          setDailyHistory(puzzleHistory)
        } else {
          const dailyPuzzles = await getDailyPuzzleHistory()
          setDailyHistory(dailyPuzzles)
        }
      } catch (error) {
        console.error('Failed to load daily puzzle history:', error)
        // Fallback to provided puzzle history
        setDailyHistory(puzzleHistory)
      } finally {
        setIsLoading(false)
      }
    }

    loadDailyHistory()
  }, [puzzleHistory])

  useEffect(() => {
    if (!chartRef.current || dailyHistory.length < 3 || isLoading) return

    const initChart = () => {
      if (typeof window !== 'undefined' && (window as { Chart?: unknown }).Chart) {
        // Destroy existing chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        if (!chartRef.current) return
        const ctx = chartRef.current.getContext('2d')
        if (!ctx) return
        
        // Sort by puzzle ID to show chronological progression
        const sortedPuzzles = [...dailyHistory].sort((a, b) => a.puzzleId - b.puzzleId)
        
        // Prepare data - only take last 30 puzzles for readability
        const recentPuzzles = sortedPuzzles.slice(-30)
        
        const labels = recentPuzzles.map(puzzle => `#${puzzle.puzzleId}`)
        const attemptsData = recentPuzzles.map(puzzle => puzzle.attemptsUsed)
        const hintsData = recentPuzzles.map(puzzle => puzzle.totalHintsUsed)
        
        // Create background colors based on win/loss
        const backgroundColors = recentPuzzles.map(puzzle => 
          puzzle.won ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        )

        const ChartConstructor = (window as { Chart: new (ctx: CanvasRenderingContext2D, config: unknown) => ChartInstance }).Chart
        chartInstanceRef.current = new ChartConstructor(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: t('attempts_used'),
                data: attemptsData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: 'y',
                pointBackgroundColor: backgroundColors,
                pointBorderColor: backgroundColors.map(color => color.replace('0.1', '1')),
                pointRadius: 6
              },
              {
                label: t('hints_used'),
                data: hintsData,
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: 'y1',
                pointBackgroundColor: backgroundColors,
                pointBorderColor: backgroundColors.map(color => color.replace('0.1', '1')),
                pointRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: t('puzzle_progression'),
                font: {
                  size: 16,
                  weight: 'bold' as const
                }
              },
              legend: {
                display: true,
                position: 'top' as const
              }
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: t('puzzle_number')
                }
              },
              y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                  display: true,
                  text: t('attempts_used')
                },
                min: 1,
                max: 6
              },
              y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                  display: true,
                  text: t('hints_used')
                },
                min: 0,
                max: 6,
                grid: {
                  drawOnChartArea: false
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index' as const
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
  }, [dailyHistory, t, language, isLoading])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 page-text">{t('puzzle_progression')}</h3>
        <div className="text-center py-8 text-gray-500 page-text">
          Loading daily puzzle progression...
        </div>
      </div>
    )
  }

  if (dailyHistory.length < 3) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 page-text">{t('puzzle_progression')}</h3>
        <div className="text-center py-8 text-gray-500 page-text">
          {t('need_more_puzzles_for_chart')}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold mb-4 page-text">{t('puzzle_progression')}</h3>
      <div className="relative h-80">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 text-sm text-gray-600 page-text">
        <div className="mb-2">
          <strong>Daily puzzles only:</strong> Shows progression for puzzles played on their actual daily puzzle date
        </div>
        {t('shows_last_30_puzzles')}
        <br />
        <span className="text-xs">🟢 Green points = Won, 🔴 Red points = Lost</span>
      </div>
    </div>
  )
}