import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createWorkoutInputSchema } from '@/lib/validation/workout-schemas';
import type { CsvRow, CsvMapping, CsvValidationError } from '@/types/import';
import type { CreateWorkoutInput, WorkoutType } from '@/types/workout';

interface ImportRequest {
  rows: CsvRow[];
  mapping: CsvMapping;
  filename: string;
}

interface ImportResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: CsvValidationError[];
  batchId: string;
}

// Convert CSV row to workout input
function mapRowToWorkout(row: CsvRow, mapping: CsvMapping): CreateWorkoutInput | null {
  // Extract date (required)
  if (!mapping.dateColumn || !row[mapping.dateColumn]) {
    return null;
  }

  const dateValue = row[mapping.dateColumn];
  let workoutDate: string;

  try {
    // Try parsing various date formats
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return null;
    }
    workoutDate = date.toISOString();
  } catch {
    return null;
  }

  // Extract workout type (default to 'strength' if not provided)
  let workoutType: WorkoutType = 'strength';
  if (mapping.workoutTypeColumn && row[mapping.workoutTypeColumn]) {
    const typeValue = row[mapping.workoutTypeColumn].toLowerCase().trim();
    if (['strength', 'cardio', 'sauna', 'mobility'].includes(typeValue)) {
      workoutType = typeValue as WorkoutType;
    }
  }

  // Extract notes
  const notes = mapping.notesColumn ? row[mapping.notesColumn] : undefined;

  // Build workout data based on type
  let data: any;

  if (workoutType === 'strength') {
    // For strength workouts, create exercise with sets
    const exerciseName = mapping.exerciseColumn ? row[mapping.exerciseColumn] : 'Exercise';
    const weight = mapping.weightColumn ? parseFloat(row[mapping.weightColumn]) : 0;
    const reps = mapping.repsColumn ? parseInt(row[mapping.repsColumn]) : 1;
    const setsCount = mapping.setsColumn ? parseInt(row[mapping.setsColumn]) : 1;

    if (isNaN(weight) || weight < 0) return null;
    if (isNaN(reps) || reps < 1) return null;
    if (isNaN(setsCount) || setsCount < 1) return null;

    const sets = Array.from({ length: setsCount }, () => ({ weight, reps }));
    data = {
      exercises: [
        {
          name: exerciseName || 'Exercise',
          sets,
        },
      ],
    };
  } else if (workoutType === 'cardio') {
    // For cardio workouts
    const timeMinutes = mapping.timeColumn ? parseFloat(row[mapping.timeColumn]) : 0;
    const distanceKm = mapping.distanceColumn ? parseFloat(row[mapping.distanceColumn]) : undefined;

    if (isNaN(timeMinutes) || timeMinutes <= 0) return null;

    data = {
      type: 'running', // Default cardio type
      time_minutes: timeMinutes,
      distance_km: distanceKm && !isNaN(distanceKm) ? distanceKm : undefined,
    };
  } else if (workoutType === 'sauna') {
    // For sauna sessions
    const durationMinutes = mapping.timeColumn ? parseFloat(row[mapping.timeColumn]) : 0;

    if (isNaN(durationMinutes) || durationMinutes <= 0) return null;

    data = {
      duration_minutes: durationMinutes,
    };
  } else if (workoutType === 'mobility') {
    // For mobility sessions
    const exerciseName = mapping.exerciseColumn ? row[mapping.exerciseColumn] : 'Stretching';
    const durationMinutes = mapping.timeColumn ? parseFloat(row[mapping.timeColumn]) : 0;

    if (isNaN(durationMinutes) || durationMinutes <= 0) return null;

    data = {
      exercises: [
        {
          name: exerciseName || 'Stretching',
          duration_minutes: durationMinutes,
        },
      ],
    };
  }

  return {
    workout_type: workoutType,
    workout_date: workoutDate,
    data,
    notes,
  };
}

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
    const body: ImportRequest = await request.json();
    const { rows, mapping, filename } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No rows provided' },
        { status: 400 }
      );
    }

    if (!mapping || !mapping.dateColumn) {
      return NextResponse.json(
        { error: 'Date column mapping is required' },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const validWorkouts: CreateWorkoutInput[] = [];
    const errors: CsvValidationError[] = [];

    // Map and validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const workoutInput = mapRowToWorkout(row, mapping);

      if (!workoutInput) {
        errors.push({
          row: i + 1,
          field: 'date',
          message: 'Invalid or missing date',
        });
        continue;
      }

      // Validate with Zod schema
      const validation = createWorkoutInputSchema.safeParse(workoutInput);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        errors.push({
          row: i + 1,
          field: firstError.path.join('.'),
          message: firstError.message,
        });
        continue;
      }

      validWorkouts.push(workoutInput);
    }

    // Batch insert valid workouts (chunks of 100)
    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < validWorkouts.length; i += BATCH_SIZE) {
      const batch = validWorkouts.slice(i, i + BATCH_SIZE);
      const workoutsToInsert = batch.map((workout) => ({
        user_id: user.id,
        workout_type: workout.workout_type,
        workout_date: workout.workout_date,
        data: workout.data,
        notes: workout.notes,
      }));

      const { data, error } = await supabase
        .from('workouts')
        .insert(workoutsToInsert)
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        // Add errors for this batch
        batch.forEach((_, idx) => {
          errors.push({
            row: i + idx + 1,
            field: 'database',
            message: 'Failed to insert workout',
          });
        });
      } else {
        successCount += data.length;
      }
    }

    // Create import batch record
    const { data: batchData, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        user_id: user.id,
        filename,
        total_rows: rows.length,
        successful_rows: successCount,
        failed_rows: errors.length,
        error_details: errors.length > 0 ? errors : null,
      })
      .select()
      .single();

    if (batchError) {
      console.error('Failed to create import batch record:', batchError);
    }

    const response: ImportResponse = {
      success: true,
      total: rows.length,
      successful: successCount,
      failed: errors.length,
      errors,
      batchId: batchData?.id || '',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in POST /api/import:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
