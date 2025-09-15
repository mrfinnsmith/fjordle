'use client'

import { useEffect } from 'react'
import { initWebVitals, measurePageLoad, measureResourcePerformance, trackMemoryUsage } from '@/lib/performance'

export default function PerformanceMonitor() {
  useEffect(() => {
    // Initialize Core Web Vitals monitoring
    initWebVitals()

    // Measure initial page load metrics
    if (typeof window !== 'undefined') {
      // Wait for page to fully load
      window.addEventListener('load', () => {
        measurePageLoad()
        measureResourcePerformance()
        
        // Track memory usage after load
        setTimeout(() => {
          trackMemoryUsage()
        }, 1000)
      })

      // Track memory usage periodically (every 30 seconds)
      const memoryInterval = setInterval(() => {
        trackMemoryUsage()
      }, 30000)

      return () => {
        clearInterval(memoryInterval)
      }
    }
  }, [])

  // This component renders nothing but monitors performance
  return null
}