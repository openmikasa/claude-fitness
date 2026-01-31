'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettings, useUpdateSettings } from '@/lib/hooks/useSettings';

type Units = 'metric' | 'imperial';
type Theme = 'light' | 'dark' | 'auto';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [units, setUnits] = useState<Units>('metric');
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load settings from API or fallback to localStorage
    if (settings) {
      setUnits(settings.units || 'metric');
      setTheme(settings.theme || 'auto');
    } else if (typeof window !== 'undefined') {
      const savedUnits = localStorage.getItem('units') as Units;
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedUnits) setUnits(savedUnits);
      if (savedTheme) setTheme(savedTheme);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({ units, theme });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/' className='hover:opacity-80 transition-opacity'>
              <h1 className='text-2xl font-bold text-gray-900'>Settings</h1>
            </Link>
            <Link href='/' className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          {/* Account Section */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Account</h2>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                <div className='text-sm text-gray-600'>{user.email}</div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>User ID</label>
                <div className='text-sm text-gray-600 font-mono truncate'>{user.id}</div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Preferences</h2>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Units</label>
                <select
                  value={units}
                  onChange={(e) => setUnits(e.target.value as Units)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                >
                  <option value='metric'>Metric (kg, km)</option>
                  <option value='imperial'>Imperial (lbs, miles)</option>
                </select>
                <p className='mt-1 text-xs text-gray-500'>Choose your preferred measurement system</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                >
                  <option value='light'>Light</option>
                  <option value='dark'>Dark</option>
                  <option value='auto'>Auto (System)</option>
                </select>
                <p className='mt-1 text-xs text-gray-500'>Choose your preferred color scheme</p>
              </div>

              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className='w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50'
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Data Management</h2>
            <div className='space-y-3'>
              <Link
                href='/workouts/export'
                className='block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors'
              >
                Export Workouts
              </Link>
              <Link
                href='/workouts/import'
                className='block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors'
              >
                Import Workouts
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Help & Support</h2>
            <div className='space-y-3'>
              <Link
                href='/help'
                className='block text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                Help Documentation →
              </Link>
              <a
                href='https://github.com/anthropics/claude-fitness/issues'
                target='_blank'
                rel='noopener noreferrer'
                className='block text-blue-600 hover:text-blue-700 text-sm font-medium'
              >
                Report an Issue →
              </a>
            </div>
          </div>

          {/* Danger Zone */}
          <div className='bg-white rounded-lg shadow p-6 border-2 border-red-200'>
            <h2 className='text-lg font-semibold text-red-600 mb-4'>Danger Zone</h2>
            <button
              onClick={handleSignOut}
              className='w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors'
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}