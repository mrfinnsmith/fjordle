'use client'

import { useEffect, useRef } from 'react'
import { PerformanceData } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'

interface PerformanceTrendsProps {
  performanceData: PerformanceData[]
}

declare global {
  interface Window {
    Chart: {
      new (ctx: CanvasRenderingContext2D, config: ChartConfig): ChartInstance
    }
  }
}

interface ChartConfig {
  type: string
  data: Record<string, unknown>
  options: Record<string, unknown>
}

interface ChartInstance {
  destroy: () => void
}

export default function PerformanceTrends({ performanceData }: PerformanceTrendsProps) {
  const { t, language } = useLanguage()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<ChartInstance | null>(null)

  useEffect(() => {
    if (!chartRef.current || performanceData.length === 0) return

    // Wait for Chart.js to load
    const initChart = () => {
      if (typeof window !== 'undefined' && window.Chart) {
        // Destroy existing chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        if (!chartRef.current) return
        const ctx = chartRef.current.getContext('2d')
        if (!ctx) return
        
        // Prepare data
        const labels = performanceData.map(data => {
          const date = new Date(data.date)
          return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
            month: 'short',
            day: 'numeric'
          })
        })

        const winRateData = performanceData.map(data => data.winRate)
        const averageAttemptsData = performanceData.map(data => data.averageAttempts)

        chartInstanceRef.current = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: t('win_rate'),
                data: winRateData,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: 'y'
              },
              {
                label: t('average_attempts'),
                data: averageAttemptsData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: t('performance_over_time'),
                font: {
                  size: 16,
                  weight: 'bold'
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
                  text: t('date')
                }
              },
              y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                  display: true,
                  text: t('win_rate') + ' (%)'
                },
                min: 0,
                max: 100
              },
              y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                  display: true,
                  text: t('average_attempts')
                },
                min: 1,
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
  }, [performanceData, t, language])

  if (performanceData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 page-text">{t('performance_trends')}</h3>
        <div className="text-center py-8 text-gray-500 page-text">
          {t('no_performance_data')}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold mb-4 page-text">{t('performance_trends')}</h3>
      <div className="relative h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  )
}