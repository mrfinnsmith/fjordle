import os
import requests
import re
import math
import time
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('../.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")
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
    return degrees + minutes/60 + seconds/3600

def distance_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers"""
    R = 6371  # Earth radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon/2) * math.sin(delta_lon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def extract_wikipedia_coordinates(page_content):
    """Extract coordinates from Norwegian Wikipedia page content"""
    # Look for geo-dms span with latitude/longitude
    geo_pattern = r'<span class="geo-dms"[^>]*>.*?<span class="latitude">(\d+)Â°(\d+)â€²(\d+)â€³N</span>\s*<span class="longitude">(\d+)Â°(\d+)â€²(\d+)â€³(?:Ã˜|E)</span>'
    match = re.search(geo_pattern, page_content, re.DOTALL)
    
    if match:
        lat_deg, lat_min, lat_sec, lon_deg, lon_min, lon_sec = map(int, match.groups())
        lat_decimal = dms_to_decimal(lat_deg, lat_min, lat_sec)
        lon_decimal = dms_to_decimal(lon_deg, lon_min, lon_sec)
        return lat_decimal, lon_decimal
    
    return None, None

def check_fjord_categories(page_title):
    """Check if Wikipedia page has fjord-related categories"""
    try:
        api_url = "https://no.wikipedia.org/w/api.php"
        params = {
            'action': 'query',
            'prop': 'categories',
            'titles': page_title,
            'format': 'json',
            'cllimit': 100
        }
        
        response = requests.get(api_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            pages = data.get('query', {}).get('pages', {})
            
            for page in pages.values():
                categories = page.get('categories', [])
                for cat in categories:
                    cat_title = cat.get('title', '').lower()
                    # Check for fjord-related category patterns
                    fjord_patterns = [
                        'fjorder i',
                        'sund i', 
                        'våger i',
                        'botner i',
                        'pollen i'
                    ]
                    if any(pattern in cat_title for pattern in fjord_patterns):
                        return True
        return False
    except:
        return False

def get_english_wikipedia_url(norwegian_page_title):
    """Get English Wikipedia URL from Norwegian page if it exists"""
    try:
        api_url = "https://no.wikipedia.org/w/api.php"
        params = {
            'action': 'query',
            'prop': 'langlinks',
            'titles': norwegian_page_title,
            'lllang': 'en',
            'format': 'json'
        }
        
        response = requests.get(api_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            pages = data.get('query', {}).get('pages', {})
            
            for page in pages.values():
                langlinks = page.get('langlinks', [])
                for link in langlinks:
                    if link.get('lang') == 'en':
                        return f"https://en.wikipedia.org/wiki/{link['*'].replace(' ', '_')}"
        return None
    except:
        return None

def search_english_wikipedia(fjord_name):
    """Search English Wikipedia for fjord as backup"""
    try:
        # Create search variants
        search_terms = [fjord_name]
        
        # Add variant with -en suffix if not already present
        if not fjord_name.endswith('en'):
            search_terms.append(fjord_name + 'en')
        
        # Add variant without -en suffix if present
        if fjord_name.endswith('en'):
            search_terms.append(fjord_name[:-2])
        
        for search_term in search_terms:
            # Use search API to find potential matches
            search_url = "https://en.wikipedia.org/w/api.php"
            search_params = {
                'action': 'opensearch',
                'search': search_term,
                'limit': 5,
                'namespace': 0,
                'format': 'json'
            }
            
            response = requests.get(search_url, params=search_params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if len(data) >= 4 and data[1]:  # Check if we have results
                    titles = data[1]
                    urls = data[3]
                    
                    # Check each search result for coordinates
                    for title, url in zip(titles, urls):
                        page_response = requests.get(url, timeout=10)
                        if page_response.status_code == 200:
                            lat, lon = extract_wikipedia_coordinates(page_response.text)
                            if lat and lon:
                                return url, lat, lon
                    
                    # If no coordinates found, return first result without coordinates
                    if titles and urls:
                        return urls[0], None, None
        
        return None, None, None
        
    except Exception as e:
        print(f"Error searching English Wikipedia for {fjord_name}: {e}")
        return None, None, None

def search_norwegian_wikipedia(fjord_name):
    """Search Norwegian Wikipedia for fjord and return page URL if found"""
    try:
        # Create search variants
        search_terms = [fjord_name]
        
        # Add variant with -en suffix if not already present
        if not fjord_name.endswith('en'):
            search_terms.append(fjord_name + 'en')
        
        # Add variant without -en suffix if present
        if fjord_name.endswith('en'):
            search_terms.append(fjord_name[:-2])
        
        for search_term in search_terms:
            # Use search API to find potential matches
            search_url = "https://no.wikipedia.org/w/api.php"
            search_params = {
                'action': 'opensearch',
                'search': search_term,
                'limit': 5,
                'namespace': 0,
                'format': 'json'
            }
            
            response = requests.get(search_url, params=search_params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if len(data) >= 4 and data[1]:  # Check if we have results
                    titles = data[1]
                    urls = data[3]
                    
                    # Check each search result for categories and coordinates
                    for title, url in zip(titles, urls):
                        # First check categories
                        if check_fjord_categories(title):
                            page_response = requests.get(url, timeout=10)
                            if page_response.status_code == 200:
                                lat, lon = extract_wikipedia_coordinates(page_response.text)
                                if lat and lon:
                                    return url, lat, lon
                                else:
                                    return url, None, None
                        else:
                            print(f"    Found '{title}' but no fjord categories")
        
        return None, None, None
        
    except Exception as e:
        print(f"Error searching for {fjord_name}: {e}")
        return None, None, None

def should_skip_fjord(fjord_name):
    """Check if fjord should be skipped based on name patterns"""
    name_lower = fjord_name.lower()
    
    # Skip if contains directional words
    directional_words = ['indre', 'ytre', 'midtre', 'inner', 'outer', 'middle']
    if any(word in name_lower for word in directional_words):
        return True
    
    # Skip if contains underscores, hyphens, or numbers
    if any(char in fjord_name for char in '_-0123456789'):
        return True
    
    return False

def main():
    # Get all fjords without Norwegian Wikipedia URLs, excluding quarantined fjords
    response = supabase.table('fjords').select('id,name,center_lat,center_lng,svg_filename').is_('wikipedia_url_no', 'null').eq('quarantined', False).execute()
    all_fjords = response.data
    
    # Get fjord IDs that are in puzzle_queue or daily_puzzles
    puzzle_queue_response = supabase.table('puzzle_queue').select('fjord_id').execute()
    daily_puzzles_response = supabase.table('daily_puzzles').select('fjord_id').execute()
    
    used_fjord_ids = set()
    used_fjord_ids.update([p['fjord_id'] for p in puzzle_queue_response.data])
    used_fjord_ids.update([p['fjord_id'] for p in daily_puzzles_response.data])
    
    # Filter out used fjords and problematic names
    fjords = [f for f in all_fjords if f['id'] not in used_fjord_ids and not should_skip_fjord(f['name'])]
    
    print(f"Processing {len(fjords)} fjords (excluded quarantined, used, and problematic names)")
    print(f"Total fjords in database: {len(all_fjords)}")
    
    results = []
    
    for i, fjord in enumerate(fjords):
        print(f"Processing {i+1}/{len(fjords)}: {fjord['name']}")
        
        wiki_url, wiki_lat, wiki_lon = search_norwegian_wikipedia(fjord['name'])
        
        result = {
            'fjord_id': fjord['id'],
            'fjord_name': fjord['name'],
            'fjord_lat': float(fjord['center_lat']),
            'fjord_lng': float(fjord['center_lng']),
            'svg_filename': fjord['svg_filename'],
            'wiki_url_no': wiki_url,
            'wiki_url_en': None,
            'wiki_lat': wiki_lat,
            'wiki_lng': wiki_lon,
            'distance_km': None,
            'match': False,
            'source': 'norwegian'
        }
        
        if wiki_url:
            if wiki_lat and wiki_lon:
                # Calculate distance between coordinates
                dist = distance_km(result['fjord_lat'], result['fjord_lng'], wiki_lat, wiki_lon)
                result['distance_km'] = dist
                
                print(f"  Found Norwegian Wikipedia page with coordinates")
                print(f"  Distance: {dist:.2f} km")
                
                # Match if within 10km tolerance
                if dist <= 10.0:
                    print(f"  ✓ MATCH! Updating database")
                    result['match'] = True
                    
                    # Get English Wikipedia URL if it exists
                    page_title = wiki_url.split('/')[-1]
                    english_url = get_english_wikipedia_url(page_title)
                    if english_url:
                        result['wiki_url_en'] = english_url
                        print(f"  Found English article: {english_url}")
                    
                    # Update database
                    update_data = {'wikipedia_url_no': wiki_url}
                    if english_url:
                        update_data['wikipedia_url_en'] = english_url
                    
                    try:
                        db_result = supabase.table('fjords').update(update_data).eq('id', fjord['id']).execute()
                        print(f"  Update result: {db_result.data}")
                    except Exception as e:
                        print(f"  Database update failed: {e}")
                    
                else:
                    print(f"  ✗ Too far apart ({dist:.2f} km)")
            else:
                print(f"  Found Norwegian Wikipedia page but no coordinates")
        
        # If no Norwegian match, try English Wikipedia as backup (but don't update DB)
        if not result['match']:
            print(f"  Trying English Wikipedia as backup...")
            en_wiki_url, en_wiki_lat, en_wiki_lon = search_english_wikipedia(fjord['name'])
            
            if en_wiki_url:
                if en_wiki_lat and en_wiki_lon:
                    en_dist = distance_km(result['fjord_lat'], result['fjord_lng'], en_wiki_lat, en_wiki_lon)
                    if en_dist <= 10.0:
                        print(f"  Found English Wikipedia match ({en_dist:.2f} km) - logged only, not updating DB")
                        result.update({
                            'wiki_url_en': en_wiki_url,
                            'wiki_lat': en_wiki_lat,
                            'wiki_lng': en_wiki_lon,
                            'distance_km': en_dist,
                            'source': 'english_backup'
                        })
                    else:
                        print(f"  Found English Wikipedia page but too far ({en_dist:.2f} km)")
                else:
                    print(f"  Found English Wikipedia page but no coordinates")
            else:
                print(f"  No English Wikipedia page found")
        
        if not wiki_url and not result.get('wiki_url_en'):
            print(f"  No Wikipedia page found")
        
        results.append(result)
        
        # Rate limiting
        time.sleep(0.5)
    
    # Write results to JSON file
    import json
    import csv
    
    with open('fjord_wikipedia_matches.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Write results to CSV file
    with open('fjord_wikipedia_matches.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # CSV headers
        headers = [
            'fjord_id', 'fjord_name', 'fjord_lat', 'fjord_lng', 'svg_filename', 'fjord_coords',
            'fjord_maps_url', 'wiki_url_no', 'wiki_url_en', 'wiki_lat', 'wiki_lng', 'wiki_coords',
            'wiki_maps_url', 'distance_km', 'match', 'source'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for result in results:
            # Create coordinate strings
            fjord_coords = f"{result['fjord_lat']},{result['fjord_lng']}"
            fjord_maps_url = f"https://maps.google.com/maps?q={fjord_coords}&z=8"
            
            wiki_coords = ""
            wiki_maps_url = ""
            if result['wiki_lat'] and result['wiki_lng']:
                wiki_coords = f"{result['wiki_lat']},{result['wiki_lng']}"
                wiki_maps_url = f"https://maps.google.com/maps?q={wiki_coords}&z=8"
            
            row = [
                result['fjord_id'],
                result['fjord_name'],
                result['fjord_lat'],
                result['fjord_lng'],
                result['svg_filename'],
                fjord_coords,
                fjord_maps_url,
                result['wiki_url_no'] or "",
                result['wiki_url_en'] or "",
                result['wiki_lat'] or "",
                result['wiki_lng'] or "",
                wiki_coords,
                wiki_maps_url,
                result['distance_km'] or "",
                result['match'],
                result['source']
            ]
            writer.writerow(row)
    
    matches = [r for r in results if r['match']]
    found_pages = [r for r in results if r['wiki_url_no'] or r.get('wiki_url_en')]
    
    print(f"\nResults written to fjord_wikipedia_matches.json and fjord_wikipedia_matches.csv")
    print(f"Found Wikipedia pages: {len(found_pages)}/{len(fjords)}")
    print(f"Coordinate matches (≤10km): {len(matches)}/{len(fjords)}")

if __name__ == "__main__":
    main()