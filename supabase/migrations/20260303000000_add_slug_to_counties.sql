-- Add slug column to fjordle_counties for URL-friendly county identifiers
ALTER TABLE fjordle_counties ADD COLUMN slug TEXT UNIQUE;

-- Populate slugs from county names:
-- lowercase, spaces to hyphens, Norwegian characters: æ->ae, ø->oe, å->aa
UPDATE fjordle_counties
SET slug = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(LOWER(name), ' ', '-'),
            'æ', 'ae'),
          'ø', 'oe'),
        'å', 'aa'),
      'é', 'e'),
    'ü', 'u'),
  'ö', 'o');

-- Now enforce NOT NULL
ALTER TABLE fjordle_counties ALTER COLUMN slug SET NOT NULL;
