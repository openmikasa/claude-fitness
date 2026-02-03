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

// Convert CSV row to a single set
interface ParsedSet {
  date: string;
  session: string; // Session identifier for multiple workouts per day
  exerciseName: string;
  weight: number;
  reps: number;
  unit: 'kg' | 'lb'; // Track detected unit
  notes?: string;
}

function parseRowToSet(
  row: CsvRow,
  mapping: CsvMapping,
  userPreferredUnit: 'metric' | 'imperial' = 'metric'
): ParsedSet | null {
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

  // Extract exercise name
  const exerciseName = mapping.exerciseColumn ? row[mapping.exerciseColumn] : 'Exercise';

  // Extract session (optional - for multiple workouts per day)
  const session = mapping.sessionColumn ? row[mapping.sessionColumn] || 'default' : 'default';

  // Extract weight
  const rawWeightValue = mapping.weightColumn ? row[mapping.weightColumn] : '0';
  const weightResult = mapping.weightColumn
    ? normalizeWeight(rawWeightValue, mapping.weightColumn, userPreferredUnit)
    : { weight: 0, unit: 'kg' as const };

  const weight = weightResult.weight;
  const unit = weightResult.unit;

  // Extract reps
  const reps = mapping.repsColumn ? parseInt(row[mapping.repsColumn]) : 1;

  // Extract notes
  const notes = mapping.notesColumn ? row[mapping.notesColumn] : undefined;

  if (isNaN(weight) || weight < 0) return null;
  if (isNaN(reps) || reps < 1) return null;

  return {
    date: workoutDate,
    session,
    exerciseName: exerciseName || 'Exercise',
    weight,
    reps,
    unit,
    notes,
  };
}

// Group sets by date+session and exercise to create workouts
function groupSetsIntoWorkouts(parsedSets: ParsedSet[]): CreateWorkoutInput[] {
  // Group by date+session (allows multiple workouts per day)
  const byDateAndSession = new Map<string, ParsedSet[]>();

  for (const set of parsedSets) {
    const key = `${set.date}|||${set.session}`; // Use ||| as separator to avoid conflicts
    const existing = byDateAndSession.get(key) || [];
    existing.push(set);
    byDateAndSession.set(key, existing);
  }

  // Convert each date+session group into a workout
  const workouts: CreateWorkoutInput[] = [];

  for (const [key, sets] of Array.from(byDateAndSession.entries())) {
    const [date] = key.split('|||'); // Extract date from key
    // Group by exercise name
    const byExercise = new Map<string, Array<{ weight: number; reps: number; unit: 'kg' | 'lb'; notes?: string }>>();

    for (const set of sets) {
      const existing = byExercise.get(set.exerciseName) || [];
      existing.push({ weight: set.weight, reps: set.reps, unit: set.unit, notes: set.notes });
      byExercise.set(set.exerciseName, existing);
    }

    // Build exercises array
    const exercises = Array.from(byExercise.entries()).map(([name, sets]) => ({
      name,
      sets,
    }));

    workouts.push({
      workout_date: date,
      data: { exercises },
      notes: undefined, // Per-set notes instead of workout-level notes
    });
  }

  return workouts;
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

    const parsedSets: ParsedSet[] = [];
    const errors: CsvValidationError[] = [];

    // Parse each row into sets (each row may represent multiple identical sets)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsedSet = parseRowToSet(row, mapping, userPreferredUnit);

      if (!parsedSet) {
        errors.push({
          row: i + 1,
          field: 'date',
          message: 'Invalid or missing date',
        });
        continue;
      }

      // If the row specifies sets > 1, duplicate the set
      const setsCount = mapping.setsColumn ? parseInt(row[mapping.setsColumn]) || 1 : 1;
      for (let j = 0; j < setsCount; j++) {
        parsedSets.push(parsedSet);
      }
    }

    // Group sets into workouts by date and exercise
    const workouts = groupSetsIntoWorkouts(parsedSets);

    // Validate each workout with Zod schema
    const validWorkouts: CreateWorkoutInput[] = [];

    for (let i = 0; i < workouts.length; i++) {
      const workout = workouts[i];
      const validation = createWorkoutInputSchema.safeParse(workout);

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        errors.push({
          row: i + 1,
          field: firstError.path.join('.'),
          message: firstError.message,
        });
        continue;
      }

      validWorkouts.push(workout);
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
