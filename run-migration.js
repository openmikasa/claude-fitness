// Script to run database migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
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
    console.log('📖 Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'supabase/migrations/005_restrict_to_strength_only.sql'),
      'utf-8'
    );

    console.log('🚀 Running migration...\n');
    console.log('SQL:', migrationSQL);
    console.log();

    // Execute each SQL statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().includes('alter table')) {
        console.log('Executing:', statement.substring(0, 80) + '...');

        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });

        if (error) {
          console.error('❌ Statement failed:', error.message);
          // Try alternative approach using direct SQL
          console.log('Trying alternative method...');
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: statement + ';' })
          });

          if (!response.ok) {
            throw new Error(`Failed to execute: ${await response.text()}`);
          }
        }
      } else if (statement.toLowerCase().includes('drop index')) {
        console.log('Executing:', statement);
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });
        if (error && !error.message.includes('does not exist')) {
          console.warn('⚠️  Warning:', error.message);
        }
      } else if (statement.toLowerCase().includes('comment on')) {
        console.log('Executing:', statement.substring(0, 80) + '...');
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });
        if (error) {
          console.warn('⚠️  Warning (comment):', error.message);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📝 The workouts table now only accepts strength training workouts.');

  } catch (error) {
    console.error('\n❌ Error running migration:', error.message);
    console.error('\n💡 Manual migration required. Please run the SQL in Supabase SQL Editor:');
    console.error('   https://supabase.com/dashboard/project/eufogieqwgqdbadvqate/sql');
    process.exit(1);
  }
}

runMigration();
