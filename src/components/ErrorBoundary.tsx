'use client'

import React, { Component, ReactNode } from 'react'
import { useLanguage } from '@/lib/languageContext'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

function ErrorFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const { t } = useLanguage()

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4 p-6 max-w-md">
        <div className="text-6xl">🌊</div>
        <h2 className="text-xl font-semibold text-gray-800">
          {t('error_title') || 'Oops! Something went wrong'}
        </h2>
        <p className="text-gray-600">
          {t('error_message') || 'The fjord seems to have disappeared. Let\'s try to find it again!'}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('try_again') || 'Try Again'}
        </button>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    
    // Track error in analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        'description': `ErrorBoundary: ${error.message}`,
        'fatal': false,
        'error_stack': error.stack,
        'component_stack': errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

export default ErrorBoundary