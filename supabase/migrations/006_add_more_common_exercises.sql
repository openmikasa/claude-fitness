-- Add more common exercises with proper equipment and muscle groups
INSERT INTO public.exercises (name, category, muscle_groups, equipment) VALUES
  -- Pull exercises
  ('Cable Row', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
  ('Cable One Arm Row', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
  ('Seated Cable Row', 'strength', ARRAY['back', 'biceps'], ARRAY['cable', 'machine']),
  ('Lat Pulldown', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
  ('Face Pull', 'strength', ARRAY['shoulders', 'back'], ARRAY['cable']),
  ('Chin-up', 'strength', ARRAY['back', 'biceps'], ARRAY['bodyweight']),
  ('Inverted Row', 'strength', ARRAY['back', 'biceps'], ARRAY['bodyweight', 'barbell']),
  ('Dumbbell Row', 'strength', ARRAY['back', 'biceps'], ARRAY['dumbbell']),
  ('T-Bar Row', 'strength', ARRAY['back'], ARRAY['barbell']),
  ('Pendlay Row', 'strength', ARRAY['back'], ARRAY['barbell']),
  ('Meadows Row', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell']),

  -- Push exercises
  ('Incline Bench Press', 'strength', ARRAY['chest', 'triceps'], ARRAY['barbell', 'rack']),
  ('Decline Bench Press', 'strength', ARRAY['chest', 'triceps'], ARRAY['barbell', 'rack']),
  ('Dumbbell Bench Press', 'strength', ARRAY['chest', 'triceps'], ARRAY['dumbbell']),
  ('Dumbbell Incline Press', 'strength', ARRAY['chest', 'triceps'], ARRAY['dumbbell']),
  ('Cable Fly', 'strength', ARRAY['chest'], ARRAY['cable']),
  ('Pec Deck', 'strength', ARRAY['chest'], ARRAY['machine']),
  ('Push-up', 'strength', ARRAY['chest', 'triceps'], ARRAY['bodyweight']),
  ('Dumbbell Shoulder Press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell']),
  ('Arnold Press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell']),
  ('Lateral Raise', 'strength', ARRAY['shoulders'], ARRAY['dumbbell']),
  ('Front Raise', 'strength', ARRAY['shoulders'], ARRAY['dumbbell']),
  ('Rear Delt Fly', 'strength', ARRAY['shoulders'], ARRAY['dumbbell']),
  ('Cable Lateral Raise', 'strength', ARRAY['shoulders'], ARRAY['cable']),
  ('Tricep Pushdown', 'strength', ARRAY['triceps'], ARRAY['cable']),
  ('Overhead Tricep Extension', 'strength', ARRAY['triceps'], ARRAY['dumbbell']),
  ('Skull Crusher', 'strength', ARRAY['triceps'], ARRAY['barbell']),
  ('Close-Grip Bench Press', 'strength', ARRAY['triceps', 'chest'], ARRAY['barbell']),

  -- Leg exercises
  ('Front Squat', 'strength', ARRAY['legs', 'quadriceps'], ARRAY['barbell', 'rack']),
  ('Goblet Squat', 'strength', ARRAY['legs', 'glutes'], ARRAY['dumbbell']),
  ('Bulgarian Split Squat', 'strength', ARRAY['legs', 'glutes'], ARRAY['dumbbell']),
  ('Leg Press', 'strength', ARRAY['legs', 'quadriceps'], ARRAY['machine']),
  ('Leg Extension', 'strength', ARRAY['quadriceps'], ARRAY['machine']),
  ('Leg Curl', 'strength', ARRAY['hamstrings'], ARRAY['machine']),
  ('Nordic Curl', 'strength', ARRAY['hamstrings'], ARRAY['bodyweight']),
  ('Calf Raise', 'strength', ARRAY['calves'], ARRAY['machine']),
  ('Standing Calf Raise', 'strength', ARRAY['calves'], ARRAY['barbell']),
  ('Walking Lunge', 'strength', ARRAY['legs', 'glutes'], ARRAY['dumbbell']),
  ('Step-up', 'strength', ARRAY['legs', 'glutes'], ARRAY['dumbbell']),

  -- Bicep exercises
  ('Barbell Curl', 'strength', ARRAY['biceps'], ARRAY['barbell']),
  ('Dumbbell Curl', 'strength', ARRAY['biceps'], ARRAY['dumbbell']),
  ('Hammer Curl', 'strength', ARRAY['biceps', 'forearms'], ARRAY['dumbbell']),
  ('Cable Curl', 'strength', ARRAY['biceps'], ARRAY['cable']),
  ('Preacher Curl', 'strength', ARRAY['biceps'], ARRAY['barbell']),
  ('Concentration Curl', 'strength', ARRAY['biceps'], ARRAY['dumbbell']),
  ('EZ Bar Curl', 'strength', ARRAY['biceps'], ARRAY['barbell']),

  -- Core exercises
  ('Plank', 'strength', ARRAY['core'], ARRAY['bodyweight']),
  ('Side Plank', 'strength', ARRAY['core'], ARRAY['bodyweight']),
  ('Ab Wheel', 'strength', ARRAY['core'], ARRAY['bodyweight']),
  ('Hanging Leg Raise', 'strength', ARRAY['core'], ARRAY['bodyweight']),
  ('Cable Crunch', 'strength', ARRAY['core'], ARRAY['cable']),
  ('Russian Twist', 'strength', ARRAY['core'], ARRAY['bodyweight']),
  ('Wood Chop', 'strength', ARRAY['core'], ARRAY['cable']),
  ('Pallof Press', 'strength', ARRAY['core'], ARRAY['cable']),

  -- Olympic lifts
  ('Power Clean', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
  ('Hang Clean', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
  ('Clean and Jerk', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
  ('Snatch', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),

  -- Specialized/Athletic
  ('Box Jump', 'strength', ARRAY['legs'], ARRAY['bodyweight']),
  ('Farmers Walk', 'strength', ARRAY['forearms', 'core'], ARRAY['dumbbell']),
  ('Sled Push', 'strength', ARRAY['legs'], ARRAY['machine']),
  ('Battle Ropes', 'cardio', ARRAY['shoulders', 'core'], ARRAY['bodyweight']),
  ('Kettlebell Swing', 'strength', ARRAY['glutes', 'hamstrings'], ARRAY['kettlebell']),
  ('Turkish Get-up', 'strength', ARRAY['core', 'shoulders'], ARRAY['kettlebell']),
  ('Burpee', 'cardio', ARRAY['chest', 'legs', 'core'], ARRAY['bodyweight'])

ON CONFLICT (name) DO UPDATE
SET
  muscle_groups = EXCLUDED.muscle_groups,
  equipment = EXCLUDED.equipment;

-- Update existing exercises with equipment if they don't have it
UPDATE public.exercises
SET equipment = ARRAY['barbell', 'rack']
WHERE name IN ('Overhead Press') AND (equipment IS NULL OR equipment = '{}');

UPDATE public.exercises
SET equipment = ARRAY['barbell']
WHERE name IN ('Barbell Row') AND (equipment IS NULL OR equipment = '{}');

UPDATE public.exercises
SET equipment = ARRAY['bodyweight']
WHERE name IN ('Dip') AND (equipment IS NULL OR equipment = '{}');

UPDATE public.exercises
SET equipment = ARRAY['bodyweight']
WHERE name IN ('Lunge') AND (equipment IS NULL OR equipment = '{}');

UPDATE public.exercises
SET equipment = ARRAY['barbell']
WHERE name IN ('Romanian Deadlift') AND (equipment IS NULL OR equipment = '{}');

UPDATE public.exercises
SET equipment = ARRAY['barbell', 'machine']
WHERE name IN ('Hip Thrust') AND (equipment IS NULL OR equipment = '{}');
