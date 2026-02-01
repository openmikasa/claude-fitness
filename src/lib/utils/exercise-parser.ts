/**
 * Utility to parse exercise names and extract equipment
 * e.g., "Hax Deadlift" -> { name: "Deadlift", equipment: "Hax Barbell" }
 */

export interface ParsedExercise {
  name: string;
  equipment: string | null;
}

// Equipment prefix mapping
const EQUIPMENT_PREFIXES: Record<string, string> = {
  'hax': 'Hax Barbell',
  'barbell': 'Barbell',
  'dumbbell': 'Dumbbell',
  'db': 'Dumbbell',
  'cable': 'Cable',
  'machine': 'Machine',
  'kettlebell': 'Kettlebell',
  'kb': 'Kettlebell',
  'band': 'Resistance Band',
  'bodyweight': 'Bodyweight',
  'bw': 'Bodyweight',
};

/**
 * Parses an exercise name to extract equipment and base exercise name
 * @param fullName - The full exercise name (e.g., "Hax Deadlift", "Barbell Bench Press")
 * @returns Object with normalized name and extracted equipment
 */
export function parseExerciseName(fullName: string): ParsedExercise {
  if (!fullName || typeof fullName !== 'string') {
    return { name: fullName, equipment: null };
  }

  const trimmed = fullName.trim();
  const words = trimmed.split(/\s+/);

  // Check if first word is an equipment prefix
  if (words.length > 1) {
    const firstWord = words[0].toLowerCase();

    if (EQUIPMENT_PREFIXES[firstWord]) {
      // Remove equipment prefix from name
      const baseName = words.slice(1).join(' ');
      return {
        name: baseName,
        equipment: EQUIPMENT_PREFIXES[firstWord],
      };
    }
  }

  // No equipment prefix found
  return {
    name: trimmed,
    equipment: null,
  };
}

/**
 * Formats an exercise name for display, combining base name and equipment
 * @param name - Base exercise name
 * @param equipment - Equipment used (optional)
 * @returns Formatted display name
 */
export function formatExerciseDisplay(name: string, equipment?: string | string[]): string {
  if (!equipment || (Array.isArray(equipment) && equipment.length === 0)) {
    return name;
  }

  const equipmentStr = Array.isArray(equipment) ? equipment[0] : equipment;

  // Find the short prefix for this equipment
  const prefix = Object.entries(EQUIPMENT_PREFIXES).find(
    ([_, fullName]) => fullName === equipmentStr
  )?.[0];

  if (prefix && prefix !== 'bodyweight' && prefix !== 'bw') {
    // Capitalize first letter of prefix
    const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    return `${capitalizedPrefix} ${name}`;
  }

  return name;
}

/**
 * Processes an array of exercises from AI, parsing names and extracting equipment
 * @param exercises - Raw exercises from AI with potentially combined names
 * @returns Exercises with normalized names and equipment arrays
 */
export function normalizeAIExercises<T extends { name: string; equipment?: string[] }>(
  exercises: T[]
): T[] {
  return exercises.map(exercise => {
    const parsed = parseExerciseName(exercise.name);

    // If equipment was extracted from name, use it
    if (parsed.equipment) {
      return {
        ...exercise,
        name: parsed.name,
        equipment: [parsed.equipment],
      };
    }

    // Otherwise keep as-is
    return exercise;
  });
}
