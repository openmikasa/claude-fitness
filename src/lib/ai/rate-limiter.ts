import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

const MAX_REQUESTS_PER_DAY = 10;

/**
 * Check if user has exceeded daily rate limit for AI requests
 * @param userId User ID to check
 * @returns Object with isAllowed boolean and current count
 */
export async function checkRateLimit(
  userId: string
): Promise<{ isAllowed: boolean; currentCount: number; limit: number }> {
  const supabase = await createRouteHandlerClient();

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ai_requests')
    .select('request_count')
    .eq('user_id', userId)
    .eq('request_date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" - that's okay
    console.error('Error checking rate limit:', error);
    throw new Error('Failed to check rate limit');
  }

  const currentCount = data?.request_count || 0;
  const isAllowed = currentCount < MAX_REQUESTS_PER_DAY;

  return {
    isAllowed,
    currentCount,
    limit: MAX_REQUESTS_PER_DAY,
  };
}

/**
 * Increment AI request count for user (creates or updates record)
 * @param userId User ID
 * @returns New count after increment
 */
export async function incrementRequestCount(userId: string): Promise<number> {
  const supabase = await createRouteHandlerClient();

  // Use the database function for atomic upsert
  const { data, error } = await supabase.rpc('increment_ai_request_count', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error incrementing request count:', error);
    throw new Error('Failed to increment request count');
  }

  return data as number;
}
