# scripts/

One-off and utility scripts for maintaining fjord data. Not part of the app.

---

## scrape-wikipedia-measurements.mjs

Fills measurement and Wikipedia URL gaps by scraping **Norwegian Wikipedia infoboxes** (`{{Infoboks vannmasse}}`).

- Fetches each fjord's Norwegian Wikipedia page (or searches for one)
- Parses `lengde`, `bredde`, `dybde` from the infobox
- Falls back to text extraction via the existing `tools/fjord_data_extractor.py` approach
- Also fetches English Wikipedia URLs via interlanguage links

```bash
node scripts/scrape-wikipedia-measurements.mjs --dry-run        # preview only
node scripts/scrape-wikipedia-measurements.mjs --dry-run --limit 50
node scripts/scrape-wikipedia-measurements.mjs                  # writes to Supabase
```

**Verdict:** hit rate is low (~8%) because most fjords are too obscure for structured Wikipedia infoboxes. The `tools/` Python scripts already did a full pass — their data is in the DB. This script is a supplement for future gaps.

---

## scrape-wikidata-measurements.mjs

Fills measurement and Wikipedia URL gaps using **Wikidata** (one SPARQL query, no per-fjord HTTP requests).

- Fetches all Norwegian fjords from Wikidata in a single request
- Matches to our DB by name (with fuzzy cleaning for suffixes like `_1`, `_Indre` etc.)
- Measurements come from Wikidata properties P2043/P2049/P4511/P5597 in SI units
- Wikipedia URLs come from Wikidata sitelinks (all languages at once)

```bash
node scripts/scrape-wikidata-measurements.mjs --dry-run        # preview only
node scripts/scrape-wikidata-measurements.mjs --dry-run --limit 50
node scripts/scrape-wikidata-measurements.mjs                  # writes to Supabase
```

**Verdict:** Wikidata has very few measurements for Norwegian fjords — all 87 updates from a full run were Wikipedia URLs only. Still useful for picking up missing `wikipedia_url_no` and `wikipedia_url_en` values.

---

## History

The `tools/` directory contains Python scripts (`fjord_data_extractor.py`, `fjord_wikipedia_matcher.py`, `fjord_measurements_import.py`) that did a full data collection pass in August 2025. That data is already in Supabase. Running those again would mostly find nothing new.

The coverage ceiling after all scripts: ~16% of fjords have `length_km`, ~5% have `depth_m`. Most fjords are too obscure for any structured data source.
