/**
 * fill-fjord-data.mjs
 *
 * Fills measurement and Wikipedia URL gaps in fjordle_fjords by scraping
 * Norwegian Wikipedia infoboxes ({{Infoboks vannmasse}}).
 *
 * Priority:
 *   1. Measurements (length_km, width_km, depth_m) from Wikipedia infoboxes
 *   2. wikipedia_url_no for fjords that don't have one (via Wikipedia search API)
 *   3. wikipedia_url_en via interlanguage links
 *
 * Usage:
 *   node scripts/fill-fjord-data.mjs [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run   Print what would be updated, don't write to Supabase
 *   --limit N   Only process the first N fjords (for testing)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://elqudjtoonlaclicskxh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscXVkanRvb25sYWNsaWNza3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3NTYwOCwiZXhwIjoyMDcyNzUxNjA4fQ.pnXxd2CafifYof2AKZoYqZ88e-fhwLj6FdqLaBGYAj4';

const WIKI_API = 'https://no.wikipedia.org/w/api.php';
const WIKI_EN_API = 'https://en.wikipedia.org/w/api.php';
// Respectful rate limit: 1 request per second
const DELAY_MS = 1000;

const isDryRun = process.argv.includes('--dry-run');
const limitIdx = process.argv.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Parse a Norwegian decimal number like "15,5" or "15.5" → 15.5
 *  Handles ranges like "0,6―1,5" or "1-2" by taking the average.
 */
