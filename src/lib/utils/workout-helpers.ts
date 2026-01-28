import type { Workout, StrengthData } from '@/types/workout';

/**
 * Helper function to get exercises from a workout, handling both new normalized
 * data (workout_exercises) and legacy JSONB format (data.exercises).
 */
export function getWorkoutExercises(workout: Workout) {
  // Prefer junction table (new normalized format)
  if (workout.workout_exercises && workout.workout_exercises.length > 0) {
    return workout.workout_exercises.map((we) => ({
      id: we.id,
      name: we.exercises?.name || 'Unknown Exercise',
      sets: we.sets_data,
      equipment: we.equipment,
      muscle_groups: we.exercises?.muscle_groups || [],
      exercise_id: we.exercise_id,
    }));
  }

  // Fallback to JSONB (old format)
  if (workout.workout_type === 'strength') {
    const data = workout.data as StrengthData;
    return data.exercises.map((ex) => ({
      id: undefined,
      name: ex.name,
      sets: ex.sets,
      equipment: [],
      muscle_groups: [],
      exercise_id: undefined,
    }));
  }

  return [];
}

/**
 * Check if a workout has been migrated to the new normalized format
 */
export function isWorkoutMigrated(workout: Workout): boolean {
  return (
    workout.workout_type === 'strength' &&
    !!workout.workout_exercises &&
    workout.workout_exercises.length > 0
  );
}

/**
 * Get all unique equipment used in a workout
 */
export function getWorkoutEquipment(workout: Workout): string[] {
  const exercises = getWorkoutExercises(workout);
  const equipmentSet = new Set<string>();

  exercises.forEach((ex) => {
    ex.equipment.forEach((eq) => equipmentSet.add(eq));
  });

  return Array.from(equipmentSet);
}

/**
 * Get all unique muscle groups targeted in a workout
 */
export function getWorkoutMuscleGroups(workout: Workout): string[] {
  const exercises = getWorkoutExercises(workout);
  const muscleGroupSet = new Set<string>();

  exercises.forEach((ex) => {
    ex.muscle_groups.forEach((mg) => muscleGroupSet.add(mg));
  });

  return Array.from(muscleGroupSet);
}
