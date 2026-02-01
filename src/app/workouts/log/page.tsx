'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import WorkoutForm from '@/components/workout/workout-form';

function LogWorkoutContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get program selection from query params
  const programId = searchParams.get('programId');
  const dayIndex = searchParams.get('dayIndex');

  const initialProgramSelection = programId && dayIndex ? {
    programId,
    dayIndex: parseInt(dayIndex, 10),
  } : undefined;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <div className="text-lg text-text-light dark:text-text-dark">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <WorkoutForm initialProgramSelection={initialProgramSelection} />
  );
}

export default function LogWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <div className="text-lg text-text-light dark:text-text-dark">Loading...</div>
        </div>
      </div>
    }>
      <LogWorkoutContent />
    </Suspense>
  );
}