function parseNorwegianNumber(str) {
  if (!str) return null;
  // Replace Norwegian decimal comma, strip whitespace, normalise all dash/bar variants to ASCII -
  const cleaned = str.trim().replace(/,/g, '.').replace(/\s/g, '').replace(/[―–—]/g, '-');
  const rangeMatch = cleaned.match(/^([\d.]+)-([\d.]+)$/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    return Math.round(((lo + hi) / 2) * 10) / 10;
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Extract a field value from a wikitext infobox template */
function extractInfoboxField(wikitext, ...fieldNames) {
  for (const fieldName of fieldNames) {
    const regex = new RegExp(`\\|\\s*${fieldName}\\s*=\\s*([^|}\n]+)`, 'i');
    const match = wikitext.match(regex);
    if (match) {
      const val = match[1].trim();
      if (val) return val;
    }
  }
  return null;
}

/** Extract title from a Norwegian Wikipedia URL */
function titleFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/wiki/');
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
}

/** Fetch raw wikitext for a Norwegian Wikipedia article title */
async function fetchWikitext(title) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    format: 'json',
    titles: title,
    redirects: '1',
  });
  const res = await fetch(`${WIKI_API}?${params}`, {
    headers: { 'User-Agent': 'fjordle-data-fill/1.0 (fjordle.lol)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (page.missing !== undefined) return null;
  return page.revisions?.[0]?.['*'] ?? null;
}

/** Search Norwegian Wikipedia for a fjord by name, return best title or null */
async function searchWikiNo(name) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: name,
    srnamespace: '0',
    srlimit: '3',
    format: 'json',
  });
  const res = await fetch(`${WIKI_API}?${params}`, {
    headers: { 'User-Agent': 'fjordle-data-fill/1.0 (fjordle.lol)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.query?.search ?? [];
  if (results.length === 0) return null;
  // Accept the top result only if the title is a close match to the fjord name
  const topTitle = results[0].title;
  const normalised = name.toLowerCase().replace(/\s+/g, '_');
  const normalisedTitle = topTitle.toLowerCase().replace(/\s+/g, '_');
  if (normalisedTitle === normalised || normalisedTitle.startsWith(normalised)) {
    return topTitle;
  }
  return null;
}

/** Return true if the wikitext looks like a fjord/water body article (not a ship, person, etc.) */
function looksLikeFjordArticle(wikitext) {
  const lower = wikitext.toLowerCase();
  // Strip wikilinks for text matching: [[fjord]] → fjord, [[foo|fjord]] → fjord
  const plain = lower.replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2');
  return (
    lower.includes('infoboks vannmasse') ||
    lower.includes('infoboks fjord') ||
    plain.includes('er en fjord') ||
    plain.includes('er ein fjord') ||
    plain.includes('er et fjordarm') ||
    plain.includes('er en fjordarm') ||
    plain.includes('er ein fjordarm') ||
    plain.includes('er en havbukt') ||
    plain.includes('er ein havbukt') ||
    plain.includes('er en poll') ||
    plain.includes('er ein poll') ||
    plain.includes('er en bukt') ||
    plain.includes('er ein bukt')
  );
}

/** Get English Wikipedia title via interlanguage links from a NO article title */
async function fetchEnTitle(noTitle) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'langlinks',
    lllang: 'en',
    format: 'json',
    titles: noTitle,
    redirects: '1',
  });
  const res = await fetch(`${WIKI_API}?${params}`, {
    headers: { 'User-Agent': 'fjordle-data-fill/1.0 (fjordle.lol)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const langlinks = page.langlinks ?? [];
  const en = langlinks.find(l => l.lang === 'en');
  return en?.['*'] ?? null;
}

/** Parse infobox from wikitext, return measurements object */
function parseMeasurements(wikitext, sourceUrl) {
  const result = {};

  const lengthRaw = extractInfoboxField(wikitext, 'lengde', 'length');
  const widthRaw = extractInfoboxField(wikitext, 'bredde', 'breidde', 'width');
  const depthRaw = extractInfoboxField(wikitext, 'dybde', 'djupne', 'depth', 'maxdybde');

  const length = parseNorwegianNumber(lengthRaw);
  const width = parseNorwegianNumber(widthRaw);
  const depth = parseNorwegianNumber(depthRaw);

  if (length !== null) result.length_km = length;
  if (width !== null) result.width_km = width;
  if (depth !== null) result.depth_m = depth;

  if (Object.keys(result).length > 0 && sourceUrl) {
    result.measurement_source_url = sourceUrl;
  }

  return result;
}

async function main() {
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);

  // Fetch all non-quarantined fjords
  const { data: fjords, error } = await supabase
    .from('fjordle_fjords')
    .select('id, name, slug, wikipedia_url_no, wikipedia_url_en, length_km, width_km, depth_m')
    .eq('quarantined', false)
    .order('name');

  if (error) {
    console.error('Failed to fetch fjords:', error);
    process.exit(1);
  }

  console.log(`Fetched ${fjords.length} fjords`);

  const toProcess = fjords.slice(0, limit);

  let updatedCount = 0;
  let skippedCount = 0;
  let noDataCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const fjord = toProcess[i];
    const needsMeasurements = fjord.length_km == null || fjord.depth_m == null || fjord.width_km == null;
    const needsWikiNo = !fjord.wikipedia_url_no;
    const needsWikiEn = !fjord.wikipedia_url_en;

    if (!needsMeasurements && !needsWikiNo && !needsWikiEn) {
      skippedCount++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${toProcess.length}] ${fjord.name} ... `);

    let noTitle = null;
    let wikitext = null;
    let updates = {};

    // Step 1: resolve NO Wikipedia title
    if (fjord.wikipedia_url_no) {
      noTitle = titleFromUrl(fjord.wikipedia_url_no);
    } else if (needsWikiNo || needsMeasurements) {
      await sleep(DELAY_MS);
      noTitle = await searchWikiNo(fjord.name);
      if (noTitle) {
        const candidateUrl = `https://no.wikipedia.org/wiki/${encodeURIComponent(noTitle)}`;
        updates.wikipedia_url_no = candidateUrl;
      }
    }

    // Step 2: fetch wikitext if we have a title
    if (noTitle && (needsMeasurements || !fjord.wikipedia_url_no)) {
      await sleep(DELAY_MS);
      const candidate = await fetchWikitext(noTitle);
      if (candidate && looksLikeFjordArticle(candidate)) {
        wikitext = candidate;
      } else if (candidate) {
        // Article exists but isn't a fjord — discard the search-found title/URL
        noTitle = null;
        delete updates.wikipedia_url_no;
      }
    }

    // Step 3: parse measurements
    if (wikitext && needsMeasurements) {
      const sourceUrl = fjord.wikipedia_url_no ?? updates.wikipedia_url_no;
      const measurements = parseMeasurements(wikitext, sourceUrl);
      // Only update fields that are currently null
      if (fjord.length_km == null && measurements.length_km != null) {
        updates.length_km = measurements.length_km;
      }
      if (fjord.width_km == null && measurements.width_km != null) {
        updates.width_km = measurements.width_km;
      }
      if (fjord.depth_m == null && measurements.depth_m != null) {
        updates.depth_m = measurements.depth_m;
      }
      // Only set source URL if we're actually adding at least one measurement
      const addingMeasurement = updates.length_km != null || updates.width_km != null || updates.depth_m != null;
      if (addingMeasurement && measurements.measurement_source_url) {
        updates.measurement_source_url = measurements.measurement_source_url;
      }
    }

    // Step 4: fetch EN Wikipedia link
    if (noTitle && needsWikiEn) {
      await sleep(DELAY_MS);
      const enTitle = await fetchEnTitle(noTitle);
      if (enTitle) {
        updates.wikipedia_url_en = `https://en.wikipedia.org/wiki/${encodeURIComponent(enTitle)}`;
      }
    }

    if (Object.keys(updates).length === 0) {
      console.log('no data found');
      noDataCount++;
      continue;
    }

    console.log(JSON.stringify(updates));

    if (!isDryRun) {
      const { error: updateError } = await supabase
        .from('fjordle_fjords')
        .update(updates)
        .eq('id', fjord.id);
      if (updateError) {
        console.error(`  ERROR updating ${fjord.name}:`, updateError.message);
      } else {
        updatedCount++;
      }
    } else {
      updatedCount++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Updated: ${updatedCount}`);
  console.log(`No data found: ${noDataCount}`);
  console.log(`Skipped (already complete): ${skippedCount}`);
}

main().catch(console.error);
