'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SaunaData } from '@/types/workout';

const saunaSchema = z.object({
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').max(180, 'Duration cannot exceed 180 minutes'),
  temperature_celsius: z.number().min(40, 'Temperature must be at least 40°C').max(120, 'Temperature cannot exceed 120°C').optional().or(z.literal('')),
});

type SaunaFormData = z.infer<typeof saunaSchema>;

interface SaunaFormProps {
  onSubmit: (data: SaunaData) => void;
  initialData?: SaunaData;
}

export function SaunaForm({ onSubmit, initialData }: SaunaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SaunaFormData>({
    resolver: zodResolver(saunaSchema),
    defaultValues: initialData || {
      duration_minutes: undefined,
      temperature_celsius: '',
    },
  });

  const handleFormSubmit = (data: SaunaFormData) => {
    const submissionData: SaunaData = {
      duration_minutes: data.duration_minutes,
      temperature_celsius: data.temperature_celsius === '' ? undefined : data.temperature_celsius,
    };
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="duration" className="block text-sm font-medium text-foreground">
          Duration (minutes) *
        </label>
        <input
          id="duration"
          type="number"
          {...register('duration_minutes', { valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
          placeholder="e.g., 20"
        />
        {errors.duration_minutes && (
          <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="temperature" className="block text-sm font-medium text-foreground">
          Temperature (°C)
        </label>
        <input
          id="temperature"
          type="number"
          {...register('temperature_celsius', {
            setValueAs: (v) => v === '' ? '' : parseFloat(v)
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
          placeholder="e.g., 80"
        />
        {errors.temperature_celsius && (
          <p className="text-sm text-red-600">{errors.temperature_celsius.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Save Sauna Session
      </button>
    </form>
  );
}
