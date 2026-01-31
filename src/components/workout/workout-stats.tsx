'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { displayWeight } from '@/lib/utils/unit-conversion';
import { useSettings } from '@/lib/hooks/useSettings';

interface PersonalRecord {
  name: string;
  equipment: string; // NEW: Equipment type
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
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'weight' | 'date'>('name');
  const { data: settings } = useSettings();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/workouts/stats', {
          credentials: 'include',
        });

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

  // Filter and sort PRs
  const filteredAndSortedPRs = useMemo(() => {
    if (!stats?.personalRecords.weightlifting) return [];

    let filtered = stats.personalRecords.weightlifting;

    // Apply search filter
    if (searchFilter.trim()) {
      filtered = filtered.filter((pr) =>
        pr.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weight':
          return b.weight - a.weight; // Descending (highest first)
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime(); // Most recent first
        default:
          return 0;
      }
    });

    return sorted;
  }, [stats, searchFilter, sortBy]);

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
                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  {filteredAndSortedPRs.length} {filteredAndSortedPRs.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Filters */}
              <div className="space-y-3 mb-4">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm font-medium"
                />

                {/* Sort Options */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      sortBy === 'name'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Name A-Z
                  </button>
                  <button
                    onClick={() => setSortBy('weight')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      sortBy === 'weight'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Highest Weight
                  </button>
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      sortBy === 'date'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Most Recent
                  </button>
                </div>
              </div>

              {/* Scrollable PR List */}
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                {filteredAndSortedPRs.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    {searchFilter ? 'No PRs match your search' : 'No personal records yet'}
                  </p>
                ) : (
                  filteredAndSortedPRs.map((pr, index) => {
                    const { value, unit } = displayWeight(pr.weight, settings?.units || 'metric');
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex-grow min-w-0 mr-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {pr.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {pr.equipment} • {format(new Date(pr.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {value}{unit}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
