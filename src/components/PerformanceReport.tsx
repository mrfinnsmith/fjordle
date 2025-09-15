'use client'

import { useState, useEffect } from 'react'
import { getPerformanceData, WebVitalsData } from '@/lib/performance'

interface PerformanceReportProps {
  showInDev?: boolean
  className?: string
}

export default function PerformanceReport({ 
  showInDev = true, 
  className = '' 
}: PerformanceReportProps) {
  const [vitals, setVitals] = useState<WebVitalsData>({})
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Only show in development by default
    if (showInDev && process.env.NODE_ENV === 'development') {
      setIsVisible(true)
      
      // Update vitals data periodically
      const interval = setInterval(() => {
        setVitals(getPerformanceData())
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [showInDev])

  // Allow manual toggle with keyboard shortcut in dev
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          setIsVisible(prev => !prev)
          if (!isVisible) {
            setVitals(getPerformanceData())
          }
        }
      }
      
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isVisible])

  if (!isVisible) return null

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50'
      case 'poor': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatValue = (value?: number) => {
    if (value === undefined) return 'N/A'
    if (value < 1000) return `${Math.round(value)}ms`
    return `${(value / 1000).toFixed(2)}s`
  }

  const formatCLS = (value?: number) => {
    if (value === undefined) return 'N/A'
    return value.toFixed(3)
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm text-sm ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Core Web Vitals</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
          aria-label="Close performance report"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        {vitals.LCP && (
          <div className="flex justify-between items-center">
            <span className="font-medium">LCP:</span>
            <span className={`px-2 py-1 rounded text-xs ${getRatingColor(vitals.LCP.rating)}`}>
              {formatValue(vitals.LCP.value)}
            </span>
          </div>
        )}
        
        {vitals.FID && (
          <div className="flex justify-between items-center">
            <span className="font-medium">FID:</span>
            <span className={`px-2 py-1 rounded text-xs ${getRatingColor(vitals.FID.rating)}`}>
              {formatValue(vitals.FID.value)}
            </span>
          </div>
        )}
        
        {vitals.CLS && (
          <div className="flex justify-between items-center">
            <span className="font-medium">CLS:</span>
            <span className={`px-2 py-1 rounded text-xs ${getRatingColor(vitals.CLS.rating)}`}>
              {formatCLS(vitals.CLS.value)}
            </span>
          </div>
        )}
        
        {vitals.TTFB && (
          <div className="flex justify-between items-center">
            <span className="font-medium">TTFB:</span>
            <span className={`px-2 py-1 rounded text-xs ${getRatingColor(vitals.TTFB.rating)}`}>
              {formatValue(vitals.TTFB.value)}
            </span>
          </div>
        )}
        
        {vitals.INP && (
          <div className="flex justify-between items-center">
            <span className="font-medium">INP:</span>
            <span className={`px-2 py-1 rounded text-xs ${getRatingColor(vitals.INP.rating)}`}>
              {formatValue(vitals.INP.value)}
            </span>
          </div>
        )}
      </div>
      
      {Object.keys(vitals).length === 0 && (
        <p className="text-gray-500 text-xs">Loading metrics...</p>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}