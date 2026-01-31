import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { OfflineQueue } from '@/lib/offline/queue';

export const settingsKeys = {
  all: ['settings'] as const,
  detail: () => [...settingsKeys.all, 'detail'] as const,
};

export interface Settings {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
}

async function fetchSettings(): Promise<Settings> {
  const response = await fetch('/api/settings', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
}

async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  // Offline support
  if (typeof window !== 'undefined' && !navigator.onLine) {
    if (settings.units) localStorage.setItem('units', settings.units);
    if (settings.theme) localStorage.setItem('theme', settings.theme);

    OfflineQueue.addToQueue({
      type: 'update',
      endpoint: '/api/settings',
      data: settings,
    });

    return {
      units: settings.units || 'metric',
      theme: settings.theme || 'auto',
    };
  }

  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
    credentials: 'include',
  });

  if (!response.ok) throw new Error('Failed to update settings');

  const data = await response.json();

  // Sync to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('units', data.units);
    localStorage.setItem('theme', data.theme);
  }

  return data;
}

export function useSettings(): UseQueryResult<Settings, Error> {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSettings(): UseMutationResult<
  Settings,
  Error,
  Partial<Settings>,
  { previous: Settings | undefined }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.detail() });
      const previous = queryClient.getQueryData<Settings>(settingsKeys.detail());

      queryClient.setQueryData<Settings>(settingsKeys.detail(), (old) => ({
        ...old,
        ...newSettings,
      } as Settings));

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.detail(), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.detail(), data);
    },
  });
}
