-- RPC function to get all counties with their fjord counts
CREATE OR REPLACE FUNCTION get_county_fjord_counts()
RETURNS TABLE(name TEXT, slug TEXT, fjord_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT c.name, c.slug, COUNT(jc.fjord_id) AS fjord_count
  FROM fjordle_counties c
  LEFT JOIN fjordle_fjord_counties jc ON jc.county_id = c.id
  GROUP BY c.id, c.name, c.slug
  ORDER BY c.name;
$$;

-- RPC function to get all fjords with their county names
CREATE OR REPLACE FUNCTION get_fjords_with_counties()
RETURNS TABLE(fjord_id INT, fjord_name TEXT, fjord_slug TEXT, county_names TEXT[])
LANGUAGE sql STABLE
AS $$
  SELECT f.id AS fjord_id, f.name AS fjord_name, f.slug AS fjord_slug,
         COALESCE(ARRAY_AGG(c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS county_names
  FROM fjordle_fjords f
  LEFT JOIN fjordle_fjord_counties jc ON jc.fjord_id = f.id
  LEFT JOIN fjordle_counties c ON c.id = jc.county_id
  WHERE f.quarantined = false
  GROUP BY f.id, f.name, f.slug
  ORDER BY f.name;
$$;
