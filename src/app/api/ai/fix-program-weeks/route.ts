import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import type { Program, ProgramDay } from '@/types/workout';

export const dynamic = 'force-dynamic';

// POST /api/ai/fix-program-weeks
// Fixes week numbers in existing programs
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const programId = body.programId;

    if (!programId) {
      return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch the program
    const { data: program, error: fetchError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const planData = program.plan_data as ProgramDay[];
    const workoutsPerWeek = program.mesocycle_info?.workouts_per_week || 4;

    // Fix week numbers based on position in array
    const correctedPlanData = planData.map((workout, index) => {
      const correctWeek = Math.floor(index / workoutsPerWeek) + 1;
      const correctWorkoutIndex = (index % workoutsPerWeek) + 1;

      return {
        ...workout,
        week: correctWeek,
        workout_index: correctWorkoutIndex,
      };
    });

    // Update the program
    const { error: updateError } = await supabase
      .from('programs')
      .update({ plan_data: correctedPlanData })
      .eq('id', programId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating program:', updateError);
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Program week numbers corrected',
      totalWorkouts: correctedPlanData.length,
      workoutsPerWeek,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/ai/fix-program-weeks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
