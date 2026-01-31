-- Migration 010: Update exercise muscle group data with accurate primary/secondary split
-- Purpose: Fix muscle group data based on authoritative sources for better AI matching
-- Sources: StrengthLog, Lift Vault, Powertec, Kettlebell Kings, NASM (2025-2026)

-- Core Compound Movements

-- Bench Press (Barbell, Dumbbell, Incline, Decline variants)
UPDATE public.exercises SET
  primary_muscles = ARRAY['chest', 'triceps', 'shoulders'],
  secondary_muscles = ARRAY['core']
WHERE LOWER(name) IN ('bench press', 'barbell bench press', 'dumbbell bench press');

UPDATE public.exercises SET
  primary_muscles = ARRAY['upper_chest', 'triceps', 'shoulders'],
  secondary_muscles = ARRAY['core']
WHERE LOWER(name) IN ('incline bench press', 'incline barbell bench press', 'incline dumbbell bench press');

UPDATE public.exercises SET
  primary_muscles = ARRAY['lower_chest', 'triceps', 'shoulders'],
  secondary_muscles = ARRAY['core']
WHERE LOWER(name) IN ('decline bench press', 'decline barbell bench press', 'decline dumbbell bench press');

-- Squat (Barbell, Front, Goblet variants)
UPDATE public.exercises SET
  primary_muscles = ARRAY['quadriceps', 'glutes', 'hamstrings'],
  secondary_muscles = ARRAY['core', 'calves', 'erector_spinae']
WHERE LOWER(name) IN ('squat', 'back squat', 'barbell squat', 'high bar squat', 'low bar squat');

UPDATE public.exercises SET
  primary_muscles = ARRAY['quadriceps', 'core'],
  secondary_muscles = ARRAY['glutes', 'shoulders', 'erector_spinae']
WHERE LOWER(name) IN ('front squat', 'barbell front squat');

UPDATE public.exercises SET
  primary_muscles = ARRAY['quadriceps', 'glutes'],
  secondary_muscles = ARRAY['core', 'shoulders']
WHERE LOWER(name) IN ('goblet squat', 'kettlebell goblet squat');

-- Deadlift (Conventional, Sumo, Romanian variants)
UPDATE public.exercises SET
  primary_muscles = ARRAY['glutes', 'hamstrings', 'erector_spinae'],
  secondary_muscles = ARRAY['quadriceps', 'trapezius', 'lats', 'core', 'forearms']
WHERE LOWER(name) IN ('deadlift', 'barbell deadlift', 'conventional deadlift');

UPDATE public.exercises SET
  primary_muscles = ARRAY['glutes', 'hamstrings', 'quadriceps'],
  secondary_muscles = ARRAY['erector_spinae', 'trapezius', 'core', 'forearms']
WHERE LOWER(name) IN ('sumo deadlift', 'barbell sumo deadlift');

UPDATE public.exercises SET
  primary_muscles = ARRAY['hamstrings', 'glutes', 'erector_spinae'],
  secondary_muscles = ARRAY['lats', 'trapezius', 'forearms']
WHERE LOWER(name) IN ('romanian deadlift', 'rdl', 'barbell romanian deadlift');

-- Overhead Press (Standing, Seated, variations)
UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders', 'triceps'],
  secondary_muscles = ARRAY['trapezius', 'upper_chest', 'core']
WHERE LOWER(name) IN ('overhead press', 'military press', 'shoulder press', 'barbell overhead press',
                      'standing overhead press', 'barbell shoulder press');

UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders', 'triceps'],
  secondary_muscles = ARRAY['trapezius', 'upper_chest']
WHERE LOWER(name) IN ('seated overhead press', 'seated shoulder press', 'seated barbell press');

UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders', 'triceps'],
  secondary_muscles = ARRAY['trapezius']
WHERE LOWER(name) IN ('dumbbell overhead press', 'dumbbell shoulder press', 'arnold press');

-- Rows (Barbell, Dumbbell, Cable variants)
UPDATE public.exercises SET
  primary_muscles = ARRAY['back', 'trapezius'],
  secondary_muscles = ARRAY['biceps', 'forearms', 'rear_deltoids', 'rhomboids']
WHERE LOWER(name) IN ('barbell row', 'bent over row', 'pendlay row');

UPDATE public.exercises SET
  primary_muscles = ARRAY['back', 'trapezius'],
  secondary_muscles = ARRAY['biceps', 'rear_deltoids', 'core']
WHERE LOWER(name) IN ('dumbbell row', 'single arm dumbbell row', 'one arm dumbbell row');

UPDATE public.exercises SET
  primary_muscles = ARRAY['back', 'trapezius'],
  secondary_muscles = ARRAY['biceps', 'rear_deltoids']
WHERE LOWER(name) IN ('cable row', 'seated cable row', 't-bar row');

-- Pull-ups and Chin-ups
UPDATE public.exercises SET
  primary_muscles = ARRAY['back', 'biceps'],
  secondary_muscles = ARRAY['trapezius', 'rhomboids', 'rear_deltoids', 'forearms', 'core']
WHERE LOWER(name) IN ('pull-up', 'pull up', 'pullup', 'wide grip pull-up');

UPDATE public.exercises SET
  primary_muscles = ARRAY['biceps', 'back'],
  secondary_muscles = ARRAY['trapezius', 'rhomboids', 'forearms', 'core']
WHERE LOWER(name) IN ('chin-up', 'chin up', 'chinup');

UPDATE public.exercises SET
  primary_muscles = ARRAY['back'],
  secondary_muscles = ARRAY['biceps', 'trapezius', 'rhomboids', 'forearms']
