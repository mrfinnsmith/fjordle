/**
 * Populates fjordle_fjord_counties junction table by intersecting
 * Fjordkatalogen fjord polygons with Norwegian county boundary polygons.
 *
 * Data sources:
 * - Fjordkatalogen WFS (fjord polygons): Miljødirektoratet
 * - County boundaries GeoJSON: Kartverket via Geonorge
 *
 * Usage: node scripts/populate-fjord-counties.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars
 */

const fs = require('fs')
const path = require('path')
const booleanIntersects = require('@turf/boolean-intersects').default
const simplify = require('@turf/simplify').default
const { createClient } = require('@supabase/supabase-js')

const DATA_DIR = path.join(__dirname, 'data')

// Load datasets
console.log('Loading county boundaries...')
const countyData = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'Basisdata_0000_Norge_4258_Fylker_GeoJSON.geojson'), 'utf8')
)
const countyFeatures = countyData.Fylke.features

// Simplify county polygons for faster intersection (tolerance in degrees, ~500m)
const simplifiedCounties = countyFeatures.map(f => {
    const simplified = simplify(f, { tolerance: 0.005, highQuality: false })
    simplified.properties = f.properties
    return simplified
})

console.log(`Loaded ${simplifiedCounties.length} county polygons:`)
for (const f of simplifiedCounties) {
    console.log(`  ${f.properties.fylkesnavn}`)
}

console.log('\nLoading fjord polygons...')
const fjordData = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'fjordkatalogen.geojson'), 'utf8')
)
const fjordFeatures = fjordData.features
console.log(`Loaded ${fjordFeatures.length} fjord polygons`)

// Build a map from fjord name (lowercase) to array of features (some names repeat)
const fjordByName = new Map()
for (const f of fjordFeatures) {
    const name = (f.properties.navn || '').toLowerCase().trim()
    if (!name) continue
    if (!fjordByName.has(name)) fjordByName.set(name, [])
    fjordByName.get(name).push(f)
}

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch all fjords from DB
    console.log('\nFetching fjords from database...')
    const allFjords = []
    let offset = 0
    while (true) {
        const { data, error } = await supabase
            .from('fjordle_fjords')
            .select('id, name, center_lat, center_lng')
            .range(offset, offset + 999)
            .order('id')
        if (error) { console.error('DB error:', error); process.exit(1) }
        if (!data || data.length === 0) break
        allFjords.push(...data)
        offset += data.length
        if (data.length < 1000) break
    }
    console.log(`Fetched ${allFjords.length} fjords from DB`)

    // Fetch all counties from DB
    const { data: dbCounties, error: countyErr } = await supabase
        .from('fjordle_counties')
        .select('id, name')
    if (countyErr) { console.error('County DB error:', countyErr); process.exit(1) }

    // Map county names to DB IDs
    const countyNameToId = new Map()
    for (const c of dbCounties) {
        countyNameToId.set(c.name.toLowerCase(), c.id)
    }
    console.log(`\nDB counties: ${dbCounties.map(c => c.name).join(', ')}`)

    // Map GeoJSON county names to DB county IDs (handle Sami name suffixes)
    const geoCountyToDbId = new Map()
    for (const f of simplifiedCounties) {
        const geoName = f.properties.fylkesnavn
        const lower = geoName.toLowerCase()
        if (countyNameToId.has(lower)) {
            geoCountyToDbId.set(geoName, countyNameToId.get(lower))
        } else {
            // Try matching the first part before " - " (strips Sami suffixes)
            const baseName = geoName.split(' - ')[0].toLowerCase()
            if (countyNameToId.has(baseName)) {
                geoCountyToDbId.set(geoName, countyNameToId.get(baseName))
                console.log(`  Mapped GeoJSON "${geoName}" -> DB "${baseName}"`)
            } else {
                console.log(`  SKIP: GeoJSON county "${geoName}" has no fjords in DB (expected)`)
            }
        }
    }

    // Intersect each DB fjord with county polygons
    const results = [] // { fjord_id, county_id }
    let matched = 0
    let unmatched = 0
    let multiCounty = 0

    for (let i = 0; i < allFjords.length; i++) {
        const fjord = allFjords[i]
        const nameLower = fjord.name.toLowerCase().trim()

        if ((i + 1) % 100 === 0) {
            console.log(`Processing ${i + 1}/${allFjords.length}...`)
        }

        // Find matching Fjordkatalogen polygon(s)
        const candidates = fjordByName.get(nameLower) || []

        let fjordFeature = null
        if (candidates.length === 1) {
            fjordFeature = candidates[0]
        } else if (candidates.length > 1) {
            // Multiple polygons with same name, pick closest to our center point
            let bestDist = Infinity
            for (const c of candidates) {
                const cx = c.properties.utmx
                const cy = c.properties.utmy
                // Rough distance using center_lat/lng vs UTM (not perfect but good enough for disambiguation)
                // Use the GeoJSON coordinates instead
                const coords = c.geometry.coordinates[0][0]
                if (!coords || coords.length === 0) continue
                // Average a few points to get approximate center
                let sumLng = 0, sumLat = 0, count = 0
                const step = Math.max(1, Math.floor(coords.length / 10))
                for (let j = 0; j < coords.length; j += step) {
                    sumLng += coords[j][0]
                    sumLat += coords[j][1]
                    count++
                }
                const avgLng = sumLng / count
                const avgLat = sumLat / count
                const dist = Math.pow(avgLng - fjord.center_lng, 2) + Math.pow(avgLat - fjord.center_lat, 2)
                if (dist < bestDist) {
                    bestDist = dist
                    fjordFeature = c
                }
            }
        }

        if (!fjordFeature) {
            unmatched++
            console.log(`  UNMATCHED: "${fjord.name}" (id=${fjord.id})`)
            continue
        }

        // Check intersection with each county
        const counties = []
        for (const county of simplifiedCounties) {
            const countyId = geoCountyToDbId.get(county.properties.fylkesnavn)
            if (!countyId) continue // County not in our DB (e.g. Oslo, Innlandet)
            try {
                if (booleanIntersects(fjordFeature, county)) {
                    counties.push({ fjord_id: fjord.id, county_id: countyId })
                }
            } catch {
                // Some geometries may be invalid, skip
            }
        }

        if (counties.length > 0) {
            matched++
            if (counties.length > 1) multiCounty++
            results.push(...counties)
        } else {
            unmatched++
        }
    }

    console.log(`\nResults:`)
    console.log(`  Matched: ${matched} fjords`)
    console.log(`  Unmatched: ${unmatched} fjords`)
    console.log(`  Multi-county: ${multiCounty} fjords`)
    console.log(`  Total junction rows: ${results.length}`)

    // Write SQL migration
    if (results.length > 0) {
        let sql = '-- Populate fjordle_fjord_counties from Fjordkatalogen polygon x county boundary intersection\n'
        sql += '-- Source: Miljødirektoratet Fjordkatalogen + Kartverket county boundaries\n\n'
        sql += '-- Clear existing data and repopulate\n'
        sql += 'DELETE FROM fjordle_fjord_counties;\n\n'
        sql += 'INSERT INTO fjordle_fjord_counties (fjord_id, county_id) VALUES\n'
        sql += results.map(r => `  (${r.fjord_id}, ${r.county_id})`).join(',\n')
        sql += ';\n'

        const outPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260303000001_populate_fjord_counties.sql')
        fs.writeFileSync(outPath, sql)
        console.log(`\nWrote migration to: ${outPath}`)
    }
}

main().catch(err => { console.error(err); process.exit(1) })
