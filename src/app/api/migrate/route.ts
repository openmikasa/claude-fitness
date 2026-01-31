import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with admin key
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/006_delete_non_weightlifting_and_rename.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration using raw SQL
    const { data, error } = await supabase.from('workouts').select('id').limit(1);

    if (error) {
      return NextResponse.json({ error: 'Database connection failed', details: error }, { status: 500 });
    }

    // Since we can't execute raw DDL via the Supabase client easily,
    // we'll return the SQL for manual execution
    return NextResponse.json({
      message: 'Please run the following SQL in Supabase SQL Editor',
      sql: migrationSQL,
      dashboard_url: 'https://supabase.com/dashboard/project/eufogieqwgqdbadvqate/sql'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
