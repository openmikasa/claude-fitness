-- Migration 009: Split muscle_groups into primary_muscles and secondary_muscles
-- Purpose: Improve AI exercise matching by distinguishing primary movers from stabilizers
-- Maintains backward compatibility by keeping muscle_groups column

-- Step 1: Add new columns for primary and secondary muscle groups
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS primary_muscles TEXT[],
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[];

-- Step 2: Create GIN indexes for fast array containment queries
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscles
  ON public.exercises USING GIN (primary_muscles);

CREATE INDEX IF NOT EXISTS idx_exercises_secondary_muscles
  ON public.exercises USING GIN (secondary_muscles);

-- Step 3: Migrate existing data
-- Copy muscle_groups to primary_muscles for backward compatibility
-- This ensures existing exercises have data in the new field
UPDATE public.exercises
  SET primary_muscles = muscle_groups
  WHERE primary_muscles IS NULL;

-- Initialize secondary_muscles as empty array
UPDATE public.exercises
  SET secondary_muscles = ARRAY[]::TEXT[]
  WHERE secondary_muscles IS NULL;

-- Note: We keep muscle_groups for backward compatibility
-- It will be deprecated once all code is migrated to use primary/secondary
