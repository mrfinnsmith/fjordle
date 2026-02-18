/**
 * fill-fjord-data-wikidata.mjs
 *
 * Fills measurement and Wikipedia URL gaps in fjordle_fjords using Wikidata.
 *
 * One SPARQL query fetches all Norwegian fjords from Wikidata with their
 * measurements (in SI units) and Wikipedia sitelinks across all languages.
 * Results are matched to our DB by name. No per-fjord HTTP requests, no
 * language hardcoding.
 *
 * Wikidata properties used:
 *   P2043 = length (normalised to metres, we convert to km)
 *   P2049 = width  (normalised to metres, we convert to km)
 *   P4511 = average depth (normalised to metres)
 *   P5597 = maximum depth (normalised to metres)
 *
 * Usage:
 *   node scripts/fill-fjord-data-wikidata.mjs [--dry-run] [--limit N]
 *
 * Options:
 *   --dry-run   Print what would be updated, don't write to Supabase
 *   --limit N   Only process the first N fjords (for testing)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://elqudjtoonlaclicskxh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscXVkanRvb25sYWNsaWNza3hoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3NTYwOCwiZXhwIjoyMDcyNzUxNjA4fQ.pnXxd2CafifYof2AKZoYqZ88e-fhwLj6FdqLaBGYAj4';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const isDryRun = process.argv.includes('--dry-run');
const limitIdx = process.argv.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetch all Norwegian fjords from Wikidata in one SPARQL query.
 * Returns an array of objects with label, altLabels, measurements, and wiki URLs.
 * Measurements are in SI base units (metres).
 */
async function fetchWikidataFjords() {
  // P31 = instance of, Q45776 = fjord, Q17 = Norway
  // psn: prefix gives normalised SI values (always in metres for lengths/depths)
  // GROUP_CONCAT aggregates multiple altLabels per item
  const sparql = `
SELECT ?item ?itemLabel
  (GROUP_CONCAT(DISTINCT ?altLabel; separator="|") AS ?altLabels)
  ?lengthM ?widthM ?avgDepthM ?maxDepthM
  ?noWikiTitle ?enWikiTitle
WHERE {
  # Q45776 = fjord, Q1251284 = fjord arm, Q3215290 = inlet, Q12284 = bay,
  # Q35509 = sound (water), Q40080 = cove, Q131681 = natural harbour
  VALUES ?type { wd:Q45776 wd:Q1251284 wd:Q3215290 wd:Q12284 wd:Q35509 wd:Q40080 wd:Q131681 }
  ?item wdt:P31 ?type ;
        wdt:P17 wd:Q20 .

  OPTIONAL {
    ?item p:P2043/psn:P2043 [ wikibase:quantityNormalizedValue ?lengthM ] .
  }
  OPTIONAL {
    ?item p:P2049/psn:P2049 [ wikibase:quantityNormalizedValue ?widthM ] .
  }
  OPTIONAL {
    ?item p:P4511/psn:P4511 [ wikibase:quantityNormalizedValue ?avgDepthM ] .
  }
  OPTIONAL {
    ?item p:P5597/psn:P5597 [ wikibase:quantityNormalizedValue ?maxDepthM ] .
  }
  OPTIONAL {
    ?noWiki schema:about ?item ;
            schema:isPartOf <https://no.wikipedia.org/> ;
            schema:name ?noWikiTitle .
  }
  OPTIONAL {
    ?enWiki schema:about ?item ;
            schema:isPartOf <https://en.wikipedia.org/> ;
            schema:name ?enWikiTitle .
  }
  OPTIONAL {
    ?item skos:altLabel ?altLabel .
    FILTER(LANG(?altLabel) IN ("no", "nn", "nb"))
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "no,nn,nb,en". }
}
GROUP BY ?item ?itemLabel ?lengthM ?widthM ?avgDepthM ?maxDepthM ?noWikiTitle ?enWikiTitle
`;

  console.log('Fetching Norwegian fjords from Wikidata...');
  const res = await fetch(`${SPARQL_ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'fjordle-data-fill/1.0 (fjordle.lol)',
    },
  });

  if (!res.ok) {
    throw new Error(`SPARQL request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.results.bindings;
}

/** Round to 1 decimal place */
function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Clean a DB fjord name for matching:
 * - Replace underscores with spaces
 * - Strip trailing disambiguation numbers (e.g. " 1", " 2", "_3")
 * - Lowercase
 */
function cleanName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\s+\d+$/, '')   // trailing " 1", " 2", etc.
    .trim()
    .toLowerCase();
}

/**
 * Build a lookup map from Wikidata results: normalised label → entry.
 * Also indexes altLabels so we can match by any known name.
 */
