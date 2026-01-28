import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Workout, StrengthData, CardioData, SaunaData } from '@/types/workout';

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
    strength: PersonalRecord[];
    cardio: PersonalRecord[];
    sauna: number;
  };
}

// Type guards
function isStrengthData(data: unknown): data is StrengthData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'exercises' in data &&
    Array.isArray((data as StrengthData).exercises)
  );
}

function isCardioData(data: unknown): data is CardioData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'time_minutes' in data
  );
}

function isSaunaData(data: unknown): data is SaunaData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'duration_minutes' in data
  );
}

// Helper to convert pace string to seconds for comparison
function paceToSeconds(pace: string): number {
  const match = pace.match(/^(\d+):(\d+)/);
  if (!match) return Infinity;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
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

    // Track personal records
    const strengthPRs = new Map<string, { weight: number; date: string }>();
    const cardioPRs = new Map<string, { pace: string; paceSeconds: number; date: string }>();
    let longestSauna = 0;

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

      // Calculate personal records
      if (workout.workout_type === 'strength' && isStrengthData(workout.data)) {
        workout.data.exercises.forEach((exercise) => {
          exercise.sets.forEach((set) => {
            const existing = strengthPRs.get(exercise.name);
            if (!existing || set.weight > existing.weight) {
              strengthPRs.set(exercise.name, {
                weight: set.weight,
                date: workout.workout_date,
              });
            }
          });
        });
      }

      if (workout.workout_type === 'cardio' && isCardioData(workout.data)) {
        if (workout.data.pace) {
          const paceSeconds = paceToSeconds(workout.data.pace);
          const existing = cardioPRs.get(workout.data.type);
          if (!existing || paceSeconds < existing.paceSeconds) {
            cardioPRs.set(workout.data.type, {
              pace: workout.data.pace,
              paceSeconds,
              date: workout.workout_date,
            });
          }
        }
      }

      if (workout.workout_type === 'sauna' && isSaunaData(workout.data)) {
        if (workout.data.duration_minutes > longestSauna) {
          longestSauna = workout.data.duration_minutes;
        }
      }
    });

    // Convert PRs to arrays and sort
    const strengthRecords: PersonalRecord[] = Array.from(strengthPRs.entries())
      .map(([name, data]) => ({
        name,
        value: `${data.weight}kg`,
        date: data.date,
      }))
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 3);

    const cardioRecords: PersonalRecord[] = Array.from(cardioPRs.entries())
      .map(([name, data]) => ({
        name,
        value: data.pace,
        date: data.date,
      }))
      .slice(0, 3);

    const response: StatsResponse = {
      total: workouts.length,
      thisWeek,
      thisMonth,
      personalRecords: {
        strength: strengthRecords,
        cardio: cardioRecords,
        sauna: longestSauna,
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
