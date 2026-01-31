import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CsvRow, CsvMapping, CsvValidationError } from '@/types/import';
import { workoutKeys } from './useWorkouts';

interface ImportInput {
  rows: CsvRow[];
  mapping: CsvMapping;
  filename: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: CsvValidationError[];
  batchId: string;
}

async function importWorkouts(input: ImportInput): Promise<ImportResult> {
  const response = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import workouts');
  }

  return response.json();
}

export function useImportWorkouts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importWorkouts,
    onSuccess: () => {
      // Invalidate all workout queries to refetch with imported data
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}
