# Fjordle

Daily Norwegian fjord guessing game. Players identify fjords from their distinctive outline shapes using distance and direction clues.

## How It Works

- One fjord puzzle per day
- Players have 6 attempts to guess correctly
- Wrong guesses show distance (km) and direction arrow to correct fjord
- Proximity percentage helps players triangulate the location
- Shareable results with proximity square patterns and streak tracking

## Hints System

- **First Letter Hint**: Reveals the first letter of the fjord name
- **Hover Tooltip**: Hint button shows translated tooltip text
- **Persistent State**: Hint usage saved per puzzle in localStorage
- **Satellite Images**: Second hint type showing aerial view of fjord for identification help

## Onboarding System

- **First-Time User Experience**: Modal automatically appears for new users
- **4-Step Tutorial**: Progressive explanation of game mechanics
  1. **Fjord Outline**: Explains daily fjord puzzles and visual identification
  2. **Typing & Selection**: Shows how to use autocomplete dropdown and submit guesses
  3. **6 Guesses**: Explains attempt limit and feedback system
  4. **Help & Hints**: Describes hint system and how-to-play access
- **Bilingual Language Toggle**: Language switcher within modal (Want this in English?/Vil du ha dette pÃ¥ norsk?)
- **Versioned Storage**: localStorage tracks onboarding version for future updates
- **Navigation Controls**: Back button for previous steps, X close button in top-right
- **Smart Persistence**: Only shows once per version, can be reset by clearing localStorage

## Internationalization

- **Default Language**: Norwegian (bokmÃ¥l) 
- **Language Toggle**: Flag icons (ðŸ‡³ðŸ‡´/ðŸ‡¬ðŸ‡§) in top-right corner
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
- **Difficulty Assessment**: Monthly automated difficulty tier updates based on player performance

## Database Schema

### Core Tables
- `fjords` - 1,467 Norwegian fjords with names, coordinates, SVG filenames, and quarantine status
- `daily_puzzles` - Daily puzzle assignments with fjord_id, puzzle_number, and last_presented_date
- `puzzle_queue` - Manual queue for specific dates (optional)
- `game_sessions` - Anonymous user sessions with completion stats
- `guesses` - Individual guess attempts with distance/proximity data

### Fjord Quarantine System
Problematic fjords are quarantined in-place using flags rather than a separate table:
- `quarantined` BOOLEAN DEFAULT FALSE - Whether fjord is quarantined
- `quarantine_reason` TEXT - Reason for quarantine (duplicates, naming issues, etc.)
- `quarantined_at` TIMESTAMP - When fjord was quarantined

### Key Functions
- `assign_daily_puzzle()` - Automatically assigns puzzles with queue priority and recycling (excludes quarantined fjords)
- `get_daily_fjord_puzzle()` - Returns today's puzzle
- `get_fjord_puzzle_by_number(puzzle_num)` - Returns specific puzzle
- `get_past_puzzles()` - Returns all previous puzzles
- `update_difficulty_tiers()` - Monthly difficulty assessment function that updates fjord difficulty tiers based on actual player performance data

## Daily Puzzle System

### Automatic Assignment
- **Timing**: Daily at 01:00 UTC (after midnight)
- **Method**: GitHub Action calls Supabase Edge Function
- **Logic**: 
  1. Check queue for today's date
  2. If queued fjord exists, use it and delete queue entry
  3. If no queue, select unused non-quarantined fjord randomly
  4. If all non-quarantined fjords used, recycle oldest by `last_presented_date`

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

### Quarantine Management

Quarantine problematic fjords:

