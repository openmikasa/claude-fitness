import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';

// GET /api/workouts/unmigrated-count
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createRouteHandlerClient();

    // Get all strength workouts
    const { data: strengthWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, workout_exercises(id)')
      .eq('user_id', user.id)
      .eq('workout_type', 'strength');

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError);
      return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
    }

    // Count workouts that have no workout_exercises
    const unmigrated = (strengthWorkouts || []).filter(
      (workout: any) => !workout.workout_exercises || workout.workout_exercises.length === 0
    );

    return NextResponse.json({ count: unmigrated.length, workouts: unmigrated.map((w: any) => w.id) });
  } catch (error) {
    console.error('Unexpected error in GET /api/workouts/unmigrated-count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
