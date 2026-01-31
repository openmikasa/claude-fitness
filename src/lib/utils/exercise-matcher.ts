import type { Exercise } from '@/types/workout';

/**
 * Calculate similarity between two strings (0-1 scale)
 * Uses a simple Levenshtein-like algorithm
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s2.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s1.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s1.length] = lastValue;
    }
  }
  return costs[s1.length];
}

/**
 * Find the best matching exercise from the database
 * Returns the exercise and confidence score (0-1)
 */
export function findBestMatch(
  exerciseName: string,
  allExercises: Exercise[]
): { exercise: Exercise | null; confidence: number } {
  if (!exerciseName || allExercises.length === 0) {
    return { exercise: null, confidence: 0 };
  }

  let bestMatch: Exercise | null = null;
  let bestScore = 0;

  for (const exercise of allExercises) {
    const score = similarity(exerciseName, exercise.name);

    // Exact match (case-insensitive)
    if (exerciseName.toLowerCase() === exercise.name.toLowerCase()) {
      return { exercise, confidence: 1.0 };
    }

    // Check if exercise name contains the workout exercise name or vice versa
    const lowerExerciseName = exerciseName.toLowerCase();
    const lowerDbName = exercise.name.toLowerCase();
    if (lowerExerciseName.includes(lowerDbName) || lowerDbName.includes(lowerExerciseName)) {
      if (score > bestScore) {
        bestScore = Math.max(score, 0.8); // Boost score for partial matches
        bestMatch = exercise;
      }
    } else if (score > bestScore) {
      bestScore = score;
      bestMatch = exercise;
    }
  }

  // Only return matches with reasonable confidence
  if (bestScore < 0.6) {
    return { exercise: null, confidence: bestScore };
  }

  return { exercise: bestMatch, confidence: bestScore };
}

/**
 * Auto-match multiple exercise names to database exercises
 */
export function autoMatchExercises(
  exerciseNames: string[],
  allExercises: Exercise[]
): Map<string, { exercise: Exercise | null; confidence: number }> {
  const matches = new Map<string, { exercise: Exercise | null; confidence: number }>();

  for (const name of exerciseNames) {
    matches.set(name, findBestMatch(name, allExercises));
  }

  return matches;
}
