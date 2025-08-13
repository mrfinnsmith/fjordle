# Fjordle

Daily Norwegian fjord guessing game. Players identify fjords from their distinctive outline shapes using distance and direction clues.

## How It Works

- One fjord puzzle per day
- Players have 6 attempts to guess correctly
- Wrong guesses show distance (km) and direction arrow to correct fjord
- Proximity percentage helps players triangulate the location
- Shareable results with proximity square patterns and streak tracking

## Internationalization

- **Default Language**: Norwegian (bokmål) 
- **Language Toggle**: Flag icons (🇳🇴/🇬🇧) in top-right corner
- **Persistence**: Language preference saved in cookies
- **Full Translation**: All UI text, page content, and metadata
- **Natural Norwegian**: Written for Norwegian audience, not direct translation
- **Fjord Names**: Always displayed in original Norwegian regardless of language
- **Language Detection**: Server-side cookie reading with client-side React Context for switching

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Assets**: 1,467 Norwegian fjord SVG outlines
- **Storage**: Local storage for user stats and game progress
- **i18n**: Server-side cookie detection with React Context for language switching
- **Automation**: GitHub Actions for daily puzzle assignment

## Database Schema

### Core Tables
- `fjords` - 1,467 Norwegian fjords with names, coordinates, SVG filenames
- `daily_puzzles` - Daily puzzle assignments with fjord_id, puzzle_number, and last_presented_date
- `puzzle_queue` - Manual queue for specific dates (optional)
- `game_sessions` - Anonymous user sessions with completion stats
- `guesses` - Individual guess attempts with distance/proximity data

### Key Functions
- `assign_daily_puzzle()` - Automatically assigns puzzles with queue priority and recycling
- `get_daily_fjord_puzzle()` - Returns today's puzzle
- `get_fjord_puzzle_by_number(puzzle_num)` - Returns specific puzzle
- `get_past_puzzles()` - Returns all previous puzzles

## Daily Puzzle System

### Automatic Assignment
- **Timing**: Daily at 01:00 UTC (after midnight)
- **Method**: GitHub Action calls Supabase Edge Function
- **Logic**: 
  1. Check queue for today's date
  2. If queued fjord exists, use it and delete queue entry
  3. If no queue, select unused fjord randomly
  4. If all fjords used, recycle oldest by `last_presented_date`

### Manual Queue Management

Queue specific fjords for future dates:

```sql
-- Queue a fjord for a specific date
INSERT INTO puzzle_queue (fjord_id, scheduled_date) 
VALUES (123, '2025-12-25');

-- Queue multiple fjords
INSERT INTO puzzle_queue (fjord_id, scheduled_date)
VALUES 
  (456, '2025-05-17'),  -- Constitution Day
  (789, '2025-12-24'),  -- Christmas Eve
  (123, '2025-12-25');  -- Christmas Day

-- View current queue
SELECT pq.scheduled_date, f.name as fjord_name, f.id as fjord_id
FROM puzzle_queue pq
JOIN fjords f ON pq.fjord_id = f.id
ORDER BY pq.scheduled_date;

-- Remove from queue
DELETE FROM puzzle_queue WHERE scheduled_date = '2025-12-25';
```

### Manual Puzzle Creation
Force create puzzle immediately:

```sql
SELECT assign_daily_puzzle();
```

### Monitoring
Check recent puzzles:

```sql
SELECT dp.presented_date, f.name, dp.puzzle_number
FROM daily_puzzles dp
JOIN fjords f ON dp.fjord_id = f.id
ORDER BY dp.presented_date DESC
LIMIT 10;
```

## GitHub Actions

### Daily Automation
- **File**: `.github/workflows/daily-puzzle.yml`
- **Schedule**: `0 1 * * *` (01:00 UTC daily)
- **Action**: Calls Supabase Edge Function to assign puzzle
- **Manual Trigger**: Can be run manually from GitHub Actions tab

### Configuration
Requires GitHub repository secret:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous public key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL

### Edge Function
- **Location**: Supabase dashboard → Edge Functions → daily-puzzle
- **URL**: `https://kvkmdkvmbuiqicgoqabx.supabase.co/functions/v1/daily-puzzle`
- **Purpose**: Executes `assign_daily_puzzle()` function

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
- **Results Display**: Guess history table with all attempts and Google Maps integration
- **Share Format**: Proximity visualized as green/yellow/black squares with direction arrows

## Assets

- **SVG Files**: `/public/fjord_svgs/` contains 1,467 fjord outline shapes
- **Naming**: Files follow pattern `####_FjordName.svg`
- **Source**: Generated from Norwegian Mapping Authority (Kartverket) data

## User Data

### Local Storage Keys
- `fjordle-session-id` - Anonymous session identifier
- `fjordle-stats` - User statistics (games played, win rate, streaks)
- `fjordle_puzzle_{id}_progress` - Individual puzzle progress

### Cookie Storage
- `fjordle-language` - User's preferred language ('no' or 'en')

### Tracked Stats
- Games played/won
- Current/max streaks  
- Win percentage
- Guess patterns for sharing

## File Structure

