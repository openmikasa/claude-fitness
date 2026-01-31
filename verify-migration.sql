-- Check all workouts are now 'weightlifting'
SELECT workout_type, COUNT(*) as count 
FROM workouts 
GROUP BY workout_type;

-- Check constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'workouts'::regclass 
AND conname = 'only_weightlifting_workouts';

-- Sample a few workouts to verify data integrity
SELECT id, workout_type, workout_date, 
       jsonb_array_length(data->'exercises') as exercise_count,
       created_at
FROM workouts 
ORDER BY workout_date DESC 
LIMIT 5;
