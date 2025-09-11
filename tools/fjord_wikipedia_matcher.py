import os
import requests
import re
import math
import time
import json
import csv
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

print(f"URL: {url}")
print(f"Key present: {bool(key)}")
print(f"Env file exists: {os.path.exists('.env.local')}")

if not url:
    print("NEXT_PUBLIC_SUPABASE_URL not found in environment")
    exit(1)

supabase: Client = create_client(url, key)


def decimal_to_dms(decimal_degrees):
    """Convert decimal degrees to degrees, minutes, seconds"""
    degrees = int(decimal_degrees)
    minutes_float = (decimal_degrees - degrees) * 60
    minutes = int(minutes_float)
    seconds = (minutes_float - minutes) * 60
    return degrees, minutes, seconds


def dms_to_decimal(degrees, minutes, seconds):
    """Convert degrees, minutes, seconds to decimal degrees"""
    return degrees + minutes / 60 + seconds / 3600


def distance_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers"""
    R = 6371  # Earth radius in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat / 2) * math.sin(delta_lat / 2) + math.cos(
        lat1_rad
    ) * math.cos(lat2_rad) * math.sin(delta_lon / 2) * math.sin(delta_lon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def extract_wikipedia_coordinates(page_content, language="nb"):
    """Extract coordinates from Wikipedia page content for different languages"""
    patterns = []

    if language == "nb":
        patterns.extend(
            [
                r'<span class="latitude">(\d+)°(\d+)′([\d,]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d,]+)″Ø</span>',
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′([\d,]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d,]+)″Ø</span>',
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′(\d+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′(\d+)″(?:Ø|E)</span>',
                r'<span class="geo-dec"[^>]*>([\d,]+)°N\s*([\d,]+)°Ø',
            ]
        )
    elif language == "nn":
        patterns.extend(
            [
                r'<span class="latitude">(\d+)°(\d+)′([\d,]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d,]+)″Ø</span>',
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′([\d,]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d,]+)″Ø</span>',
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′(\d+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′(\d+)″(?:Ø|E)</span>',
                r'<span class="geo-dec"[^>]*>([\d,]+)°N\s*([\d,]+)°Ø',
            ]
        )
    elif language == "da":
        patterns.extend(
            [
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′([\d,\.]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d,\.]+)″(?:Ø|E)</span>',
                r'<span class="geo-dec"[^>]*>([\d,\.]+)°N\s*([\d,\.]+)°[ØE]',
            ]
        )
    elif language == "ceb":
        patterns.extend(
            [
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′([\d\.]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d\.]+)″E</span>',
                r'<span class="geo-dec"[^>]*>([\d\.]+)°N\s*([\d\.]+)°E',
            ]
        )
    elif language == "en":
        patterns.extend(
            [
                r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)°(\d+)′([\d\.]+)″N</span>\s*<span class="longitude">(\d+)°(\d+)′([\d\.]+)″E</span>',
                r'<span class="geo-dec"[^>]*>([\d\.]+)°N\s*([\d\.]+)°E',
            ]
        )

    patterns.extend(
        [
            r'<span class="geo-dms"[^>]*>.*?(\d+)°(\d+)′([\d\.,]+)″N\s*(\d+)°(\d+)′([\d\.,]+)″[EØ]',
            r"([\d,\.]+)\s*°\s*N[^0-9]*([\d,\.]+)\s*°\s*[EØ]",
        ]
    )

    for pattern in patterns:
        match = re.search(pattern, page_content, re.DOTALL | re.IGNORECASE)
        if match:
            groups = match.groups()
            try:
                if len(groups) == 6:
                    lat_deg, lat_min, lat_sec_str, lon_deg, lon_min, lon_sec_str = (
                        groups
                    )
                    lat_sec = float(lat_sec_str.replace(",", "."))
                    lon_sec = float(lon_sec_str.replace(",", "."))
                    lat_decimal = dms_to_decimal(int(lat_deg), int(lat_min), lat_sec)
                    lon_decimal = dms_to_decimal(int(lon_deg), int(lon_min), lon_sec)
                    return lat_decimal, lon_decimal
                elif len(groups) == 2:
                    lat_str, lon_str = groups
                    lat_decimal = float(lat_str.replace(",", "."))
                    lon_decimal = float(lon_str.replace(",", "."))
                    return lat_decimal, lon_decimal
            except (ValueError, TypeError):
                continue

    return None, None


def get_interlanguage_links(page_title, source_lang="nb"):
    """Get interlanguage links from a Wikipedia page"""
    try:
        # Map language codes to API URLs
        api_urls = {
            "nb": "https://no.wikipedia.org/w/api.php",
            "nn": "https://nn.wikipedia.org/w/api.php",
            "da": "https://da.wikipedia.org/w/api.php",
            "ceb": "https://ceb.wikipedia.org/w/api.php",
            "en": "https://en.wikipedia.org/w/api.php",
        }

        api_url = api_urls.get(source_lang, "https://no.wikipedia.org/w/api.php")

        params = {
            "action": "query",
            "prop": "langlinks",
            "titles": page_title,
            "lllimit": 100,
            "format": "json",
        }

        response = requests.get(api_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})

            links = {}
            for page in pages.values():
                if "missing" in page:
                    continue

                langlinks = page.get("langlinks", [])
                for link in langlinks:
                    lang = link.get("lang")
                    title = link.get("*")
                    if lang and title:
                        # Create URLs for each language
                        if lang in ["nb"]:
                            links["nb"] = (
                                f"https://no.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            )
                        elif lang == "nn":
                            links["nn"] = (
                                f"https://nn.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            )
                        elif lang == "da":
                            links["da"] = (
                                f"https://da.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            )
                        elif lang == "ceb":
                            links["ceb"] = (
                                f"https://ceb.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            )
                        elif lang == "en":
                            links["en"] = (
                                f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            )

            return links
        return {}
    except Exception as e:
        print(f"    Error getting interlanguage links: {e}")
        return {}


def check_coordinates_in_page(url, language, fjord_lat, fjord_lng):
    """Check coordinates in a specific Wikipedia page"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"    Checking coordinates in: {url}")
            lat, lon = extract_wikipedia_coordinates(response.text, language)
            if lat and lon:
                dist = distance_km(fjord_lat, fjord_lng, lat, lon)
                print(f"    Extracted: {lat}, {lon} (distance: {dist:.2f}km)")
                return lat, lon, dist
            else:
                print(f"    No coordinates extracted from page")
                # Debug: show a snippet of geo content
                coord_pattern = r'<span class="geo[^>]*>.*?</span>'
                coord_matches = re.findall(
                    coord_pattern, response.text, re.DOTALL | re.IGNORECASE
                )
                if coord_matches:
                    print(f"    Found {len(coord_matches)} geo spans, first one:")
                    print(f"    {coord_matches[0][:200]}...")
    except Exception as e:
        print(f"    Error checking coordinates in {url}: {e}")

    return None, None, None


