# Apply Database Migrations to Production

This guide will help you apply the pending migrations (008, 009, 010) to your production Supabase database.

## Option 1: Supabase Dashboard (Recommended - Easiest)

### Step 1: Apply Migration 008 (URGENT - Fixes Custom Exercise Creation)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your `claude-fitness` project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration 008**
   - Open `supabase/migrations/008_add_user_specific_exercises.sql`
   - Copy the ENTIRE contents

4. **Run Migration**
   - Paste into the SQL Editor
   - Click "Run" button
   - Should see: "Success. No rows returned"

5. **Verify**
   - Run this query in SQL Editor:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'exercises' AND column_name = 'user_id';
   ```
   - Should return one row showing `user_id` column exists

### Step 2: Apply Migration 009 (Adds Primary/Secondary Muscles)

1. **New Query in SQL Editor**
   - Click "New Query" again

2. **Copy Migration 009**
   - Open `supabase/migrations/009_split_muscle_groups.sql`
   - Copy the ENTIRE contents

3. **Run Migration**
   - Paste into the SQL Editor
   - Click "Run"
   - Should see: "Success. No rows returned"

4. **Verify**
   - Run this query:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'exercises'
   AND column_name IN ('primary_muscles', 'secondary_muscles');
   ```
   - Should return TWO rows

### Step 3: Apply Migration 010 (Fixes Exercise Data)

1. **New Query in SQL Editor**

2. **Copy Migration 010**
   - Open `supabase/migrations/010_fix_exercise_muscle_data.sql`
   - Copy the ENTIRE contents

3. **Run Migration**
   - Paste into the SQL Editor
   - Click "Run"
   - Should see: "Success. No rows returned"

4. **Verify Data**
   - Run this query:
   ```sql
   SELECT name, primary_muscles, secondary_muscles
   FROM exercises
   WHERE name = 'Bench Press';
   ```
   - Should return:
     - `primary_muscles`: `{chest,triceps,shoulders}`
     - `secondary_muscles`: `{core}`

### Step 4: Test in Production

1. **Go to your app**: https://claude-fitness.vercel.app/
2. **Log in**
3. **Test Custom Exercise Creation**:
   - Go to workout creation or bulk migration
   - Try to create a custom exercise
   - Should succeed (previously failed with "Failed to create exercise")
4. **Check Exercise Display**:
   - Exercises should now show accurate muscle groups

---

## Option 2: Supabase CLI (For Advanced Users)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply all pending migrations
supabase db push --linked
```

---

## Rollback Instructions (If Needed)

If you encounter issues, you can rollback:

```sql
-- Rollback 010 & 009 (safe - doesn't delete data)
ALTER TABLE exercises DROP COLUMN IF EXISTS primary_muscles;
ALTER TABLE exercises DROP COLUMN IF EXISTS secondary_muscles;

-- Rollback 008 (careful - removes user exercise support)
ALTER TABLE exercises DROP COLUMN IF EXISTS user_id;
-- Re-create old policies (see migration 008 for details)
```

---

## Expected Results After All Migrations

✅ Custom exercises can be created (migration 008)
✅ Exercises have primary_muscles and secondary_muscles columns (migration 009)
✅ All ~150 exercises have accurate muscle data (migration 010)
✅ UI shows separate primary/secondary muscle groups
✅ Backward compatibility maintained

---

## Need Help?

If you encounter any errors during migration:
1. Copy the error message
2. Check which migration step failed
3. You can DM me the error for troubleshooting
