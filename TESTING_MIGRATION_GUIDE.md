# Testing & Migration Guide

This guide covers testing and deploying the Settings Persistence & Advanced Filtering features.

## Prerequisites

Before testing or deploying:

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Install Playwright** (for automated testing):
   ```bash
   npx playwright install
   ```

3. **Ensure Supabase is running**:
   - Local development: `supabase start`
   - Or connected to remote Supabase project

## Database Migration

### Step 1: Apply Migrations

**Local Development:**
```bash
# Reset database and apply all migrations
supabase db reset

# Or apply new migrations only
supabase db push
```

**Production:**
```bash
# Push migrations to remote database
supabase db push --linked
```

### Step 2: Verify Migrations

Check that the new tables and columns exist:

```sql
-- Check profiles table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('units', 'theme');

-- Check workout_exercises table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'workout_exercises';

-- Check exercises table has equipment column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercises'
AND column_name = 'equipment';

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'workout_exercises';
```

## Manual Testing Workflow

### 1. Settings Persistence

**Test Units & Theme Storage:**

1. Navigate to http://localhost:3000/settings
2. Change units to "Imperial"
3. Change theme to "Dark"
4. Click "Save Preferences"
5. Open browser DevTools → Network tab
6. Verify PUT request to `/api/settings` returns 200
7. Refresh the page
8. **Expected:** Units and theme should persist

**Test Offline Mode:**

1. Open DevTools → Network tab → Set to "Offline"
2. Change settings and click Save
3. **Expected:** Settings save to localStorage
4. Go back online
5. **Expected:** Settings sync to database

**Test Cross-Device Sync:**

1. Change settings in one browser
2. Open same account in different browser/tab
3. Navigate to settings page
4. **Expected:** Settings match across browsers

### 2. Advanced Filtering

**Test Equipment Filter:**

1. Navigate to http://localhost:3000/workouts
2. Click "Equipment" dropdown
3. Select "Barbell"
4. **Expected:** Only workouts using barbell equipment shown
5. Verify filter chip appears: "Equipment: Barbell"
6. Click X on chip to clear
7. **Expected:** All workouts shown again

**Test Muscle Group Filter:**

1. Click "Muscle Groups" dropdown
2. Select "Chest"
3. **Expected:** Only workouts targeting chest shown
4. Verify filter chip appears: "Muscles: Chest"

**Test Combined Filters:**

1. Select Equipment: "Barbell"
2. Select Muscle Groups: "Chest"
3. Select Workout Type: "Strength"
4. **Expected:** Only strength workouts using barbell for chest exercises
5. Click "Clear All" button
6. **Expected:** All filters reset

### 3. New Workout Creation

**Test Creating Workout with Equipment:**

1. Navigate to http://localhost:3000/workouts/log
2. Select "Strength" workout type
3. In exercise name field, type "Bench"
4. **Expected:** Autocomplete dropdown appears with "Bench Press"
5. Select "Bench Press" from dropdown
6. **Expected:** Equipment auto-populates with "Barbell, Rack"
7. **Expected:** Muscle groups auto-populate with relevant muscles
8. Add weight and reps for a set
9. Click "Save Workout"
10. **Expected:** Workout created successfully
11. Go to workouts list and open the new workout
12. **Expected:** Equipment and muscle group tags visible

### 4. Backfill System

**Test Backfill Detection:**

1. Navigate to http://localhost:3000 (dashboard)
2. If you have old strength workouts without equipment data:
   - **Expected:** Blue banner appears: "Enhance Your Workout Data"
   - **Expected:** Banner shows count of unmigrated workouts
3. If no unmigrated workouts:
   - **Expected:** No banner shown

**Test Backfill Modal:**

1. Click "Start Migration" button on banner
2. **Expected:** Modal opens showing first unmigrated workout
3. **Expected:** Progress indicator shows "Workout 1 of X"
4. For each exercise:
   - Search and link to exercise database
   - **Expected:** When exercise selected, equipment pre-fills
   - Select equipment used
   - Select muscle groups
