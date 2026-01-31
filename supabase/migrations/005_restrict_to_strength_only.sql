-- Migration: Comprehensive cleanup to strength training only
-- This migration simplifies the database schema to only support strength training

-- Step 1: Add CHECK constraint to prevent new non-strength workouts
-- This ensures that even if the enum still has other values, only 'strength' can be inserted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'only_strength_workouts'
    AND conrelid = 'public.workouts'::regclass
  ) THEN
    ALTER TABLE public.workouts
    ADD CONSTRAINT only_strength_workouts
    CHECK (workout_type = 'strength');
  END IF;
END $$;

-- Step 2: Remove unnecessary index on workout_type (no longer needed with single type)
DROP INDEX IF EXISTS idx_workouts_type;

-- Step 3: Simplify the workout_type enum
-- Note: We create a new enum with only 'strength' and migrate the column
-- WARNING: This will FAIL if there are existing non-strength workouts in the database

DO $$
BEGIN
  -- Create new simplified enum type (if it doesn't already exist)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workout_type_strength_only') THEN
    CREATE TYPE workout_type_strength_only AS ENUM ('strength');
  END IF;

  -- Migrate the column to use the new enum type
  -- This ensures type safety at the database level
  ALTER TABLE public.workouts
    ALTER COLUMN workout_type TYPE workout_type_strength_only
    USING workout_type::text::workout_type_strength_only;

  -- Drop the old enum type (which had all 4 values)
  DROP TYPE IF EXISTS workout_type CASCADE;

  -- Rename the new type to the original name for backward compatibility
  ALTER TYPE workout_type_strength_only RENAME TO workout_type;

EXCEPTION
  WHEN OTHERS THEN
    -- If migration fails (e.g., due to existing non-strength workouts),
    -- just keep the CHECK constraint and log the error
    RAISE NOTICE 'Could not migrate enum type. Keeping CHECK constraint only. Error: %', SQLERRM;
END $$;

-- Step 4: Add helpful comments to document the schema
COMMENT ON TABLE public.workouts IS
  'Stores strength training workouts only. The data column contains StrengthData JSONB structure.';

COMMENT ON COLUMN public.workouts.workout_type IS
  'Always set to ''strength'' - the app only supports strength training.';

COMMENT ON COLUMN public.workouts.data IS
  'JSONB structure for strength workout: {"exercises": [{"name": "...", "sets": [{"weight": 100, "reps": 5}]}]}';

COMMENT ON CONSTRAINT only_strength_workouts ON public.workouts IS
  'Ensures only strength workouts can be created. Added as part of simplification to strength-only app.';

-- Step 5: Update programs table comments
-- The plan_data JSONB no longer includes workout_type per day
COMMENT ON COLUMN public.programs.plan_data IS
  'Array of program days with strength workout data only. Structure: [{"day": 1, "data": {...}, "coaching_notes": "..."}]';

COMMENT ON TABLE public.programs IS
  'AI-generated training plans. All programs are for strength training only.';
