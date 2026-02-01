'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import type { Workout, WeightliftingData } from '@/types/workout';
import WorkoutDetail from './workout-detail';
import { MultiSelect } from '@/components/ui/multi-select';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [muscleGroupsFilter, setMuscleGroupsFilter] = useState<string[]>([]);
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

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (dateFrom) {
        params.append('date_from', dateFrom);
      }

      if (dateTo) {
        params.append('date_to', dateTo);
      }

      if (equipmentFilter.length > 0) {
        equipmentFilter.forEach(eq => params.append('equipment', eq));
      }

      if (muscleGroupsFilter.length > 0) {
        muscleGroupsFilter.forEach(mg => params.append('muscle_groups', mg));
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
  }, [page, searchQuery, dateFrom, dateTo, equipmentFilter, muscleGroupsFilter]);

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
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setEquipmentFilter([]);
    setMuscleGroupsFilter([]);
    setPage(1);
  };

  const removeFilter = (filterType: 'search' | 'dates' | 'equipment' | 'muscle_groups') => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'dates':
        setDateFrom('');
        setDateTo('');
        break;
      case 'equipment':
        setEquipmentFilter([]);
        break;
      case 'muscle_groups':
        setMuscleGroupsFilter([]);
        break;
    }
    setPage(1);
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || equipmentFilter.length > 0 || muscleGroupsFilter.length > 0;

  const handleWorkoutDeleted = (deletedId: string) => {
    setWorkouts(workouts.filter(w => w.id !== deletedId));
    setTotal(total - 1);
    setSelectedWorkout(null);
  };

  const handleWorkoutUpdated = (updated: Workout) => {
    setWorkouts(workouts.map(w => w.id === updated.id ? updated : w));
    setSelectedWorkout(updated);
  };

  const getWorkoutIcon = (): string => '💪'; // Always weightlifting

  const getWorkoutSummary = (workout: Workout): string => {
    const data = workout.data;
    const exerciseCount = data.exercises.length;
    const totalSets = data.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    return `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} • ${totalSets} set${totalSets !== 1 ? 's' : ''}`;
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
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full lg:hidden flex items-center justify-between p-4 text-left font-medium text-text-light dark:text-text-dark"
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
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Quick Filters
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickDateFilter('week')}
                className="px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark rounded-xl hover:bg-primary/20 transition-colors"
              >
                This Week
              </button>
              <button
                onClick={() => handleQuickDateFilter('month')}
                className="px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark rounded-xl hover:bg-primary/20 transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => handleQuickDateFilter('last30')}
                className="px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark rounded-xl hover:bg-primary/20 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handleQuickDateFilter('all')}
                className="px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark rounded-xl hover:bg-primary/20 transition-colors"
              >
                All Time
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors bg-white dark:bg-gray-700 text-text-light dark:text-text-dark placeholder-gray-400"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors bg-white dark:bg-gray-700 text-text-light dark:text-text-dark"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
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
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors bg-white dark:bg-gray-700 text-text-light dark:text-text-dark"
              />
            </div>
          </div>

          {/* Equipment and Muscle Groups Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MultiSelect
              label="Equipment"
              options={['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Resistance Band', 'Medicine Ball']}
              selected={equipmentFilter}
              onChange={(value) => {
                setEquipmentFilter(value);
                handleFilterChange();
              }}
              placeholder="Filter by equipment..."
            />
            <MultiSelect
              label="Muscle Groups"
              options={['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Glutes', 'Hamstrings', 'Quadriceps', 'Calves']}
              selected={muscleGroupsFilter}
              onChange={(value) => {
                setMuscleGroupsFilter(value);
                handleFilterChange();
              }}
              placeholder="Filter by muscle groups..."
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <button
                  onClick={() => removeFilter('search')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light dark:bg-accent-dark text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light dark:bg-accent-dark text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
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
              {equipmentFilter.length > 0 && (
                <button
                  onClick={() => removeFilter('equipment')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light dark:bg-accent-dark text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
                >
                  <span>Equipment: {equipmentFilter.join(', ')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {muscleGroupsFilter.length > 0 && (
                <button
                  onClick={() => removeFilter('muscle_groups')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light dark:bg-accent-dark text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
                >
                  <span>Muscles: {muscleGroupsFilter.join(', ')}</span>
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
              className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 animate-pulse"
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
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
            No workouts found
          </h3>
          <p className="text-subtext-light dark:text-subtext-dark mb-4">
            {searchQuery || dateFrom || dateTo
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
              className="w-full bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow p-4 text-left"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0">
                  {getWorkoutIcon()}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
                      Workout
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {format(new Date(workout.workout_date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <p className="text-sm text-subtext-light dark:text-subtext-dark mb-2">
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
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Info */}
            <div className="text-sm text-subtext-light dark:text-subtext-dark">
              Showing {startItem}-{endItem} of {total} workout{total !== 1 ? 's' : ''}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark rounded-xl hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700 transition-colors min-w-[90px]"
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
                className="px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark rounded-xl hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700 transition-colors min-w-[90px]"
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
        <div className="text-center text-sm text-subtext-light dark:text-subtext-dark">
          Showing all {total} workout{total !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
