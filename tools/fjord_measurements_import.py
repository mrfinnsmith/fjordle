import json
import os
import requests
from typing import Dict, List, Tuple
from dotenv import load_dotenv

def validate_measurement(fjord_id: int, measurement_type: str, value: float) -> bool:
    bounds = {
        'length_km': (0.5, 200),
        'width_km': (0.01, 50),
        'depth_m': (5, 1000)
    }
    
    if measurement_type not in bounds:
        return False
    
    min_val, max_val = bounds[measurement_type]
    return min_val <= value <= max_val

def process_measurements(data: Dict) -> Tuple[List[Dict], List[Dict]]:
    valid = []
    invalid = []
    
    for fjord_id_str, measurement_data in data.items():
        fjord_id = int(fjord_id_str)
        entry = {'fjord_id': fjord_id}
        is_valid = True
        
        for field in ['length_km', 'width_km', 'depth_m']:
            if field in measurement_data:
                value = measurement_data[field]
                if validate_measurement(fjord_id, field, value):
                    entry[field] = value
                else:
                    is_valid = False
                    entry[f'{field}_invalid'] = value
        
        if 'extraction_metadata' in measurement_data:
            meta = measurement_data['extraction_metadata']
            entry['source_url'] = meta.get('source_url')
        
        if is_valid and len([k for k in entry.keys() if k.endswith('_km') or k.endswith('_m')]) > 0:
            valid.append(entry)
        else:
            invalid.append(entry)
    
    return valid, invalid

def insert_measurements(valid_measurements: List[Dict], supabase_url: str, service_key: str):
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    for entry in valid_measurements:
        fjord_id = entry['fjord_id']
        update_data = {}
        
        for field in ['length_km', 'width_km', 'depth_m']:
            if field in entry:
                update_data[field] = entry[field]
        
        if 'source_url' in entry:
            update_data['measurement_source_url'] = entry['source_url']
        
        if update_data:
            updates = []
            for k, v in update_data.items():
                if isinstance(v, (int, float)):
                    updates.append(f'{k} = {v}')
                else:
                    updates.append(f"{k} = '{v}'")
            print(f"UPDATE fjords SET {', '.join(updates)} WHERE id = {fjord_id};")
            # url = f"{supabase_url}/rest/v1/fjords?id=eq.{fjord_id}"
            # requests.patch(url, json=update_data, headers=headers)

def main():
    env_paths = ['.env.local', '../.env.local', '../../.env.local']
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            break
    
    json_paths = ['fjord_measurements.json', 'tools/fjord_measurements.json', '../fjord_measurements.json']
    data = None
    for json_path in json_paths:
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                data = json.load(f)
            break
    
    if data is None:
        raise FileNotFoundError("fjord_measurements.json not found")
    
    valid, invalid = process_measurements(data)
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('NEXT_PUBLIC_SUPABASE_SERVICE_KEY')
    insert_measurements(valid, supabase_url, service_key)
    
    return valid, invalid

if __name__ == "__main__":
    valid_measurements, invalid_measurements = main()
