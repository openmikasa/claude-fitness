-- Migration 008: Add User-Specific Exercises
-- Purpose: Allow users to create their own custom exercises that only they can see
-- Global exercises have user_id = NULL, user-specific have user_id set

-- Step 1: Add user_id column to exercises table
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON public.exercises(user_id);

-- Step 3: Update RLS policies to support user-specific exercises

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can delete exercises" ON public.exercises;

-- New SELECT policy: Users can see global exercises + their own
CREATE POLICY "Users can view global and own exercises" ON public.exercises
  FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- New INSERT policy: Users can create their own exercises
CREATE POLICY "Users can create own exercises" ON public.exercises
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- New UPDATE policy: Users can only update their own exercises
CREATE POLICY "Users can update own exercises" ON public.exercises
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- New DELETE policy: Users can only delete their own exercises
CREATE POLICY "Users can delete own exercises" ON public.exercises
  FOR DELETE
  USING (user_id = auth.uid());

-- Step 4: Add unique constraint for user-specific exercises
-- Global exercises: unique by name where user_id IS NULL
-- User exercises: unique by (user_id, name) combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_global_unique
  ON public.exercises(LOWER(name))
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_user_unique
  ON public.exercises(user_id, LOWER(name))
  WHERE user_id IS NOT NULL;

-- Note: This replaces the simple unique constraint on name
-- The original constraint will conflict, so we need to drop it if it exists
DO $$
BEGIN
  -- Try to drop the old unique constraint if it exists
  ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_name_key;
EXCEPTION
  WHEN OTHERS THEN
    -- If constraint doesn't exist or has different name, continue
    NULL;
END $$;
