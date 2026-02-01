import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import type { Workout } from '@/types/workout';

// GET /api/programs/[id]/workouts - Fetch all workouts linked to a specific program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: programId } = await params;
    const supabase = await createRouteHandlerClient();

    // Verify program ownership
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', programId)
      .eq('user_id', user.id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Fetch workouts linked to this program
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('program_id', programId)
      .order('program_day_index', { ascending: true });

    if (error) {
      console.error('Error fetching program workouts:', error);
      return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
    }

    return NextResponse.json(workouts || []);
  } catch (error) {
    console.error('Error in GET /api/programs/[id]/workouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
