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
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const exerciseSearch = searchParams.get('exercise_search');
    const equipment = searchParams.getAll('equipment');
    const muscleGroups = searchParams.getAll('muscle_groups');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Build query with workout_exercises join
    let query = supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          id,
          exercise_id,
          equipment,
          sets_data,
          exercises (
            name,
            muscle_groups,
            equipment
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false });

    // Apply filters
    if (dateFrom) {
      query = query.gte('workout_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('workout_date', dateTo);
    }

    if (search) {
      query = query.ilike('notes', `%${search}%`);
    }

    // Execute query (we'll filter by exercise_search/equipment/muscle_groups in-memory due to JSONB complexity)
    let queryData;
    let queryCount;

    if (exerciseSearch || equipment.length > 0 || muscleGroups.length > 0) {
      // When searching exercises or filtering by equipment/muscles, fetch all and filter client-side
      const { data: allData, error: fetchError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            id,
            exercise_id,
            equipment,
            sets_data,
            exercises (
              name,
              muscle_groups,
              equipment
            )
          )
        `)
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching workouts:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch workouts' },
          { status: 500 }
        );
      }

      // Filter by exercise search and equipment/muscle groups
      const searchLower = exerciseSearch?.toLowerCase() || '';
      const filtered = (allData || []).filter((workout) => {
        // Apply other filters
        if (dateFrom && workout.workout_date < dateFrom) return false;
        if (dateTo && workout.workout_date > dateTo) return false;
        if (search && (!workout.notes || !workout.notes.toLowerCase().includes(search.toLowerCase()))) return false;

        // Check workout_exercises for equipment/muscle group filtering
        if (equipment.length > 0 || muscleGroups.length > 0) {
          const workoutExercises = (workout as any).workout_exercises || [];
          if (workoutExercises.length === 0) return false;

          const hasMatchingEquipment = equipment.length === 0 || workoutExercises.some((we: any) => {
            const weEquipment = we.equipment || [];
            return equipment.some((eq: string) =>
              weEquipment.some((e: string) => e.toLowerCase() === eq.toLowerCase())
            );
          });

          const hasMatchingMuscleGroup = muscleGroups.length === 0 || workoutExercises.some((we: any) => {
            const exerciseMuscles = we.exercises?.muscle_groups || [];
            return muscleGroups.some((mg: string) =>
              exerciseMuscles.some((m: string) => m.toLowerCase() === mg.toLowerCase())
            );
          });

          if (!hasMatchingEquipment || !hasMatchingMuscleGroup) return false;
        }

        // Apply exercise search (weightlifting workouts only)
        if (exerciseSearch) {
          const data = workout.data as any;
          if (data.exercises && Array.isArray(data.exercises)) {
            return data.exercises.some((ex: any) =>
              ex.name && ex.name.toLowerCase().includes(searchLower)
            );
          }
          return false;
        }

        return true;
      });

      queryCount = filtered.length;

      // Apply pagination to filtered results
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      queryData = filtered.slice(from, to);
    } else {
      // Apply basic filters to query
      if (dateFrom) {
        query = query.gte('workout_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('workout_date', dateTo);
      }

      if (search) {
        query = query.ilike('notes', `%${search}%`);
      }

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
        workout_type: 'weightlifting', // Always weightlifting
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

    // Create junction table records for exercises with exercise_id
    const weightliftingData = workoutInput.data as any;
    if (weightliftingData.exercises && Array.isArray(weightliftingData.exercises)) {
      const exercisesWithId = weightliftingData.exercises.filter(
        (ex: any) => ex.exercise_id && ex.exercise_id.trim() !== ''
      );

      if (exercisesWithId.length > 0) {
        const workoutExercises = exercisesWithId.map((ex: any) => ({
          workout_id: data.id,
          exercise_id: ex.exercise_id,
          equipment: ex.equipment || [],
          sets_data: ex.sets,
        }));

        const { error: junctionError } = await supabase
          .from('workout_exercises')
          .insert(workoutExercises);

        if (junctionError) {
          console.error('Error creating workout_exercises:', junctionError);
          // Don't fail the whole request, just log the error
        }
      }
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
