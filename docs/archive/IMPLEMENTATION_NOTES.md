# Implementation Notes & Technical Decisions

Technical deep-dive into why specific architectural patterns were chosen and lessons learned during implementation.

→ **For what was built, see [HISTORY.md](HISTORY.md)**
→ **For complete architecture, see [../architecture.md](../architecture.md)**

---

## Why Dual-Write Pattern?

**Problem**: Need normalized tables without breaking 1000+ existing JSONB workouts.

**Decision**: Write to both JSONB and junction table. Read from either.

**Why this approach**:
- ✅ Zero downtime
- ✅ No breaking changes
- ✅ Users migrate at their own pace
- ✅ Original data preserved

**Code Pattern**:
```typescript
// Write: Both formats
await createWorkout(jsonbData)
await createJunctionRecords(normalizedData)

// Read: Helper abstracts source
function getExercises(workout) {
  return workout.workout_exercises || workout.data.exercises
}
```

**Alternative rejected**: "Big bang" migration - too risky for production data.

---

## Why GIN Indexes?

**Problem**: Array containment queries on equipment/muscle_groups were slow.

**Decision**: Add GIN indexes for array columns.

**Performance Impact**:
```sql
-- Without GIN: Seq Scan, 450ms (10k rows)
-- With GIN: Index Scan, 12ms (10k rows)
```

**Takeaway**: Always use GIN indexes for array columns that will be filtered.

---

## Why Optimistic Updates?

**Problem**: Users experienced lag when saving settings (500ms wait).

**Decision**: React Query optimistic updates.

**User Experience**:
```
Before: Click Save → Wait 500ms → UI updates
After:  Click Save → UI updates instantly → Server confirms in background
```

**Tradeoff**: More complex rollback logic, but 10x better perceived performance.

---

## Why NOT Auto-Migrate?

**Initial approach**: Auto-migrate workouts on first edit.

**Problem**: Users lost trust in data accuracy - feared silent changes.

**Better approach**: Optional UI wizard with progress tracking.

**Result**: Users migrate at their own pace and verify data.

**Lesson**: Give users control over data changes, even if slower.

---

## Why Offline Queue?

**Problem**: Network failures broke settings updates.

**Decision**: Queue mutations in localStorage, sync when online.

**Pattern**:
```typescript
class OfflineQueue {
  enqueue(mutation) { /* localStorage */ }
  sync() { /* execute when online */ }
}

window.addEventListener('online', () => queue.sync())
```

**Benefit**: Works without internet, no data loss.

---

## Why Helper Functions for Backward Compatibility?

**Without helpers** (bad):
```typescript
// Every component checks migration status
const exercises = workout.workout_exercises?.length > 0
  ? workout.workout_exercises
  : workout.data.exercises
```

**With helpers** (good):
```typescript
// Single source of truth
const exercises = getWorkoutExercises(workout)
```

**Benefit**: Components don't need to know about migration. Easier to refactor later.

---

## Why Gradual Migration UI?

**Design Principles**:
1. **Non-destructive** - Original JSONB untouched
2. **Optional** - Users can skip entirely
3. **Gradual** - One workout at a time
4. **Resumable** - Stop and continue later
5. **Informative** - Progress and remaining count

**Why not bulk "Migrate All"?**
- Users want to verify accuracy
- Prevents overwhelming UI
- Allows learning the new format

**Future**: Could add "Migrate All" for power users.

---

## Why Structured Query Keys?

**Bad**:
```typescript
['workouts'] // Invalidates ALL workout queries
```

**Good**:
```typescript
workoutKeys.list(filters) // Invalidates only this filter
workoutKeys.detail(id)    // Invalidates only this workout
```

**Benefit**: Precise cache management. Don't refetch unrelated data.

---

## Key Lessons Learned

### 1. Progressive Enhancement > Breaking Changes

Avoid "big bang" migrations:
- ❌ Drop old schema → migrate all data → deploy new schema
- ✅ Add new schema → dual-write → gradual migration → drop old later

### 2. Show Progress for Long Operations

```
Without: "Migrating workouts..." (user waits, anxious)
With:    "Workout 12 of 47" (user knows exactly where they are)
```

Progress indicators reduce abandonment.

### 3. Helper Functions Centralize Compatibility

Abstraction layers make refactoring safer. One place to update, not scattered across components.

### 4. GIN Indexes Critical for Arrays

Always add GIN indexes when filtering array columns with `@>` operator.

### 5. Optimistic Updates Feel 10x Faster

Worth the complexity for better UX. Users notice instant feedback.

---

## Deployment Considerations

### Before Production

1. **Backup database** - Always
2. **Run tests** - All Playwright tests must pass
3. **Performance check** - Verify indexes used (not seq scan)
4. **RLS testing** - Create second user, verify isolation

### Rollback Strategy

If critical issues:
1. Revert application code
2. Drop new tables (preserves original JSONB)
3. Restore from backup (last resort)

**Note**: Original JSONB data survives even if junction table dropped.

---

## Future Enhancements

### Auto-Migration on Edit
- Automatically migrate when user edits workout
- Less intrusive than wizard

### Bulk Migration
- "Migrate All" button for power users
- Background job with notification

### Equipment Analytics
- "You use barbells 80% of the time"
- Suggest equipment purchases based on usage

### Muscle Group Balance
- Chart showing distribution
- Warn if imbalanced (e.g., chest 2x more than back)

---

*This document focuses on WHY decisions were made. For WHAT was built, see [HISTORY.md](HISTORY.md). For HOW to implement, see [../architecture.md](../architecture.md).*