```sql
-- Quarantine a fjord
UPDATE fjords 
SET quarantined = TRUE, 
    quarantine_reason = 'Duplicate naming in source data',
    quarantined_at = NOW()
WHERE id = 700;

-- View quarantined fjords
SELECT id, name, quarantine_reason, quarantined_at 
FROM fjords 
WHERE quarantined = TRUE
ORDER BY quarantined_at DESC;

-- Unquarantine a fjord
UPDATE fjords 
SET quarantined = FALSE, 
    quarantine_reason = NULL,
    quarantined_at = NULL
WHERE id = 700;
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

## Difficulty Assessment System

### Monthly Difficulty Updates
- **Timing**: Monthly on 1st at 02:00 UTC
- **Method**: GitHub Action calls Supabase Edge Function
- **Function**: `update_difficulty_tiers()` analyzes player performance data
- **Thresholds**: Dynamic percentile-based or fallback to fixed (45%/30%) for insufficient data
- **Minimum Sessions**: 10+ sessions required per fjord for tier assignment

### Difficulty Tiers
- **Easy (1)**: High win rate fjords (67th percentile or 45%+ win rate)
- **Medium (2)**: Moderate win rate fjords (33rd-67th percentile or 30-44% win rate)  
- **Hard (3)**: Low win rate fjords (below 33rd percentile or <30% win rate)

### Manual Difficulty Update
Run difficulty assessment immediately:

```sql
SELECT * FROM update_difficulty_tiers();
```

Returns execution metrics: time, updated count, tier distribution, and changes.

## GitHub Actions

### Daily Automation
- **File**: `.github/workflows/daily-puzzle.yml`
- **Schedule**: `0 1 * * *` (01:00 UTC daily)
- **Action**: Calls Supabase Edge Function to assign puzzle
- **Manual Trigger**: Can be run manually from GitHub Actions tab

### Monthly Difficulty Update
- **File**: `.github/workflows/monthly-difficulty-update.yml`
- **Schedule**: `0 2 1 * *` (1st of every month at 02:00 UTC)
- **Action**: Calls Supabase Edge Function to update difficulty tiers
- **Manual Trigger**: Can be run manually from GitHub Actions tab

### Configuration
Requires GitHub repository secret:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous public key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL

### Edge Function
- **Location**: Supabase dashboard â†' Edge Functions â†' daily-puzzle
- **URL**: `https://kvkmdkvmbuiqicgoqabx.supabase.co/functions/v1/daily-puzzle`
- **Purpose**: Executes `assign_daily_puzzle()` function

### Edge Function
- **Location**: Supabase dashboard → Edge Functions → update-difficulty
- **Purpose**: Executes `update_difficulty_tiers()` function and returns execution metrics

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
- **Satellite Images**: `/public/fjord_satellite/` contains satellite images for hint system
- **Naming**: Files follow pattern `####_FjordName.svg` and `####_FjordName.png`
- **Source**: Generated from Norwegian Mapping Authority (Kartverket) data
- **Generation**: Use `python3 tools/generate_satellite_images.py` with Google Maps API key

### Satellite Image Generation

Generate satellite images for fjords:

1. Set `GOOGLE_MAPS_API_KEY` in `.env.local`
2. Export fjord data: `SELECT name, svg_filename, center_lat, center_lng FROM fjords;`
3. Save as `tools/all_fjords.json`
4. Run: `python3 tools/generate_satellite_images.py`

Script skips existing files and includes error handling.

## User Data

### Local Storage Keys
- `fjordle-session-id` - Anonymous session identifier
- `fjordle-stats` - User statistics (games played, win rate, streaks)
- `fjordle_puzzle_{id}_progress` - Individual puzzle progress
- `fjordle-onboarding-version` - Onboarding tutorial version (current: 1)
- `fjordle_hints_{puzzle_id}` - Hint usage per puzzle

### Cookie Storage
- `fjordle-language` - User's preferred language ('no' or 'en')

### Tracked Stats
- Games played/won
- Current/max streaks  
- Win percentage
- Hint usage per puzzle
- Guess patterns for sharing

## File Structure

