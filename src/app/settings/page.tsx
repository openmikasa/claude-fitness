'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettings, useUpdateSettings } from '@/lib/hooks/useSettings';

type Units = 'metric' | 'imperial';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [units, setUnits] = useState<Units>('metric');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load settings from API or fallback to localStorage
    if (settings) {
      setUnits(settings.units || 'metric');
    } else if (typeof window !== 'undefined') {
      const savedUnits = localStorage.getItem('units') as Units;
      if (savedUnits) setUnits(savedUnits);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({ units });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark'>
        <div className='text-lg font-bold uppercase text-text-light dark:text-text-dark'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background-light dark:bg-background-dark pb-24 md:pb-8'>
      <header className='bg-card-light dark:bg-card-dark border-b-3 border-black dark:border-white'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/' className='hover:opacity-80 transition-opacity'>
              <h1 className='text-2xl font-bold uppercase tracking-wide text-text-light dark:text-text-dark'>Settings</h1>
            </Link>
            <Link href='/' className='text-sm text-primary hover:underline font-bold uppercase transition-colors'>
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          {/* Account Section */}
          <div className='bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6'>
            <h2 className='text-lg font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2'>
              <span>👤</span> <span className='border-b-4 border-accent pb-1'>Account</span>
            </h2>
            <div className='space-y-4'>
              <div>
                <label className='block text-xs font-bold uppercase text-subtext-light dark:text-subtext-dark mb-1'>Email</label>
                <div className='text-sm font-medium text-text-light dark:text-text-dark'>{user.email}</div>
              </div>
              <div>
                <label className='block text-xs font-bold uppercase text-subtext-light dark:text-subtext-dark mb-1'>User ID</label>
                <div className='text-sm text-text-light dark:text-text-dark font-mono truncate p-2 border-2 border-black dark:border-white rounded-sm bg-background-light dark:bg-background-dark'>{user.id}</div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className='bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6'>
            <h2 className='text-lg font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2'>
              <span>⚙️</span> <span className='border-b-4 border-accent pb-1'>Preferences</span>
            </h2>
            <div className='space-y-4'>
              <div>
                <label className='block text-xs font-bold uppercase text-text-light dark:text-text-dark mb-2'>Units</label>
                <select
                  value={units}
                  onChange={(e) => setUnits(e.target.value as Units)}
                  className='w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all'
                >
                  <option value='metric'>Metric (kg, km)</option>
                  <option value='imperial'>Imperial (lbs, miles)</option>
                </select>
                <p className='mt-2 text-xs text-subtext-light dark:text-subtext-dark'>Choose your preferred measurement system</p>
              </div>

              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className='w-full bg-primary text-white px-4 py-4 rounded-sm font-bold uppercase border-3 border-black dark:border-white shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50'
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className='bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6'>
            <h2 className='text-lg font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2'>
              <span>📊</span> <span className='border-b-4 border-accent pb-1'>Data Management</span>
            </h2>
            <div className='space-y-3'>
              <Link
                href='/workouts/export'
                className='block w-full text-center bg-card-light dark:bg-card-dark text-primary border-3 border-black dark:border-white px-4 py-3 rounded-sm font-bold uppercase hover:bg-accent-light dark:hover:bg-accent-dark transition-colors'
              >
                Export Workouts
              </Link>
              <Link
                href='/workouts/import'
                className='block w-full text-center bg-card-light dark:bg-card-dark text-primary border-3 border-black dark:border-white px-4 py-3 rounded-sm font-bold uppercase hover:bg-accent-light dark:hover:bg-accent-dark transition-colors'
              >
                Import Workouts
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className='bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6'>
            <h2 className='text-lg font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2'>
              <span>❓</span> <span className='border-b-4 border-accent pb-1'>Help & Support</span>
            </h2>
            <div className='space-y-3'>
              <Link
                href='/help'
                className='block text-primary hover:underline text-sm font-bold transition-colors'
              >
                Help Documentation →
              </Link>
              <a
                href='https://github.com/anthropics/claude-fitness/issues'
                target='_blank'
                rel='noopener noreferrer'
                className='block text-primary hover:underline text-sm font-bold transition-colors'
              >
                Report an Issue →
              </a>
              <p className='text-sm text-subtext-light dark:text-subtext-dark'>
                If you like Winter Arc, contact me <a href='https://github.com/openmikasa' target='_blank' rel='noopener noreferrer' className='text-primary hover:underline font-bold'>@openmikasa</a> on GitHub.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className='bg-card-light dark:bg-card-dark rounded-sm shadow-brutal p-6 border-4 border-danger'>
            <h2 className='text-lg font-bold uppercase text-danger mb-4 flex items-center gap-2'>
              <span>⚠️</span> Danger Zone
            </h2>
            <button
              onClick={handleSignOut}
              className='w-full bg-danger text-white px-4 py-4 rounded-sm font-bold uppercase border-3 border-black dark:border-white shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
