import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { updateWorkoutInputSchema } from '@/lib/validation/workout-schemas';
import type { Workout } from '@/types/workout';

// GET /api/workouts/[id] - Get workout by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    // Fetch workout by ID (RLS will enforce ownership)
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching workout:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workout' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Workout);
  } catch (error) {
    console.error('Unexpected error in GET /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workouts/[id] - Update workout
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validation = updateWorkoutInputSchema.safeParse({ ...body, id });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const workoutInput = validation.data;
    const supabase = await createRouteHandlerClient();

    // Build update object (only include fields that were provided)
    const updateData: any = {};
    if (workoutInput.workout_date !== undefined) {
      updateData.workout_date = workoutInput.workout_date;
    }
    if (workoutInput.data !== undefined) {
      updateData.data = workoutInput.data;
    }
    if (workoutInput.notes !== undefined) {
      updateData.notes = workoutInput.notes;
    }

    // Update workout (RLS will enforce ownership)
    const { data, error } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workout not found' },
          { status: 404 }
        );
      }
      console.error('Error updating workout:', error);
      return NextResponse.json(
        { error: 'Failed to update workout' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Workout);
  } catch (error) {
    console.error('Unexpected error in PUT /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/[id] - Delete workout
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    // Delete workout (RLS will enforce ownership)
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting workout:', error);
      return NextResponse.json(
        { error: 'Failed to delete workout' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Workout deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
