'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { BulkMigrationModal } from '@/components/workout/bulk-migration-modal';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { format, parseISO } from 'date-fns';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [unmigratedCount, setUnmigratedCount] = useState<number>(0);
  const [showBackfillModal, setShowBackfillModal] = useState(false);

  // Fetch recent workouts (limit to 3 most recent)
  const { data: workoutsResponse, isLoading: workoutsLoading } = useWorkouts({
    pageSize: 3,
    page: 1,
  });

  const workouts = workoutsResponse?.workouts || [];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      fetchUnmigratedCount();
    }
  }, [user, loading]);

  const fetchUnmigratedCount = async () => {
    try {
      const response = await fetch('/api/workouts/unmigrated-count', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUnmigratedCount(data.count || 0);
      } else if (response.status !== 401) {
        // Only log non-auth errors
        console.error('Failed to fetch unmigrated count:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch unmigrated count:', error);
    }
  };

  const handleBackfillComplete = () => {
    setUnmigratedCount(0);
    setShowBackfillModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Claude Fitness
          </h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered fitness journey starts here.
          </p>
        </div>

        {/* Backfill Banner */}
        {unmigratedCount > 0 && (
          <div
            className="mb-8 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg"
            data-testid="backfill-banner"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  Enhance Your Workout Data
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  You have {unmigratedCount} workout{unmigratedCount !== 1 ? 's' : ''} that can be
                  enhanced with equipment and muscle group data. This enables advanced filtering
                  and better analytics.
                </p>
                <button
                  onClick={() => setShowBackfillModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                >
                  Start Migration
                </button>
              </div>
              <button
                onClick={() => setUnmigratedCount(0)}
                className="text-blue-600 hover:text-blue-800 text-xl font-bold ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Bulk Migration Modal */}
        <BulkMigrationModal
          isOpen={showBackfillModal}
          onClose={() => setShowBackfillModal(false)}
          onComplete={handleBackfillComplete}
        />

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ActionCard
            title="Log Workout"
            description="Record your training session"
            href="/workouts/log"
            icon="💪"
          />
          <ActionCard
            title="View History"
            description="Browse past workouts"
            href="/workouts"
            icon="📊"
          />
          <ActionCard
            title="AI Program"
            description="Get your training plan"
            href="/programs"
            icon="🤖"
          />
          <ActionCard
            title="Import Data"
            description="Upload CSV history"
            href="/workouts/import"
            icon="📥"
          />
          <ActionCard
            title="Settings"
            description="Preferences & account"
            href="/settings"
            icon="⚙️"
          />
          <ActionCard
            title="Help"
            description="Guides & documentation"
            href="/help"
            icon="❓"
          />
        </div>

        {/* Recent workouts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Workouts
            </h3>
            {workouts && workouts.length > 0 && (
              <Link
                href="/workouts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            )}
          </div>

          {workoutsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : !workouts || workouts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No workouts yet. Start by logging your first session!
            </p>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => {
                const exerciseCount = workout.data.exercises.length;
                const totalSets = workout.data.exercises.reduce(
                  (sum, ex) => sum + ex.sets.length,
                  0
                );

                return (
                  <Link
                    key={workout.id}
                    href={`/workouts/${workout.id}/edit`}
                    className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format(parseISO(workout.workout_date), 'EEEE, MMM d')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} · {totalSets} set{totalSets !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-gray-400 dark:text-gray-600">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="grid grid-cols-4 gap-1">
          <NavButton href="/" label="Home" icon="🏠" />
          <NavButton href="/workouts/log" label="Log" icon="➕" />
          <NavButton href="/workouts" label="History" icon="📖" />
          <NavButton href="/programs" label="Plan" icon="📋" />
        </div>
      </nav>
    </div>
  );
}

function ActionCard({ title, description, href, icon }: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </a>
  );
}

function NavButton({ href, label, icon }: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs">{label}</span>
    </a>
  );
}
