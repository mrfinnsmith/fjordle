# Fjordle

Daily Norwegian fjord guessing game. Players identify fjords from their distinctive outline shapes using distance and direction clues.

## How It Works

- One fjord puzzle per day
- Players have 6 attempts to guess correctly
- Wrong guesses show distance (km) and direction arrow to correct fjord
- Proximity percentage helps players triangulate the location
- Shareable results with emoji patterns

## Internationalization

- **Default Language**: Norwegian (bokmål) 
- **Language Toggle**: Flag icons (🇳🇴/🇬🇧) in top-right corner
- **Persistence**: Language preference saved in localStorage
- **Full Translation**: All UI text, page content, and metadata
- **Natural Norwegian**: Written for Norwegian audience, not direct translation
- **Fjord Names**: Always displayed in original Norwegian regardless of language

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Assets**: 1,467 Norwegian fjord SVG outlines
- **Storage**: Local storage for user stats and game progress
- **i18n**: React Context for language switching

## Database Schema

### Core Tables
- `fjords` - 1,467 Norwegian fjords with names, coordinates, SVG filenames
- `daily_puzzles` - Daily puzzle assignments with fjord_id and puzzle_number
- `game_sessions` - Anonymous user sessions with completion stats
- `guesses` - Individual guess attempts with distance/proximity data

### Key Functions
- `assign_daily_puzzle()` - Automatically queues next unused fjord
- `get_daily_fjord_puzzle()` - Returns today's puzzle
- `get_fjord_puzzle_by_number(puzzle_num)` - Returns specific puzzle
- `get_past_puzzles()` - Returns all previous puzzles

## Local Development

```bash
npm install
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_domain_when_deployed
```

## Game Mechanics

### Feedback System
- **Distance**: Kilometers from guess to correct answer
- **Direction**: Arrow emoji pointing toward correct fjord
- **Proximity**: Percentage (100% = correct, 0% = furthest possible)

### Difficulty Progression
- Monday-Tuesday: Famous fjords (Geirangerfjord, Sognefjord)
- Wednesday-Thursday: Regional fjords
- Friday-Sunday: Mixed difficulty including local fjords

## Assets

- **SVG Files**: `/public/fjord_svgs/` contains 1,467 fjord outline shapes
- **Naming**: Files follow pattern `####_FjordName.svg`
- **Source**: Generated from Norwegian Mapping Authority (Kartverket) data

## User Data

### Local Storage Keys
- `fjordle-session-id` - Anonymous session identifier
- `fjordle-stats` - User statistics (games played, win rate, streaks)
- `fjordle_puzzle_{id}_progress` - Individual puzzle progress
- `fjordle-language` - User's preferred language ('no' or 'en')

### Tracked Stats
- Games played/won
- Current/max streaks  
- Win percentage
- Guess patterns for sharing

## Daily Puzzle Management

### Adding New Puzzle
```sql
SELECT assign_daily_puzzle();
```

### Manual Puzzle Assignment
```sql
INSERT INTO daily_puzzles (fjord_id, puzzle_number, presented_date)
VALUES (fjord_id, next_number, CURRENT_DATE);
```

### View Today's Puzzle
```sql
SELECT * FROM get_daily_fjord_puzzle();
```

## File Structure

```
src/
├── app/                 # Next.js app router
├── components/Game/     # Game components
├── lib/                # Utilities and API functions
│   ├── gameLogic.ts         # Core game mechanics
│   ├── languageContext.tsx  # i18n context and translations
│   ├── localStorage.ts      # Browser storage utilities
│   ├── puzzleApi.ts         # Puzzle data API functions
│   ├── session_api.ts       # Session tracking API
│   ├── supabase.ts          # Database connection
│   └── translations.ts      # Translation utilities (optional)
├── types/              # TypeScript interfaces
public/
├── fjord_svgs/         # 1,467 fjord outline SVGs
```

## Key Components

- `GameBoard` - Main game interface
- `FjordDisplay` - Shows fjord outline SVG
- `GuessInput` - Autocomplete fjord name input
- `GuessHistory` - Shows previous attempts with feedback
- `ResultsModal` - End game stats and sharing
- `LanguageProvider` - i18n context wrapper
- `LanguageToggle` - Flag-based language switcher

## Translation Management

### Adding New Translations
1. Add translation keys to `languageContext.tsx`
2. Include both Norwegian (`no`) and English (`en`) versions
3. Use `t('translation_key')` in components
4. Import `useLanguage` hook where needed

### Translation Guidelines
- Norwegian text should sound natural, not like direct translation
- Keep fjord names in original Norwegian always
- Date formatting adapts to selected language
- Metadata and page titles translate dynamically

## Deployment Notes

- Set `NEXT_PUBLIC_SITE_URL` for proper OpenGraph/canonical URLs
- Ensure Supabase RLS policies allow anonymous access
- Verify all 1,467 SVG files are deployed to `/public/fjord_svgs/`
- Default language is Norwegian (bokmål) for SEO and audience targeting

## Troubleshooting

### No Puzzle Available
- Check if daily puzzle exists: `SELECT * FROM daily_puzzles WHERE presented_date = CURRENT_DATE;`
- Create today's puzzle: `SELECT assign_daily_puzzle();`

### Database Connection Issues
- Verify environment variables are set
- Check Supabase project status and API keys
- Ensure RLS policies allow anonymous read access

### SVG Not Loading
- Verify file exists in `/public/fjord_svgs/`
- Check filename matches database `svg_filename` field exactly
- Ensure proper file permissions after deployment

### Language/Translation Issues
- Check `localStorage` for `fjordle-language` key
- Verify `useLanguage` hook is used within `LanguageProvider`
- Ensure all translation keys exist in both languages
- Check browser console for missing translation warnings