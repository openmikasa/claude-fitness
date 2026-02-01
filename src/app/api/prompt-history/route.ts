import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { z } from 'zod';

const savePromptSchema = z.object({
  prompt: z.string().min(1),
  programWeeks: z.number().int().min(1).max(12),
  label: z.string().optional(),
});

// GET /api/prompt-history - Fetch user's prompt history
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase
    .from('user_prompt_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/prompt-history - Save new prompt
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = savePromptSchema.parse(body);

  const supabase = await createRouteHandlerClient();

  // Insert new entry
  const { data: newEntry, error: insertError } = await supabase
    .from('user_prompt_history')
    .insert({
      user_id: user.id,
      prompt: validated.prompt,
      program_weeks: validated.programWeeks,
      label: validated.label,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Auto-prune: Keep only last 10 entries
  const { data: allEntries, error: fetchError } = await supabase
    .from('user_prompt_history')
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // If more than 10, delete the oldest ones
  if (allEntries && allEntries.length > 10) {
    const idsToDelete = allEntries.slice(10).map((e) => e.id);
    await supabase
      .from('user_prompt_history')
      .delete()
      .in('id', idsToDelete);
  }

  return NextResponse.json(newEntry);
}

// DELETE /api/prompt-history - Delete all history or specific entry
export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const supabase = await createRouteHandlerClient();

  if (id) {
    // Delete specific entry
    const { error } = await supabase
      .from('user_prompt_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Delete all entries for user
    const { error } = await supabase
      .from('user_prompt_history')
      .delete()
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
