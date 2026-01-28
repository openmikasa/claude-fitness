'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

        {/* Recent activity placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No workouts yet. Start by logging your first session!
          </p>
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
