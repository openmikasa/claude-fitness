'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WeightliftingForm from './weightlifting-form';
import ProgramDaySelector from './program-day-selector';
import type {
  WeightliftingData,
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
  const [workoutDate, setWorkoutDate] = useState<string>(
    initialData?.workout_date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [programSelection, setProgramSelection] = useState<{
    programId: string;
    dayIndex: number;
    exercises: WeightliftingData;
  } | null>(null);
  const [workoutData, setWorkoutData] = useState<WeightliftingData | undefined>(
    initialData?.data
  );

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleWorkoutDataSubmit = async (data: WeightliftingData) => {
    setIsSubmitting(true);

    try {
      const workoutInput: CreateWorkoutInput = {
        workout_date: workoutDate,
        data, // Always WeightliftingData
        notes: notes.trim() || undefined,
        program_id: programSelection?.programId,
        program_day_index: programSelection?.dayIndex,
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
            : 'Track your weightlifting progress'}
        </p>
      </div>

      {/* Program Day Selector - Only show when creating new workout */}
      {!workoutId && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Following a Program? (Optional)
          </label>
          <ProgramDaySelector
            onSelect={(selection) => {
              // Auto-populate date
              setWorkoutDate(selection.scheduledDate.split('T')[0]);
              // Store program selection for submission
              setProgramSelection({
                programId: selection.programId,
                dayIndex: selection.dayIndex,
                exercises: selection.exercises,
              });
              // Pre-fill exercises
              setWorkoutData(selection.exercises);
            }}
            activeOnly={true}
          />
          {programSelection && (
            <p className="text-sm text-gray-600 mt-2">
              Pre-filled from: Week{' '}
              {Math.floor(programSelection.dayIndex / 7) + 1}, Day{' '}
              {(programSelection.dayIndex % 7) + 1}
            </p>
          )}
        </div>
      )}

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

      {/* Weightlifting Form - Always Rendered */}
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Workout Details
          </h2>

          <WeightliftingForm
            onSubmit={handleWorkoutDataSubmit}
            initialData={workoutData || initialData?.data}
          />
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
