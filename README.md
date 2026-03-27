# Fjordle

**Live at: https://fjordle.lol**

Daily Norwegian fjord guessing game. Players identify fjords from their distinctive outline shapes using distance and direction clues.

## How It Works

- One fjord puzzle per day
- Players have 6 attempts to guess correctly
- Wrong guesses show distance (km) and direction arrow to correct fjord
- Proximity percentage helps players triangulate the location
- Shareable results with proximity square patterns and streak tracking

## Hints System

- **First Letter Hint**: Reveals the first letter of the fjord name
- **Satellite Images**: Aerial view of fjord for identification help
- **Municipality Hint**: Shows which municipalities the fjord is located in
- **County Hint**: Shows which counties the fjord is located in
- **Measurements Hint**: Displays fjord length, width, and depth data
- **Weather Hint**: Current weather conditions at the fjord location
- **Hover Tooltip**: Hint button shows translated tooltip text
- **Persistent State**: Hint usage saved per puzzle in localStorage

## Onboarding System

- **First-Time User Experience**: Modal automatically appears for new users
- **4-Step Tutorial**: Progressive explanation of game mechanics
  1. **Fjord Outline**: Explains daily fjord puzzles and visual identification
  2. **Typing & Selection**: Shows how to use autocomplete dropdown and submit guesses
  3. **6 Guesses**: Explains attempt limit and feedback system
  4. **Help & Hints**: Describes hint system and how-to-play access
- **Bilingual Language Toggle**: Language switcher within modal (Want this in English?/Vil du ha dette på norsk?)
- **Versioned Storage**: localStorage tracks onboarding version for future updates
- **Navigation Controls**: Back button for previous steps, X close button in top-right
- **Smart Persistence**: Only shows once per version, can be reset by clearing localStorage

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
- **Weather API**: Open-Meteo (free, no API key required)
- **Assets**: 1,467 Norwegian fjord SVG outlines
- **Storage**: Local storage for user stats and game progress
- **i18n**: Server-side cookie detection with React Context for language switching
- **Automation**: GitHub Actions for daily puzzle assignment
- **Difficulty Assessment**: Monthly automated difficulty tier updates based on player performance
- **Performance Monitoring**: Core Web Vitals tracking with Lighthouse auditing
- **Testing**: Comprehensive test suite with Vitest (49 tests covering game logic)
- **Accessibility**: WCAG 2.1 compliant with full keyboard navigation and screen reader support

## Database Schema

### Core Tables
- `fjordle_fjords` - 1,467 Norwegian fjords with names, coordinates, SVG filenames, and quarantine status
- `fjordle_daily_puzzles` - Daily puzzle assignments with fjord_id, puzzle_number, and last_presented_date
- `fjordle_puzzle_queue` - Manual queue for specific dates (optional)
- `fjordle_game_sessions` - Anonymous user sessions with completion stats
- `fjordle_guesses` - Individual guess attempts with distance/proximity data

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

### Geographic Relationships
- `fjordle_fjord_municipalities` - Many-to-many linking fjords to municipalities  
- `fjordle_fjord_counties` - Many-to-many linking fjords to counties
- `fjordle_municipalities` - Municipality reference data
- `fjordle_counties` - County reference data

### Enhanced Fjord Data
Additional fjord table columns:
- `wikipedia_url_no` TEXT - Norwegian bokmål Wikipedia URL
- `wikipedia_url_en` TEXT - English Wikipedia URL  
- `wikipedia_url_nn` TEXT - Norwegian nynorsk Wikipedia URL
- `wikipedia_url_da` TEXT - Danish Wikipedia URL
- `wikipedia_url_ceb` TEXT - Cebuano Wikipedia URL
- `notes` TEXT - Additional metadata
- `satellite_filename` TEXT - Satellite image filename

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
INSERT INTO fjordle_puzzle_queue (fjord_id, scheduled_date) 
VALUES (123, '2025-12-25');

-- Queue multiple fjords
INSERT INTO fjordle_puzzle_queue (fjord_id, scheduled_date)
VALUES 
  (456, '2025-05-17'),  -- Constitution Day
  (789, '2025-12-24'),  -- Christmas Eve
  (123, '2025-12-25');  -- Christmas Day

-- View current queue
SELECT pq.scheduled_date, f.name as fjord_name, f.id as fjord_id
FROM fjordle_puzzle_queue pq
JOIN fjordle_fjords f ON pq.fjord_id = f.id
ORDER BY pq.scheduled_date;

