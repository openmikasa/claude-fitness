// Script to run database migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(
      join(__dirname, 'supabase/migrations/005_restrict_to_strength_only.sql'),
      'utf-8'
    );

    console.log('Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('The workouts table now only accepts strength training workouts.');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