function buildLookup(bindings) {
  const map = new Map();

  for (const row of bindings) {
    const label = row.itemLabel?.value;
    if (!label) continue;

    const entry = {
      qid: row.item.value.split('/').pop(), // e.g. "Q45776"
      label,
      lengthKm: row.lengthM ? round1(parseFloat(row.lengthM.value) / 1000) : null,
      widthKm: row.widthM ? round1(parseFloat(row.widthM.value) / 1000) : null,
      // Prefer max depth over avg depth for our depth_m field
      depthM: row.maxDepthM
        ? round1(parseFloat(row.maxDepthM.value))
        : row.avgDepthM
        ? round1(parseFloat(row.avgDepthM.value))
        : null,
      noWikiTitle: row.noWikiTitle?.value ?? null,
      enWikiTitle: row.enWikiTitle?.value ?? null,
    };

    // Index by main label
    const key = label.toLowerCase();
    if (!map.has(key)) map.set(key, entry);

    // Index by each altLabel
    const altLabels = row.altLabels?.value ?? '';
    for (const alt of altLabels.split('|').filter(Boolean)) {
      const altKey = alt.toLowerCase();
      if (!map.has(altKey)) map.set(altKey, entry);
    }
  }

  return map;
}

/**
 * Try to find a Wikidata entry for a given DB fjord name.
 * Tries progressively stripped versions of the name.
 */
function findMatch(name, lookup) {
  const cleaned = cleanName(name);

  // 1. Exact match on cleaned name
  if (lookup.has(cleaned)) return lookup.get(cleaned);

  // 2. Without trailing directional word (Indre, Ytre, Nord, Sør, Vest, Øst, etc.)
  const withoutDir = cleaned.replace(/\s+(indre|ytre|nord|sør|vest|øst|inner|outer|nedre|øvre)$/i, '');
  if (withoutDir !== cleaned && lookup.has(withoutDir)) return lookup.get(withoutDir);

  // 3. Without trailing word entirely (e.g. "Lysefjorden Sandnes" → "Lysefjorden")
  const withoutLast = cleaned.replace(/\s+\S+$/, '');
  if (withoutLast !== cleaned && withoutLast.length > 3 && lookup.has(withoutLast)) {
    return lookup.get(withoutLast);
  }

  return null;
}

async function main() {
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Fetch Wikidata and DB in parallel
  const [wikidataBindings, dbResult] = await Promise.all([
    fetchWikidataFjords(),
    supabase
      .from('fjordle_fjords')
      .select('id, name, wikipedia_url_no, wikipedia_url_en, length_km, width_km, depth_m')
      .eq('quarantined', false)
      .order('name'),
  ]);

  if (dbResult.error) {
    console.error('Failed to fetch fjords:', dbResult.error);
    process.exit(1);
  }

  console.log(`Wikidata returned ${wikidataBindings.length} entries`);
  console.log(`DB has ${dbResult.data.length} fjords\n`);

  const lookup = buildLookup(wikidataBindings);
  const fjords = dbResult.data.slice(0, limit);

  let updatedCount = 0;
  let skippedCount = 0;
  let noMatchCount = 0;
  let noNewDataCount = 0;

  for (let i = 0; i < fjords.length; i++) {
    const fjord = fjords[i];
    const needsMeasurements = fjord.length_km == null || fjord.depth_m == null || fjord.width_km == null;
    const needsWikiNo = !fjord.wikipedia_url_no;
    const needsWikiEn = !fjord.wikipedia_url_en;

    if (!needsMeasurements && !needsWikiNo && !needsWikiEn) {
      skippedCount++;
      continue;
    }

    const match = findMatch(fjord.name, lookup);

    if (!match) {
      console.log(`[${i + 1}/${fjords.length}] ${fjord.name} ... no Wikidata match`);
      noMatchCount++;
      continue;
    }

    const updates = {};

    if (fjord.length_km == null && match.lengthKm != null) updates.length_km = match.lengthKm;
    if (fjord.width_km == null && match.widthKm != null) updates.width_km = match.widthKm;
    if (fjord.depth_m == null && match.depthM != null) updates.depth_m = match.depthM;

    const addingMeasurement = updates.length_km != null || updates.width_km != null || updates.depth_m != null;
    if (addingMeasurement) {
      updates.measurement_source_url = `https://www.wikidata.org/wiki/${match.qid}`;
    }

    if (needsWikiNo && match.noWikiTitle) {
      updates.wikipedia_url_no = `https://no.wikipedia.org/wiki/${encodeURIComponent(match.noWikiTitle)}`;
    }
    if (needsWikiEn && match.enWikiTitle) {
      updates.wikipedia_url_en = `https://en.wikipedia.org/wiki/${encodeURIComponent(match.enWikiTitle)}`;
    }

    if (Object.keys(updates).length === 0) {
      console.log(`[${i + 1}/${fjords.length}] ${fjord.name} ... matched ${match.qid} but no new data`);
      noNewDataCount++;
      continue;
    }

    console.log(`[${i + 1}/${fjords.length}] ${fjord.name} (${match.qid}) ... ${JSON.stringify(updates)}`);

    if (!isDryRun) {
      const { error } = await supabase
        .from('fjordle_fjords')
        .update(updates)
        .eq('id', fjord.id);
      if (error) {
        console.error(`  ERROR: ${error.message}`);
      } else {
        updatedCount++;
      }
    } else {
      updatedCount++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Updated:              ${updatedCount}`);
  console.log(`No Wikidata match:    ${noMatchCount}`);
  console.log(`Matched, no new data: ${noNewDataCount}`);
  console.log(`Skipped (complete):   ${skippedCount}`);
}

main().catch(console.error);
