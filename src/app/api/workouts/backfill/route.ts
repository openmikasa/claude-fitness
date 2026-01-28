import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { z } from 'zod';

const backfillExerciseSchema = z.object({
  name: z.string(),
  exercise_id: z.string(),
  equipment: z.array(z.string()),
  sets: z.array(z.object({
    weight: z.number(),
    reps: z.number(),
  })),
});

const backfillSchema = z.object({
  workout_id: z.string(),
  exercises: z.array(backfillExerciseSchema),
});

// POST /api/workouts/backfill
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = backfillSchema.parse(body);

    const supabase = await createRouteHandlerClient();

    // Verify workout ownership
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', validated.workout_id)
      .eq('user_id', user.id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Create workout_exercises records
    const workoutExercises = validated.exercises.map((ex) => ({
      workout_id: validated.workout_id,
      exercise_id: ex.exercise_id,
      equipment: ex.equipment,
      sets_data: ex.sets,
    }));

    const { error: insertError } = await supabase
      .from('workout_exercises')
      .insert(workoutExercises);

    if (insertError) {
      console.error('Error inserting workout_exercises:', insertError);
      return NextResponse.json({ error: 'Failed to backfill workout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }

    console.error('Unexpected error in POST /api/workouts/backfill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
