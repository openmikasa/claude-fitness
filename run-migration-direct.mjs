import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://eufogieqwgqdbadvqate.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Zm9naWVxd2dxZGJhZHZxYXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU3MTA4MywiZXhwIjoyMDg1MTQ3MDgzfQ.lq0l4h2eBVvTudI4u1Af9Iwn0ff-1Gd-s2jik2DiQcE';

console.log('🔌 Connecting to Supabase...\n');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  try {
    // Test connection first
    console.log('🧪 Testing database connection...');
    const { data, error } = await supabase.from('workouts').select('count').limit(0);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }

    console.log('✅ Connected successfully!\n');

    // Read migration SQL
    const sql = readFileSync('supabase/migrations/005_restrict_to_strength_only.sql', 'utf-8');

    console.log('📋 Comprehensive Database Cleanup Migration');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('This migration will:');
    console.log('  ✓ Add CHECK constraint (only strength workouts allowed)');
    console.log('  ✓ Remove idx_workouts_type index (no longer needed)');
    console.log('  ✓ Simplify workout_type ENUM from 4 types → 1 type');
    console.log('  ✓ Add documentation comments to tables/columns');
    console.log('  ✓ Clean up programs table structure\n');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(sql);
    console.log('───────────────────────────────────────────────────────────────\n');

    // Unfortunately, Supabase REST API doesn't support DDL directly
    console.log('⚠️  Important Note:');
    console.log('   Supabase REST API cannot execute DDL statements (ALTER TABLE, etc.)');
    console.log('   You need to run this manually in the Supabase Dashboard.\n');

    console.log('📝 Steps to apply the migration:\n');
    console.log('   OPTION 1 - Supabase Dashboard (Recommended):');
    console.log('   ────────────────────────────────────────────');
    console.log('   1. Open: https://supabase.com/dashboard/project/eufogieqwgqdbadvqate/sql');
    console.log('   2. Paste the SQL above');
    console.log('   3. Click "Run"\n');

    console.log('   OPTION 2 - Supabase CLI:');
    console.log('   ────────────────────────');
    console.log('   $ supabase link --project-ref eufogieqwgqdbadvqate');
    console.log('   $ supabase db push\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('After migration, the database will ONLY accept strength workouts!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

runMigration();
