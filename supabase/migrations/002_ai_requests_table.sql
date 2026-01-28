-- Migration: Add AI requests tracking table for rate limiting
-- Phase 5: AI Integration

-- AI requests table (for rate limiting)
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, request_date)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_date ON public.ai_requests(user_id, request_date);

-- Row Level Security
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI requests"
  ON public.ai_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI requests"
  ON public.ai_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI requests"
  ON public.ai_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for ai_requests updated_at
CREATE TRIGGER update_ai_requests_updated_at
  BEFORE UPDATE ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment AI request count (upsert pattern)
CREATE OR REPLACE FUNCTION increment_ai_request_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.ai_requests (user_id, request_date, request_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, request_date)
  DO UPDATE SET 
    request_count = ai_requests.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_count;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
