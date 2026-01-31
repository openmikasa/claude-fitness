'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { displayWeight } from '@/lib/utils/unit-conversion';
import { useSettings } from '@/lib/hooks/useSettings';

interface PersonalRecord {
  name: string;
  weight: number;  // Changed from value: string to weight: number
  date: string;
}

interface StatsData {
  total: number;
  thisWeek: number;
  thisMonth: number;
  personalRecords: {
    weightlifting: PersonalRecord[];
  };
}

export default function WorkoutStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: settings } = useSettings();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/workouts/stats');

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Loading statistics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Workouts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl md:text-3xl">💪</span>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total
            </h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            All time
          </p>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl md:text-3xl">🔥</span>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              This Week
            </h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {stats.thisWeek}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Keep it up!
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl md:text-3xl">📅</span>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              This Month
            </h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {stats.thisMonth}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Current month
          </p>
        </div>
      </div>

      {/* Personal Records */}
      {stats.personalRecords.weightlifting.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weightlifting PRs */}
          {stats.personalRecords.weightlifting.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏋️</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Weightlifting PRs
                </h3>
              </div>
              <div className="space-y-3">
                {stats.personalRecords.weightlifting.map((pr, index) => {
                  const { value, unit } = displayWeight(pr.weight, settings?.units || 'metric');
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-grow min-w-0 mr-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {pr.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {format(new Date(pr.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {value}{unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
