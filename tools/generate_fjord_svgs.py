import struct
import os
import csv
import math

def utm_to_latlon(easting, northing):
    if not easting or not northing:
        return None, None
    a = 6378137.0
    f = 1/298.257223563
    e2 = 2*f - f*f
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    k0 = 0.9996
    lon0 = math.radians(15.0)
    false_easting = 500000.0
    false_northing = 0.0
    x = easting - false_easting
    y = northing - false_northing
    M = y / k0
    mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256))
    phi1 = mu + (3*e1/2 - 27*e1*e1*e1/32) * math.sin(2*mu) + \
        (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * math.sin(4*mu) + \
        (151*e1*e1*e1/96) * math.sin(6*mu)
    N1 = a / math.sqrt(1 - e2 * math.sin(phi1)**2)
    T1 = math.tan(phi1)**2
    C1 = e2 * math.cos(phi1)**2 / (1 - e2)
    R1 = a * (1 - e2) / (1 - e2 * math.sin(phi1)**2)**(3/2)
    D = x / (N1 * k0)
    lat = phi1 - (N1 * math.tan(phi1) / R1) * (
        D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2) * D**4 / 24 +
        (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2 - 3*C1*C1) * D**6 / 720)
    lon = lon0 + (D - (1 + 2*T1 + C1) * D**3 / 6 +
        (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2 + 24*T1*T1) * D**5 / 120) / math.cos(phi1)
    return math.degrees(lat), math.degrees(lon)

def read_dbf_data(filename):
    with open(filename, 'rb') as f:
        f.seek(4)
        num_records = struct.unpack('<I', f.read(4))[0]
        header_len = struct.unpack('<H', f.read(2))[0]
        record_len = struct.unpack('<H', f.read(2))[0]
        f.seek(32)
        fields = []
        while True:
            field_data = f.read(32)
            if field_data[0] == 0x0D:
                break
            name = field_data[:11].rstrip(b'\x00').decode('ascii')
            field_type = chr(field_data[11])
            length = field_data[16]
            offset = sum(field[2] for field in fields) + 1
            fields.append((name, field_type, length, offset))
        navn_field = utmx_field = utmy_field = fjordid_field = None
        for field in fields:
            if field[0] == 'navn': navn_field = field
            elif field[0] == 'utmx': utmx_field = field
            elif field[0] == 'utmy': utmy_field = field
            elif field[0] == 'fjordid': fjordid_field = field
        records = []
        f.seek(header_len)
        for _ in range(num_records):
            record = f.read(record_len)
            navn = record[navn_field[3]:navn_field[3]+navn_field[2]].rstrip(b'\x00 ').decode('iso-8859-1') if navn_field else ''
            utmx_str = record[utmx_field[3]:utmx_field[3]+utmx_field[2]].rstrip(b'\x00 ').decode('ascii') if utmx_field else ''
            utmy_str = record[utmy_field[3]:utmy_field[3]+utmy_field[2]].rstrip(b'\x00 ').decode('ascii') if utmy_field else ''
            fjordid = record[fjordid_field[3]:fjordid_field[3]+fjordid_field[2]].rstrip(b'\x00 ').decode('ascii') if fjordid_field else ''
            try:
                utmx = float(utmx_str.replace(',', '.').replace('*', '')) if utmx_str.strip() else None
            except Exception:
                utmx = None
            try:
                utmy = float(utmy_str.replace(',', '.').replace('*', '')) if utmy_str.strip() else None
            except Exception:
                utmy = None
            records.append({
                'navn': navn, 'utmx': utmx, 'utmy': utmy, 'fjordid': fjordid
            })
    return records

def read_shp_polygons(filename):
    with open(filename, 'rb') as f:
        f.seek(100)
        geometries = []
        while True:
            try:
                record_num = struct.unpack('>I', f.read(4))[0]
                content_len = struct.unpack('>I', f.read(4))[0]
                shape_type = struct.unpack('<I', f.read(4))[0]
                if shape_type == 5:
                    f.read(32)
                    num_parts = struct.unpack('<I', f.read(4))[0]
                    num_points = struct.unpack('<I', f.read(4))[0]
                    part_indices = [struct.unpack('<I', f.read(4))[0] for _ in range(num_parts)]
                    all_points = [list(struct.unpack('<dd', f.read(16))) for _ in range(num_points)]
                    if num_parts > 1:
                        exterior_points = all_points[part_indices[0]:part_indices[1]]
                    else:
                        exterior_points = all_points
                    geometries.append(exterior_points)
                else:
                    f.read(content_len*2 - 4)
                    geometries.append([])
            except struct.error:
                break
        return geometries

def normalize_to_square(coords, size=400, padding=40):
    if not coords: return []
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    width = maxx - minx
    height = maxy - miny
    if width == 0 or height == 0: return []
    available_size = size - (2 * padding)
    scale = available_size / max(width, height)
    new_width = width * scale
    new_height = height * scale
    offset_x = (size - new_width) / 2
    offset_y = (size - new_height) / 2
    return [[(x - minx)*scale + offset_x, size - ((y - miny)*scale + offset_y)] for x, y in coords]

def create_svg_path(coords):
    if not coords: return ""
    # DO NOT REMOVE last coordinate, even if equal to first
    path = f"M {coords[0][0]:.1f},{coords[0][1]:.1f}"
    for x, y in coords[1:]:
        path += f" L {x:.1f},{y:.1f}"
    return path

records = read_dbf_data('fjordkatalogen_omrade.dbf')
geometries = read_shp_polygons('fjordkatalogen_omrade.shp')
os.makedirs('fjord_svgs', exist_ok=True)
csv_file = open('fjord_data.csv', 'w', newline='', encoding='utf-8')
csv_writer = csv.writer(csv_file)
csv_writer.writerow(['svg_filename', 'name', 'center_lat', 'center_lng', 'fjordid', 'difficulty_tier'])

for idx, (record, coords) in enumerate(zip(records, geometries)):
    navn = record.get('navn', '')
    fjord_id = record.get('fjordid', '')
    utmx, utmy = record.get('utmx'), record.get('utmy')
    safe_name = "".join(c for c in navn if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"{idx:04d}_{safe_name}.svg" if safe_name else f"{idx:04d}_unknown.svg"
    try:
        if utmx is not None and utmy is not None:
            lat, lon = utm_to_latlon(utmx, utmy)
        else:
            lat, lon = None, None
    except Exception:
        lat, lon = None, None
    normalized_coords = normalize_to_square(coords, size=400, padding=40)
    path = create_svg_path(normalized_coords)
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="white"/>
  <path d="{path}" fill="none" stroke="black" stroke-width="2"/>
</svg>'''
    with open(f'fjord_svgs/{filename}', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    csv_writer.writerow([filename, navn, lat, lon, fjord_id, ''])
    print(f"Generated: {filename} - {navn} (lat: {lat}, lng: {lon})")

csv_file.close()
print(f"Processing complete. SVGs saved to 'fjord_svgs' directory.")
print(f"Metadata saved to 'fjord_data.csv'")

