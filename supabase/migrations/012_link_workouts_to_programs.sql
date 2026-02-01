-- Migration 012: Add Program Linking to Workouts
-- Allows workouts to be linked to specific days in AI-generated programs

-- Add program tracking columns to workouts table
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS program_day_index INTEGER;

-- Add check constraint for program_day_index (0-83 for up to 12 weeks)
-- Note: IF NOT EXISTS is not supported for constraints, so we use DO block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_program_day_index'
  ) THEN
    ALTER TABLE public.workouts
    ADD CONSTRAINT check_program_day_index
    CHECK (program_day_index IS NULL OR (program_day_index >= 0 AND program_day_index <= 83));
  END IF;
END $$;

-- Add index for querying workouts by program
CREATE INDEX IF NOT EXISTS idx_workouts_program_id
ON public.workouts(program_id)
WHERE program_id IS NOT NULL;

-- Add composite index for program progress tracking
CREATE INDEX IF NOT EXISTS idx_workouts_program_progress
ON public.workouts(program_id, program_day_index)
WHERE program_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.workouts.program_id IS 'Links workout to AI-generated program (null for standalone workouts)';
COMMENT ON COLUMN public.workouts.program_day_index IS 'Zero-based index into programs.plan_data array (0 = day 1)';
