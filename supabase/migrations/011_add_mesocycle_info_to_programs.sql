-- Add mesocycle_info column to programs table for multi-week periodized programs
-- This column stores information about the periodization structure including:
-- - total_weeks: number of weeks in the program (1-12)
-- - deload_weeks: array of week numbers that are deload weeks
-- - periodization_model: 'linear', 'undulating', or 'block'
-- - phase: optional phase name like 'hypertrophy', 'strength', 'power'

ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS mesocycle_info JSONB DEFAULT NULL;

-- Add index for querying programs by periodization model
CREATE INDEX IF NOT EXISTS idx_programs_mesocycle_model
ON public.programs ((mesocycle_info->>'periodization_model'))
WHERE mesocycle_info IS NOT NULL;
