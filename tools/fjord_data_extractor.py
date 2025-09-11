#!/usr/bin/env python3
"""
Fjord Wikipedia Data Extractor

Extracts length and depth measurements from Wikipedia articles for Norwegian fjords.
Connects to Supabase database and processes fjords table directly.
Processes multiple languages with priority: Norwegian Bokmål → Nynorsk → English → Danish → Cebuano

Usage:
    python tools/fjord_extractor.py

Requires .env.local in project root with:
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your_service_key
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
"""

import requests
import re
import csv
import json
import time
import logging
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables from .env.local in parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
load_dotenv(env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tools/extraction_log.txt', mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SupabaseFjordExtractor:
    def __init__(self, rate_limit_delay=1.0):
        self.rate_limit_delay = rate_limit_delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'FjordDataExtractor/1.0 (Educational Research; contact@example.com)'
        })
        
        # Supabase configuration
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_SERVICE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase configuration. Check .env.local file.")
        
        self.supabase_headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }
        
        # Language processing order
        self.language_priority = ['no', 'nn', 'en', 'da', 'ceb']
        
        # Validation ranges (in km for length, m for depth)
        self.length_range = (0.1, 200)
        self.depth_range = (1, 1500)
        
        # Results storage
        self.results = []
        self.conflicts = []
        
    def fetch_fjords_from_supabase(self) -> List[Dict]:
        """Fetch fjords data from Supabase database."""
        url = f"{self.supabase_url}/rest/v1/fjordle_fjords"
        params = {
            'select': 'id,name,wikipedia_url_no,wikipedia_url_nn,wikipedia_url_en,wikipedia_url_da,wikipedia_url_ceb,notes',
            'or': '(wikipedia_url_no.not.is.null,wikipedia_url_nn.not.is.null,wikipedia_url_en.not.is.null,wikipedia_url_da.not.is.null,wikipedia_url_ceb.not.is.null)'
        }
        
        try:
            response = requests.get(url, headers=self.supabase_headers, params=params)
            response.raise_for_status()
            fjords = response.json()
            logger.info(f"Fetched {len(fjords)} fjords with Wikipedia URLs from Supabase")
            return fjords
        except Exception as e:
            logger.error(f"Failed to fetch fjords from Supabase: {e}")
            raise
    
    def extract_from_fjord_data(self, fjord_data: Dict) -> Optional[Dict]:
        """Extract measurements for a single fjord from all available Wikipedia URLs."""
        fjord_id = fjord_data['id']
        fjord_name = fjord_data['name']
        
        logger.info(f"Processing fjord {fjord_id}: {fjord_name}")
        
        # Try each language in priority order
        for lang in self.language_priority:
            url_key = f'wikipedia_url_{lang}'
            if url_key in fjord_data and fjord_data[url_key]:
                url = fjord_data[url_key].strip()
                if url:
                    logger.info(f"  Trying {lang} Wikipedia: {url}")
                    
                    try:
                        # Phase A: Infobox extraction
                        measurements = self._extract_from_infobox(url, lang)
                        if measurements:
                            logger.info(f"  ✓ Found measurements in {lang} infobox")
                            return self._create_result(fjord_id, measurements, lang, url, 'infobox')
                        
                        # Phase B: Text extraction (only if infobox failed)
                        measurements = self._extract_from_text(url, lang)
                        if measurements:
                            logger.info(f"  ✓ Found measurements in {lang} text")
                            return self._create_result(fjord_id, measurements, lang, url, 'text')
                            
                    except Exception as e:
                        logger.warning(f"  ✗ Error processing {lang} URL: {e}")
                        continue
        
        logger.warning(f"  ✗ No measurements found for fjord {fjord_id}")
        return None
    
    def _extract_from_infobox(self, url: str, language: str) -> Optional[Dict]:
        """Extract measurements from Wikipedia infobox."""
        soup = self._fetch_page(url)
        if not soup:
            return None
            
        # Find infobox
        infobox = soup.find('table', class_='infobox')
        if not infobox:
            return None
            
        measurements = {}
        
        # Language-specific field mappings
        field_mappings = {
            'no': {  # Norwegian Bokmål
                'length': ['lengde'],
                'depth': ['dybde', 'største dybde', 'maksimal dybde'],
                'width': ['bredde', 'største bredde', 'maksimal bredde']
            },
            'nn': {  # Norwegian Nynorsk
                'length': ['lengde'],
                'depth': ['dybde', 'største dybde'],
                'width': ['breidde', 'største breidde']
            },
            'en': {  # English
                'length': ['max. length', 'length', 'max length'],
                'depth': ['max. depth', 'depth', 'max depth', 'maximum depth'],
                'width': ['max. width', 'width', 'max width', 'maximum width']
            },
            'da': {  # Danish
                'length': ['længde'],
                'depth': ['dybde', 'største dybde'],
                'width': ['bredde', 'største bredde']
            },
            'ceb': {  # Cebuano (often similar to English)
                'length': ['gitas-on', 'length'],
                'depth': ['giladmon', 'depth'],
                'width': ['gilapdon', 'width']
            }
        }
        
        mapping = field_mappings.get(language, field_mappings['en'])
        
        # Extract from table rows
        for row in infobox.find_all('tr'):
            th = row.find('th')
            td = row.find('td')
            
            if th and td:
                header_text = th.get_text().strip().lower()
                value_text = td.get_text().strip()
                
                # Check for length
                for length_field in mapping['length']:
                    if length_field in header_text:
                        length = self._parse_measurement(value_text, 'length', language)
                        if length:
                            measurements['length_km'] = length
                            measurements['length_raw'] = value_text
                
                # Check for depth
                for depth_field in mapping['depth']:
                    if depth_field in header_text:
                        depth = self._parse_measurement(value_text, 'depth', language)
                        if depth:
                            measurements['depth_m'] = depth
                            measurements['depth_raw'] = value_text
                            
                # Check for width
                for width_field in mapping['width']:
                    if width_field in header_text:
                        width = self._parse_measurement(value_text, 'width', language)
                        if width:
                            measurements['width_km'] = width
                            measurements['width_raw'] = value_text
        
        return measurements if measurements else None
    
    def _extract_from_text(self, url: str, language: str) -> Optional[Dict]:
        """Extract measurements from Wikipedia article text."""
        soup = self._fetch_page(url)
        if not soup:
            return None
            
        # Get main content
        content_div = soup.find('div', {'id': 'mw-content-text'}) or soup.find('div', {'class': 'mw-parser-output'})
        if not content_div:
            return None
            
        text = content_div.get_text()
        measurements = {}
        
        # Language-specific regex patterns
        patterns = {
            'no': {  # Norwegian Bokmål
                'length': [
                    r'(\d+(?:,\d+)?)\s*kilometer?\s+lang',
                    r'(\d+(?:,\d+)?)\s*km\s+lang',
                    r'er\s+(\d+(?:,\d+)?)\s*(?:kilometer?|km)\s+lang',
                    r'lengde\s+(?:på|av)\s+(\d+(?:,\d+)?)\s*(?:kilometer?|km)',
                    r'(\d+(?:,\d+)?)\s*(?:kilometer?|km)\s+(?:i\s+)?lengde',
                    r'(?:ca\.?\s*|rundt\s+|cirka\s+)?(\d+(?:,\d+)?)\s*(?:kilometer?|km)\s+lang',
                    r'(\d+(?:,\d+)?)-(\d+(?:,\d+)?)\s*(?:kilometer?|km)\s+lang'  # ranges
                ],
                'depth': [
                    r'(\d+(?:,\d+)?)\s*meter?\s+dyp',
                    r'(\d+(?:,\d+)?)\s*m\s+dyp',
                    r'dybde\s+(?:på|av)\s+(\d+(?:,\d+)?)\s*(?:meter?|m)',
                    r'(?:ca\.?\s*|rundt\s+|cirka\s+)?(\d+(?:,\d+)?)\s*(?:meter?|m)\s+dyp',
                    r'(\d+(?:,\d+)?)-(\d+(?:,\d+)?)\s*(?:meter?|m)\s+dyp'  # ranges
                ]
            },
            'nn': {  # Norwegian Nynorsk - similar patterns
                'length': [
                    r'(\d+(?:,\d+)?)\s*kilometer?\s+lang',
                    r'(\d+(?:,\d+)?)\s*km\s+lang',
                    r'lengde\s+(?:på|av)\s+(\d+(?:,\d+)?)\s*(?:kilometer?|km)'
                ],
                'depth': [
                    r'(\d+(?:,\d+)?)\s*meter?\s+djup',  # "djup" in Nynorsk
                    r'(\d+(?:,\d+)?)\s*m\s+djup',
                    r'djupne\s+(?:på|av)\s+(\d+(?:,\d+)?)\s*(?:meter?|m)'
                ]
            },
            'en': {  # English
                'length': [
                    r'(\d+(?:\.\d+)?)\s*(?:kilometres?|kilometers?|km)\s+long',
                    r'length\s+of\s+(\d+(?:\.\d+)?)\s*(?:km|kilometres?|kilometers?)',
                    r'(\d+(?:\.\d+)?)\s*(?:km|kilometres?|kilometers?)\s+(?:in\s+)?length',
                    r'(?:approximately|about|around)\s+(\d+(?:\.\d+)?)\s*(?:km|kilometres?|kilometers?)\s+long',
                    r'(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s*(?:km|kilometres?|kilometers?)\s+long'  # ranges
                ],
                'depth': [
                    r'(\d+(?:\.\d+)?)\s*(?:metres?|meters?|m)\s+deep',
                    r'depth\s+of\s+(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)',
                    r'(?:approximately|about|around)\s+(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)\s+deep',
                    r'(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)\s+deep'  # ranges
                ]
            },
            'da': {  # Danish - similar to Norwegian
                'length': [
                    r'(\d+(?:,\d+)?)\s*kilometer?\s+lang',
                    r'(\d+(?:,\d+)?)\s*km\s+lang',
                    r'længde\s+(?:på|af)\s+(\d+(?:,\d+)?)\s*(?:kilometer?|km)'
                ],
                'depth': [
                    r'(\d+(?:,\d+)?)\s*meter?\s+dyb',
                    r'(\d+(?:,\d+)?)\s*m\s+dyb',
                    r'dybde\s+(?:på|af)\s+(\d+(?:,\d+)?)\s*(?:meter?|m)'
                ]
            }
        }
        
        lang_patterns = patterns.get(language, patterns['en'])
        
        # Extract length
        for pattern in lang_patterns.get('length', []):
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                if '-' in pattern and len(match.groups()) > 1:
                    # Handle ranges - take average
                    val1 = self._parse_number(match.group(1), language)
                    val2 = self._parse_number(match.group(2), language)
                    if val1 and val2:
                        length = (val1 + val2) / 2
                else:
                    length = self._parse_number(match.group(1), language)
                
                if length and self._validate_measurement(length, 'length'):
                    measurements['length_km'] = length
                    measurements['length_raw'] = match.group(0)
                    break
        
        # Extract depth
        for pattern in lang_patterns.get('depth', []):
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                if '-' in pattern and len(match.groups()) > 1:
                    # Handle ranges - take average
                    val1 = self._parse_number(match.group(1), language)
                    val2 = self._parse_number(match.group(2), language)
                    if val1 and val2:
                        depth = (val1 + val2) / 2
                else:
                    depth = self._parse_number(match.group(1), language)
                
                if depth and self._validate_measurement(depth, 'depth'):
                    measurements['depth_m'] = depth
                    measurements['depth_raw'] = match.group(0)
                    break
        
        return measurements if measurements else None
    
    def _fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a Wikipedia page with error handling."""
        try:
            time.sleep(self.rate_limit_delay)  # Rate limiting
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Handle redirects and disambiguation
            final_url = response.url
            if final_url != url:
                logger.info(f"    Redirected to: {final_url}")
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Check for disambiguation page
            if self._is_disambiguation_page(soup):
                logger.warning(f"    Disambiguation page detected: {url}")
                return None
                
            # Check if page exists
            if self._is_missing_page(soup):
                logger.warning(f"    Page not found: {url}")
                return None
                
            return soup
            
        except requests.exceptions.RequestException as e:
            logger.error(f"    Request failed for {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"    Unexpected error for {url}: {e}")
            return None
    
    def _is_disambiguation_page(self, soup: BeautifulSoup) -> bool:
        """Check if page is a disambiguation page."""
        # Check for disambiguation indicators
        disambig_indicators = [
            'disambiguation',
            'may refer to',
            'flertydighet',  # Norwegian
            'flertydig',     # Norwegian
        ]
        
        page_text = soup.get_text().lower()
        return any(indicator in page_text[:1000] for indicator in disambig_indicators)
    
    def _is_missing_page(self, soup: BeautifulSoup) -> bool:
        """Check if page is missing/does not exist."""
        # Check for "page does not exist" indicators
        missing_indicators = [
            'page does not exist',
            'no page with this title',
            'siden finnes ikke',  # Norwegian
            'artikkelen finnes ikke',  # Norwegian
        ]
        
        page_text = soup.get_text().lower()
        return any(indicator in page_text[:1000] for indicator in missing_indicators)
    
    def _parse_measurement(self, text: str, measurement_type: str, language: str) -> Optional[float]:
        """Parse a measurement value from text."""
        # Clean the text
        text = re.sub(r'[^\d.,\s]', ' ', text)
        
        # Extract number
        if language in ['no', 'nn', 'da']:  # Norwegian/Danish use comma as decimal separator
            number_match = re.search(r'(\d+(?:,\d+)?)', text)
        else:  # English uses period
            number_match = re.search(r'(\d+(?:\.\d+)?)', text)
            
        if not number_match:
            return None
            
        number_str = number_match.group(1)
        value = self._parse_number(number_str, language)
        
        if not value:
            return None
            
        # Convert units if needed
        if measurement_type == 'length':
            # Convert to km if needed
            if 'meter' in text.lower() or ' m ' in text:
                value = value / 1000  # Convert m to km
            elif 'mile' in text.lower():
                value = value * 1.609344  # Convert miles to km
        elif measurement_type == 'depth':
            # Keep in meters
            if 'kilometer' in text.lower() or ' km' in text:
                value = value * 1000  # Convert km to m
            elif 'feet' in text.lower() or 'foot' in text.lower():
                value = value * 0.3048  # Convert feet to m
        
        return value if self._validate_measurement(value, measurement_type) else None
    
    def _parse_number(self, number_str: str, language: str) -> Optional[float]:
        """Parse a number string considering language-specific decimal separators."""
        try:
            if language in ['no', 'nn', 'da']:  # Norwegian/Danish use comma
                number_str = number_str.replace(',', '.')
            return float(number_str)
        except ValueError:
            return None
    
    def _validate_measurement(self, value: float, measurement_type: str) -> bool:
        """Validate if a measurement is within reasonable ranges."""
        if measurement_type == 'length':
            return self.length_range[0] <= value <= self.length_range[1]
        elif measurement_type in ['depth', 'width']:
            return self.depth_range[0] <= value <= self.depth_range[1]
        return False
    
    def _create_result(self, fjord_id: int, measurements: Dict, language: str, url: str, method: str) -> Dict:
        """Create a standardized result dictionary."""
        timestamp = datetime.now().isoformat() + 'Z'
        
        result = {
            'fjord_id': fjord_id,
            'extraction_metadata': {
                'source_language': language,
                'source_url': url,
                'extraction_method': method,
                'confidence': 'high' if method == 'infobox' else 'medium',
                'timestamp': timestamp
            }
        }
        
        # Add measurements
        for key, value in measurements.items():
            if not key.endswith('_raw'):
                result[key] = value
            else:
                result['extraction_metadata'][key] = value
        
        return result
    
    def process_fjords(self) -> None:
        """Process all fjords from Supabase database."""
        logger.info("Starting fjord extraction from Supabase")
        
        # Fetch fjords from database
        fjords = self.fetch_fjords_from_supabase()
        total_fjords = len(fjords)
        successful_extractions = 0
        
        logger.info(f"Processing {total_fjords} fjords")
        
        for i, fjord_data in enumerate(fjords, 1):
            logger.info(f"Progress: {i}/{total_fjords}")
            
            result = self.extract_from_fjord_data(fjord_data)
            if result:
                self.results.append(result)
                successful_extractions += 1
                
        logger.info(f"Extraction complete: {successful_extractions}/{total_fjords} successful")
        
    def save_results(self) -> None:
        """Save results to CSV and JSON files in tools directory."""
        # Save to CSV
        csv_filename = 'tools/fjord_measurements.csv'
        self._save_to_csv(csv_filename)
        
        # Save to JSON
        json_filename = 'tools/fjord_measurements.json'
        self._save_to_json(json_filename)
        
        logger.info(f"Results saved to {csv_filename} and {json_filename}")
        
    def _save_to_csv(self, filename: str) -> None:
        """Save results to CSV format with update logic."""
        existing_data = {}
        
        # Load existing data if file exists
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    fjord_id = int(row['fjord_id'])
                    existing_data[fjord_id] = row
        except FileNotFoundError:
            pass
        
        # Update with new results
        for result in self.results:
            fjord_id = result['fjord_id']
            
            # Flatten the result for CSV
            csv_row = {
                'fjord_id': fjord_id,
                'timestamp': result['extraction_metadata']['timestamp']
            }
            
            # Add measurements
            for key, value in result.items():
                if key != 'extraction_metadata':
                    if key.endswith('_km') or key.endswith('_m'):
                        csv_row[key] = value
            
            # Add metadata
            metadata = result['extraction_metadata']
            csv_row.update({
                'source_language': metadata['source_language'],
                'source_url': metadata['source_url'],
                'extraction_method': metadata['extraction_method'],
                'confidence': metadata['confidence']
            })
            
            # Add raw text if available
            for key, value in metadata.items():
                if key.endswith('_raw'):
                    csv_row[key] = value
            
            existing_data[fjord_id] = csv_row
        
        # Write updated data
        if existing_data:
            fieldnames = set()
            for row in existing_data.values():
                fieldnames.update(row.keys())
            fieldnames = sorted(fieldnames)
            
            with open(filename, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for fjord_id in sorted(existing_data.keys()):
                    writer.writerow(existing_data[fjord_id])
    
    def _save_to_json(self, filename: str) -> None:
        """Save results to JSON format with update logic."""
        existing_data = {}
        
        # Load existing data if file exists
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except FileNotFoundError:
            pass
        
        # Update with new results
        for result in self.results:
            fjord_id = str(result['fjord_id'])  # JSON keys are strings
            existing_data[fjord_id] = result
        
        # Write updated data
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)

def main():
    try:
        extractor = SupabaseFjordExtractor(rate_limit_delay=1.0)
        
        extractor.process_fjords()
        extractor.save_results()
        
        logger.info(f"Extraction completed successfully!")
        logger.info(f"Total results: {len(extractor.results)}")
        
        # Print summary statistics
        languages = {}
        methods = {}
        measurements = {'length': 0, 'depth': 0, 'width': 0}
        
        for result in extractor.results:
            lang = result['extraction_metadata']['source_language']
            method = result['extraction_metadata']['extraction_method']
            
            languages[lang] = languages.get(lang, 0) + 1
            methods[method] = methods.get(method, 0) + 1
            
            if 'length_km' in result:
                measurements['length'] += 1
            if 'depth_m' in result:
                measurements['depth'] += 1
            if 'width_km' in result:
                measurements['width'] += 1
        
        logger.info("Summary statistics:")
        logger.info(f"  Languages: {languages}")
        logger.info(f"  Methods: {methods}")
        logger.info(f"  Measurements: {measurements}")
        
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise

if __name__ == '__main__':
    main()