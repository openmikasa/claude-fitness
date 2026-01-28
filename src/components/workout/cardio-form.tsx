'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CardioData, CardioType } from '@/types/workout';
import { useMemo } from 'react';

// Zod validation schema
const cardioSchema = z.object({
  type: z.enum(['running', 'cycling', 'swimming', 'rowing'], {
    errorMap: () => ({ message: 'Please select a cardio type' }),
  }),
  time_minutes: z
    .number({
      required_error: 'Time is required',
      invalid_type_error: 'Time must be a number',
    })
    .positive('Time must be greater than 0')
    .max(1440, 'Time cannot exceed 24 hours'),
  distance_km: z
    .number({
      invalid_type_error: 'Distance must be a number',
    })
    .positive('Distance must be greater than 0')
    .optional()
    .or(z.literal(undefined)),
});

type CardioFormData = z.infer<typeof cardioSchema>;

interface CardioFormProps {
  onSubmit: (data: CardioData) => void;
  initialData?: CardioData;
}

export default function CardioForm({ onSubmit, initialData }: CardioFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CardioFormData>({
    resolver: zodResolver(cardioSchema),
    defaultValues: initialData || {
      type: 'running',
      time_minutes: undefined,
      distance_km: undefined,
    },
  });

  const timeMinutes = watch('time_minutes');
  const distanceKm = watch('distance_km');

  // Calculate pace when both time and distance are provided
  const pace = useMemo(() => {
    if (!timeMinutes || !distanceKm || timeMinutes <= 0 || distanceKm <= 0) {
      return null;
    }

    const paceMinutesPerKm = timeMinutes / distanceKm;
    const minutes = Math.floor(paceMinutesPerKm);
    const seconds = Math.round((paceMinutesPerKm - minutes) * 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }, [timeMinutes, distanceKm]);

  const handleFormSubmit = (data: CardioFormData) => {
    const cardioData: CardioData = {
      type: data.type,
      time_minutes: data.time_minutes,
      distance_km: data.distance_km,
      pace: pace || undefined,
    };

    onSubmit(cardioData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Cardio Type Selector */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Cardio Type
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
        >
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
          <option value="swimming">Swimming</option>
          <option value="rowing">Rowing</option>
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Time Input */}
      <div>
        <label
          htmlFor="time_minutes"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Time (minutes)
        </label>
        <input
          id="time_minutes"
          type="number"
          step="0.1"
          {...register('time_minutes', { valueAsNumber: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
          placeholder="Enter duration in minutes"
        />
        {errors.time_minutes && (
          <p className="mt-1 text-sm text-red-600">
            {errors.time_minutes.message}
          </p>
        )}
      </div>

      {/* Distance Input */}
      <div>
        <label
          htmlFor="distance_km"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Distance (km) - Optional
        </label>
        <input
          id="distance_km"
          type="number"
          step="0.01"
          {...register('distance_km', {
            valueAsNumber: true,
            setValueAs: (v) => v === '' || v === null ? undefined : Number(v)
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
          placeholder="Enter distance in kilometers"
        />
        {errors.distance_km && (
          <p className="mt-1 text-sm text-red-600">
            {errors.distance_km.message}
          </p>
        )}
      </div>

      {/* Pace Display */}
      {pace && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Calculated Pace
            </span>
            <span className="text-lg font-bold text-blue-700">{pace}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
      >
        {isSubmitting ? 'Saving...' : 'Save Cardio Workout'}
      </button>
    </form>
  );
}
