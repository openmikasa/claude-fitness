import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';

export const promptHistoryKeys = {
  all: ['promptHistory'] as const,
  list: () => [...promptHistoryKeys.all, 'list'] as const,
};

export interface PromptHistoryEntry {
  id: string;
  user_id: string;
  prompt: string;
  program_weeks: number;
  label?: string | null;
  created_at: string;
}

interface SavePromptData {
  prompt: string;
  programWeeks: number;
  label?: string;
}

async function fetchPromptHistory(): Promise<PromptHistoryEntry[]> {
  const response = await fetch('/api/prompt-history', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch prompt history');
  return response.json();
}

async function savePrompt(data: SavePromptData): Promise<PromptHistoryEntry> {
  const response = await fetch('/api/prompt-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to save prompt');
  return response.json();
}

async function deletePrompt(id?: string): Promise<void> {
  const url = id ? `/api/prompt-history?id=${id}` : '/api/prompt-history';
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to delete prompt');
}

/**
 * Fetch user's prompt history (last 10 entries, newest first)
 */
export function usePromptHistory(): UseQueryResult<PromptHistoryEntry[], Error> {
  return useQuery({
    queryKey: promptHistoryKeys.list(),
    queryFn: fetchPromptHistory,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Save a new prompt to history
 */
export function useSavePrompt(): UseMutationResult<
  PromptHistoryEntry,
  Error,
  SavePromptData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptHistoryKeys.list() });
    },
  });
}

/**
 * Delete prompt(s) from history
 * Pass id to delete specific entry, or omit to delete all
 */
export function useDeletePrompt(): UseMutationResult<
  void,
  Error,
  string | undefined
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptHistoryKeys.list() });
    },
  });
}

/**
 * Format timestamp for display in dropdown.
 * Example: "Jan 15, 2024"
 */
export function formatHistoryTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generate a user-friendly label for a history entry.
 * Uses custom label if available, otherwise generates from programWeeks.
 */
export function getHistoryLabel(entry: PromptHistoryEntry): string {
  if (entry.label) return entry.label;
  return `${entry.program_weeks}-Week Program`;
}