```
src/
â"œâ"€â"€ app/                 # Next.js app router
â"‚   â"œâ"€â"€ api/             # API routes
â"‚   â"‚   â"œâ"€â"€ advance-puzzle/
â"‚   â"‚   â"œâ"€â"€ past-puzzles/     # Past puzzles API
â"‚   â"‚   â""â"€â"€ puzzle/[number]/  # Specific puzzle API
â"‚   â"œâ"€â"€ hvordan-spille/  # How to play page (Norwegian)
â"‚   â"‚   â"œâ"€â"€ layout.tsx   # Page-specific metadata
â"‚   â"‚   â""â"€â"€ page.tsx
â"‚   â"œâ"€â"€ om/              # About page (Norwegian)
â"‚   â"‚   â"œâ"€â"€ layout.tsx   # Page-specific metadata
â"‚   â"‚   â""â"€â"€ page.tsx
â"‚   â"œâ"€â"€ personvern/      # Privacy policy page (Norwegian)
â"‚   â"‚   â"œâ"€â"€ layout.tsx   # Page-specific metadata
â"‚   â"‚   â""â"€â"€ page.tsx
â"‚   â"œâ"€â"€ spoersmaal-og-svar/ # FAQ page (Norwegian)
â"‚   â"‚   â"œâ"€â"€ layout.tsx   # Page-specific metadata
â"‚   â"‚   â""â"€â"€ page.tsx
â"‚   â"œâ"€â"€ tidligere/       # Past puzzles page (Norwegian)
â"‚   â"‚   â"œâ"€â"€ layout.tsx   # Page-specific metadata
â"‚   â"‚   â""â"€â"€ page.tsx
â"‚   â"œâ"€â"€ puzzle/[number]/ # Individual puzzle pages
â"‚   â"‚   â""â"€â"€ page.tsx
â"‚   â"œâ"€â"€ globals.css      # Global styles
â"‚   â"œâ"€â"€ layout.tsx       # Root layout with server-side language detection
â"‚   â"œâ"€â"€ page.tsx         # Home page
â"‚   â"œâ"€â"€ robots.ts        # Robots.txt generation
â"‚   â""â"€â"€ sitemap.ts       # Sitemap generation
â"œâ"€â"€ components/          # React components
â"‚   â"œâ"€â"€ Game/            # Game-specific components
â"‚   â"‚   â"œâ"€â"€ FjordDisplay.tsx      # Fjord outline display
â"‚   â"‚   â"œâ"€â"€ GameBoard.tsx         # Main game interface
â"‚   â"‚   â"œâ"€â"€ GuessHistory.tsx      # Previous attempts with feedback
â"‚   â"‚   â"œâ"€â"€ GuessInput.tsx        # Autocomplete fjord input
â"‚   â"‚   â"œâ"€â"€ OnboardingModal.tsx   # First-time user tutorial modal
â"‚   â"‚   â"œâ"€â"€ ResultsModal.tsx      # End game stats and sharing
â"‚   â"‚   â"œâ"€â"€ Toast.tsx             # Notification component
â"‚   â"‚   â"œâ"€â"€ FirstLetterHint.tsx   # First letter hint component
â"‚   â"‚   â"œâ"€â"€ SatelliteHint.tsx     # Satellite image hint component
â"‚   â"‚   â"œâ"€â"€ SatelliteModal.tsx    # Satellite image display modal
â"‚   â"‚   â""â"€â"€ LoadingSpinner.tsx    # Loading state component
â"‚   â"œâ"€â"€ ClientLayout.tsx          # Client-side layout wrapper
â"‚   â"œâ"€â"€ DebugInfo.tsx            # Development debug panel
â"‚   â""â"€â"€ NavigationMenu.tsx        # Main navigation menu
â"œâ"€â"€ lib/                # Utilities and API functions
â"‚   â"œâ"€â"€ cookies.ts               # Client-side cookie management
â"‚   â"œâ"€â"€ gameLogic.ts             # Core game mechanics
â"‚   â"œâ"€â"€ languageContext.tsx      # i18n context and translations
â"‚   â"œâ"€â"€ localStorage.ts          # Browser storage utilities
â"‚   â"œâ"€â"€ puzzleApi.ts             # Puzzle data API functions
â"‚   â"œâ"€â"€ serverCookies.ts         # Server-side cookie reading
â"‚   â"œâ"€â"€ session_api.ts           # Session tracking API
â"‚   â"œâ"€â"€ supabase.ts              # Database connection
â"‚   â"œâ"€â"€ translations.ts          # Translation data
â"‚   â"œâ"€â"€ useFormattedDate.ts       # Custom hook for date formatting
â"‚   â""â"€â"€ utils.ts                 # General utilities
â"œâ"€â"€ types/              # TypeScript interfaces
â"‚   â""â"€â"€ game.ts                  # Game-related types
.github/
â""â"€â"€ workflows/
    â"œâ"€â"€ daily-puzzle.yml        # GitHub Action for daily automation
    â""â"€â"€ monthly-difficulty-update.yml # GitHub Action for monthly difficulty updates
public/
â"œâ"€â"€ fjord_svgs/         # 1,467 fjord outline SVGs
â"œâ"€â"€ fjord_satellite/    # Satellite images for hint system
â"œâ"€â"€ og-image.png        # Social media image
â"œâ"€â"€ favicon files       # Various favicon formats
â""â"€â"€ site.webmanifest    # PWA manifest
tools/
â"œâ"€â"€ all_fjords.json     # Fjord data for satellite image generation
â"œâ"€â"€ fjord_wikipedia_matcher.py  # Wikipedia URL matching script
â"œâ"€â"€ fjord_wikipedia_matches.csv # Wikipedia URL matches (generated)
â"œâ"€â"€ fjord_wikipedia_matches.json # Wikipedia URL matches (generated)
â"œâ"€â"€ generate_fjord_svgs.py      # SVG generation script
â""â"€â"€ generate_satellite_images.py # Satellite image generation script
```

