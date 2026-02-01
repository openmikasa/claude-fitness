import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { askClaude } from '@/lib/ai/claude-client';
import { z } from 'zod';
import { weeklyPlanResponseSchema } from '@/lib/validation/ai-schemas';
import type {
  RefreshProgramRequest,
  RefreshProgramResponse,
  Program,
  Workout,
  WeightliftingExercise,
} from '@/types/workout';
import { startOfDay, parseISO, differenceInDays } from 'date-fns';

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

const refreshRequestSchema = z.object({
  program_id: z.string().uuid(),
  from_today: z.boolean().optional().default(true),
});

function formatWorkoutForAI(workout: Workout): string {
  const data = workout.data;
  let output = `Date: ${workout.workout_date}\n`;

  if (workout.notes) {
    output += `Overall Notes: ${workout.notes}\n`;
  }

  data.exercises.forEach((ex: WeightliftingExercise) => {
    output += `  ${ex.name}:\n`;
    ex.sets.forEach((set, idx) => {
      const note = set.notes ? ` (${set.notes})` : '';
      output += `    Set ${idx + 1}: ${set.weight}kg × ${set.reps} reps${note}\n`;
    });
  });

  return output;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = refreshRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { program_id, from_today } = validation.data;
    const supabase = await createRouteHandlerClient();

    // Fetch program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .eq('user_id', user.id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Fetch all workouts linked to this program
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('program_id', program_id)
      .order('program_day_index', { ascending: true });

    if (workoutsError) {
      return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
    }

    // Calculate which days to regenerate
    const today = startOfDay(new Date());
    const planStart = startOfDay(parseISO(program.valid_from));
    const daysDiff = differenceInDays(today, planStart);

    let todayIndex = daysDiff;
    if (!from_today) {
      todayIndex = 0; // Regenerate entire program
    }

    // Ensure we don't regenerate past days
    if (todayIndex < 0) {
      todayIndex = 0;
    }
    if (todayIndex >= program.plan_data.length) {
      return NextResponse.json(
        { error: 'Program has already ended. Cannot refresh future days.' },
        { status: 400 }
      );
    }

    // Build AI prompt
    const totalWeeks = program.mesocycle_info?.total_weeks || 1;
    const totalDays = program.plan_data.length;
    const completedWorkoutsText = (workouts || [])
      .map((w) => `Day ${(w.program_day_index || 0) + 1}:\n${formatWorkoutForAI(w)}`)
      .join('\n\n');

    const prompt = `You are refreshing a ${totalWeeks}-week ${program.mesocycle_info?.periodization_model || 'training'} program.

ORIGINAL PROGRAM STRUCTURE:
- Valid from: ${program.valid_from}
- Valid until: ${program.valid_until}
- Periodization: ${program.mesocycle_info?.periodization_model || 'N/A'}
- Phase: ${program.mesocycle_info?.phase || 'N/A'}
- Deload weeks: ${program.mesocycle_info?.deload_weeks?.join(', ') || 'None'}

COMPLETED WORKOUTS (User's Actual Performance):
${completedWorkoutsText || 'No completed workouts yet.'}

IMPORTANT NOTES TO CONSIDER:
- "cheated last 2 reps" = weight is at upper limit, maintain or slight increase
- "felt light" / "easy" = user can handle more weight
- "struggled" / "failed reps" = reduce weight or volume
- Missing days = user skipped, consider recovery needs

TASK:
Regenerate Days ${todayIndex + 1} through ${totalDays} based on actual performance.
Keep the same periodization structure and deload weeks.
Adjust weights, volume, and intensity based on user's notes and performance.

Return ONLY valid JSON matching this exact format:
{
  "program_type": "weekly_plan",
  "mesocycle_info": {
    "total_weeks": ${totalWeeks},
    "deload_weeks": [${program.mesocycle_info?.deload_weeks?.join(', ') || ''}],
    "periodization_model": "${program.mesocycle_info?.periodization_model || 'linear'}",
    "phase": "${program.mesocycle_info?.phase || 'hypertrophy'}"
  },
  "plan_data": [/* array of day objects with day, week, is_deload, data, coaching_notes */],
  "rationale": "Detailed explanation of all adjustments...",
  "valid_from": "${program.valid_from}",
  "valid_until": "${program.valid_until}"
}

Include a detailed rationale explaining all major adjustments with references to specific workout notes.
`;

    // Call Claude API using helper
    const systemPrompt = 'You are an evidence-based strength and conditioning coach.';
    let aiResponse: string;
    try {
      aiResponse = await askClaude(prompt, systemPrompt);
    } catch (aiError) {
      console.error('Claude API error:', aiError);
      return NextResponse.json(
        { error: 'AI generation failed', message: 'Failed to refresh program. Please try again.' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let aiResponseParsed;
    try {
      aiResponseParsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('AI returned invalid JSON');
    }

    // Validate response
    const validatedResponse = weeklyPlanResponseSchema.parse(aiResponseParsed);

    // Build updated plan_data: keep past days, replace future days
    const updatedPlanData = [
      ...program.plan_data.slice(0, todayIndex),
      ...validatedResponse.plan_data,
    ];

    // Update program in database
    const { data: updatedProgram, error: updateError } = await supabase
      .from('programs')
      .update({
        plan_data: updatedPlanData,
        rationale: validatedResponse.rationale,
        updated_at: new Date().toISOString(),
      })
      .eq('id', program_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedProgram) {
      console.error('Failed to update program:', updateError);
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
    }

    // Generate key adjustments summary
    const keyAdjustments: string[] = [];
    // Simple heuristic: compare first and last day of regenerated section
    if (validatedResponse.plan_data.length > 0) {
      keyAdjustments.push(
        `Regenerated ${validatedResponse.plan_data.length} days based on your performance`
      );
    }

    const response: RefreshProgramResponse = {
      updated_program: updatedProgram as Program,
      changes_summary: {
        days_analyzed: (workouts || []).length,
        days_regenerated: validatedResponse.plan_data.length,
        key_adjustments: keyAdjustments,
      },
      rationale: validatedResponse.rationale,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/ai/refresh-program:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
