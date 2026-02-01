import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { normalizeAIExercises } from '@/lib/utils/exercise-parser';
import type { Program, ProgramDay } from '@/types/workout';

export const dynamic = 'force-dynamic';

// POST /api/ai/cleanup-programs
// One-time cleanup to normalize exercise names in existing programs
export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createRouteHandlerClient();

    // Fetch all user's programs
    const { data: programs, error: fetchError } = await supabase
      .from('programs')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching programs:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
    }

    if (!programs || programs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No programs to clean up',
        updated: 0,
      });
    }

    const updatePromises = programs.map(async (program: Program) => {
      // Normalize all exercises in all workouts
      const normalizedPlanData = program.plan_data.map((workout: ProgramDay) => ({
        ...workout,
        data: {
          ...workout.data,
          exercises: normalizeAIExercises(workout.data.exercises),
        },
      }));

      // Update the program
      const { error: updateError } = await supabase
        .from('programs')
        .update({ plan_data: normalizedPlanData })
        .eq('id', program.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Failed to update program ${program.id}:`, updateError);
        return { id: program.id, success: false, error: updateError.message };
      }

      return { id: program.id, success: true };
    });

    const results = await Promise.all(updatePromises);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${successCount} programs`,
      total: programs.length,
      updated: successCount,
      failed: failureCount,
      details: results,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/ai/cleanup-programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
