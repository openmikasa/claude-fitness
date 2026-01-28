import { NextResponse } from 'next/server';
import { createRouteHandlerClient, getAuthenticatedUser } from '@/lib/supabase/route-handler';
import { z } from 'zod';

const settingsSchema = z.object({
  units: z.enum(['metric', 'imperial']).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
});

// GET /api/settings
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('units, theme')
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT /api/settings
export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validated = settingsSchema.parse(body);

  const supabase = await createRouteHandlerClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(validated)
    .eq('user_id', user.id)
    .select('units, theme')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
