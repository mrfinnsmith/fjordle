"""
Generate satellite images for all fjords in the Fjordle game.

These satellite images are used as hints in the game to help players identify fjords
when they're struggling with the outline shapes alone.

Setup:
1. Get fjord data from Supabase:
  SELECT name, svg_filename, center_lat, center_lng FROM fjords;

2. Save the JSON result as tools/all_fjords.json

3. Ensure GOOGLE_MAPS_API_KEY is set in .env.local

4. Run: python3 tools/generate_satellite_images.py

Output: PNG files in public/fjord_satellite/ named to match SVG files
(e.g., 0621_Hadselfjorden.svg → 0621_Hadselfjorden.png)
"""

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(".env.local")

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
OUTPUT_DIR = "public/fjord_satellite"

with open("tools/all_fjords.json", "r") as f:
    fjords = json.load(f)

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Filter out existing files
remaining_fjords = []
for fjord in fjords:
    filename = fjord["svg_filename"].replace(".svg", ".png")
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        remaining_fjords.append(fjord)

print(f"Found {len(remaining_fjords)} remaining fjords to download")

for i, fjord in enumerate(remaining_fjords):
    url = f"https://maps.googleapis.com/maps/api/staticmap?center={fjord['center_lat']},{fjord['center_lng']}&zoom=9&size=400x400&maptype=satellite&style=feature:all|element:labels|visibility:off&key={API_KEY}"
    filename = fjord["svg_filename"].replace(".svg", ".png")
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(filepath, "wb") as f:
            f.write(response.content)
        print(f"SUCCESS {i+1}/{len(remaining_fjords)}: {filename}")
    except Exception as e:
        print(f"FAILED {i+1}/{len(remaining_fjords)}: {filename} - {e}")

print(f"Completed. {len(os.listdir(OUTPUT_DIR))} total files exist.")