```
src/
├── app/                 # Next.js app router
│   ├── about/           # About page
│   ├── api/             # API routes
│   │   ├── past-puzzles/     # Past puzzles API
│   │   └── puzzle/[number]/  # Specific puzzle API
│   ├── how-to-play/     # How to play page
│   ├── past/            # Past puzzles page
│   ├── privacy/         # Privacy policy page
│   ├── puzzle/[number]/ # Individual puzzle pages
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout with server-side language detection
│   ├── page.tsx         # Home page
│   ├── robots.ts        # Robots.txt generation
│   └── sitemap.ts       # Sitemap generation
├── components/          # React components
│   ├── Game/            # Game-specific components
│   │   ├── FjordDisplay.tsx      # Fjord outline display
│   │   ├── GameBoard.tsx         # Main game interface
│   │   ├── GuessHistory.tsx      # Previous attempts with feedback
│   │   ├── GuessInput.tsx        # Autocomplete fjord input
│   │   ├── ResultsModal.tsx      # End game stats and sharing
│   │   └── Toast.tsx             # Notification component
│   ├── ClientLayout.tsx          # Client-side layout wrapper
│   ├── DebugInfo.tsx            # Development debug panel
│   └── NavigationMenu.tsx        # Main navigation menu
├── lib/                # Utilities and API functions
│   ├── cookies.ts               # Client-side cookie management
│   ├── gameLogic.ts             # Core game mechanics
│   ├── languageContext.tsx      # i18n context and translations
│   ├── localStorage.ts          # Browser storage utilities
│   ├── puzzleApi.ts             # Puzzle data API functions
│   ├── serverCookies.ts         # Server-side cookie reading
│   ├── session_api.ts           # Session tracking API
│   ├── supabase.ts              # Database connection
│   ├── translations.ts          # Translation data
│   ├── useFormattedDate.ts       # Custom hook for date formatting
│   └── utils.ts                 # General utilities
├── types/              # TypeScript interfaces
│   └── game.ts                  # Game-related types
.github/
└── workflows/
    └── daily-puzzle.yml        # GitHub Action for daily automation
public/
├── fjord_svgs/         # 1,467 fjord outline SVGs
├── og-image.png        # Social media image
├── favicon files       # Various favicon formats
└── site.webmanifest    # PWA manifest
```

## Key Components

- `GameBoard` - Main game interface
- `FjordDisplay` - Shows fjord outline SVG
- `GuessInput` - Autocomplete fjord name input
- `GuessHistory` - Shows previous attempts with feedback
- `ResultsModal` - End game stats, guess history table, and sharing with Google Maps integration
- `LanguageProvider` - i18n context wrapper
- `LanguageToggle` - Flag-based language switcher
- `NavigationMenu` - Dropdown navigation menu

## Translation Management

### Adding New Translations
1. Add translation keys to `lib/languageContext.tsx`
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
- **Norwegian Flash**: Brief Norwegian text may appear before English loads (acceptable trade-off for working navigation)

## Troubleshooting

### No Puzzle Available
Check if daily puzzle exists:
```sql
SELECT * FROM daily_puzzles WHERE presented_date = CURRENT_DATE;
```

Create today's puzzle manually:
```sql
SELECT assign_daily_puzzle();
```

### GitHub Action Failed
1. Check Actions tab in GitHub repository
2. Click failed run to see error details
3. Common issues:
   - Missing `SUPABASE_ANON_KEY` secret
   - Supabase Edge Function not deployed
   - Database function errors

### Database Connection Issues
- Verify environment variables are set
- Check Supabase project status and API keys
- Ensure RLS policies allow anonymous read access

### SVG Not Loading
- Verify file exists in `/public/fjord_svgs/`
- Check filename matches database `svg_filename` field exactly
- Ensure proper file permissions after deployment

### Language/Translation Issues
- Check browser cookies for `fjordle-language` key
- Verify `useLanguage` hook is used within `LanguageProvider`
- Ensure all translation keys exist in both languages
- Check browser console for missing translation warnings

### Navigation Issues
- If navigation links don't work after deployment, delete `.next` build cache and redeploy
- Next.js chunk caching can serve old JavaScript even with new source code
- Force fresh build: `rm -rf .next` then push to trigger new deployment
- This prevents cached JavaScript chunks from breaking navigation functionality

## Common Tasks

### Queue Special Date
```sql
-- Queue famous fjords for holidays
INSERT INTO puzzle_queue (fjord_id, scheduled_date) 
VALUES 
  (SELECT id FROM fjords WHERE name = 'Geirangerfjorden' LIMIT 1, '2025-05-17'),
  (SELECT id FROM fjords WHERE name = 'Nærøyfjorden' LIMIT 1, '2025-12-25');
```

### Check System Status
```sql
-- Recent puzzles
SELECT dp.presented_date, f.name, dp.puzzle_number
FROM daily_puzzles dp
JOIN fjords f ON dp.fjord_id = f.id
ORDER BY dp.presented_date DESC
LIMIT 5;

-- Upcoming queue
SELECT pq.scheduled_date, f.name
FROM puzzle_queue pq
JOIN fjords f ON pq.fjord_id = f.id
WHERE pq.scheduled_date >= CURRENT_DATE
ORDER BY pq.scheduled_date;

-- Total fjords used
SELECT COUNT(*) as total_fjords, 
       COUNT(DISTINCT dp.fjord_id) as used_fjords
FROM fjords f
LEFT JOIN daily_puzzles dp ON f.id = dp.fjord_id;
```

### Update GitHub Secrets
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Update `SUPABASE_ANON_KEY` if Supabase keys change
3. Secrets are automatically used by GitHub Actions