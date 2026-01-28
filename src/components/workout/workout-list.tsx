'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import type { Workout, WorkoutType, StrengthData, CardioData, SaunaData, MobilityData } from '@/types/workout';
import WorkoutDetail from './workout-detail';

interface WorkoutListProps {
  userId: string;
}

export default function WorkoutList({ userId }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<WorkoutType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Detail view
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const pageSize = 20;

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (workoutTypeFilter !== 'all') {
        params.append('workout_type', workoutTypeFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (dateFrom) {
        params.append('date_from', dateFrom);
      }

      if (dateTo) {
        params.append('date_to', dateTo);
      }

      const response = await fetch(`/api/workouts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }

      const data = await response.json();
      setWorkouts(data.workouts);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, workoutTypeFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Auto-expand filters on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setFiltersExpanded(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFilterChange = () => {
    setPage(1);
  };

  const handleQuickDateFilter = (filter: 'week' | 'month' | 'last30' | 'all') => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    switch (filter) {
      case 'week': {
        const start = startOfWeek(now, { weekStartsOn: 0 });
        const end = endOfWeek(now, { weekStartsOn: 0 });
        setDateFrom(format(start, 'yyyy-MM-dd'));
        setDateTo(format(end, 'yyyy-MM-dd'));
        break;
      }
      case 'month': {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        setDateFrom(format(start, 'yyyy-MM-dd'));
        setDateTo(format(end, 'yyyy-MM-dd'));
        break;
      }
      case 'last30': {
        const start = subDays(now, 30);
        setDateFrom(format(start, 'yyyy-MM-dd'));
        setDateTo(today);
        break;
      }
      case 'all':
        setDateFrom('');
        setDateTo('');
        break;
    }
    setPage(1);
  };

  const clearAllFilters = () => {
    setWorkoutTypeFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const removeFilter = (filterType: 'type' | 'search' | 'dates') => {
    switch (filterType) {
      case 'type':
        setWorkoutTypeFilter('all');
        break;
      case 'search':
        setSearchQuery('');
        break;
      case 'dates':
        setDateFrom('');
        setDateTo('');
        break;
    }
    setPage(1);
  };

  const hasActiveFilters = workoutTypeFilter !== 'all' || searchQuery || dateFrom || dateTo;

  const handleWorkoutDeleted = (deletedId: string) => {
    setWorkouts(workouts.filter(w => w.id !== deletedId));
    setTotal(total - 1);
    setSelectedWorkout(null);
  };

  const handleWorkoutUpdated = (updated: Workout) => {
    setWorkouts(workouts.map(w => w.id === updated.id ? updated : w));
    setSelectedWorkout(updated);
  };

  const getWorkoutIcon = (type: WorkoutType): string => {
    switch (type) {
      case 'strength':
        return '💪';
      case 'cardio':
        return '🏃';
      case 'sauna':
        return '🧖';
      case 'mobility':
        return '🧘';
      default:
        return '🏋️';
    }
  };

  const getWorkoutSummary = (workout: Workout): string => {
    switch (workout.workout_type) {
      case 'strength': {
        const data = workout.data as StrengthData;
        const exerciseCount = data.exercises.length;
        const totalSets = data.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        return `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} • ${totalSets} set${totalSets !== 1 ? 's' : ''}`;
      }
      case 'cardio': {
        const data = workout.data as CardioData;
        const parts: string[] = [data.type];
        if (data.distance_km) {
          parts.push(`${data.distance_km}km`);
        }
        parts.push(`${data.time_minutes}min`);
        return parts.join(' • ');
      }
      case 'sauna': {
        const data = workout.data as SaunaData;
        const parts = [`${data.duration_minutes}min`];
        if (data.temperature_celsius) {
          parts.push(`${data.temperature_celsius}°C`);
        }
        return parts.join(' • ');
      }
      case 'mobility': {
        const data = workout.data as MobilityData;
        const exerciseCount = data.exercises.length;
        const totalMinutes = data.exercises.reduce((sum, ex) => sum + ex.duration_minutes, 0);
        return `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} • ${totalMinutes}min`;
      }
      default:
        return 'Unknown workout';
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (selectedWorkout) {
    return (
      <WorkoutDetail
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onDelete={handleWorkoutDeleted}
        onUpdate={handleWorkoutUpdated}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full lg:hidden flex items-center justify-between p-4 text-left font-medium text-gray-900 dark:text-white"
        >
          <span>Filters</span>
          <svg
            className={`w-5 h-5 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Filter Content */}
        <div className={`${filtersExpanded ? 'block' : 'hidden lg:block'} p-4 space-y-4`}>
          {/* Quick Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Filters
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickDateFilter('week')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                This Week
              </button>
              <button
                onClick={() => handleQuickDateFilter('month')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => handleQuickDateFilter('last30')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handleQuickDateFilter('all')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                All Time
              </button>
            </div>
          </div>

          {/* Workout Type Filter */}
          <div>
            <label htmlFor="workout-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Type
            </label>
            <select
              id="workout-type"
              value={workoutTypeFilter}
              onChange={(e) => {
                setWorkoutTypeFilter(e.target.value as WorkoutType | 'all');
                handleFilterChange();
              }}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="sauna">Sauna</option>
              <option value="mobility">Mobility</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Notes
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
              placeholder="Search in notes..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {workoutTypeFilter !== 'all' && (
                <button
                  onClick={() => removeFilter('type')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <span className="capitalize">{workoutTypeFilter}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => removeFilter('search')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <span>Search: {searchQuery}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => removeFilter('dates')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <span>
                    {dateFrom && dateTo
                      ? `${format(new Date(dateFrom), 'MMM d, yyyy')} - ${format(new Date(dateTo), 'MMM d, yyyy')}`
                      : dateFrom
                      ? `From ${format(new Date(dateFrom), 'MMM d, yyyy')}`
                      : `Until ${format(new Date(dateTo), 'MMM d, yyyy')}`}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchWorkouts}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && workouts.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No workouts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {workoutTypeFilter !== 'all' || searchQuery || dateFrom || dateTo
              ? 'Try adjusting your filters'
              : 'Start by logging your first workout'}
          </p>
        </div>
      )}

      {/* Workout Cards */}
      {!loading && !error && workouts.length > 0 && (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <button
              key={workout.id}
              onClick={() => setSelectedWorkout(workout)}
              className="w-full bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 text-left"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0">
                  {getWorkoutIcon(workout.workout_type)}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {workout.workout_type}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {format(new Date(workout.workout_date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {getWorkoutSummary(workout)}
                  </p>

                  {workout.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 truncate">
                      {workout.notes}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startItem}-{endItem} of {total} workout{total !== 1 ? 's' : ''}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700 transition-colors min-w-[90px]"
                aria-label="Previous page"
              >
                Previous
              </button>
              <div className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 min-w-[100px] justify-center">
                <span className="font-medium">{page}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700 transition-colors min-w-[90px]"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary for Single Page */}
      {!loading && !error && workouts.length > 0 && totalPages === 1 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Showing all {total} workout{total !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
