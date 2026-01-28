import { NextResponse } from 'next/server';
import { addDays } from 'date-fns';
import {
  createRouteHandlerClient,
  getAuthenticatedUser,
} from '@/lib/supabase/route-handler';
import { askClaude } from '@/lib/ai/claude-client';
import { formatWorkoutHistory } from '@/lib/ai/workout-analyzer';
import {
  checkRateLimit,
  incrementRequestCount,
} from '@/lib/ai/rate-limiter';
import { weeklyPlanResponseSchema } from '@/lib/validation/ai-schemas';
import type { Workout } from '@/types/workout';

export const dynamic = 'force-dynamic';

const WEEKLY_PLAN_SYSTEM_PROMPT = `You are an expert strength and conditioning coach. Create a complete 7-day training program for the user based on their workout history.

Goals:
- Balance strength, cardio, and recovery
- Progressive overload where appropriate (2.5-5kg for upper body, 5-10kg for lower body)
- Variety to prevent boredom
- Realistic volume based on user's capacity
- Include at least 1-2 rest/recovery days

Respond with ONLY valid JSON, no markdown formatting or code blocks:
{
  "program_type": "weekly_plan",
  "plan_data": [
    {
      "day": 1,
      "workout_type": "strength",
      "data": {
        "exercises": [
          {
            "name": "Squat",
            "sets": [
              { "weight": 100, "reps": 5 },
              { "weight": 100, "reps": 5 },
              { "weight": 100, "reps": 5 }
            ]
          }
        ]
      },
      "coaching_notes": "Focus on form and depth"
    },
    {
      "day": 2,
      "workout_type": "cardio",
      "data": {
        "type": "running",
        "time_minutes": 30,
        "distance_km": 5
      },
      "coaching_notes": "Easy pace, focus on aerobic base"
    }
  ],
  "rationale": "This plan focuses on strength development with adequate recovery...",
  "valid_from": "2026-01-27",
  "valid_until": "2026-02-02"
}`;

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.isAllowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have reached your daily limit of ${rateLimit.limit} AI requests. Try again tomorrow.`,
          currentCount: rateLimit.currentCount,
          limit: rateLimit.limit,
        },
        { status: 429 }
      );
    }

    const supabase = await createRouteHandlerClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: workouts, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('workout_date', { ascending: false });

    if (fetchError) {
      console.error('Error fetching workouts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch workout history' },
        { status: 500 }
      );
    }

    if (!workouts || workouts.length === 0) {
      return NextResponse.json(
        {
          error: 'No workout history',
          message: 'Please log at least one workout before generating a weekly plan.',
        },
        { status: 400 }
      );
    }

    const today = new Date();
    const validFrom = today.toISOString().split('T')[0];
    const validUntil = addDays(today, 6).toISOString().split('T')[0];

    const historyText = formatWorkoutHistory(workouts as Workout[]);
    const prompt = `Here is the user's recent workout history (last 30 days):\n\n${historyText}\n\nGenerate a complete 7-day training plan starting from ${validFrom} and ending on ${validUntil}. Include exactly 7 days.`;

    let aiResponse: string;
    try {
      aiResponse = await askClaude(prompt, WEEKLY_PLAN_SYSTEM_PROMPT);
    } catch (aiError) {
      console.error('Claude API error:', aiError);
      return NextResponse.json(
        {
          error: 'AI generation failed',
          message: 'Failed to generate weekly plan. Please try again.',
        },
        { status: 500 }
      );
    }

    let jsonText = aiResponse.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI Response:', aiResponse);
      return NextResponse.json(
        {
          error: 'Invalid AI response',
          message: 'AI returned an invalid response format. Please try again.',
        },
        { status: 500 }
      );
    }

    const validation = weeklyPlanResponseSchema.safeParse(parsedResponse);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return NextResponse.json(
        {
          error: 'Invalid AI response structure',
          details: validation.error.flatten(),
        },
        { status: 500 }
      );
    }

    const weeklyPlan = validation.data;

    const { data: program, error: saveError } = await supabase
      .from('programs')
      .insert({
        user_id: user.id,
        program_type: 'weekly_plan',
        plan_data: weeklyPlan.plan_data,
        status: 'pending',
        valid_from: weeklyPlan.valid_from,
        valid_until: weeklyPlan.valid_until,
        rationale: weeklyPlan.rationale,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving program:', saveError);
      return NextResponse.json(
        { error: 'Failed to save weekly plan' },
        { status: 500 }
      );
    }

    await incrementRequestCount(user.id);

    return NextResponse.json({
      ...weeklyPlan,
      programId: program.id,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/ai/weekly-plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
