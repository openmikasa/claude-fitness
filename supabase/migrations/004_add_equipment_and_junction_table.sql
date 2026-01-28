-- Add equipment array to exercises table
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}';

-- Create workout_exercises junction table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  equipment TEXT[] DEFAULT '{}',
  sets_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, exercise_id)
);

-- Indexes for performance (CRITICAL for query speed)
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises USING GIN(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON public.exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_equipment ON public.workout_exercises USING GIN(equipment);

-- RLS policies
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout exercises"
  ON public.workout_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own workout exercises"
  ON public.workout_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own workout exercises"
  ON public.workout_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own workout exercises"
  ON public.workout_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = workout_exercises.workout_id
    AND workouts.user_id = auth.uid()
  ));

-- Trigger for updated_at (reuse existing function)
CREATE TRIGGER update_workout_exercises_updated_at
  BEFORE UPDATE ON public.workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed common equipment values for existing exercises
UPDATE public.exercises
SET equipment = ARRAY['barbell', 'rack']
WHERE name IN ('Squat', 'Bench Press', 'Deadlift') AND equipment = '{}';

UPDATE public.exercises
SET equipment = ARRAY['dumbbell']
WHERE name IN ('Dumbbell Row', 'Shoulder Press') AND equipment = '{}';

UPDATE public.exercises
SET equipment = ARRAY['bodyweight']
WHERE name IN ('Pull-up', 'Push-up') AND equipment = '{}';
