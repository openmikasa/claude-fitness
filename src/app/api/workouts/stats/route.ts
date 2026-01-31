import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Workout, WeightliftingData } from '@/types/workout';

export const dynamic = 'force-dynamic';

interface PersonalRecord {
  name: string;
  equipment: string; // NEW: Track equipment type
  weight: number;  // Changed from value: string to weight: number
  date: string;
}

interface StatsResponse {
  total: number;
  thisWeek: number;
  thisMonth: number;
  personalRecords: {
    weightlifting: PersonalRecord[]; // Only weightlifting PRs
  };
}

// Type guard for weightlifting data
function isWeightliftingData(data: unknown): data is WeightliftingData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'exercises' in data &&
    Array.isArray((data as WeightliftingData).exercises)
  );
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // Fetch all workouts with workout_exercises for equipment data
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          exercise_id,
          equipment,
          sets_data,
          exercises (name)
        )
      `)
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false });

    if (error) {
      console.error('Error fetching workouts for stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workout statistics' },
        { status: 500 }
      );
    }

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let thisWeek = 0;
    let thisMonth = 0;

    // Track personal records for weightlifting exercises
    // Key format: "Exercise Name | Equipment" (e.g., "Bench Press | Barbell")
    const weightliftingPRs = new Map<string, { weight: number; date: string; name: string; equipment: string }>();

    (workouts as Workout[]).forEach((workout) => {
      const workoutDate = new Date(workout.workout_date);

      // Count this week
      if (workoutDate >= weekStart && workoutDate <= weekEnd) {
        thisWeek++;
      }

      // Count this month
      if (workoutDate >= monthStart && workoutDate <= monthEnd) {
        thisMonth++;
      }

      // Calculate PRs from workout_exercises (new format with equipment)
      if (workout.workout_exercises && workout.workout_exercises.length > 0) {
        workout.workout_exercises.forEach((we) => {
          const exerciseName = we.exercises?.name || 'Unknown';
          const equipment = we.equipment?.[0] || 'Unknown'; // Take first equipment

          we.sets_data?.forEach((set) => {
            const key = `${exerciseName} | ${equipment}`;
            const existing = weightliftingPRs.get(key);

            if (!existing || set.weight > existing.weight) {
              weightliftingPRs.set(key, {
                weight: set.weight,
                date: workout.workout_date,
                name: exerciseName,
                equipment: equipment,
              });
            }
          });
        });
      }
      // Fallback to JSONB data for backward compatibility (no equipment tracking)
      else if (isWeightliftingData(workout.data)) {
        workout.data.exercises.forEach((exercise) => {
          const key = `${exercise.name} | Unknown`;

          exercise.sets.forEach((set) => {
            const existing = weightliftingPRs.get(key);
            if (!existing || set.weight > existing.weight) {
              weightliftingPRs.set(key, {
                weight: set.weight,
                date: workout.workout_date,
                name: exercise.name,
                equipment: 'Unknown',
              });
            }
          });
        });
      }
    });

    // Convert PRs to arrays and sort by weight (descending)
    const weightliftingRecords: PersonalRecord[] = Array.from(weightliftingPRs.values())
      .map((data) => ({
        name: data.name,
        equipment: data.equipment,
        weight: data.weight,
        date: data.date,
      }))
      .sort((a, b) => b.weight - a.weight); // Sort by weight, no limit

    const response: StatsResponse = {
      total: workouts.length,
      thisWeek,
      thisMonth,
      personalRecords: {
        weightlifting: weightliftingRecords,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/workouts/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
