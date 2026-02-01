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
    const totalWeeks = program.mesocycle_info?.total_weeks || 4;

    // Auto-detect workouts per week from the actual data
    // This is more reliable than trusting mesocycle_info
    const actualWorkoutsPerWeek = Math.ceil(planData.length / totalWeeks);

    console.log(`[Fix Program] Program ${programId}: ${planData.length} workouts, ${totalWeeks} weeks = ${actualWorkoutsPerWeek} workouts/week`);

    // Fix week numbers based on position in array
    const correctedPlanData = planData.map((workout, index) => {
      const correctWeek = Math.floor(index / actualWorkoutsPerWeek) + 1;
      const correctWorkoutIndex = (index % actualWorkoutsPerWeek) + 1;

      console.log(`[Fix Program] Workout ${index}: ${workout.week}/${workout.workout_index} → ${correctWeek}/${correctWorkoutIndex}`);

      return {
        ...workout,
        week: correctWeek,
        workout_index: correctWorkoutIndex,
      };
    });

    // Update mesocycle_info with correct workouts_per_week
    const updatedMesocycleInfo = {
      ...program.mesocycle_info,
      workouts_per_week: actualWorkoutsPerWeek,
      total_weeks: totalWeeks,
    };

    // Update the program
    const { error: updateError } = await supabase
      .from('programs')
      .update({
        plan_data: correctedPlanData,
        mesocycle_info: updatedMesocycleInfo,
      })
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
      workoutsPerWeek: actualWorkoutsPerWeek,
      totalWeeks: totalWeeks,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/ai/fix-program-weeks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
