import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { z } from 'zod';

// Validation schema for creating exercises
const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['strength', 'cardio']),
  primary_muscles: z.array(z.string()).min(1), // NEW - required, 1-5 primary movers
  secondary_muscles: z.array(z.string()).optional(), // NEW - optional, 0-5 stabilizers
  muscle_groups: z.array(z.string()).optional(), // DEPRECATED - kept for backward compat
  equipment: z.array(z.string()).min(1).max(1), // Exactly one equipment
});

// GET /api/exercises - Search exercises (global + user's own)
export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const supabase = await createRouteHandlerClient();

  // Fetch global exercises (user_id IS NULL) + user's own exercises (user_id = user.id)
  let query = supabase
    .from('exercises')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query.limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exercises: data });
}

// POST /api/exercises - Create user-specific exercise
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const validatedData = createExerciseSchema.parse(body);

    const supabase = await createRouteHandlerClient();

    // Check if exercise already exists (global or user-specific)
    const { data: existing } = await supabase
      .from('exercises')
      .select('id, name, user_id')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .ilike('name', validatedData.name)
      .single();

    if (existing) {
      const isGlobal = existing.user_id === null;
      return NextResponse.json({
        error: isGlobal
          ? 'This exercise already exists in the global database'
          : 'You already have a custom exercise with this name',
        existingExercise: existing,
      }, { status: 409 });
    }

    // Create user-specific exercise
    // Dual-write pattern: Write to both old (muscle_groups) and new (primary/secondary) fields
    const { data: newExercise, error } = await supabase
      .from('exercises')
      .insert({
        name: validatedData.name,
        category: validatedData.category,
        muscle_groups: validatedData.primary_muscles, // Backward compat - use primary as default
        primary_muscles: validatedData.primary_muscles, // NEW field
        secondary_muscles: validatedData.secondary_muscles || [], // NEW field
        equipment: validatedData.equipment,
        user_id: user.id, // Mark as user-specific
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exercise: newExercise }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
