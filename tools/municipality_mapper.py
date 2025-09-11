#!/usr/bin/env python3
import os
import sys
import requests
import json
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")


def get_supabase_client():
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

    if not url or not service_key:
        raise ValueError("Missing Supabase credentials in .env.local")

    return create_client(url, service_key)


def get_municipality_county(municipality_name):
    """Query Norwegian Wikipedia for municipality county info"""
    # Try wikitext first
    url = "https://no.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "titles": municipality_name,
        "prop": "revisions",
        "rvprop": "content",
        "rvsection": 0,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        pages = data["query"]["pages"]
        for page_id in pages:
            if page_id == "-1":  # Page not found
                return None

            revisions = pages[page_id].get("revisions", [])
            if not revisions:
                return None

            content = revisions[0].get("*", "")

            # Check if disambiguation page
            if (
                "kan henvise til" in content.lower()
                or "disambiguation" in content.lower()
                or "#REDIRECT" in content
            ):
                print(f"  WARNING: Multiple articles found for {municipality_name}")
                return "DISAMBIGUATION"

            # Look for fylke in infobox
            fylke_match = re.search(
                r"\|\s*fylke\s*=\s*\[\[([^\]]+)\]\]", content, re.IGNORECASE
            )
            if fylke_match:
                return fylke_match.group(1).strip()

            # Alternative pattern
            fylke_match = re.search(
                r"\|\s*fylke\s*=\s*([^\n\|]+)", content, re.IGNORECASE
            )
            if fylke_match:
                county = fylke_match.group(1).strip()
                # Clean up wikitext
                county = re.sub(r"\[\[([^\]]+)\]\]", r"\1", county)
                return county

        # Fallback: get HTML and parse infobox
        params = {
            "action": "parse",
            "format": "json",
            "page": municipality_name,
            "prop": "text",
            "section": 0,
        }

        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if "parse" in data and "text" in data["parse"]:
            html = data["parse"]["text"]["*"]
            # Parse HTML for fylke
            fylke_match = re.search(
                r"<th[^>]*>.*?Fylke.*?</th>\s*<td[^>]*>.*?<a[^>]*>([^<]+)</a>",
                html,
                re.IGNORECASE | re.DOTALL,
            )
            if fylke_match:
                return fylke_match.group(1).strip()

        return None

    except Exception as e:
        print(f"Error fetching {municipality_name}: {e}")
        return None


def map_county_name_to_id(county_name, county_mapping):
    """Map extracted county name to your county ID"""
    if not county_name:
        return None

    # Normalize county name
    county_name = county_name.lower().strip()

    # Direct mapping
    name_mappings = {
        "agder": 11,
        "aust-agder": 11,
        "vest-agder": 11,
        "akershus": 1,
        "finnmark": 9,
        "møre og romsdal": 2,
        "nordland": 3,
        "østfold": 8,
        "rogaland": 4,
        "telemark": 5,
        "troms": 10,
        "trøndelag": 6,
        "nord-trøndelag": 6,
        "sør-trøndelag": 6,
        "vestland": 7,
        "hordaland": 7,
        "sogn og fjordane": 7,
    }

    return name_mappings.get(county_name)


def main():
    try:
        supabase = get_supabase_client()

        # Fetch municipalities
        print("Fetching municipalities from database...")
        municipalities_response = (
            supabase.table("fjordle_municipalities").select("id, name").execute()
        )
        municipalities = municipalities_response.data

        # Fetch counties for mapping
        counties_response = supabase.table("fjordle_counties").select("id, name").execute()
        counties = {county["id"]: county["name"] for county in counties_response.data}

        results = []

        print(f"Processing {len(municipalities)} municipalities...")

        for i, municipality in enumerate(municipalities, 1):
            print(f"[{i}/{len(municipalities)}] Processing {municipality['name']}...")

            county_name = get_municipality_county(municipality["name"])
            county_id = map_county_name_to_id(county_name, counties)

            result = {
                "municipality_id": municipality["id"],
                "municipality_name": municipality["name"],
                "extracted_county": county_name,
                "mapped_county_id": county_id,
                "mapped_county_name": counties.get(county_id) if county_id else None,
            }

            results.append(result)

            print(
                f"  → {county_name} → {counties.get(county_id) if county_id else 'UNMAPPED'}"
            )

        # Write results to JSON file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_file = os.path.join(script_dir, "municipality_county_mapping.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"\nResults written to {output_file}")

        # Summary
        mapped_count = sum(1 for r in results if r["mapped_county_id"])
        unmapped_count = len(results) - mapped_count

        print(f"\nSummary:")
        print(f"  Mapped: {mapped_count}")
        print(f"  Unmapped: {unmapped_count}")

        if unmapped_count > 0:
            print(f"\nUnmapped municipalities:")
            for result in results:
                if not result["mapped_county_id"]:
                    print(
                        f"  - {result['municipality_name']} (extracted: {result['extracted_county']})"
                    )

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
