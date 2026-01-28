import { NextRequest, NextResponse } from 'next/server';
import {
  createRouteHandlerClient,
  getAuthenticatedUser,
} from '@/lib/supabase/route-handler';
import type { Program } from '@/types/workout';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const programType = searchParams.get('program_type');

    let query = supabase
      .from('programs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (programType) {
      query = query.eq('program_type', programType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Program[]);
  } catch (error) {
    console.error('Unexpected error in GET /api/programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
