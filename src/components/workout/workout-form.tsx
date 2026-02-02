'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  initialProgramSelection?: {
    programId: string;
    dayIndex: number;
  };
}

export default function WorkoutForm({ initialData, workoutId, onSuccess, initialProgramSelection }: WorkoutFormProps) {
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
        data,
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

  // Format date as DD/MM/YYYY
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-sm shadow-brutal border-3 transition-opacity ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold uppercase">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="hover:opacity-70 transition-opacity font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b-3 border-black">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-black hover:text-[#22FF00] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-black uppercase text-black tracking-tight">
              Log Workout
            </h1>
          </div>
          <Link
            href="/workouts"
            className="text-sm font-bold uppercase text-black hover:text-[#22FF00] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Date Display */}
        <div className="flex items-center justify-center gap-3 py-3">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="text-xl font-bold text-black bg-transparent border-none focus:outline-none cursor-pointer"
          />
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Program Selector - Only show when creating new workout */}
        {!workoutId && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">
              Program (Optional)
            </label>
            <ProgramDaySelector
              onSelect={(selection) => {
                setWorkoutDate(selection.scheduledDate.split('T')[0]);
                setProgramSelection({
                  programId: selection.programId,
                  dayIndex: selection.dayIndex,
                  exercises: selection.exercises,
                });
                setWorkoutData(selection.exercises);
              }}
              activeOnly={true}
              initialSelection={initialProgramSelection}
            />
          </div>
        )}

        {/* Weightlifting Form */}
        <WeightliftingForm
          onSubmit={handleWorkoutDataSubmit}
          initialData={workoutData || initialData?.data}
          notes={notes}
          onNotesChange={setNotes}
        />
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-sm border-3 border-black shadow-brutal p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-black border-t-[#22FF00] animate-spin"></div>
            <p className="text-black font-bold uppercase">
              {workoutId ? 'Updating workout...' : 'Saving workout...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
