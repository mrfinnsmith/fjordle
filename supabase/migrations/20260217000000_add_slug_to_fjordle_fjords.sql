-- INS-982: Add slug column to fjordle_fjords
-- slug is nullable initially; INS-983 populates values, then adds NOT NULL constraint.
-- The UNIQUE constraint creates the index needed for efficient slug lookups.
ALTER TABLE fjordle_fjords
  ADD COLUMN slug text UNIQUE;
