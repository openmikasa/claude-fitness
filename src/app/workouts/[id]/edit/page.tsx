'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WorkoutForm from '@/components/workout/workout-form';
import type { Workout } from '@/types/workout';

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/workouts/${workoutId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch workout');
        }

        const data = await response.json();
        setWorkout(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId]);

  const handleSuccess = () => {
    router.push('/workouts');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Loading workout...
          </p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error || 'Workout not found'}
          </p>
          <button
            onClick={() => router.push('/workouts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <WorkoutForm
        initialData={workout}
        workoutId={workoutId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
