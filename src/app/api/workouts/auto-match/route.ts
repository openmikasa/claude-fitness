import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { autoMatchExercises } from '@/lib/utils/exercise-matcher';
import type { WeightliftingData } from '@/types/workout';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createRouteHandlerClient();

  try {
    // Fetch all exercises from database
    const { data: allExercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (exercisesError) {
      return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }

    // Fetch unmigrated workouts (those without workout_exercises entries)
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, workout_date, workout_type, data, notes')
      .eq('user_id', user.id)
      .eq('workout_type', 'weightlifting')
      .order('workout_date', { ascending: false });

    if (workoutsError) {
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }

    // Filter to only workouts without workout_exercises
    const { data: migratedWorkoutIds } = await supabase
      .from('workout_exercises')
      .select('workout_id')
      .in('workout_id', workouts.map(w => w.id));

    const migratedIds = new Set(migratedWorkoutIds?.map(w => w.workout_id) || []);
    const unmigratedWorkouts = workouts.filter(w => !migratedIds.has(w.id));

    // Auto-match exercises for each workout
    const workoutsWithMatches = unmigratedWorkouts.map((workout) => {
      const weightliftingData = workout.data as WeightliftingData;
      const exerciseNames = weightliftingData.exercises.map(ex => ex.name);
      const matches = autoMatchExercises(exerciseNames, allExercises || []);

      const exercisesWithMatches = weightliftingData.exercises.map(ex => {
        const match = matches.get(ex.name);
        return {
          name: ex.name,
          sets: ex.sets,
          matchedExercise: match?.exercise || null,
          confidence: match?.confidence || 0,
          equipment: match?.exercise?.equipment || [],
          muscle_groups: match?.exercise?.muscle_groups || [],
        };
      });

      return {
        id: workout.id,
        workout_date: workout.workout_date,
        notes: workout.notes,
        exercises: exercisesWithMatches,
      };
    });

    return NextResponse.json({
      workouts: workoutsWithMatches,
      totalCount: workoutsWithMatches.length,
    });
  } catch (error) {
    console.error('Auto-match error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-match workouts' },
      { status: 500 }
    );
  }
}
