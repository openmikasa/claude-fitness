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
        <div className="text-lg font-bold uppercase">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-card-light dark:bg-card-dark border-b-3 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end items-center">
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark underline hover:text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-text-light dark:text-text-dark mb-4 leading-tight">
            <span className="heading-underline block">YOUR WINTER</span>
            <span className="heading-underline block mt-2">ARC STARTS</span>
            <span className="heading-underline block mt-2">HERE</span>
          </h2>
        </div>

        {/* System Ready Callout */}
        <div className="bg-card-light dark:bg-card-dark border-3 border-black dark:border-white border-l-6 border-l-accent rounded-sm p-4 shadow-brutal mb-8">
          <p className="font-bold text-accent">&gt;&gt;&gt; SYSTEM READY</p>
          <p className="text-subtext-light dark:text-subtext-dark">
            Start by uploading your training history, then generate a new AI-powered program.
          </p>
        </div>

        {/* Backfill Banner */}
        {unmigratedCount > 0 && (
          <div
            className="mb-8 bg-card-light dark:bg-card-dark border-3 border-black dark:border-white border-l-6 border-l-primary p-4 rounded-sm shadow-brutal"
            data-testid="backfill-banner"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-1">
                  Enhance Your Workout Data
                </h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark mb-3">
                  You have {unmigratedCount} workout{unmigratedCount !== 1 ? 's' : ''} that can be
                  enhanced with equipment and muscle group data. This enables advanced filtering
                  and better analytics.
                </p>
                <button
                  onClick={() => setShowBackfillModal(true)}
                  className="px-4 py-3 bg-primary text-white border-3 border-black dark:border-white rounded-sm font-bold uppercase shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
                >
                  Start Migration
                </button>
              </div>
              <button
                onClick={() => setUnmigratedCount(0)}
                className="text-text-light dark:text-text-dark hover:text-primary text-2xl font-bold ml-4"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark">
              Recent Workouts
            </h3>
            {workouts && workouts.length > 0 && (
              <Link
                href="/workouts"
                className="text-sm text-primary hover:underline font-bold uppercase transition-colors"
              >
                View all →
              </Link>
            )}
          </div>

          {workoutsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-3 border-black dark:border-white border-t-primary mx-auto animate-spin"></div>
            </div>
          ) : !workouts || workouts.length === 0 ? (
            <p className="text-subtext-light dark:text-subtext-dark text-center py-8 uppercase">
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
                    className="block p-4 rounded-sm border-3 border-black dark:border-white hover:border-accent hover:shadow-brutal-sm transition-all bg-card-light dark:bg-card-dark"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text-light dark:text-text-dark">
                          {format(parseISO(workout.workout_date), 'EEEE, MMM d')}
                        </p>
                        <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} · {totalSets} set{totalSets !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-text-light dark:text-text-dark font-bold">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark border-t-3 border-black dark:border-white md:hidden">
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
      className="block p-6 bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white hover:border-accent hover:shadow-brutal-lg transition-all"
    >
      <div className="w-12 h-12 rounded-sm bg-accent-light dark:bg-accent-dark flex items-center justify-center mb-4 border-2 border-black dark:border-white">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-1">
        {title}
      </h3>
      <p className="text-sm text-subtext-light dark:text-subtext-dark">
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
      className="flex flex-col items-center justify-center py-3 text-text-light dark:text-text-dark hover:text-primary transition-colors"
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-bold uppercase">{label}</span>
    </a>
  );
}
