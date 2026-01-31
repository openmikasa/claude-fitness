import { NextResponse } from 'next/server';
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
import { nextSessionResponseSchema } from '@/lib/validation/ai-schemas';
import type { Workout } from '@/types/workout';

export const dynamic = 'force-dynamic';

const NEXT_SESSION_SYSTEM_PROMPT = `You are an expert weightlifting coach. Analyze the user's recent workout history and generate the optimal next training session.

Apply these principles:
- Progressive overload (gradual weight/volume increase of 2.5-5kg for upper body, 5-10kg for lower body)
- Adequate recovery (48-72 hours between similar muscle groups)
- Exercise variety to prevent plateaus
- Realistic recommendations based on recent performance
- If user hasn't trained a muscle group recently, prioritize it

Respond with ONLY valid JSON, no markdown formatting or code blocks:
{
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
  "rationale": "Increasing squat weight by 5kg for progressive overload after successful completion last week. Adding volume with bench press variations.",
  "coaching_notes": "Focus on depth and bar path. Rest 3-5 min between sets. If you can't complete all reps, reduce weight by 10%."
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
    const { data: workouts, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .limit(20);

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
          message: 'Please log at least one workout before generating AI recommendations.',
        },
        { status: 400 }
      );
    }

    const historyText = formatWorkoutHistory(workouts as Workout[]);
    const prompt = `Here is the user's recent workout history:\n\n${historyText}\n\nGenerate the optimal next training session based on this history.`;

    let aiResponse: string;
    try {
      aiResponse = await askClaude(prompt, NEXT_SESSION_SYSTEM_PROMPT);
    } catch (aiError) {
      console.error('Claude API error:', aiError);
      return NextResponse.json(
        {
          error: 'AI generation failed',
          message: 'Failed to generate recommendation. Please try again.',
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

    const validation = nextSessionResponseSchema.safeParse(parsedResponse);
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

    const nextSession = validation.data;

    const today = new Date().toISOString().split('T')[0];
    const { data: program, error: saveError } = await supabase
      .from('programs')
      .insert({
        user_id: user.id,
        program_type: 'next_session',
        plan_data: [
          {
            day: 1,
            data: nextSession.data, // Always weightlifting data
            coaching_notes: nextSession.coaching_notes,
          },
        ],
        status: 'pending',
        valid_from: today,
        valid_until: today,
        rationale: nextSession.rationale,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving program:', saveError);
      return NextResponse.json(
        { error: 'Failed to save recommendation' },
        { status: 500 }
      );
    }

    await incrementRequestCount(user.id);

    return NextResponse.json({
      ...nextSession,
      programId: program.id,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/ai/next-session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
