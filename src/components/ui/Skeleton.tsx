'use client'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export default function Skeleton({ className = '', width = '100%', height = '1rem' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-md ${className}`}
      style={{ width, height }}
    />
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton height="1.25rem" width="60%" className="mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton height="0.875rem" width="40%" />
            <Skeleton height="1.5rem" width="4rem" />
          </div>
        </div>
        <Skeleton height="2.5rem" width="4rem" />
      </div>
    </div>
  )
}