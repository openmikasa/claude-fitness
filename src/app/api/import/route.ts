import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { createWorkoutInputSchema } from '@/lib/validation/workout-schemas';
import { normalizeWeight } from '@/lib/parsers/csv-parser';
import type { CsvRow, CsvMapping, CsvValidationError } from '@/types/import';
import type { CreateWorkoutInput } from '@/types/workout';

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

// Convert CSV row to workout input (weightlifting only)
function mapRowToWorkout(
  row: CsvRow,
  mapping: CsvMapping,
  userPreferredUnit: 'metric' | 'imperial' = 'metric'
): CreateWorkoutInput | null {
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

  // Extract notes
  const notes = mapping.notesColumn ? row[mapping.notesColumn] : undefined;

  // ALWAYS build weightlifting data
  const exerciseName = mapping.exerciseColumn ? row[mapping.exerciseColumn] : 'Exercise';
  const rawWeightValue = mapping.weightColumn ? row[mapping.weightColumn] : '0';
  const reps = mapping.repsColumn ? parseInt(row[mapping.repsColumn]) : 1;
  const setsCount = mapping.setsColumn ? parseInt(row[mapping.setsColumn]) : 1;

  // Normalize weight to kg based on cell value, column name, or user preference
  const weight = mapping.weightColumn
    ? normalizeWeight(rawWeightValue, mapping.weightColumn, userPreferredUnit)
    : 0;

  if (isNaN(weight) || weight < 0) return null;
  if (isNaN(reps) || reps < 1) return null;
  if (isNaN(setsCount) || setsCount < 1) return null;

  // Build sets array
  const sets = Array.from({ length: setsCount }, () => ({ weight, reps }));

  return {
    workout_date: workoutDate,
    data: {
      exercises: [
        {
          name: exerciseName || 'Exercise',
          sets,
        },
      ],
    },
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

    // Fetch user's unit preference
    const { data: profileData } = await supabase
      .from('profiles')
      .select('units')
      .eq('id', user.id)
      .single();

    const userPreferredUnit = profileData?.units || 'metric';

    const validWorkouts: CreateWorkoutInput[] = [];
    const errors: CsvValidationError[] = [];

    // Map and validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const workoutInput = mapRowToWorkout(row, mapping, userPreferredUnit);

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
        workout_type: 'weightlifting', // Always weightlifting
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
