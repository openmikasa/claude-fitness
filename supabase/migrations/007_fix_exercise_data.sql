-- Migration 007: Fix and Standardize Exercise Data
-- Purpose: Ensure all exercises have anatomically correct muscle groups and equipment
-- IMPORTANT: Each exercise has EXACTLY ONE equipment type

-- Step 1: Delete known duplicate plural forms
DELETE FROM public.exercises
WHERE name IN (
  'Pull-ups', 'Push-ups', 'Chin-ups', 'Dips',
  'Squats', 'Lunges', 'Curls', 'Rows'
);

-- Step 2: Comprehensive exercise insert with ON CONFLICT UPDATE
-- This will fix existing exercises and add missing ones

INSERT INTO public.exercises (name, category, muscle_groups, equipment) VALUES

-- PULL EXERCISES (Back focused)
('Pull-up', 'strength', ARRAY['back', 'biceps'], ARRAY['bodyweight']),
('Chin-up', 'strength', ARRAY['back', 'biceps'], ARRAY['bodyweight']),
('Barbell Row', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell']),
('Pendlay Row', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell']),
('T-Bar Row', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell']),
('Dumbbell Row', 'strength', ARRAY['back', 'biceps'], ARRAY['dumbbell']),
('Cable Row', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
('Seated Cable Row', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
('Cable One Arm Row', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
('Machine Row One Arm', 'strength', ARRAY['back', 'biceps'], ARRAY['machine']),
('Meadows Row', 'strength', ARRAY['back', 'biceps'], ARRAY['barbell']),
('Inverted Row', 'strength', ARRAY['back', 'biceps'], ARRAY['bodyweight']),
('Lat Pulldown', 'strength', ARRAY['back', 'biceps'], ARRAY['cable']),
('Face Pull', 'strength', ARRAY['shoulders', 'back'], ARRAY['cable']),
('Barbell Shrug', 'strength', ARRAY['back'], ARRAY['barbell']),
('Dumbbell Shrug', 'strength', ARRAY['back'], ARRAY['dumbbell']),

-- PUSH EXERCISES (Chest/Shoulders/Triceps)
('Bench Press', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell']),
('Incline Bench Press', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell']),
('Decline Bench Press', 'strength', ARRAY['chest', 'triceps'], ARRAY['barbell']),
('Dumbbell Bench Press', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dumbbell']),
('Dumbbell Incline Press', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dumbbell']),
('Close-Grip Bench Press', 'strength', ARRAY['triceps', 'chest'], ARRAY['barbell']),
('Push-up', 'strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['bodyweight']),
('Dip', 'strength', ARRAY['chest', 'triceps'], ARRAY['bodyweight']),
('Cable Fly', 'strength', ARRAY['chest'], ARRAY['cable']),
('Dumbbell Fly', 'strength', ARRAY['chest'], ARRAY['dumbbell']),
('Pec Deck', 'strength', ARRAY['chest'], ARRAY['machine']),

('Overhead Press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['barbell']),
('Dumbbell Shoulder Press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell']),
('Dumbbell Overhead Press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell']),
('Arnold Press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell']),
('Lateral Raise', 'strength', ARRAY['shoulders'], ARRAY['dumbbell']),
('Cable Lateral Raise', 'strength', ARRAY['shoulders'], ARRAY['cable']),
('Front Raise', 'strength', ARRAY['shoulders'], ARRAY['dumbbell']),
('Rear Delt Fly', 'strength', ARRAY['shoulders'], ARRAY['dumbbell']),
('Reverse Pec Deck', 'strength', ARRAY['shoulders'], ARRAY['machine']),

('Tricep Pushdown', 'strength', ARRAY['triceps'], ARRAY['cable']),
('Overhead Tricep Extension', 'strength', ARRAY['triceps'], ARRAY['dumbbell']),
('Skull Crusher', 'strength', ARRAY['triceps'], ARRAY['barbell']),
('Tricep Dip', 'strength', ARRAY['triceps'], ARRAY['bodyweight']),

-- LEG EXERCISES (Quads/Hamstrings/Glutes/Calves)
('Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['barbell']),
('Front Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['barbell']),
('Goblet Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),
('Zercher Squat', 'strength', ARRAY['quadriceps', 'glutes', 'core'], ARRAY['barbell']),
('Bulgarian Split Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),
('ATG Split Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['bodyweight']),
('Patrick Step', 'strength', ARRAY['quadriceps', 'core'], ARRAY['bodyweight']),
('Hack Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['machine']),
('Pistol Squat', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['bodyweight']),

('Deadlift', 'strength', ARRAY['hamstrings', 'back', 'glutes'], ARRAY['barbell']),
('Hex Bar Deadlift', 'strength', ARRAY['quadriceps', 'hamstrings', 'glutes'], ARRAY['barbell']),
('Romanian Deadlift', 'strength', ARRAY['hamstrings', 'glutes'], ARRAY['barbell']),
('Sumo Deadlift', 'strength', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['barbell']),
('Stiff-Leg Deadlift', 'strength', ARRAY['hamstrings'], ARRAY['barbell']),
('Good Morning', 'strength', ARRAY['hamstrings', 'back', 'glutes'], ARRAY['barbell']),

('Bodyweight Lunge', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['bodyweight']),
('Dumbbell Lunge', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),
('Barbell Lunge', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['barbell']),
('Walking Lunge', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),
('Reverse Lunge', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),

('Leg Press', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['machine']),
('Leg Extension', 'strength', ARRAY['quadriceps'], ARRAY['machine']),
('Leg Curl', 'strength', ARRAY['hamstrings'], ARRAY['machine']),
('Nordic Curl', 'strength', ARRAY['hamstrings'], ARRAY['bodyweight']),

('Hip Thrust', 'strength', ARRAY['glutes'], ARRAY['barbell']),
('Barbell Glute Bridge', 'strength', ARRAY['glutes'], ARRAY['barbell']),
('Bodyweight Glute Bridge', 'strength', ARRAY['glutes'], ARRAY['bodyweight']),

('Calf Raise', 'strength', ARRAY['calves'], ARRAY['machine']),
('Standing Calf Raise', 'strength', ARRAY['calves'], ARRAY['barbell']),
('Seated Calf Raise', 'strength', ARRAY['calves'], ARRAY['machine']),
('Tibialis Raise', 'strength', ARRAY['calves'], ARRAY['bodyweight']),

('Step-up', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),
('Box Step-up', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['dumbbell']),

-- BICEP EXERCISES
('Barbell Curl', 'strength', ARRAY['biceps'], ARRAY['barbell']),
('EZ Bar Curl', 'strength', ARRAY['biceps'], ARRAY['barbell']),
('Dumbbell Curl', 'strength', ARRAY['biceps'], ARRAY['dumbbell']),
('Hammer Curl', 'strength', ARRAY['biceps', 'forearms'], ARRAY['dumbbell']),
('Cable Curl', 'strength', ARRAY['biceps'], ARRAY['cable']),
('Barbell Preacher Curl', 'strength', ARRAY['biceps'], ARRAY['barbell']),
('Machine Preacher Curl', 'strength', ARRAY['biceps'], ARRAY['machine']),
('Concentration Curl', 'strength', ARRAY['biceps'], ARRAY['dumbbell']),
('Incline Dumbbell Curl', 'strength', ARRAY['biceps'], ARRAY['dumbbell']),

-- CORE EXERCISES
('Plank', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Side Plank', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Ab Wheel', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Hanging Leg Raise', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Cable Crunch', 'strength', ARRAY['core'], ARRAY['cable']),
('Russian Twist', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Wood Chop', 'strength', ARRAY['core'], ARRAY['cable']),
('Pallof Press', 'strength', ARRAY['core'], ARRAY['cable']),
('Dead Bug', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Bird Dog', 'strength', ARRAY['core'], ARRAY['bodyweight']),
('Mountain Climber', 'cardio', ARRAY['core', 'shoulders'], ARRAY['bodyweight']),

-- OLYMPIC LIFTS
('Power Clean', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
('Hang Clean', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
('Clean and Jerk', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
('Snatch', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),
('Hang Snatch', 'strength', ARRAY['back', 'legs', 'shoulders'], ARRAY['barbell']),

-- SPECIALIZED/ATHLETIC
('Box Jump', 'cardio', ARRAY['quadriceps'], ARRAY['bodyweight']),
('Broad Jump', 'cardio', ARRAY['quadriceps', 'glutes'], ARRAY['bodyweight']),
('Farmers Walk', 'strength', ARRAY['forearms', 'core'], ARRAY['dumbbell']),
('Sled Push', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['machine']),
('Sled Pull', 'strength', ARRAY['hamstrings', 'back'], ARRAY['machine']),
('Battle Rope', 'cardio', ARRAY['shoulders', 'core'], ARRAY['bodyweight']),
('Kettlebell Swing', 'strength', ARRAY['glutes', 'hamstrings'], ARRAY['kettlebell']),
('Turkish Get-up', 'strength', ARRAY['core', 'shoulders'], ARRAY['kettlebell']),
('Burpee', 'cardio', ARRAY['chest', 'legs', 'core'], ARRAY['bodyweight']),
('Barbell Thruster', 'strength', ARRAY['shoulders', 'legs'], ARRAY['barbell']),
('Dumbbell Thruster', 'strength', ARRAY['shoulders', 'legs'], ARRAY['dumbbell']),

-- CARDIO
('Running', 'cardio', ARRAY['legs'], ARRAY['bodyweight']),
('Cycling', 'cardio', ARRAY['legs'], ARRAY['machine']),
('Rowing', 'cardio', ARRAY['back', 'legs'], ARRAY['machine']),
('Jump Rope', 'cardio', ARRAY['legs', 'shoulders'], ARRAY['bodyweight']),
('Stair Climber', 'cardio', ARRAY['legs'], ARRAY['machine'])

ON CONFLICT (name) DO UPDATE SET
  muscle_groups = EXCLUDED.muscle_groups,
  equipment = EXCLUDED.equipment,
  category = EXCLUDED.category;

-- Step 3: Verify no case-sensitive duplicates remain
-- This query will show if there are any (should return 0 rows)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT LOWER(name) as lower_name, COUNT(*) as count
    FROM public.exercises
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'WARNING: % case-sensitive duplicates still exist', duplicate_count;
  ELSE
    RAISE NOTICE 'SUCCESS: No duplicates found';
  END IF;
END $$;
