/**
 * Performance monitoring utilities for Core Web Vitals
 * Tracks LCP, FID, CLS, TTFB, and other performance metrics
 */

// Type for Google Analytics gtag function
type GtagFunction = (command: string, action: string, parameters?: Record<string, unknown>) => void

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url?: string
}

export interface WebVitalsData {
  LCP?: PerformanceMetric
  FID?: PerformanceMetric
  CLS?: PerformanceMetric
  TTFB?: PerformanceMetric
  INP?: PerformanceMetric
}

type MetricName = keyof WebVitalsData

// Thresholds for Core Web Vitals ratings
const THRESHOLDS: Record<MetricName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
}

function getRating(metricName: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function createMetric(name: MetricName, value: number): PerformanceMetric {
  return {
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : undefined
  }
}

// Store metrics for reporting
const vitalsData: WebVitalsData = {}

export function reportWebVital(metric: PerformanceMetric) {
  const metricName = metric.name as MetricName
  vitalsData[metricName] = metric

  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: GtagFunction }).gtag
    gtag('event', 'web_vitals', {
      event_category: 'Performance',
      event_label: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      custom_map: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating
      }
    })
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance metric:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    })
  }
}

// Initialize Core Web Vitals monitoring
export async function initWebVitals() {
  if (typeof window === 'undefined') return

  try {
    // Dynamic import to avoid SSR issues - web-vitals 5.x uses different imports
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

    onCLS((metric: { value: number }) => {
      const perfMetric = createMetric('CLS', metric.value)
      reportWebVital(perfMetric)
    })

    onFCP((metric: { value: number }) => {
      // FCP isn't in our main vitals but useful for monitoring
      const perfMetric = createMetric('FCP' as MetricName, metric.value)
      reportWebVital(perfMetric)
    })

    onLCP((metric: { value: number }) => {
      const perfMetric = createMetric('LCP', metric.value)
      reportWebVital(perfMetric)
    })

    onTTFB((metric: { value: number }) => {
      const perfMetric = createMetric('TTFB', metric.value)
      reportWebVital(perfMetric)
    })

    // INP is available in web-vitals 5.x
    onINP((metric: { value: number }) => {
      const perfMetric = createMetric('INP', metric.value)
      reportWebVital(perfMetric)
    })
  } catch (error) {
    console.warn('Failed to initialize web vitals:', error)
  }
}

// Get current performance data
export function getPerformanceData(): WebVitalsData {
  return { ...vitalsData }
}

// Custom performance measurement utilities
export function measurePageLoad() {
  if (typeof window === 'undefined' || !window.performance) return

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  
  const metrics = {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcpConnect: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart
  }

  // Report custom metrics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: GtagFunction }).gtag
    gtag('event', 'page_load_timing', {
      event_category: 'Performance',
      dom_content_loaded: Math.round(metrics.domContentLoaded),
      load_complete: Math.round(metrics.loadComplete),
      dns_lookup: Math.round(metrics.dnsLookup),
      tcp_connect: Math.round(metrics.tcpConnect),
      ttfb: Math.round(metrics.ttfb)
    })
  }

  return metrics
}

// Measure resource loading performance
export function measureResourcePerformance() {
  if (typeof window === 'undefined' || !window.performance) return

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  const resourceMetrics = resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize,
    type: resource.initiatorType
  }))

  // Find slow resources (>1s)
  const slowResources = resourceMetrics.filter(r => r.duration > 1000)
  
  if (slowResources.length > 0 && typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: GtagFunction }).gtag
    slowResources.forEach(resource => {
      gtag('event', 'slow_resource', {
        event_category: 'Performance',
        event_label: resource.name,
        value: Math.round(resource.duration),
        resource_type: resource.type,
        resource_size: resource.size
      })
    })
  }

  return resourceMetrics
}

// Performance monitoring for game-specific metrics
export function trackGamePerformance(eventName: string, duration?: number) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: GtagFunction }).gtag
    gtag('event', 'game_performance', {
      event_category: 'Game Performance',
      event_label: eventName,
      value: duration ? Math.round(duration) : undefined
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`Game performance: ${eventName}`, duration ? `${duration}ms` : '')
  }
}

// Memory usage tracking (if available)
export function trackMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return

  const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
  const memoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit
  }

  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: GtagFunction }).gtag
    gtag('event', 'memory_usage', {
      event_category: 'Performance',
      used_heap_mb: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
      total_heap_mb: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)
    })
  }

  return memoryInfo
}