def check_fjord_categories(page_title, language="nb"):
    """Check if Wikipedia page has fjord-related categories"""
    try:
        api_urls = {
            "nb": "https://no.wikipedia.org/w/api.php",
            "nn": "https://nn.wikipedia.org/w/api.php",
            "da": "https://da.wikipedia.org/w/api.php",
            "ceb": "https://ceb.wikipedia.org/w/api.php",
            "en": "https://en.wikipedia.org/w/api.php",
        }

        fjord_patterns = {
            "nb": ["fjorder i", "sund i", "våger i", "botner i", "pollen i"],
            "nn": ["fjorder i", "sund i", "våger i", "botner i", "pollen i"],
            "da": ["fjorde i", "sunde i", "bugter i"],
            "ceb": ["mga fjord", "mga dagat", "tubig"],
            "en": ["fjords", "inlets", "bays", "sounds"],
        }

        api_url = api_urls.get(language, "https://no.wikipedia.org/w/api.php")
        patterns = fjord_patterns.get(language, fjord_patterns["nb"])

        params = {
            "action": "query",
            "prop": "categories",
            "titles": page_title,
            "format": "json",
            "cllimit": 100,
        }

        response = requests.get(api_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            pages = data.get("query", {}).get("pages", {})

            for page in pages.values():
                if "missing" in page:
                    continue

                categories = page.get("categories", [])
                for cat in categories:
                    cat_title = cat.get("title", "").lower()
                    if any(pattern in cat_title for pattern in patterns):
                        return True
        return False
    except Exception as e:
        print(f"    Error checking categories: {e}")
        return False


def search_wikipedia_language(fjord_name, language, fjord_lat, fjord_lng):
    """Search a specific Wikipedia language for fjord"""
    api_urls = {
        "nb": "https://no.wikipedia.org/w/api.php",
        "nn": "https://nn.wikipedia.org/w/api.php",
        "da": "https://da.wikipedia.org/w/api.php",
        "ceb": "https://ceb.wikipedia.org/w/api.php",
        "en": "https://en.wikipedia.org/w/api.php",
    }

    api_url = api_urls.get(language, "https://no.wikipedia.org/w/api.php")

    # Create search variants
    search_terms = [fjord_name]
    if not fjord_name.endswith("en"):
        search_terms.append(fjord_name + "en")
    if fjord_name.endswith("en"):
        search_terms.append(fjord_name[:-2])

    for search_term in search_terms:
        try:
            # Search for potential matches
            search_params = {
                "action": "opensearch",
                "search": search_term,
                "limit": 5,
                "namespace": 0,
                "format": "json",
            }

            response = requests.get(api_url, params=search_params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if len(data) >= 4 and data[1]:
                    titles = data[1]
                    urls = data[3]

                    for title, url in zip(titles, urls):
                        # Check categories for relevance
                        if check_fjord_categories(title, language):
                            print(f"    Found relevant page: {title}")

                            # Check coordinates
                            lat, lon, dist = check_coordinates_in_page(
                                url, language, fjord_lat, fjord_lng
                            )

                            if lat and lon:
                                print(
                                    f"    Found coordinates: {lat}, {lon} (distance: {dist:.2f}km)"
                                )

                                if dist <= 10.0:
                                    return url, title, lat, lon, dist

                        time.sleep(0.2)  # Rate limiting between page checks

        except Exception as e:
            print(f"    Error searching {language} for {search_term}: {e}")
            continue

    return None, None, None, None, None


def search_wikipedia_with_fallback(fjord_name, fjord_lat, fjord_lng):
    """Search Wikipedia with complete language fallback strategy"""
    # Language priority: Bokmål -> Nynorsk -> English -> Danish -> Cebuano
    languages = ["nb", "nn", "en", "da", "ceb"]

    result = {
        "wiki_url_nb": None,
        "wiki_url_nn": None,
        "wiki_url_en": None,
        "wiki_url_da": None,
        "wiki_url_ceb": None,
        "wiki_lat": None,
        "wiki_lng": None,
        "distance_km": None,
        "coordinate_source": None,
        "match_source": None,
        "match": False,
    }

    for lang in languages:
        lang_name = {
            "nb": "Norwegian Bokmål",
            "nn": "Norwegian Nynorsk",
            "en": "English",
            "da": "Danish",
            "ceb": "Cebuano",
        }[lang]
        print(f"  Searching {lang_name} Wikipedia...")

        url, title, lat, lon, dist = search_wikipedia_language(
            fjord_name, lang, fjord_lat, fjord_lng
        )

        if url and lat and lon and dist <= 10.0:
            print(f"  ✓ COORDINATE MATCH in {lang_name}! Distance: {dist:.2f}km")

            # Get all interlanguage links from the found page
            interlang_links = get_interlanguage_links(title, lang)
            print(f"    Found interlanguage links: {list(interlang_links.keys())}")

            # Populate all available language URLs
            result[f"wiki_url_{lang}"] = url
            for link_lang, link_url in interlang_links.items():
                if f"wiki_url_{link_lang}" in result:
                    result[f"wiki_url_{link_lang}"] = link_url
                    print(f"    {link_lang.upper()}: {link_url}")

            # Set coordinate info
            result["wiki_lat"] = lat
            result["wiki_lng"] = lon
            result["distance_km"] = dist
            result["coordinate_source"] = lang
            result["match_source"] = lang
            result["match"] = True

            return result

        elif url:
            print(f"    Found page in {lang_name} but coordinates too far or missing")

        time.sleep(0.5)  # Rate limiting between languages

    return result


def should_skip_fjord(fjord_name):
    """Check if fjord should be skipped based on name patterns"""
    name_lower = fjord_name.lower()

    # Skip if contains directional words
    directional_words = ["indre", "ytre", "midtre", "inner", "outer", "middle"]
    if any(word in name_lower for word in directional_words):
        return True

    # Skip if contains underscores, hyphens, or numbers
    if any(char in fjord_name for char in "_-0123456789"):
        return True

    return False


def load_existing_results():
    """Load existing results from JSON and CSV files"""
    results = {}

    # Try loading from JSON first
    try:
        with open("fjord_wikipedia_matches.json", "r", encoding="utf-8") as f:
            results = {result["fjord_id"]: result for result in json.load(f)}
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    # If no JSON, try loading from CSV
    if not results:
        try:
            with open("fjord_wikipedia_matches.csv", "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    fjord_id = int(row["fjord_id"]) if row["fjord_id"] else None
                    if fjord_id:
                        # Convert string values back to appropriate types
                        result = {
                            "fjord_id": fjord_id,
                            "fjord_name": row["fjord_name"],
                            "fjord_lat": (
                                float(row["fjord_lat"]) if row["fjord_lat"] else None
                            ),
                            "fjord_lng": (
                                float(row["fjord_lng"]) if row["fjord_lng"] else None
                            ),
                            "svg_filename": row["svg_filename"],
                            "wiki_url_nb": (
                                row["wiki_url_nb"] if row["wiki_url_nb"] else None
                            ),
                            "wiki_url_nn": (
                                row["wiki_url_nn"] if row["wiki_url_nn"] else None
                            ),
                            "wiki_url_en": (
                                row["wiki_url_en"] if row["wiki_url_en"] else None
                            ),
                            "wiki_url_da": (
                                row["wiki_url_da"] if row["wiki_url_da"] else None
                            ),
                            "wiki_url_ceb": (
                                row["wiki_url_ceb"] if row["wiki_url_ceb"] else None
                            ),
                            "wiki_lat": (
                                float(row["wiki_lat"]) if row["wiki_lat"] else None
                            ),
                            "wiki_lng": (
                                float(row["wiki_lng"]) if row["wiki_lng"] else None
                            ),
                            "distance_km": (
                                float(row["distance_km"])
                                if row["distance_km"]
                                else None
                            ),
                            "coordinate_source": (
                                row["coordinate_source"]
                                if row["coordinate_source"]
                                else None
                            ),
                            "match_source": (
                                row["match_source"] if row["match_source"] else None
                            ),
                            "match": (
                                row["match"].lower() == "true"
                                if row["match"]
                                else False
                            ),
                        }
                        results[fjord_id] = result
        except (FileNotFoundError, csv.Error):
            pass

    return results


def merge_results(existing_results, new_result):
    """Merge new result with existing, preserving existing language URLs"""
    if new_result["fjord_id"] not in existing_results:
        return new_result

    merged = existing_results[new_result["fjord_id"]].copy()

    # Update with new data
    for key, value in new_result.items():
        if key.startswith("wiki_url_") and value and not merged.get(key):
            merged[key] = value
        elif key not in [
            "fjord_id",
            "fjord_name",
            "fjord_lat",
            "fjord_lng",
            "svg_filename",
        ]:
            if value is not None:
                merged[key] = value

    return merged


def write_results(results):
    """Write results to JSON and CSV files"""
    results_list = list(results.values())

    # Write JSON file
    with open("fjord_wikipedia_matches.json", "w", encoding="utf-8") as f:
        json.dump(results_list, f, indent=2, ensure_ascii=False)

    # Write CSV file
    with open("fjord_wikipedia_matches.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # CSV headers
        headers = [
            "fjord_id",
            "fjord_name",
            "fjord_lat",
            "fjord_lng",
            "svg_filename",
            "fjord_coords",
            "fjord_maps_url",
            "wiki_url_nb",
            "wiki_url_nn",
            "wiki_url_en",
            "wiki_url_da",
            "wiki_url_ceb",
            "wiki_lat",
            "wiki_lng",
            "wiki_coords",
            "wiki_maps_url",
            "distance_km",
            "coordinate_source",
            "match_source",
            "match",
        ]
        writer.writerow(headers)

        # Write data rows
        for result in results_list:
            # Create coordinate strings
            fjord_coords = f"{result['fjord_lat']},{result['fjord_lng']}"
            fjord_maps_url = f"https://maps.google.com/maps?q={fjord_coords}&z=8"

            wiki_coords = ""
            wiki_maps_url = ""
            if result.get("wiki_lat") and result.get("wiki_lng"):
                wiki_coords = f"{result['wiki_lat']},{result['wiki_lng']}"
                wiki_maps_url = f"https://maps.google.com/maps?q={wiki_coords}&z=8"

            row = [
                result["fjord_id"],
                result["fjord_name"],
                result["fjord_lat"],
                result["fjord_lng"],
                result["svg_filename"],
                fjord_coords,
                fjord_maps_url,
                result.get("wiki_url_nb", "") or "",
                result.get("wiki_url_nn", "") or "",
                result.get("wiki_url_en", "") or "",
                result.get("wiki_url_da", "") or "",
                result.get("wiki_url_ceb", "") or "",
                result.get("wiki_lat", "") or "",
                result.get("wiki_lng", "") or "",
                wiki_coords,
                wiki_maps_url,
                result.get("distance_km", "") or "",
                result.get("coordinate_source", "") or "",
                result.get("match_source", "") or "",
                result.get("match", False),
            ]
            writer.writerow(row)


def main():
    # Load existing results
    existing_results = load_existing_results()
    print(f"Loaded {len(existing_results)} existing results")

    # Get all fjords from database
    all_fjords_response = (
        supabase.table("fjordle_fjords")
        .select("id,name,center_lat,center_lng,svg_filename")
        .execute()
    )
    total_fjords = len(all_fjords_response.data)

    # Get all fjords without Norwegian Wikipedia URLs, excluding quarantined fjords
    response = (
        supabase.table("fjordle_fjords")
        .select("id,name,center_lat,center_lng,svg_filename")
        .is_("wikipedia_url_no", "null")
        .eq("quarantined", False)
        .execute()
    )
    all_fjords = response.data

    # Get fjord IDs that are in puzzle_queue or daily_puzzles
    puzzle_queue_response = supabase.table("fjordle_puzzle_queue").select("fjord_id").execute()
    daily_puzzles_response = (
        supabase.table("fjordle_daily_puzzles").select("fjord_id").execute()
    )

    used_fjord_ids = set()
    used_fjord_ids.update([p["fjord_id"] for p in puzzle_queue_response.data])
    used_fjord_ids.update([p["fjord_id"] for p in daily_puzzles_response.data])

    # Filter out used fjords and problematic names
    fjords = [
        f
        for f in all_fjords
        if f["id"] not in used_fjord_ids and not should_skip_fjord(f["name"])
    ]

    print(
        f"Processing {len(fjords)} fjords (excluded quarantined, used, and problematic names)"
    )
    print(f"Total fjords in database: {total_fjords}")
    print(f"Fjords without Norwegian URLs: {len(all_fjords)}")
    print(f"Used in puzzles: {len(used_fjord_ids)}")
    print(
        f"Skipped problematic names: {len(all_fjords) - len(fjords) - len(used_fjord_ids)}"
    )

    db_updates = []

    for i, fjord in enumerate(reversed(fjords)):
        print(f"\nProcessing {i+1}/{len(fjords)}: {fjord['name']}")

        search_result = search_wikipedia_with_fallback(
            fjord["name"], float(fjord["center_lat"]), float(fjord["center_lng"])
        )

        new_result = {
            "fjord_id": fjord["id"],
            "fjord_name": fjord["name"],
            "fjord_lat": float(fjord["center_lat"]),
            "fjord_lng": float(fjord["center_lng"]),
            "svg_filename": fjord["svg_filename"],
            **search_result,
        }

        # Merge with existing results
        existing_results[fjord["id"]] = merge_results(existing_results, new_result)

        if search_result["match"]:
            print(f"  ✓ MATCH! Found via {search_result['match_source'].upper()}")
            print(f"    Coordinates from: {search_result['coordinate_source'].upper()}")
            print(f"    Distance: {search_result['distance_km']:.2f} km")

            # Queue database update only if we have a Bokmål URL
            if search_result["wiki_url_nb"]:
                db_updates.append(
                    {"id": fjord["id"], "url": search_result["wiki_url_nb"]}
                )
                print(f"    ✓ Queued database update with Bokmål URL")
            else:
                print(f"    ℹ  No Bokmål URL found, logging match only")
        else:
            print(f"  ✗ No matching Wikipedia page found")

        # Rate limiting
        time.sleep(1.0)

    # Batch update database
    print(f"\nUpdating database for {len(db_updates)} fjords...")
    for update in db_updates:
        try:
            update_data = {"wikipedia_url_no": update["url"]}
            supabase.table("fjordle_fjords").update(update_data).eq(
                "id", update["id"]
            ).execute()
            print(f"  ✓ Updated fjord {update['id']}")
        except Exception as e:
            print(f"  ✗ Failed to update fjord {update['id']}: {e}")

    # Write all results to files
    write_results(existing_results)

    matches = [r for r in existing_results.values() if r.get("match")]
    bokmaal_updates = [
        r for r in existing_results.values() if r.get("match") and r.get("wiki_url_nb")
    ]

    print(
        f"\nResults written to fjord_wikipedia_matches.json and fjord_wikipedia_matches.csv"
    )
    print(f"Total results in files: {len(existing_results)}")
    print(f"Total matches: {len(matches)}")
    print(f"Bokmål URLs in database: {len(bokmaal_updates)}")

    # Summary by match source
    match_sources = {}
    coord_sources = {}
    for result in matches:
        if result.get("match_source"):
            match_src = result["match_source"]
            match_sources[match_src] = match_sources.get(match_src, 0) + 1
        if result.get("coordinate_source"):
            coord_src = result["coordinate_source"]
            coord_sources[coord_src] = coord_sources.get(coord_src, 0) + 1

    print(f"Match sources: {match_sources}")
    print(f"Coordinate sources: {coord_sources}")


if __name__ == "__main__":
    main()
