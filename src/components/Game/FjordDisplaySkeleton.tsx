'use client'

import Skeleton from '@/components/ui/Skeleton'
import { useLanguage } from '@/lib/languageContext'

export default function FjordDisplaySkeleton() {
  const { t } = useLanguage()

  return (
    <div className="fjord-display">
      <div className="fjord-svg-container bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton 
            width="300px" 
            height="200px" 
            className="rounded-lg"
          />
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
            <span className="text-sm">{t('loading_fjord')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}