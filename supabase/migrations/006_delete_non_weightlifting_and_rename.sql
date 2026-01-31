-- Migration 006: Delete non-weightlifting workouts and rename 'strength' to 'weightlifting'
-- WARNING: This migration deletes data! Backup your database first!
-- This migration:
--   1. Deletes all workouts where workout_type != 'strength'
--   2. Renames the enum value from 'strength' to 'weightlifting'
--   3. Updates CHECK constraint to reference 'weightlifting'

-- Step 1: Delete all non-strength workouts (CASCADE handles workout_exercises)
-- IMPORTANT: Backup your database first!
DELETE FROM public.workouts
WHERE workout_type != 'strength';

-- Step 2: Drop existing CHECK constraint (from migration 005)
ALTER TABLE public.workouts
DROP CONSTRAINT IF EXISTS only_strength_workouts;

-- Step 3: Rename enum value from 'strength' to 'weightlifting'
-- First, create new enum with 'weightlifting'
CREATE TYPE workout_type_new AS ENUM ('weightlifting');

-- Step 4: Migrate the column to new enum
ALTER TABLE public.workouts
  ALTER COLUMN workout_type TYPE workout_type_new
  USING 'weightlifting'::workout_type_new;

-- Step 5: Drop old enum and rename new one
DROP TYPE IF EXISTS workout_type CASCADE;
ALTER TYPE workout_type_new RENAME TO workout_type;

-- Step 6: Add new CHECK constraint with 'weightlifting'
ALTER TABLE public.workouts
ADD CONSTRAINT only_weightlifting_workouts
CHECK (workout_type = 'weightlifting');

-- Step 7: Update table and column comments
COMMENT ON TABLE public.workouts IS
  'Stores weightlifting workouts only. The data column contains WeightliftingData JSONB structure.';

COMMENT ON COLUMN public.workouts.workout_type IS
  'Always set to ''weightlifting'' - the app only supports weightlifting.';

COMMENT ON COLUMN public.workouts.data IS
  'JSONB structure for weightlifting workout: {"exercises": [{"name": "...", "sets": [{"weight": 100, "reps": 5}]}]}';

COMMENT ON CONSTRAINT only_weightlifting_workouts ON public.workouts IS
  'Ensures only weightlifting workouts can be created.';

-- Verification queries (commented out - run manually to verify):
-- Check all workouts are now 'weightlifting':
-- SELECT workout_type, COUNT(*) FROM public.workouts GROUP BY workout_type;

-- Verify enum only has 'weightlifting':
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'workout_type'::regtype;

-- Verify constraint exists:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'workouts'::regclass;
