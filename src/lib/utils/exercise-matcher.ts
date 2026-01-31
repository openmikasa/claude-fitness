import type { Exercise } from '@/types/workout';

/**
 * Normalize exercise name for matching
 * - Lowercase
 * - Remove trailing 's' for plurals
 * - Trim whitespace
 */
function normalizeExerciseName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove trailing 's' for plural handling (pull-ups -> pull-up)
  if (normalized.endsWith('s') && normalized.length > 3) {
    // Don't remove 's' from words that naturally end in 's' (press, cross, etc.)
    if (!normalized.endsWith('ss') && !normalized.endsWith('us')) {
      normalized = normalized.slice(0, -1);
    }
  }

  return normalized;
}

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

  const normalizedInput = normalizeExerciseName(exerciseName);
  let bestMatch: Exercise | null = null;
  let bestScore = 0;

  for (const exercise of allExercises) {
    const normalizedDbName = normalizeExerciseName(exercise.name);

    // Exact match after normalization (handles plurals and case)
    if (normalizedInput === normalizedDbName) {
      return { exercise, confidence: 1.0 };
    }

    // Calculate similarity score
    const score = similarity(normalizedInput, normalizedDbName);

    // Check if one contains the other (for variations like "cable row" vs "row")
    if (normalizedInput.includes(normalizedDbName) || normalizedDbName.includes(normalizedInput)) {
      const containmentScore = Math.max(score, 0.85); // Boost score for containment
      if (containmentScore > bestScore) {
        bestScore = containmentScore;
        bestMatch = exercise;
      }
    } else if (score > bestScore) {
      bestScore = score;
      bestMatch = exercise;
    }
  }

  // Lower threshold to 0.5 for more flexible matching
  if (bestScore < 0.5) {
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