-- Remove from queue
DELETE FROM fjordle_puzzle_queue WHERE scheduled_date = '2025-12-25';
```

### Quarantine Management

Quarantine problematic fjords:

```sql
-- Quarantine a fjord
UPDATE fjordle_fjords 
SET quarantined = TRUE, 
    quarantine_reason = 'Duplicate naming in source data',
    quarantined_at = NOW()
WHERE id = 700;

-- View quarantined fjords
SELECT id, name, quarantine_reason, quarantined_at 
FROM fjordle_fjords 
WHERE quarantined = TRUE
ORDER BY quarantined_at DESC;

-- Unquarantine a fjord
UPDATE fjordle_fjords 
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
FROM fjordle_daily_puzzles dp
JOIN fjordle_fjords f ON dp.fjord_id = f.id
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

## Weather System

### Weather Data Source
- **API**: Open-Meteo (https://api.open-meteo.com)
- **Cost**: Completely free, no API key required
- **Data**: Current temperature, wind speed/direction, weather conditions
- **Coverage**: Global coverage including all Norwegian fjord coordinates

### Caching Implementation
- **Type**: In-memory server-side cache using Map
- **Duration**: 30-minute TTL per fjord and language
- **Cache Key**: `weather_{fjordId}_{language}`
- **Benefits**: Reduces API calls from ~50/day to ~2-3/day per fjord
- **Scope**: Shared across all users hitting same server instance

### Weather API Endpoint
```
GET /api/weather/[fjordId]?lang={language}
```

### Cache Management
Monitor cache usage:
```typescript
import { getCacheStats, clearWeatherCache } from '@/lib/weatherApi'

// Check cache status
const stats = getCacheStats()
console.log(`Cache size: ${stats.size}, Keys: ${stats.keys}`)

// Clear cache if needed
clearWeatherCache()
```

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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous public key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL

### Edge Function
- **Location**: Supabase dashboard → Edge Functions → daily-puzzle
- **URL**: Update with new Supabase project URL after migration
- **Purpose**: Executes `assign_daily_puzzle()` function

### Edge Function
- **Location**: Supabase dashboard → Edge Functions → update-difficulty
- **Purpose**: Executes `update_difficulty_tiers()` function and returns execution metrics

## Local Development

```bash
npm install
npm run dev
```

## User Statistics System

Comprehensive user statistics and analytics are available at `/stats` (via "Statistikk" menu):

### Features
- **Progressive Disclosure**: Statistics unlock as players complete more games
- **Enhanced Analytics**: Detailed breakdowns by difficulty tiers and hint usage
- **Visual Charts**: Daily progress trends and performance visualization using Chart.js
- **Data Integrity**: Corruption detection and reporting for localStorage issues
- **Responsive Design**: Optimized for all screen sizes with skeleton loading states

### Statistics Tracked
- Games played/won with win percentage
- Current and maximum win streaks
- Average guesses per winning game
- Hint usage analytics (6 hint types with per-game tracking)
- Difficulty tier performance breakdown (easy/medium/hard)
- Daily progress visualization
- Game history table with detailed results

### Data Storage
- `EnhancedUserStats` interface with comprehensive analytics
- localStorage corruption detection and recovery
- Mock data generation for development/testing
- Version-aware data migration system

### Development Helper
```javascript
// In browser console (development only)
loadTestStats() // Loads mock data for testing statistics UI
```

## Performance Monitoring System

Comprehensive performance monitoring using Core Web Vitals and Lighthouse auditing:

### Real-Time Monitoring (`src/lib/performance.ts`)
- **Core Web Vitals**: LCP, FID, CLS, TTFB, INP tracking
- **Custom Metrics**: Page load timing, resource performance, memory usage
- **Game-Specific Tracking**: Performance events for game interactions
- **Analytics Integration**: Google Analytics event reporting
- **Development Logging**: Console output for debugging

### Performance Auditing
```bash
# Run comprehensive performance audit
npm run perf:report

# Generate baseline measurements  
npm run perf:baseline
```

### Lighthouse Integration
- **Multi-Page Audits**: Home, past puzzles, how-to-play pages
- **Production Testing**: Full build + production server testing
- **Automated Reporting**: HTML and JSON reports with metric comparisons
- **Continuous Monitoring**: Baseline tracking and performance regression detection

### Report Generation
- `performance-reports/` directory with timestamped audits
- Summary JSON with environment details and comparison metrics
- Web Vitals thresholds and rating system (good/needs-improvement/poor)

## Accessibility Implementation

Full WCAG 2.1 compliance with comprehensive accessibility features:

### Keyboard Navigation
- Full keyboard navigation support across all components
- Proper focus management in modals and dropdowns
- Visible focus indicators and logical tab ordering

### Screen Reader Support
- Semantic HTML structure with proper headings
- ARIA labels and roles throughout the application
- Live regions for dynamic content updates
- Descriptive alt text for all images and visual elements

### Accessibility Features
- High contrast ratios for text and interactive elements
- Scalable text that works up to 200% zoom
- Clear visual hierarchy and consistent navigation
- Error messages and form validation with screen reader announcements
- Modal dialogs with proper focus trapping and escape handling

### Testing
- Automated accessibility testing integrated into development
- Manual testing with keyboard-only navigation
- Screen reader compatibility verification

## Enhanced Loading States

Skeleton screens and optimized loading experiences:

### Skeleton Components (`src/components/ui/Skeleton.tsx`)
- **Reusable Skeleton**: Base skeleton component with customizable dimensions
- **SkeletonText**: Multi-line text placeholder with realistic proportions
- **SkeletonCard**: Pre-configured card layouts for common UI patterns

### Fjord Display Loading (`src/components/Game/FjordDisplaySkeleton.tsx`)
- SVG outline placeholder with proper aspect ratio
- Loading spinner with localized text
- Seamless transition to actual fjord display

### Progressive Loading
- Statistics page with progressive disclosure based on games played
- Loading states that match final content layout
- Optimized image loading with Next.js Image component
- Reduced main thread blocking during initial load

### Testing

Comprehensive test suite for game logic using Vitest:

```bash
# Run tests once
npm run test:run

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui

# Type checking
npm run type-check

# Linting
npm run lint
```

**Test Coverage:**
- Distance calculations (Haversine formula)
- Direction calculations (8-directional arrows)
- Proximity percentage algorithms
- Win/loss condition logic
- Guess validation and duplicate prevention
- Game state management
- Toast message logic

**49 comprehensive tests** covering edge cases, error boundaries, and real-world scenarios with Norwegian fjord coordinates.

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
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
2. Export fjord data: `SELECT name, svg_filename, center_lat, center_lng FROM fjordle_fjords;`
3. Save as `tools/all_fjords.json`
4. Run: `python3 tools/generate_satellite_images.py`

Script skips existing files and includes error handling.

## User Data

### Local Storage Keys
- `fjordle-session-id` - Anonymous session identifier
- `fjordle-stats` - User statistics (games played, win rate, streaks)
- `fjordle_puzzle_{id}_progress` - Individual puzzle progress
- `fjordle-onboarding-version` - Onboarding tutorial version (current: 1)
- `fjordle_hints_{puzzle_id}` - Hint usage per puzzle (6 hint types)

### Cookie Storage
- `fjordle-language` - User's preferred language ('no' or 'en')

### Tracked Stats
- Games played/won
- Current/max streaks  
- Win percentage
- Hint usage per puzzle (6 types)
- Guess patterns for sharing

## File Structure
```
src/
├── app/                 # Next.js app router
│   ├── api/             # API routes
│   │   ├── advance-puzzle/
│   │   ├── past-puzzles/     # Past puzzles API
│   │   ├── puzzle/[number]/  # Specific puzzle API
│   │   └── weather/[fjordId]/ # Weather data API
│   ├── hvordan-spille/  # How to play page (Norwegian)
│   │   ├── layout.tsx   # Page-specific metadata
│   │   └── page.tsx
│   ├── om/              # About page (Norwegian)
│   │   ├── layout.tsx   # Page-specific metadata
│   │   └── page.tsx
│   ├── personvern/      # Privacy policy page (Norwegian)
│   │   ├── layout.tsx   # Page-specific metadata
│   │   └── page.tsx
│   ├── spoersmaal-og-svar/ # FAQ page (Norwegian)
│   │   ├── layout.tsx   # Page-specific metadata
│   │   └── page.tsx
│   ├── stats/           # User statistics page
│   │   └── page.tsx     # Comprehensive analytics dashboard
│   ├── tidligere/       # Past puzzles page (Norwegian)
│   │   ├── layout.tsx   # Page-specific metadata
│   │   └── page.tsx
│   ├── puzzle/[number]/ # Individual puzzle pages
│   │   └── page.tsx
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout with server-side language detection
│   ├── page.tsx         # Home page
│   ├── robots.ts        # Robots.txt generation
│   └── sitemap.ts       # Sitemap generation
├── components/          # React components
│   ├── Game/            # Game-specific components
│   │   ├── FjordDisplay.tsx      # Fjord outline display
│   │   ├── FjordDisplaySkeleton.tsx # Loading skeleton for fjord display
│   │   ├── GameBoard.tsx         # Main game interface
│   │   ├── GuessHistory.tsx      # Previous attempts with feedback
│   │   ├── GuessInput.tsx        # Autocomplete fjord input
│   │   ├── OnboardingModal.tsx   # First-time user tutorial modal
│   │   ├── ResultsModal.tsx      # End game stats and sharing
│   │   ├── Toast.tsx             # Notification component
│   │   ├── FirstLetterHint.tsx   # First letter hint component
│   │   ├── SatelliteHint.tsx     # Satellite image hint component
│   │   ├── SatelliteModal.tsx    # Satellite image display modal
│   │   ├── MunicipalityHint.tsx  # Municipality hint component
│   │   ├── CountyHint.tsx        # County hint component
│   │   ├── MeasurementsHint.tsx  # Measurements hint component
│   │   ├── WeatherHint.tsx       # Weather hint component
│   │   ├── WeatherModal.tsx      # Weather display modal
│   │   └── LoadingSpinner.tsx    # Loading state component
│   ├── Stats/           # Statistics page components
│   │   ├── DailyProgress.tsx     # Daily progress visualization
│   │   ├── GameHistoryTable.tsx  # Detailed game history table
│   │   ├── PerformanceTrends.tsx # Performance trend analytics
│   │   └── StatsOverview.tsx     # Overview statistics cards
│   ├── ui/              # Reusable UI components
│   │   └── Skeleton.tsx          # Loading skeleton components
│   ├── ClientLayout.tsx          # Client-side layout wrapper
│   ├── DebugInfo.tsx            # Development debug panel
│   ├── ErrorBoundary.tsx        # Error boundary with retry functionality
│   ├── NavigationMenu.tsx        # Main navigation menu
│   ├── PerformanceMonitor.tsx   # Real-time performance monitoring
│   └── PerformanceReport.tsx    # Performance report display
├── lib/                # Utilities and API functions
│   ├── __tests__/              # Test files
│   │   └── gameLogic.test.ts    # Comprehensive game logic tests (49 tests)
│   ├── cookies.ts               # Client-side cookie management
│   ├── gameLogic.ts             # Core game mechanics
│   ├── languageContext.tsx      # i18n context and translations
│   ├── localStorage.ts          # Browser storage utilities with corruption detection
│   ├── mockStatsData.ts         # Mock data generator for statistics testing
│   ├── performance.ts           # Performance monitoring utilities
│   ├── puzzleApi.ts             # Puzzle data API functions
│   ├── serverCookies.ts         # Server-side cookie reading
│   ├── session_api.ts           # Session tracking API
│   ├── supabase.ts              # Database connection
│   ├── translations.ts          # Translation data
│   ├── useFormattedDate.ts      # Custom hook for date formatting
│   ├── utils.ts                 # General utilities
│   └── weatherApi.ts            # Weather data fetching and caching
├── test/               # Test configuration
│   └── setup.ts                 # Vitest test setup and global mocks
├── types/              # TypeScript interfaces
│   ├── game.ts                  # Game-related types with enhanced analytics
│   └── weather.ts               # Weather data types
.github/
└── workflows/
   ├── daily-puzzle.yml        # GitHub Action for daily automation
   └── monthly-difficulty-update.yml # GitHub Action for monthly difficulty updates
performance-reports/     # Lighthouse audit reports (generated)
├── lighthouse-*.html    # HTML performance reports
├── lighthouse-*.json    # JSON performance data
└── performance-summary.json # Summary report with comparisons
public/
├── fjord_svgs/         # 1,467 fjord outline SVGs
├── fjord_satellite/    # Satellite images for hint system
├── og-image.png        # Social media image
├── favicon files       # Various favicon formats
└── site.webmanifest    # PWA manifest
scripts/
└── performance-report.js # Performance audit and reporting script
tools/
├── all_fjords.json     # Fjord data for satellite image generation
├── fjord_wikipedia_matcher.py  # Wikipedia URL matching script
├── fjord_wikipedia_matches.csv # Wikipedia URL matches (generated)
├── fjord_wikipedia_matches.json # Wikipedia URL matches (generated)
├── generate_fjord_svgs.py      # SVG generation script
├── generate_satellite_images.py # Satellite image generation script
├── municipality_mapper.py      # Geographic relationship mapping
└── municipality_county_mapping.json # Municipality/county mappings
vitest.config.ts        # Vitest test configuration with TypeScript support
```

## Key Components

### Game Components
- `GameBoard` - Main game interface
- `FjordDisplay` - Shows fjord outline SVG with hint overlays
- `FjordDisplaySkeleton` - Loading skeleton for fjord display
- `GuessInput` - Autocomplete fjord name input (excludes quarantined fjords)
- `GuessHistory` - Shows previous attempts with feedback
- `OnboardingModal` - First-time user tutorial with bilingual language toggle
- `ResultsModal` - End game stats, guess history table, and sharing with Google Maps integration
- `WeatherHint` - Weather conditions hint with modal display
- `WeatherModal` - Detailed weather information display

### Statistics Components
- `StatsOverview` - Overview statistics cards with key metrics
- `DailyProgress` - Daily progress visualization with Chart.js
- `GameHistoryTable` - Detailed game history table
- `PerformanceTrends` - Performance trend analytics

### Infrastructure Components
- `ErrorBoundary` - Error boundary with retry functionality and analytics tracking
- `PerformanceMonitor` - Real-time Core Web Vitals monitoring
- `PerformanceReport` - Performance report display
- `Skeleton` - Reusable loading skeleton components
- `LanguageProvider` - i18n context wrapper
- `NavigationMenu` - Dropdown navigation menu

## Page Structure

The site uses Norwegian URLs by default, reflecting the primary Norwegian audience:

- **Home**: `/` - Main game interface
- **Statistics**: `/stats/` - Comprehensive user analytics dashboard
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
- **IMPORTANT**: Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` environment variables for new "games" Supabase project
- Update GitHub Actions secrets with new Supabase credentials
- Ensure Supabase RLS policies allow anonymous access
- Verify all 1,467 SVG files are deployed to `/public/fjord_svgs/`
- Weather API requires no additional configuration (no API key needed)
- Default language is Norwegian (bokmål) for SEO and audience targeting

## Troubleshooting

### No Puzzle Available
Check if daily puzzle exists:
```sql
SELECT * FROM fjordle_daily_puzzles WHERE presented_date = CURRENT_DATE;
```

Create today's puzzle manually:
```sql
SELECT assign_daily_puzzle();
```

### GitHub Action Failed
1. Check Actions tab in GitHub repository
2. Click failed run to see error details
3. Common issues:
   - Missing `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` secret
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

### Weather Hint Issues
- Check browser network tab for failed API calls to `/api/weather/`
- Verify fjord has valid `center_lat` and `center_lng` coordinates
- Open-Meteo API has 99.9% uptime, temporary failures are rare
- Check server logs for weather API errors

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
INSERT INTO fjordle_puzzle_queue (fjord_id, scheduled_date) 
VALUES 
  ((SELECT id FROM fjordle_fjords WHERE name = 'Geirangerfjorden' LIMIT 1), '2025-05-17'),
  ((SELECT id FROM fjordle_fjords WHERE name = 'Nærøyfjorden' LIMIT 1), '2025-12-25');
```

### Check System Status
```sql
-- Recent puzzles
SELECT dp.presented_date, f.name, dp.puzzle_number
FROM fjordle_daily_puzzles dp
JOIN fjordle_fjords f ON dp.fjord_id = f.id
ORDER BY dp.presented_date DESC
LIMIT 5;

-- Upcoming queue
SELECT pq.scheduled_date, f.name
FROM fjordle_puzzle_queue pq
JOIN fjordle_fjords f ON pq.fjord_id = f.id
WHERE pq.scheduled_date >= CURRENT_DATE
ORDER BY pq.scheduled_date;

-- Total fjords available (non-quarantined)
SELECT COUNT(*) as total_fjords, 
       COUNT(DISTINCT dp.fjord_id) as used_fjords
FROM fjordle_fjords f
LEFT JOIN fjordle_daily_puzzles dp ON f.id = dp.fjord_id
WHERE f.quarantined = FALSE;

-- Quarantined fjords
SELECT COUNT(*) as quarantined_count
FROM fjordle_fjords 
WHERE quarantined = TRUE;
```

### Update GitHub Secrets
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Update `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if Supabase keys change
3. Secrets are automatically used by GitHub Actions

### Onboarding Functions
- `hasSeenOnboarding()` - Checks if user has seen current onboarding version
- `markOnboardingSeen()` - Marks onboarding as completed for current version
- `ONBOARDING_VERSION` - Constant defining current onboarding version (currently 1)