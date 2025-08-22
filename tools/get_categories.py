import os
import json
import requests
import time
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"SUPABASE_URL: {SUPABASE_URL}")
    print(f"SUPABASE_KEY: {SUPABASE_KEY}")
    raise Exception("Missing environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_wikipedia_categories(wikipedia_url, lang="no"):
    """Extract categories from Wikipedia article"""
    if not wikipedia_url:
        return []

    try:
        page_title = wikipedia_url.split("/")[-1]

        # Use appropriate API endpoint based on language
        api_url = f"https://{lang}.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "titles": page_title,
            "prop": "categories",
            "cllimit": "max",
        }

        response = requests.get(api_url, params=params)
        data = response.json()

        pages = data.get("query", {}).get("pages", {})
        for page_id, page_info in pages.items():
            if "categories" in page_info:
                return [
                    cat["title"].replace("Category:", "").replace("Kategori:", "")
                    for cat in page_info["categories"]
                ]

        return []

    except Exception as e:
        print(f"Error processing {wikipedia_url}: {e}")
        return []


def main():
    # Get script directory and JSON file path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(script_dir, "fjord_categories.json")

    # Load existing data if file exists
    existing_data = {}
    if os.path.exists(json_file):
        with open(json_file, "r", encoding="utf-8") as f:
            existing_list = json.load(f)
            existing_data = {item["id"]: item for item in existing_list}
        print(f"Loaded {len(existing_data)} existing records")

    response = (
        supabase.table("fjords")
        .select("id, name, wikipedia_url_no, wikipedia_url_en")
        .neq("wikipedia_url_no", None)
        .execute()
    )
    fjords = response.data

    print(f"Processing {len(fjords)} fjords...")

    for fjord in fjords:
        id = fjord["id"]
        name = fjord["name"]
        wikipedia_url_no = fjord["wikipedia_url_no"]
        wikipedia_url_en = fjord["wikipedia_url_en"]

        # Skip if already processed
        if id in existing_data:
            print(f"Skipping {name} (already processed)")
            continue

        print(f"Processing: {name}")

        # Get Norwegian categories (primary)
        no_categories = get_wikipedia_categories(wikipedia_url_no, "no")

        # Get English categories if available
        en_categories = []
        if wikipedia_url_en:
            en_categories = get_wikipedia_categories(wikipedia_url_en, "en")

        existing_data[id] = {
            "id": id,
            "name": name,
            "wikipedia_url_no": wikipedia_url_no,
            "wikipedia_url_en": wikipedia_url_en,
            "categories_no": no_categories,
            "categories_en": en_categories,
        }

        time.sleep(1)

    # Convert back to list and save
    results = list(existing_data.values())
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\\nSaved {len(results)} fjords to {json_file}")


if __name__ == "__main__":
    main()
