import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Workout, WeightliftingData } from '@/types/workout';

export const dynamic = 'force-dynamic';

interface PersonalRecord {
  name: string;
  equipment: string; // NEW: Track equipment type
  weight: number;  // Changed from value: string to weight: number
  reps: number; // NEW: Track reps for this weight
  date: string;
}

interface VolumeDataPoint {
  date: string;
  volume: number;
  workoutId: string;
}

interface ExerciseVolumeHistory {
  exerciseName: string;
  equipment: string;
  volumeHistory: VolumeDataPoint[];
}

interface StatsResponse {
  total: number;
  thisWeek: number;
  thisMonth: number;
  personalRecords: {
    weightlifting: PersonalRecord[]; // Only weightlifting PRs
  };
  volumeHistory: ExerciseVolumeHistory[];
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
    const weightliftingPRs = new Map<string, { weight: number; reps: number; date: string; name: string; equipment: string }>();

    // Track volume history per exercise
    const volumeHistoryMap = new Map<string, VolumeDataPoint[]>();

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
          const key = `${exerciseName} | ${equipment}`;

          // Calculate volume for this exercise in this workout
          let exerciseVolume = 0;

          we.sets_data?.forEach((set) => {
            // Track PRs
            const existing = weightliftingPRs.get(key);

            if (!existing || set.weight > existing.weight) {
              weightliftingPRs.set(key, {
                weight: set.weight,
                reps: set.reps,
                date: workout.workout_date,
                name: exerciseName,
                equipment: equipment,
              });
            }

            // Accumulate volume (weight × reps)
            exerciseVolume += set.weight * set.reps;
          });

          // Add volume data point if there's volume
          if (exerciseVolume > 0) {
            if (!volumeHistoryMap.has(key)) {
              volumeHistoryMap.set(key, []);
            }
            volumeHistoryMap.get(key)!.push({
              date: workout.workout_date,
              volume: exerciseVolume,
              workoutId: workout.id,
            });
          }
        });
      }
      // Fallback to JSONB data for backward compatibility (no equipment tracking)
      else if (isWeightliftingData(workout.data)) {
        workout.data.exercises.forEach((exercise) => {
          const key = `${exercise.name} | Unknown`;
          let exerciseVolume = 0;

          exercise.sets.forEach((set) => {
            // Track PRs
            const existing = weightliftingPRs.get(key);
            if (!existing || set.weight > existing.weight) {
              weightliftingPRs.set(key, {
                weight: set.weight,
                reps: set.reps,
                date: workout.workout_date,
                name: exercise.name,
                equipment: 'Unknown',
              });
            }

            // Accumulate volume
            exerciseVolume += set.weight * set.reps;
          });

          // Add volume data point if there's volume
          if (exerciseVolume > 0) {
            if (!volumeHistoryMap.has(key)) {
              volumeHistoryMap.set(key, []);
            }
            volumeHistoryMap.get(key)!.push({
              date: workout.workout_date,
              volume: exerciseVolume,
              workoutId: workout.id,
            });
          }
        });
      }
    });

    // Convert PRs to arrays and sort by weight (descending)
    const weightliftingRecords: PersonalRecord[] = Array.from(weightliftingPRs.values())
      .map((data) => ({
        name: data.name,
        equipment: data.equipment,
        weight: data.weight,
        reps: data.reps,
        date: data.date,
      }))
      .sort((a, b) => b.weight - a.weight); // Sort by weight, no limit

    // Convert volume history to array and sort by date
    const volumeHistory: ExerciseVolumeHistory[] = Array.from(volumeHistoryMap.entries())
      .map(([key, dataPoints]) => {
        const [exerciseName, equipment] = key.split(' | ');
        return {
          exerciseName,
          equipment,
          volumeHistory: dataPoints.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        };
      });

    const response: StatsResponse = {
      total: workouts.length,
      thisWeek,
      thisMonth,
      personalRecords: {
        weightlifting: weightliftingRecords,
      },
      volumeHistory,
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
