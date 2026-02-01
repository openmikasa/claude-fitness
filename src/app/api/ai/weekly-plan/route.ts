import { NextResponse } from 'next/server';
import { addDays } from 'date-fns';
import { readFileSync } from 'fs';
import { join } from 'path';
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

// Load fitness coaching skill
const COACHING_SKILL_PATH = join(process.cwd(), '.claude/skills/fitness-coach/SKILL.md');
const COACHING_SKILL = readFileSync(COACHING_SKILL_PATH, 'utf-8')
  .split('---')[2] // Extract content after YAML frontmatter
  .trim();

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for custom prompt and program weeks
    const body = await request.json().catch(() => ({}));
    const customPrompt = body.customPrompt || '';
    const programWeeks = Math.min(Math.max(body.programWeeks || 1, 1), 12); // 1-12 weeks

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
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: workouts, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('workout_date', ninetyDaysAgo.toISOString().split('T')[0])
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

    // Calculate dates based on program length
    const today = new Date();
    const validFrom = today.toISOString().split('T')[0];
    const totalDays = programWeeks * 7;
    const validUntil = addDays(today, totalDays - 1).toISOString().split('T')[0];

    const historyText = formatWorkoutHistory(workouts as Workout[]);

    // Build the prompt with custom user requirements if provided
    let prompt = `Here is the user's recent workout history (last 90 days):\n\n${historyText}\n\n`;

    if (customPrompt.trim()) {
      prompt += `USER'S CUSTOM REQUIREMENTS:\n${customPrompt}\n\n`;
    }

    prompt += `Generate a ${programWeeks}-week periodized training program starting from ${validFrom} and ending on ${validUntil}. Include exactly ${totalDays} days (day 1 through day ${totalDays}).`;

    if (programWeeks >= 4) {
      prompt += ` Include strategic deload week(s) approximately every 4 weeks with reduced volume (50-60% of normal). Mark deload days with is_deload: true and include "week" field (1-${programWeeks}) for each day. Include mesocycle_info in your response.`;
    }

    if (customPrompt.trim()) {
      prompt += ` Make sure to follow all the user's requirements listed above including their equipment preferences, training focus, preferred split, and training frequency.`;
    }

    let aiResponse: string;
    try {
      aiResponse = await askClaude(prompt, COACHING_SKILL);
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
        mesocycle_info: weeklyPlan.mesocycle_info || null,
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
      mesocycle_info: weeklyPlan.mesocycle_info,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/ai/weekly-plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