5. Click "Save & Next"
6. **Expected:** Modal advances to next workout
7. Complete all workouts or click "Skip This Workout"
8. **Expected:** When done, modal closes and banner disappears

### 5. Backward Compatibility

**Test Old Workout Display:**

1. If you have old workouts (before migration):
   - Navigate to workouts list
   - Open an old workout
   - **Expected:** Workout displays correctly (no errors)
   - **Expected:** No equipment/muscle tags shown (graceful degradation)
2. After migrating old workout:
   - Open same workout again
   - **Expected:** Equipment and muscle tags now visible

## Automated Testing (Playwright)

### Running Tests

**Start dev server:**
```bash
npm run dev
```

**In a new terminal, run Playwright tests:**
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/settings-and-filters.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

### Test Coverage

The test suite covers:

- ✅ Settings persistence (units & theme)
- ✅ Settings sync across tabs
- ✅ Equipment filtering
- ✅ Muscle group filtering
- ✅ Combined filters
- ✅ New workout creation with equipment
- ✅ Backfill banner detection
- ✅ Backfill modal workflow
- ✅ Backward compatibility

### Setting Up Test Data

For comprehensive testing, ensure your test account has:

1. **At least 5 strength workouts** (mix of old and new format)
2. **Workouts with different equipment** (barbell, dumbbell, bodyweight)
3. **Workouts targeting different muscle groups**

You can create test workouts via:
```bash
# Import sample data (if import feature exists)
# Or manually create through UI
# Or seed via SQL
```

## Performance Testing

### Database Query Performance

Test with 100+ workouts to verify indexes work:

```sql
-- Should use idx_workout_exercises_workout_id
EXPLAIN ANALYZE
SELECT * FROM workout_exercises WHERE workout_id = 'some-uuid';

-- Should use GIN index
EXPLAIN ANALYZE
SELECT * FROM exercises WHERE equipment @> ARRAY['Barbell'];

-- Should use GIN index
EXPLAIN ANALYZE
SELECT * FROM exercises WHERE muscle_groups @> ARRAY['Chest'];
```

**Expected:** Query plans should show "Index Scan" not "Seq Scan"

### Frontend Performance

1. Open workouts page with filters applied
2. Open DevTools → Performance tab
3. Record while changing filters
4. **Expected:** Filter updates < 500ms
5. **Expected:** No memory leaks on repeated filtering

## Deployment Checklist

Before deploying to production:

- [ ] All migrations applied successfully
- [ ] Manual tests pass for all features
- [ ] Playwright tests pass (100%)
- [ ] Performance tests show acceptable query times
- [ ] RLS policies verified (users can only see their own data)
- [ ] Backup database before deployment
- [ ] Test rollback procedure

### Migration Rollback (Emergency)

If issues arise after deployment:

```sql
-- Rollback workout_exercises table
DROP TABLE IF EXISTS public.workout_exercises;

-- Rollback exercises.equipment column
ALTER TABLE public.exercises DROP COLUMN IF EXISTS equipment;

-- Rollback profiles settings columns
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS units,
  DROP COLUMN IF EXISTS theme;
```

**Note:** This will lose any data in junction table but preserve original JSONB data.

## Common Issues & Solutions

### Issue: Filters not working

**Symptom:** Selecting equipment filter shows no results

**Solution:**
1. Check browser console for errors
2. Verify API response in Network tab
3. Ensure database has workout_exercises records
4. Check if workouts have been migrated

### Issue: Autocomplete not showing exercises

**Symptom:** Typing exercise name shows "No exercises found"

**Solution:**
1. Verify `/api/exercises` endpoint returns data
2. Check database has exercises table populated
3. Ensure search query length ≥ 2 characters

### Issue: Backfill modal shows 0 workouts

**Symptom:** Banner appears but modal shows no workouts

**Solution:**
1. Check `/api/workouts/unmigrated-count` response
2. Verify strength workouts exist without workout_exercises
3. Check browser console for errors

## Support

For issues or questions:
- Check CLAUDE.md for project-specific guidance
- Review API responses in Network tab
- Check Supabase logs for database errors
- Verify RLS policies are not blocking queries
