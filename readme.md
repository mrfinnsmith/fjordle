# Fjordle

Daily Norwegian fjord guessing game. Players identify fjords from their distinctive outline shapes using distance and direction clues.

## How It Works

- One fjord puzzle per day
- Players have 6 attempts to guess correctly
- Wrong guesses show distance (km) and direction arrow to correct fjord
- Proximity percentage helps players triangulate the location
- Shareable results with emoji patterns

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Assets**: 1,467 Norwegian fjord SVG outlines
- **Storage**: Local storage for user stats and game progress

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

## Deployment Notes

- Set `NEXT_PUBLIC_SITE_URL` for proper OpenGraph/canonical URLs
- Ensure Supabase RLS policies allow anonymous access
- Verify all 1,467 SVG files are deployed to `/public/fjord_svgs/`

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