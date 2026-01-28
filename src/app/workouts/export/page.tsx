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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Export Workouts</h1>
            <Link href="/workouts" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Back to Workouts
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
              <p className="text-sm text-gray-600 mb-6">
                Export your workout data for backup or analysis in external tools.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="json">JSON (Complete Data)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{filteredCount}</strong> workout{filteredCount !== 1 ? 's' : ''} will be exported
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={filteredCount === 0}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Workouts
            </button>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">What&apos;s included:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
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
