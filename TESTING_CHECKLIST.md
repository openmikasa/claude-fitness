# Testing Checklist: Program Refresh & Workout Linking

## ⚙️ Setup
- [ ] Run migration: `supabase/migrations/012_link_workouts_to_programs.sql`
- [ ] Verify columns added to workouts table (program_id, program_day_index)
- [ ] Verify indexes created (idx_workouts_program_id, idx_workouts_program_progress)

## ✅ Test 1: Workout Linking
- [ ] Navigate to "Log Workout" page
- [ ] See "Following a Program?" dropdown
- [ ] Select a program day (e.g., "Week 1, Day 1")
- [ ] **Expected**: Date auto-fills, exercises pre-populate
- [ ] **Expected**: Shows "Pre-filled from: Week X, Day Y"
- [ ] Edit weight, add note like "felt easy"
- [ ] Submit workout
- [ ] **Verify**: Check database - workout has program_id and program_day_index

## ✅ Test 2: Completion Tracking
- [ ] Go to AI Programs page
- [ ] View active program
- [ ] **Expected**: Day with logged workout shows green checkmark ✓
- [ ] Log workout for another day
- [ ] Refresh page
- [ ] **Expected**: Both days now show checkmarks

## ✅ Test 3: Program Refresh
- [ ] Complete 2-3 workouts with varied notes:
  - "felt light"
  - "struggled on last set"
  - "perfect weight"
- [ ] Go to AI Programs page
- [ ] See "🔄 Refresh Program" button (next to "Generate New Plan")
- [ ] Click refresh button
- [ ] **Expected**: Button shows "Refreshing..."
- [ ] **Expected**: Modal appears after 10-20 seconds
- [ ] **Expected**: Modal shows:
  - Workouts analyzed count
  - Days regenerated count
  - Key adjustments (may be generic)
  - AI rationale (expandable)
- [ ] Close modal
- [ ] Reload page
- [ ] **Verify**: Future days may have updated weights
- [ ] **Verify**: Past days unchanged

## ✅ Test 4: Edge Cases
- [ ] Program with status='pending' - refresh button hidden
- [ ] Program with 0 workouts - refresh handles gracefully
- [ ] Log workout without selecting program - works as standalone
- [ ] Try 11 refreshes in 1 hour - should hit rate limit

## ✅ Test 5: Visual Checks
- [ ] Completed days have green background + checkmark
- [ ] Today's day has green border + "TODAY" badge
- [ ] Selected day has purple border
- [ ] Modal UI looks clean and professional
- [ ] Refresh button disabled during loading
- [ ] Program selector shows week/day/exercises clearly

## 🐛 Common Issues

**Refresh button not showing**
- Check program.status === 'active'
- Verify program exists in database

**Checkmarks not appearing**
- Verify program_id is set in workouts table
- Check useProgramWorkouts hook returns data
- Ensure program_day_index matches day in plan_data

**AI returns error**
- Check ANTHROPIC_API_KEY is set
- Verify prompt format in logs
- Check rate limit (10/hour per user)

**Auto-population not working**
- Verify ProgramDaySelector returns correct data
- Check setValue() calls in WorkoutForm
- Ensure program.plan_data has exercises

## ✅ Success Criteria

All tests passing = Ready for production! 🚀
