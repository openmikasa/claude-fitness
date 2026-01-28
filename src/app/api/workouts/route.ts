import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createWorkoutInputSchema } from '@/lib/validation/workout-schemas';
import type { WorkoutListResponse, Workout } from '@/types/workout';

// GET /api/workouts - List workouts with optional filters
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const workoutType = searchParams.get('workout_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const exerciseSearch = searchParams.get('exercise_search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Build query
    let query = supabase
      .from('workouts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false });

    // Apply filters
    if (workoutType) {
      query = query.eq('workout_type', workoutType);
    }

    if (dateFrom) {
      query = query.gte('workout_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('workout_date', dateTo);
    }

    if (search) {
      query = query.ilike('notes', `%${search}%`);
    }

    // Execute query (we'll filter by exercise_search in-memory due to JSONB complexity)
    let queryData;
    let queryCount;

    if (exerciseSearch) {
      // When searching exercises, we need to fetch more data and filter client-side
      // Remove pagination temporarily to ensure we get all matching results
      const { data: allData, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching workouts:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch workouts' },
          { status: 500 }
        );
      }

      // Filter by exercise search
      const searchLower = exerciseSearch.toLowerCase();
      const filtered = (allData || []).filter((workout) => {
        // Apply other filters
        if (workoutType && workout.workout_type !== workoutType) return false;
        if (dateFrom && workout.workout_date < dateFrom) return false;
        if (dateTo && workout.workout_date > dateTo) return false;
        if (search && (!workout.notes || !workout.notes.toLowerCase().includes(search.toLowerCase()))) return false;

        // Apply exercise search based on workout type
        if (workout.workout_type === 'strength' || workout.workout_type === 'mobility') {
          const data = workout.data as any;
          if (data.exercises && Array.isArray(data.exercises)) {
            return data.exercises.some((ex: any) =>
              ex.name && ex.name.toLowerCase().includes(searchLower)
            );
          }
          return false;
        } else if (workout.workout_type === 'cardio') {
          const data = workout.data as any;
          return data.type && data.type.toLowerCase().includes(searchLower);
        }
        return false;
      });

      queryCount = filtered.length;

      // Apply pagination to filtered results
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      queryData = filtered.slice(from, to);
    } else {
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching workouts:', error);
        return NextResponse.json(
          { error: 'Failed to fetch workouts' },
          { status: 500 }
        );
      }

      queryData = data;
      queryCount = count || 0;
    }

    const response: WorkoutListResponse = {
      workouts: queryData as Workout[],
      total: queryCount,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workouts - Create new workout
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validation = createWorkoutInputSchema.safeParse(body);
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

    // Insert workout into database
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        workout_type: workoutInput.workout_type,
        workout_date: workoutInput.workout_date,
        data: workoutInput.data,
        notes: workoutInput.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Workout, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
