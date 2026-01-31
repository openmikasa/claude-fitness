import type { Exercise } from '@/types/workout';

/**
 * Helper function to get display muscles with backward compatibility
 * Prefers primary_muscles/secondary_muscles, falls back to muscle_groups
 */
export function getDisplayMuscles(exercise: Exercise): {
  primary: string[];
  secondary: string[];
} {
  // New schema: use primary_muscles and secondary_muscles
  if (exercise.primary_muscles && exercise.primary_muscles.length > 0) {
    return {
      primary: exercise.primary_muscles,
      secondary: exercise.secondary_muscles || [],
    };
  }

  // Backward compatibility: fall back to muscle_groups as primary
  return {
    primary: exercise.muscle_groups || [],
    secondary: [],
  };
}

/**
 * Format muscle groups for display
 * Capitalizes first letter and replaces underscores with spaces
 */
export function formatMuscleGroup(muscle: string): string {
  return muscle
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format muscles as a comma-separated list
 */
export function formatMuscleList(muscles: string[]): string {
  return muscles.map(formatMuscleGroup).join(', ');
}