## Key Components

- `GameBoard` - Main game interface
- `FjordDisplay` - Shows fjord outline SVG
- `GuessInput` - Autocomplete fjord name input (excludes quarantined fjords)
- `GuessHistory` - Shows previous attempts with feedback
- `OnboardingModal` - First-time user tutorial with bilingual language toggle
- `ResultsModal` - End game stats, guess history table, and sharing with Google Maps integration
- `LanguageProvider` - i18n context wrapper
- `LanguageToggle` - Flag-based language switcher
- `NavigationMenu` - Dropdown navigation menu

## Page Structure

The site uses Norwegian URLs by default, reflecting the primary Norwegian audience:

- **Home**: `/` - Main game interface
- **How to Play**: `/hvordan-spille/` - Game instructions and rules
- **About**: `/om/` - About the game and project
- **FAQ**: `/spoersmaal-og-svar/` - Frequently asked questions
- **Past Puzzles**: `/tidligere/` - Archive of previous daily puzzles
- **Privacy**: `/personvern/` - Privacy policy and data handling
- **Individual Puzzles**: `/puzzle/[number]/` - Specific puzzle pages

Each page includes Norwegian SEO metadata via layout.tsx files for optimal search visibility.

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
- Default language is Norwegian (bokmÃ¥l) for SEO and audience targeting

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
  (SELECT id FROM fjords WHERE name = 'NÃ¦rÃ¸yfjorden' LIMIT 1, '2025-12-25');
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

-- Total fjords available (non-quarantined)
SELECT COUNT(*) as total_fjords, 
       COUNT(DISTINCT dp.fjord_id) as used_fjords
FROM fjords f
LEFT JOIN daily_puzzles dp ON f.id = dp.fjord_id
WHERE f.quarantined = FALSE;

-- Quarantined fjords
SELECT COUNT(*) as quarantined_count
FROM fjords 
WHERE quarantined = TRUE;
```

### Update GitHub Secrets
1. Go to GitHub repository â†' Settings â†' Secrets and variables â†' Actions
2. Update `SUPABASE_ANON_KEY` if Supabase keys change
3. Secrets are automatically used by GitHub Actions

### Onboarding Functions
- `hasSeenOnboarding()` - Checks if user has seen current onboarding version
- `markOnboardingSeen()` - Marks onboarding as completed for current version
- `ONBOARDING_VERSION` - Constant defining current onboarding version (currently 1)