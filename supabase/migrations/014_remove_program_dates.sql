-- Remove date fields from programs table (programs are now date-agnostic)
-- Users complete workouts in sequence without calendar constraints

ALTER TABLE IF EXISTS public.programs
DROP COLUMN IF EXISTS valid_from,
DROP COLUMN IF EXISTS valid_until;

-- Add comment to document the change
COMMENT ON TABLE public.programs IS 'Training programs with week/workout structure (no calendar dates)';
