import { format, startOfWeek, parseISO } from 'date-fns';
import type {
  Workout,
  StrengthData,
  CardioData,
  SaunaData,
  MobilityData,
} from '@/types/workout';

/**
 * Format workouts grouped by week for AI analysis
 */
export function formatWorkoutHistory(workouts: Workout[]): string {
  if (workouts.length === 0) {
    return 'No workout history available.';
  }

  // Group workouts by week
  const weekGroups = new Map<string, Workout[]>();

  workouts.forEach((workout) => {
    const date = parseISO(workout.workout_date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weekGroups.has(weekKey)) {
      weekGroups.set(weekKey, []);
    }
    weekGroups.get(weekKey)!.push(workout);
  });

  // Sort weeks (most recent first)
  const sortedWeeks = Array.from(weekGroups.entries()).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Format output
  let output = 'Recent Workout History:\n\n';

  sortedWeeks.slice(0, 4).forEach(([weekStart, weekWorkouts], weekIndex) => {
    const weekNum = weekIndex + 1;
    output += `Week ${weekNum} (${format(parseISO(weekStart), 'MMM d')}):\n`;

    weekWorkouts.forEach((workout) => {
      const date = parseISO(workout.workout_date);
      const dayName = format(date, 'EEE');
      output += `- ${dayName}: ${formatWorkoutSummary(workout)}\n`;
    });

    output += '\n';
  });

  return output;
}

/**
 * Format a single workout as a readable summary
 */
function formatWorkoutSummary(workout: Workout): string {
  const type = workout.workout_type;
  const data = workout.data;

  switch (type) {
    case 'strength': {
      const strengthData = data as StrengthData;
      const exercises = strengthData.exercises
        .map((ex) => {
          const topSet = ex.sets.reduce((max, set) =>
            set.weight > max.weight ? set : max
          );
          return `${ex.name} ${ex.sets.length}x${topSet.reps} @ ${topSet.weight}kg`;
        })
        .join(', ');
      return `Strength - ${exercises}`;
    }

    case 'cardio': {
      const cardioData = data as CardioData;
      const distance = cardioData.distance_km
        ? ` ${cardioData.distance_km}km`
        : '';
      const pace = cardioData.pace ? ` (${cardioData.pace} pace)` : '';
      return `Cardio - ${cardioData.type} ${cardioData.time_minutes}min${distance}${pace}`;
    }

    case 'sauna': {
      const saunaData = data as SaunaData;
      const temp = saunaData.temperature_celsius
        ? ` @ ${saunaData.temperature_celsius}°C`
        : '';
      return `Sauna - ${saunaData.duration_minutes}min${temp}`;
    }

    case 'mobility': {
      const mobilityData = data as MobilityData;
      const exercises = mobilityData.exercises
        .map((ex) => `${ex.name} ${ex.duration_minutes}min`)
        .join(', ');
      return `Mobility - ${exercises}`;
    }

    default:
      return 'Unknown workout';
  }
}

/**
 * Analyze recent workouts to extract key insights
 */
export function analyzeRecentWorkouts(workouts: Workout[]): {
  totalWorkouts: number;
  strengthWorkouts: number;
  cardioWorkouts: number;
  averagePerWeek: number;
  lastWorkoutDate: string;
  commonExercises: string[];
} {
  const strengthWorkouts = workouts.filter(
    (w) => w.workout_type === 'strength'
  ).length;
  const cardioWorkouts = workouts.filter(
    (w) => w.workout_type === 'cardio'
  ).length;

  // Calculate average per week
  const oldestDate = workouts.length
    ? parseISO(workouts[workouts.length - 1].workout_date)
    : new Date();
  const newestDate = workouts.length
    ? parseISO(workouts[0].workout_date)
    : new Date();
  const weeksDiff =
    Math.max(
      1,
      Math.ceil(
        (newestDate.getTime() - oldestDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
    );
  const averagePerWeek = Math.round((workouts.length / weeksDiff) * 10) / 10;

  // Find common exercises
  const exerciseCount = new Map<string, number>();
  workouts.forEach((workout) => {
    if (workout.workout_type === 'strength') {
      const data = workout.data as StrengthData;
      data.exercises.forEach((ex) => {
        exerciseCount.set(ex.name, (exerciseCount.get(ex.name) || 0) + 1);
      });
    }
  });

  const commonExercises = Array.from(exerciseCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return {
    totalWorkouts: workouts.length,
    strengthWorkouts,
    cardioWorkouts,
    averagePerWeek,
    lastWorkoutDate: workouts[0]?.workout_date || new Date().toISOString(),
    commonExercises,
  };
}
