-- Fix county assignments for famous fjords.
-- Previous migration used wrong county IDs.

-- Remove incorrect assignments
DELETE FROM fjordle_fjord_counties WHERE fjord_id IN (1468, 1469, 1470);

-- Sognefjorden -> Vestland (7)
INSERT INTO fjordle_fjord_counties (fjord_id, county_id) VALUES (1468, 7);

-- Hardangerfjorden -> Vestland (7)
INSERT INTO fjordle_fjord_counties (fjord_id, county_id) VALUES (1469, 7);

-- Oslofjorden -> Akershus (1), Østfold (8), Vestfold (12)
INSERT INTO fjordle_fjord_counties (fjord_id, county_id) VALUES (1470, 1);
INSERT INTO fjordle_fjord_counties (fjord_id, county_id) VALUES (1470, 8);
INSERT INTO fjordle_fjord_counties (fjord_id, county_id) VALUES (1470, 12);
