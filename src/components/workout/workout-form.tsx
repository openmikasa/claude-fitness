'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StrengthForm from './strength-form';
import CardioForm from './cardio-form';
import { SaunaForm } from './sauna-form';
import { MobilityForm } from './mobility-form';
import type {
  WorkoutType,
  StrengthData,
  CardioData,
  SaunaData,
  MobilityData,
  CreateWorkoutInput,
  Workout,
} from '@/types/workout';

type Toast = {
  message: string;
  type: 'success' | 'error';
};

interface WorkoutFormProps {
  initialData?: Workout;
  workoutId?: string;
  onSuccess?: () => void;
}

export default function WorkoutForm({ initialData, workoutId, onSuccess }: WorkoutFormProps) {
  const router = useRouter();
  const [workoutType, setWorkoutType] = useState<WorkoutType>(
    initialData?.workout_type || 'strength'
  );
  const [workoutDate, setWorkoutDate] = useState<string>(
    initialData?.workout_date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleWorkoutDataSubmit = async (
    data: StrengthData | CardioData | SaunaData | MobilityData
  ) => {
    setIsSubmitting(true);

    try {
      const workoutInput: CreateWorkoutInput = {
        workout_type: workoutType,
        workout_date: workoutDate,
        data,
        notes: notes.trim() || undefined,
      };

      const url = workoutId ? `/api/workouts/${workoutId}` : '/api/workouts';
      const method = workoutId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workout');
      }

      const workout: Workout = await response.json();
      showToast(
        workoutId ? 'Workout updated successfully!' : 'Workout saved successfully!',
        'success'
      );

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/workouts');
        }
      }, 1500);
    } catch (error) {
      console.error('Error saving workout:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to save workout',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-opacity ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white hover:text-gray-200"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {workoutId ? 'Edit Workout' : 'Log Workout'}
        </h1>
        <p className="text-gray-600">
          {workoutId
            ? 'Update your workout details'
            : 'Track your fitness progress by logging your workouts'}
        </p>
      </div>

      {/* Workout Type Selector */}
      <div className="mb-6">
        <label
          htmlFor="workoutType"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Workout Type
        </label>
        <select
          id="workoutType"
          value={workoutType}
          onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base bg-white"
        >
          <option value="strength">Strength Training</option>
          <option value="cardio">Cardio</option>
          <option value="sauna">Sauna Session</option>
          <option value="mobility">Mobility & Stretching</option>
        </select>
      </div>

      {/* Date Picker */}
      <div className="mb-6">
        <label
          htmlFor="workoutDate"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Workout Date
        </label>
        <input
          id="workoutDate"
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
        />
      </div>

      {/* Conditional Form Rendering */}
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {workoutType === 'strength' && 'Strength Workout Details'}
            {workoutType === 'cardio' && 'Cardio Workout Details'}
            {workoutType === 'sauna' && 'Sauna Session Details'}
            {workoutType === 'mobility' && 'Mobility Session Details'}
          </h2>

          {workoutType === 'strength' && (
            <StrengthForm
              onSubmit={handleWorkoutDataSubmit}
              initialData={
                initialData?.workout_type === 'strength'
                  ? (initialData.data as StrengthData)
                  : undefined
              }
            />
          )}
          {workoutType === 'cardio' && (
            <CardioForm
              onSubmit={handleWorkoutDataSubmit}
              initialData={
                initialData?.workout_type === 'cardio'
                  ? (initialData.data as CardioData)
                  : undefined
              }
            />
          )}
          {workoutType === 'sauna' && (
            <SaunaForm
              onSubmit={handleWorkoutDataSubmit}
              initialData={
                initialData?.workout_type === 'sauna'
                  ? (initialData.data as SaunaData)
                  : undefined
              }
            />
          )}
          {workoutType === 'mobility' && (
            <MobilityForm
              onSubmit={handleWorkoutDataSubmit}
              initialData={
                initialData?.workout_type === 'mobility'
                  ? (initialData.data as MobilityData)
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Notes Field */}
      <div className="mb-6">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add any additional notes about your workout..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base resize-none"
        />
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">
              {workoutId ? 'Updating workout...' : 'Saving workout...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
