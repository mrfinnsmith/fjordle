import { getTodaysPuzzle } from '@/lib/puzzleApi'
import HomeContent from './HomeContent'

export default async function Home() {
  const puzzle = await getTodaysPuzzle()

  return <HomeContent puzzle={puzzle} />
}
