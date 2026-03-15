-- Add famous Norwegian fjords missing from the Fjordkatalogen dataset:
-- Sognefjorden, Hardangerfjorden, Oslofjorden
--
-- These fjords are too large for the Fjordkatalogen (Miljodirektoratet)
-- which only catalogs smaller water bodies. Added for fact pages and SEO.

ALTER TABLE fjordle_fjords ALTER COLUMN svg_filename DROP NOT NULL;

INSERT INTO fjordle_fjords (id, name, svg_filename, center_lat, center_lng, difficulty_tier, satellite_filename, slug, quarantined, quarantine_reason)
OVERRIDING SYSTEM VALUE
VALUES
  (1468, 'Sognefjorden', NULL, 61.12800463, 6.51353706, 1, NULL, 'sognefjorden', true, 'No outline available; added for fact pages and SEO only'),
  (1469, 'Hardangerfjorden', NULL, 60.23008566, 6.33784652, 1, NULL, 'hardangerfjorden', true, 'No outline available; added for fact pages and SEO only'),
  (1470, 'Oslofjorden', NULL, 59.58924307, 10.59498842, 1, NULL, 'oslofjorden', true, 'No outline available; added for fact pages and SEO only');

INSERT INTO fjordle_fjord_counties (fjord_id, county_id)
VALUES
  (1468, 5),  -- Sognefjorden -> Vestland
  (1469, 5),  -- Hardangerfjorden -> Vestland
  (1470, 3);  -- Oslofjorden -> Viken

SELECT setval('fjordle_fjords_id_seq', (SELECT MAX(id) FROM fjordle_fjords));
