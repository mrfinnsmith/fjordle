'use client'

import { useRouter } from 'next/navigation'
import GameBoard from '@/components/Game/GameBoard'
import { getTodaysPuzzle } from '@/lib/puzzleApi'
import { useLanguage } from '@/lib/languageContext'
import { useEffect, useState } from 'react'
import { Puzzle } from '@/types/game'
import { formatDate } from '@/lib/utils'

function NoPuzzleMessage() {
  const { t } = useLanguage()

  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {t('no_puzzle_today')}
      </h2>
      <p className="text-gray-600">
        {t('no_puzzle_message')}
      </p>
    </div>
  )
}

function GameContent({ puzzle }: { puzzle: Puzzle }) {
  const { t, language, mounted } = useLanguage()
  const [formattedDate, setFormattedDate] = useState('')

  console.log('[DEBUG] GameContent render - language:', language, 'mounted:', mounted)

  useEffect(() => {
    if (mounted) {
      console.log('[DEBUG] GameContent formatting date with language:', language)
      setFormattedDate(formatDate(new Date(), language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Oslo'
      }))
    }
  }, [language, mounted])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-gray-700 mb-4">
          {t('game_description')}
        </p>
      </div>
      <div className="text-center mb-4">
        <p className="text-gray-600 text-sm">
          {formattedDate}
        </p>
      </div>

      <GameBoard puzzle={puzzle} />
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('[DEBUG] HomePage render - router:', router)
  console.log('[DEBUG] HomePage render - puzzle:', puzzle)
  console.log('[DEBUG] HomePage render - loading:', loading)

  useEffect(() => {
    console.log('[DEBUG] HomePage mounted')
    console.log('[DEBUG] Router in HomePage:', router)
    if (typeof window !== 'undefined') {
      console.log('[DEBUG] Current URL:', window.location.href)
    }
  }, [router])

  useEffect(() => {
    async function loadPuzzle() {
      console.log('[DEBUG] Loading puzzle...')
      try {
        const todaysPuzzle = await getTodaysPuzzle()
        console.log('[DEBUG] Puzzle loaded:', todaysPuzzle)
        setPuzzle(todaysPuzzle)
      } catch (error) {
        console.error('[DEBUG] Failed to load puzzle:', error)
      } finally {
        console.log('[DEBUG] Puzzle loading completed')
        setLoading(false)
      }
    }

    loadPuzzle()
  }, [])

  if (loading) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!puzzle) {
    return <NoPuzzleMessage />
  }

  return <GameContent puzzle={puzzle} />
}