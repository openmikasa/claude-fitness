-- Create user_prompt_history table for saving program generation prompts
CREATE TABLE IF NOT EXISTS user_prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  program_weeks integer NOT NULL CHECK (program_weeks >= 1 AND program_weeks <= 12),
  label text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for efficient user queries (sorted by created_at DESC)
CREATE INDEX IF NOT EXISTS idx_user_prompt_history_user_created
ON user_prompt_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE user_prompt_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own prompt history

-- SELECT: Users can view their own history
CREATE POLICY "Users can view their own prompt history"
ON user_prompt_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can create their own history entries
CREATE POLICY "Users can create their own prompt history"
ON user_prompt_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own history entries
CREATE POLICY "Users can delete their own prompt history"
ON user_prompt_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- UPDATE: Users can update their own history entries (for custom labels)
CREATE POLICY "Users can update their own prompt history"
ON user_prompt_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
