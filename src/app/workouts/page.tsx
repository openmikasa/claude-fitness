'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import WorkoutStats from '@/components/workout/workout-stats';
import WorkoutList from '@/components/workout/workout-list';

export default function WorkoutsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-lg font-bold uppercase text-text-light dark:text-text-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 md:pb-8">
      <header className="bg-card-light dark:bg-card-dark border-b-3 border-black dark:border-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide text-text-light dark:text-text-dark">
                  Workout History
                </h1>
                <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1 font-medium">
                  Get a flashback of your origin story. Scroll through the sweat and tears of your previous arcs.
                </p>
              </div>
            </Link>
            <Link
              href="/workouts/log"
              className="px-4 py-3 bg-primary text-white rounded-sm font-bold uppercase border-3 border-black dark:border-white shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
            >
              Log New Workout
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <WorkoutStats />
        <WorkoutList userId={user.id} />
      </main>
    </div>
  );
}