WHERE LOWER(name) IN ('lat pulldown', 'lat pull down', 'wide grip lat pulldown');

-- Isolation: Chest
UPDATE public.exercises SET
  primary_muscles = ARRAY['chest'],
  secondary_muscles = ARRAY['shoulders']
WHERE LOWER(name) IN ('chest fly', 'dumbbell fly', 'cable fly', 'pec deck', 'pec fly machine');

-- Isolation: Shoulders
UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('lateral raise', 'side lateral raise', 'dumbbell lateral raise');

UPDATE public.exercises SET
  primary_muscles = ARRAY['rear_deltoids'],
  secondary_muscles = ARRAY['trapezius', 'rhomboids']
WHERE LOWER(name) IN ('rear delt fly', 'rear deltoid fly', 'reverse fly', 'face pull');

UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders'],
  secondary_muscles = ARRAY['trapezius']
WHERE LOWER(name) IN ('front raise', 'dumbbell front raise', 'barbell front raise');

-- Isolation: Arms
UPDATE public.exercises SET
  primary_muscles = ARRAY['biceps'],
  secondary_muscles = ARRAY['forearms']
WHERE LOWER(name) IN ('bicep curl', 'barbell curl', 'dumbbell curl', 'hammer curl',
                      'preacher curl', 'concentration curl', 'ez bar curl');

UPDATE public.exercises SET
  primary_muscles = ARRAY['triceps'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('tricep extension', 'overhead tricep extension', 'skull crusher',
                      'tricep kickback', 'rope pushdown', 'tricep pushdown');

UPDATE public.exercises SET
  primary_muscles = ARRAY['triceps', 'chest'],
  secondary_muscles = ARRAY['shoulders']
WHERE LOWER(name) IN ('dip', 'dips', 'chest dip', 'tricep dip');

-- Isolation: Legs
UPDATE public.exercises SET
  primary_muscles = ARRAY['quadriceps'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('leg extension', 'leg extensions');

UPDATE public.exercises SET
  primary_muscles = ARRAY['hamstrings'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('leg curl', 'lying leg curl', 'seated leg curl', 'hamstring curl');

UPDATE public.exercises SET
  primary_muscles = ARRAY['glutes'],
  secondary_muscles = ARRAY['hamstrings']
WHERE LOWER(name) IN ('hip thrust', 'barbell hip thrust', 'glute bridge');

UPDATE public.exercises SET
  primary_muscles = ARRAY['quadriceps', 'glutes'],
  secondary_muscles = ARRAY['hamstrings', 'core']
WHERE LOWER(name) IN ('lunge', 'walking lunge', 'reverse lunge', 'bulgarian split squat',
                      'split squat', 'forward lunge');

UPDATE public.exercises SET
  primary_muscles = ARRAY['calves'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('calf raise', 'standing calf raise', 'seated calf raise',
                      'donkey calf raise');

-- Isolation: Back
UPDATE public.exercises SET
  primary_muscles = ARRAY['trapezius'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('shrug', 'barbell shrug', 'dumbbell shrug', 'trap raise');

UPDATE public.exercises SET
  primary_muscles = ARRAY['back'],
  secondary_muscles = ARRAY['biceps', 'rhomboids']
WHERE LOWER(name) IN ('straight arm pulldown', 'straight arm lat pulldown');

-- Core Exercises
UPDATE public.exercises SET
  primary_muscles = ARRAY['core'],
  secondary_muscles = ARRAY[]::TEXT[]
WHERE LOWER(name) IN ('plank', 'front plank', 'side plank', 'ab wheel',
                      'ab rollout', 'hanging leg raise', 'leg raise');

UPDATE public.exercises SET
  primary_muscles = ARRAY['core'],
  secondary_muscles = ARRAY['hip_flexors']
WHERE LOWER(name) IN ('crunch', 'sit-up', 'bicycle crunch', 'russian twist');

-- Functional/Olympic Lifts
UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders', 'quadriceps', 'glutes'],
  secondary_muscles = ARRAY['triceps', 'trapezius', 'core', 'calves']
WHERE LOWER(name) IN ('push press', 'barbell push press');

UPDATE public.exercises SET
  primary_muscles = ARRAY['shoulders', 'quadriceps', 'glutes'],
  secondary_muscles = ARRAY['triceps', 'trapezius', 'core', 'hamstrings', 'calves']
WHERE LOWER(name) IN ('clean and press', 'clean & press', 'power clean');

UPDATE public.exercises SET
  primary_muscles = ARRAY['trapezius', 'shoulders', 'quadriceps'],
  secondary_muscles = ARRAY['glutes', 'hamstrings', 'calves', 'core']
WHERE LOWER(name) IN ('snatch', 'power snatch');

-- Cardio (keep simple - whole body)
UPDATE public.exercises SET
  primary_muscles = ARRAY['cardio'],
  secondary_muscles = ARRAY['quadriceps', 'hamstrings', 'glutes', 'calves']
WHERE LOWER(name) IN ('running', 'treadmill', 'jogging', 'sprinting');

UPDATE public.exercises SET
  primary_muscles = ARRAY['cardio'],
  secondary_muscles = ARRAY['quadriceps', 'glutes', 'core']
WHERE LOWER(name) IN ('cycling', 'bike', 'stationary bike', 'spin');

UPDATE public.exercises SET
  primary_muscles = ARRAY['cardio'],
  secondary_muscles = ARRAY['back', 'shoulders', 'core', 'quadriceps']
WHERE LOWER(name) IN ('rowing', 'rowing machine', 'erg');

-- Sync muscle_groups with primary_muscles for backward compatibility
UPDATE public.exercises
  SET muscle_groups = primary_muscles
  WHERE primary_muscles IS NOT NULL;
