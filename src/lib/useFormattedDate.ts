import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import { Language } from '@/types/game'

export function useFormattedDate(language: Language) {
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    setFormattedDate(formatDate(new Date(), language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Oslo'
    }))
  }, [language])

  return formattedDate
}