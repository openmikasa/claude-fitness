-- Add settings columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto'));

-- Set defaults for existing rows
UPDATE public.profiles
  SET units = 'metric', theme = 'auto'
  WHERE units IS NULL OR theme IS NULL;
