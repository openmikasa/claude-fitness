import { NextResponse } from 'next/server';
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
import { extractJson } from '@/lib/utils/json-extractor';
import { normalizeAIExercises } from '@/lib/utils/exercise-parser';

export const dynamic = 'force-dynamic';

// Load fitness coaching skill
function loadCoachingSkill(): string {
  try {
    const COACHING_SKILL_PATH = join(process.cwd(), '.claude/skills/fitness-coach/SKILL.md');
    const content = readFileSync(COACHING_SKILL_PATH, 'utf-8');
    const parts = content.split('---');

    if (parts.length < 3) {
      console.error('Invalid SKILL.md format: expected YAML frontmatter with --- delimiters');
      return ''; // Fallback to empty string if format is wrong
    }

    return parts[2].trim();
  } catch (error) {
    console.error('Failed to load coaching skill file:', error);
    return ''; // Fallback to empty string if file can't be read
  }
}

// Extract workouts per week from custom prompt
function extractWorkoutsPerWeek(prompt: string): number {
  const match = prompt.match(/frequency[:\s]*(\d+)\s*days?\/week/i);
  if (match) {
    return Math.min(Math.max(parseInt(match[1], 10), 1), 7);
  }
  return 4; // Default to 4 workouts per week
}

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

    // Calculate total workouts based on weeks and workouts per week
    const workoutsPerWeek = extractWorkoutsPerWeek(customPrompt);
    const totalWorkouts = programWeeks * workoutsPerWeek;

    const historyText = formatWorkoutHistory(workouts as Workout[]);

    // Build the prompt with custom user requirements if provided
    let prompt = `Here is the user's recent workout history (last 90 days):\n\n${historyText}\n\n`;

    if (customPrompt.trim()) {
      prompt += `USER'S CUSTOM REQUIREMENTS:\n${customPrompt}\n\n`;
    }

    prompt += `Generate a ${programWeeks}-week training program with ${workoutsPerWeek} workouts per week.

IMPORTANT STRUCTURE:
- DISTRIBUTE workouts across ALL weeks: Week 1 has ${workoutsPerWeek} workouts, Week 2 has ${workoutsPerWeek} workouts, etc.
- Each workout MUST have: week (1-${programWeeks}), workout_index (1-${workoutsPerWeek})
- Week numbers must be SEQUENTIAL: first ${workoutsPerWeek} workouts use week: 1, next ${workoutsPerWeek} workouts use week: 2, and so on
- Example for 4-week program with 4 workouts/week:
  * Workouts 1-4: week: 1, workout_index: 1-4
  * Workouts 5-8: week: 2, workout_index: 1-4
  * Workouts 9-12: week: 3, workout_index: 1-4
  * Workouts 13-16: week: 4, workout_index: 1-4
- Do NOT use calendar dates or day-of-week (no "Monday", "Tuesday")
- Return ${totalWorkouts} total workouts (${programWeeks} weeks × ${workoutsPerWeek} workouts/week)
- Include mesocycle_info.workouts_per_week: ${workoutsPerWeek}`;

    if (programWeeks >= 4) {
      prompt += `\n\nPERIODIZATION:
- Include strategic deload week(s) approximately every 4 weeks
- DELOAD WEEKS: Keep same number of workouts (${workoutsPerWeek}), but reduce volume/intensity to 50-60%
- Mark deload workouts with is_deload: true
- Include mesocycle_info in your response`;
    }

    if (customPrompt.trim()) {
      prompt += `\n\nMake sure to follow all the user's requirements listed above including their equipment preferences, training focus, preferred split, and training frequency.`;
    }

    // Explicit format enforcement (last thing Claude reads)
    prompt += `

CRITICAL OUTPUT FORMAT:
Your response must start with { and end with }.
Do NOT add:
- Markdown fences (no \`\`\`json)
- Explanatory text before or after the JSON
- Comments or notes outside the JSON structure

Return ONLY the JSON object. Nothing else.`;

    let aiResponse: string;
    try {
      const coachingSkill = loadCoachingSkill();

      // Calculate max_tokens based on program length
      // Base: 2048 tokens + 1500 tokens per week
      // 1 week: 3548 tokens, 4 weeks: 8048 tokens, 12 weeks: 20048 tokens
      const maxTokens = 2048 + (programWeeks * 1500);

      aiResponse = await askClaude(prompt, coachingSkill, maxTokens, true);
    } catch (aiError) {
      console.error('Claude API error:', aiError);
      console.error('Error details:', JSON.stringify(aiError, null, 2));
      return NextResponse.json(
        {
          error: 'AI generation failed',
          message: aiError instanceof Error ? aiError.message : 'Failed to generate weekly plan. Please try again.',
        },
        { status: 500 }
      );
    }

    // Extract and parse JSON with robust extraction
    const extraction = extractJson(aiResponse, true);

    if (!extraction.success) {
      console.error('=== JSON EXTRACTION FAILURE ===');
      console.error('Extraction error:', extraction.error);
      console.error('Raw AI response (first 500 chars):', aiResponse.substring(0, 500));
      console.error('Raw AI response (last 500 chars):', aiResponse.substring(Math.max(0, aiResponse.length - 500)));
      console.error('Response length:', aiResponse.length);
      console.error('=== END EXTRACTION FAILURE ===');

      return NextResponse.json(
        {
          error: 'Invalid AI response',
          message: 'AI returned an invalid response format. Please try again.',
          debug: process.env.NODE_ENV === 'development' ? {
            extractionError: extraction.error,
            responsePreview: aiResponse.substring(0, 200),
          } : undefined,
        },
        { status: 500 }
      );
    }

    console.log(`JSON extracted successfully using method: ${extraction.extractionMethod}`);
    const parsedResponse = extraction.data;

    const validation = weeklyPlanResponseSchema.safeParse(parsedResponse);
    if (!validation.success) {
      console.error('=== VALIDATION FAILURE ===');
      console.error('Validation error:', JSON.stringify(validation.error.flatten(), null, 2));
      console.error('Parsed response keys:', parsedResponse && typeof parsedResponse === 'object'
        ? Object.keys(parsedResponse)
        : `Invalid type: ${typeof parsedResponse}`);
      console.error('=== END VALIDATION FAILURE ===');
      return NextResponse.json(
        {
          error: 'Invalid AI response structure',
          details: validation.error.flatten(),
        },
        { status: 500 }
      );
    }

    const weeklyPlan = validation.data;

    // POST-PROCESSING: Validate and correct week numbers
    // Ensure workouts are properly distributed across weeks
    const correctedPlanData = weeklyPlan.plan_data.map((workout, index) => {
      const expectedWeek = Math.floor(index / workoutsPerWeek) + 1;
      const expectedWorkoutIndex = (index % workoutsPerWeek) + 1;

      // Normalize exercise names (extract equipment from names like "Hax Deadlift")
      const normalizedExercises = normalizeAIExercises(workout.data.exercises);

      if (workout.week !== expectedWeek || workout.workout_index !== expectedWorkoutIndex) {
        console.warn(`[Week Correction] Workout ${index}: Correcting week ${workout.week} → ${expectedWeek}, workout_index ${workout.workout_index} → ${expectedWorkoutIndex}`);
        return {
          ...workout,
          week: expectedWeek,
          workout_index: expectedWorkoutIndex,
          data: {
            ...workout.data,
            exercises: normalizedExercises,
          },
        };
      }
      return {
        ...workout,
        data: {
          ...workout.data,
          exercises: normalizedExercises,
        },
      };
    });

    const { data: program, error: saveError } = await supabase
      .from('programs')
      .insert({
        user_id: user.id,
        program_type: 'weekly_plan',
        mesocycle_info: weeklyPlan.mesocycle_info || null,
        plan_data: correctedPlanData,
        status: 'pending',
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
