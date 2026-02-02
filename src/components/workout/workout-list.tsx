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
      <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full lg:hidden flex items-center justify-between p-4 text-left font-bold uppercase text-text-light dark:text-text-dark"
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
            <label className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">
              Quick Filters
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickDateFilter('week')}
                className="px-3 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark border-2 border-black dark:border-white rounded-sm hover:bg-accent transition-colors"
              >
                This Week
              </button>
              <button
                onClick={() => handleQuickDateFilter('month')}
                className="px-3 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark border-2 border-black dark:border-white rounded-sm hover:bg-accent transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => handleQuickDateFilter('last30')}
                className="px-3 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark border-2 border-black dark:border-white rounded-sm hover:bg-accent transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handleQuickDateFilter('all')}
                className="px-3 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark border-2 border-black dark:border-white rounded-sm hover:bg-accent transition-colors"
              >
                All Time
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">
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
              className="w-full px-4 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-subtext-light dark:placeholder-subtext-dark transition-all"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date-from" className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">
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
                className="w-full px-4 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2">
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
                className="w-full px-4 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all"
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
          <div className="px-4 pb-4 space-y-2 border-t-2 border-black dark:border-white pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Active Filters:</span>
              <button
                onClick={clearAllFilters}
                className="text-sm font-bold uppercase text-primary hover:underline"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <button
                  onClick={() => removeFilter('search')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-bright text-text-light text-sm font-bold uppercase border-2 border-black rounded-sm hover:bg-accent transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-bright text-text-light text-sm font-bold uppercase border-2 border-black rounded-sm hover:bg-accent transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-bright text-text-light text-sm font-bold uppercase border-2 border-black rounded-sm hover:bg-accent transition-colors"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-bright text-text-light text-sm font-bold uppercase border-2 border-black rounded-sm hover:bg-accent transition-colors"
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
              className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-4 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-background-light dark:bg-background-dark border-2 border-black dark:border-white flex-shrink-0" />
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-6 bg-background-light dark:bg-background-dark border-2 border-black dark:border-white w-32" />
                    <div className="h-5 bg-background-light dark:bg-background-dark border-2 border-black dark:border-white w-24" />
                  </div>
                  <div className="h-4 bg-background-light dark:bg-background-dark border-2 border-black dark:border-white w-48" />
                  <div className="h-4 bg-background-light dark:bg-background-dark border-2 border-black dark:border-white w-full max-w-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-danger/10 border-3 border-danger rounded-sm p-4">
          <p className="text-danger font-bold">{error}</p>
          <button
            onClick={fetchWorkouts}
            className="mt-2 text-sm text-danger hover:underline font-bold"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && workouts.length === 0 && (
        <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-12 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-2">
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
              className="w-full bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white hover:border-accent hover:shadow-brutal-lg transition-all p-4 text-left"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-4xl flex-shrink-0">
                  {getWorkoutIcon()}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark">
                      Workout
                    </h3>
                    <span className="text-sm font-bold text-subtext-light dark:text-subtext-dark flex-shrink-0">
                      {format(new Date(workout.workout_date), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <p className="text-sm text-subtext-light dark:text-subtext-dark mb-2">
                    {getWorkoutSummary(workout)}
                  </p>

                  {workout.notes && (
                    <p className="text-sm text-subtext-light dark:text-subtext-dark truncate">
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
        <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Info */}
            <div className="text-sm font-bold uppercase text-subtext-light dark:text-subtext-dark">
              Showing {startItem}-{endItem} of {total} workout{total !== 1 ? 's' : ''}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark border-2 border-black dark:border-white rounded-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[90px]"
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <div className="flex items-center px-3 py-2 text-sm font-bold text-text-light dark:text-text-dark min-w-[100px] justify-center border-2 border-black dark:border-white rounded-sm">
                <span>{page}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-accent-light dark:bg-accent-dark border-2 border-black dark:border-white rounded-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[90px]"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary for Single Page */}
      {!loading && !error && workouts.length > 0 && totalPages === 1 && (
        <div className="text-center text-sm font-bold uppercase text-subtext-light dark:text-subtext-dark">
          Showing all {total} workout{total !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
