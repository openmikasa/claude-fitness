import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import type {
  Workout,
  WorkoutListResponse,
  CreateWorkoutInput,
  UpdateWorkoutInput,
} from '@/types/workout';
import { OfflineQueue } from '@/lib/offline/queue';

// Query keys
export const workoutKeys = {
  all: ['workouts'] as const,
  lists: () => [...workoutKeys.all, 'list'] as const,
  list: (filters: WorkoutFilters) => [...workoutKeys.lists(), filters] as const,
  details: () => [...workoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutKeys.details(), id] as const,
};

// Filter types (weightlifting only)
export interface WorkoutFilters {
  date_from?: string;
  date_to?: string;
  search?: string;
  exercise_search?: string;
  equipment?: string[];
  muscle_groups?: string[];
  page?: number;
  pageSize?: number;
}

// API client functions
async function fetchWorkouts(
  filters: WorkoutFilters = {}
): Promise<WorkoutListResponse> {
  const params = new URLSearchParams();

  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);
  if (filters.exercise_search)
    params.append('exercise_search', filters.exercise_search);
  if (filters.equipment) {
    filters.equipment.forEach(eq => params.append('equipment', eq));
  }
  if (filters.muscle_groups) {
    filters.muscle_groups.forEach(mg => params.append('muscle_groups', mg));
  }
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

  const response = await fetch(`/api/workouts?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch workouts');
  }

  return response.json();
}

async function fetchWorkout(id: string): Promise<Workout> {
  const response = await fetch(`/api/workouts/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch workout');
  }

  return response.json();
}

async function createWorkout(input: CreateWorkoutInput): Promise<Workout> {
  // Check if offline
  if (typeof window !== 'undefined' && !navigator.onLine) {
    // Create temporary workout object for optimistic update
    const tempWorkout: Workout = {
      id: `temp-${Date.now()}`,
      user_id: 'pending',
      workout_type: 'weightlifting', // Always weightlifting
      workout_date: input.workout_date,
      data: input.data,
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to offline queue
    OfflineQueue.addToQueue({
      type: 'create',
      endpoint: '/api/workouts',
      data: input,
    });

    return tempWorkout;
  }

  const response = await fetch('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create workout');
  }

  return response.json();
}

async function updateWorkout(input: UpdateWorkoutInput): Promise<Workout> {
  const { id, ...updateData } = input;

  // Check if offline
  if (typeof window !== 'undefined' && !navigator.onLine) {
    // Add to offline queue
    OfflineQueue.addToQueue({
      type: 'update',
      endpoint: `/api/workouts/${id}`,
      data: updateData,
    });

    // Return optimistic result
    return {
      id,
      ...updateData,
      updated_at: new Date().toISOString(),
    } as Workout;
  }

  const response = await fetch(`/api/workouts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update workout');
  }

  return response.json();
}

async function deleteWorkout(id: string): Promise<void> {
  // Check if offline
  if (typeof window !== 'undefined' && !navigator.onLine) {
    // Add to offline queue
    OfflineQueue.addToQueue({
      type: 'delete',
      endpoint: `/api/workouts/${id}`,
    });
    return;
  }

  const response = await fetch(`/api/workouts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete workout');
  }
}

// Hook: Fetch workouts list with filters
export function useWorkouts(
  filters: WorkoutFilters = {}
): UseQueryResult<WorkoutListResponse, Error> {
  return useQuery({
    queryKey: workoutKeys.list(filters),
    queryFn: () => fetchWorkouts(filters),
  });
}

// Hook: Fetch single workout by ID
export function useWorkout(
  id: string | undefined
): UseQueryResult<Workout, Error> {
  return useQuery({
    queryKey: workoutKeys.detail(id || ''),
    queryFn: () => fetchWorkout(id!),
    enabled: !!id,
  });
}

// Hook: Create workout mutation
export function useCreateWorkout(): UseMutationResult<
  Workout,
  Error,
  CreateWorkoutInput,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkout,
    onSuccess: (newWorkout) => {
      // Invalidate all workout list queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });

      // Optionally, add the new workout to the cache
      queryClient.setQueryData(workoutKeys.detail(newWorkout.id), newWorkout);
    },
  });
}

// Hook: Update workout mutation
export function useUpdateWorkout(): UseMutationResult<
  Workout,
  Error,
  UpdateWorkoutInput,
  { previousWorkout: Workout | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkout,
    onMutate: async (updatedWorkout) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: workoutKeys.detail(updatedWorkout.id),
      });

      // Snapshot previous value
      const previousWorkout = queryClient.getQueryData<Workout>(
        workoutKeys.detail(updatedWorkout.id)
      );

      // Optimistically update to new value
      if (previousWorkout) {
        queryClient.setQueryData<Workout>(
          workoutKeys.detail(updatedWorkout.id),
          {
            ...previousWorkout,
            ...updatedWorkout,
          }
        );
      }

      return { previousWorkout };
    },
    onError: (err, updatedWorkout, context) => {
      // Rollback to previous value on error
      if (context?.previousWorkout) {
        queryClient.setQueryData(
          workoutKeys.detail(updatedWorkout.id),
          context.previousWorkout
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update the cache with the server response
      queryClient.setQueryData(workoutKeys.detail(variables.id), data);

      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
}

// Hook: Delete workout mutation
export function useDeleteWorkout(): UseMutationResult<
  void,
  Error,
  string,
  { previousWorkouts: WorkoutListResponse | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkout,
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: workoutKeys.lists() });

      // Snapshot previous value
      const previousWorkouts = queryClient.getQueryData<WorkoutListResponse>(
        workoutKeys.lists()
      );

      // Optimistically remove from all list queries
      queryClient.setQueriesData<WorkoutListResponse>(
        { queryKey: workoutKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            workouts: old.workouts.filter((workout) => workout.id !== deletedId),
            total: old.total - 1,
          };
        }
      );

      return { previousWorkouts };
    },
    onError: (err, deletedId, context) => {
      // Rollback to previous value on error
      if (context?.previousWorkouts) {
        queryClient.setQueryData(
          workoutKeys.lists(),
          context.previousWorkouts
        );
      }
    },
    onSuccess: (data, deletedId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: workoutKeys.detail(deletedId) });

      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
}
