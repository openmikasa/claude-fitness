'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { format } from 'date-fns';

export default function ExportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: workouts, isLoading } = useWorkouts({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    setDateTo(format(today, 'yyyy-MM-dd'));
    setDateFrom(format(ninetyDaysAgo, 'yyyy-MM-dd'));
  }, []);

  const handleExport = () => {
    if (!workouts?.workouts) return;

    const filtered = workouts.workouts.filter((w) => {
      const workoutDate = new Date(w.workout_date);
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      return workoutDate >= from && workoutDate <= to;
    });

    if (exportFormat === 'csv') {
      let csv = 'Date,Type,Data,Notes\n';
      filtered.forEach((w) => {
        const dataStr = JSON.stringify(w.data).replace(/"/g, '""');
        const notesStr = (w.notes || '').replace(/"/g, '""');
        csv += `${w.workout_date},${w.workout_type},"${dataStr}","${notesStr}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workouts-' + format(new Date(), 'yyyy-MM-dd') + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'json') {
      const json = JSON.stringify(filtered, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workouts-' + format(new Date(), 'yyyy-MM-dd') + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-lg font-bold uppercase text-text-light dark:text-text-dark">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredCount = workouts?.workouts.filter((w) => {
    const workoutDate = new Date(w.workout_date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return workoutDate >= from && workoutDate <= to;
  }).length || 0;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <header className="bg-card-light dark:bg-card-dark border-b-3 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold uppercase tracking-wide text-text-light dark:text-text-dark">Export Workouts</h1>
            </Link>
            <Link href="/workouts" className="text-sm text-primary hover:underline font-bold uppercase">
              ← Back to Workouts
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-4">Export Options</h2>
              <p className="text-sm text-subtext-light dark:text-subtext-dark mb-6">
                Export your workout data for backup or analysis in external tools.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all"
              >
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="json">JSON (Complete Data)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all"
                />
              </div>
            </div>

            <div className="bg-accent-light dark:bg-accent-dark border-3 border-black dark:border-white rounded-sm p-4">
              <p className="text-sm text-text-light dark:text-text-dark font-bold">
                <strong>{filteredCount}</strong> workout{filteredCount !== 1 ? 's' : ''} will be exported
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={filteredCount === 0}
              className="w-full bg-primary text-white px-4 py-4 rounded-sm font-bold uppercase border-3 border-black dark:border-white shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Workouts
            </button>

            <div className="text-sm text-subtext-light dark:text-subtext-dark">
              <p className="font-bold uppercase mb-2">What&apos;s included:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Workout dates and types</li>
                <li>Exercise details (sets, reps, weight)</li>
                <li>Cardio data (time, distance, pace)</li>
                <li>Notes and comments</li>
                {exportFormat === 'json' && <li>Complete metadata (IDs, timestamps)</li>}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
