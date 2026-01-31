import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Workout, WeightliftingData } from '@/types/workout';

export const dynamic = 'force-dynamic';

interface PersonalRecord {
  name: string;
  value: string;
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

    // Fetch all workouts (no pagination)
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
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
    const weightliftingPRs = new Map<string, { weight: number; date: string }>();

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

      // Calculate personal records (all workouts are weightlifting)
      if (isWeightliftingData(workout.data)) {
        workout.data.exercises.forEach((exercise) => {
          exercise.sets.forEach((set) => {
            const existing = weightliftingPRs.get(exercise.name);
            if (!existing || set.weight > existing.weight) {
              weightliftingPRs.set(exercise.name, {
                weight: set.weight,
                date: workout.workout_date,
              });
            }
          });
        });
      }
    });

    // Convert PRs to arrays and sort by weight
    const weightliftingRecords: PersonalRecord[] = Array.from(weightliftingPRs.entries())
      .map(([name, data]) => ({
        name,
        value: `${data.weight}kg`,
        date: data.date,
      }))
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 3);

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
