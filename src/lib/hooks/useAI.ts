import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import type { Program } from '@/types/workout';

// Query keys
export const aiKeys = {
  all: ['ai'] as const,
  programs: () => [...aiKeys.all, 'programs'] as const,
  program: (id: string) => [...aiKeys.all, 'program', id] as const,
};

// API client functions
async function generateNextSession(): Promise<Program> {
  const response = await fetch('/api/ai/next-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to generate next session');
  }

  return response.json();
}

async function generateWeeklyPlan(params?: { customPrompt?: string; programWeeks?: number }): Promise<Program> {
  const response = await fetch('/api/ai/weekly-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to generate weekly plan');
  }

  return response.json();
}

async function fetchPrograms(
  filters: { status?: string; program_type?: string } = {}
): Promise<Program[]> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.program_type) params.append('program_type', filters.program_type);

  const response = await fetch(`/api/programs?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch programs');
  }

  return response.json();
}

async function fetchProgram(id: string): Promise<Program> {
  const response = await fetch(`/api/programs/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch program');
  }

  return response.json();
}

async function updateProgramStatus(input: {
  id: string;
  status: 'pending' | 'active' | 'completed';
}): Promise<Program> {
  const { id, status } = input;
  const response = await fetch(`/api/programs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update program');
  }

  return response.json();
}

async function deleteProgram(id: string): Promise<void> {
  const response = await fetch(`/api/programs/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete program');
  }
}

// Hooks
export function useGenerateNextSession(): UseMutationResult<
  Program,
  Error,
  void,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateNextSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.programs() });
    },
  });
}

export function useGenerateWeeklyPlan(): UseMutationResult<
  Program,
  Error,
  { customPrompt?: string; programWeeks?: number } | undefined,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => generateWeeklyPlan(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.programs() });
    },
  });
}

export function usePrograms(
  filters: { status?: string; program_type?: string } = {}
): UseQueryResult<Program[], Error> {
  return useQuery({
    queryKey: [...aiKeys.programs(), filters],
    queryFn: () => fetchPrograms(filters),
  });
}

export function useProgram(id: string | undefined): UseQueryResult<Program, Error> {
  return useQuery({
    queryKey: aiKeys.program(id || ''),
    queryFn: () => fetchProgram(id!),
    enabled: !!id,
  });
}

export function useUpdateProgramStatus(): UseMutationResult<
  Program,
  Error,
  { id: string; status: 'pending' | 'active' | 'completed' },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProgramStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(aiKeys.program(data.id), data);
      queryClient.invalidateQueries({ queryKey: aiKeys.programs() });
    },
  });
}

export function useDeleteProgram(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProgram,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: aiKeys.program(deletedId) });
      queryClient.invalidateQueries({ queryKey: aiKeys.programs() });
    },
  });
}
