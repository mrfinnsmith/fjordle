-- INS-984: Create Supabase RPC fjordle_get_fjord_by_slug

CREATE OR REPLACE FUNCTION public.fjordle_get_fjord_by_slug(p_slug text)
RETURNS TABLE (
  fjord_id           integer,
  fjord_name         text,
  slug               text,
  svg_filename       text,
  satellite_filename text,
  center_lat         numeric,
  center_lng         numeric,
  wikipedia_url_no   text,
  wikipedia_url_en   text,
  wikipedia_url_nn   text,
  wikipedia_url_da   text,
  wikipedia_url_ceb  text,
  length_km          numeric,
  width_km           numeric,
  depth_m            numeric,
  measurement_source_url text,
  municipalities     text[],
  counties           text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id               AS fjord_id,
    f.name             AS fjord_name,
    f.slug,
    f.svg_filename,
    f.satellite_filename,
    f.center_lat,
    f.center_lng,
    f.wikipedia_url_no,
    f.wikipedia_url_en,
    f.wikipedia_url_nn,
    f.wikipedia_url_da,
    f.wikipedia_url_ceb,
    f.length_km,
    f.width_km,
    f.depth_m,
    f.measurement_source_url,
    ARRAY(
      SELECT m.name
      FROM fjordle_fjord_municipalities fm
      JOIN fjordle_municipalities m ON m.id = fm.municipality_id
      WHERE fm.fjord_id = f.id
      ORDER BY m.name
    ) AS municipalities,
    ARRAY(
      SELECT DISTINCT c.name
      FROM (
        SELECT fc.county_id
        FROM fjordle_fjord_counties fc
        WHERE fc.fjord_id = f.id
        UNION
        SELECT m2.county_id
        FROM fjordle_fjord_municipalities fm2
        JOIN fjordle_municipalities m2 ON m2.id = fm2.municipality_id
        WHERE fm2.fjord_id = f.id
          AND m2.county_id IS NOT NULL
      ) combined
      JOIN fjordle_counties c ON c.id = combined.county_id
      ORDER BY c.name
    ) AS counties
  FROM fjordle_fjords f
  WHERE f.slug = p_slug;
END;
$$;

GRANT ALL ON FUNCTION public.fjordle_get_fjord_by_slug(text) TO anon;
GRANT ALL ON FUNCTION public.fjordle_get_fjord_by_slug(text) TO authenticated;
GRANT ALL ON FUNCTION public.fjordle_get_fjord_by_slug(text) TO service_role;
