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
import { nextSessionResponseSchema } from '@/lib/validation/ai-schemas';
import type { Workout } from '@/types/workout';
import { extractJson } from '@/lib/utils/json-extractor';

export const dynamic = 'force-dynamic';

// Load fitness coaching skill
const COACHING_SKILL_PATH = join(process.cwd(), '.claude/skills/fitness-coach/SKILL.md');
const COACHING_SKILL = readFileSync(COACHING_SKILL_PATH, 'utf-8')
  .split('---')[2] // Extract content after YAML frontmatter
  .trim();

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
      .limit(50);

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
    let prompt = `Here is the user's recent workout history:\n\n${historyText}\n\nGenerate the optimal next training session based on this history.`;

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
      // Single workout session: 6144 tokens should be more than enough
      aiResponse = await askClaude(prompt, COACHING_SKILL, 6144, true);
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

    const validation = nextSessionResponseSchema.safeParse(parsedResponse);
    if (!validation.success) {
      console.error('=== VALIDATION FAILURE ===');
      console.error('Validation error:', validation.error);
      console.error('Parsed response keys:', Object.keys(parsedResponse as object));
      console.error('=== END VALIDATION FAILURE ===');
      return NextResponse.json(
        {
          error: 'Invalid AI response structure',
          details: validation.error.flatten(),
        },
        { status: 500 }
      );
    }

    const nextSession = validation.data;

    const { data: program, error: saveError } = await supabase
      .from('programs')
      .insert({
        user_id: user.id,
        program_type: 'next_session',
        plan_data: [
          {
            week: 1,
            workout_index: 1,
            data: nextSession.data, // Always weightlifting data
            coaching_notes: nextSession.coaching_notes,
          },
        ],
        status: 'pending',
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
