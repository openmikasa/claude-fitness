'use client';

import { useState, useEffect } from 'react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { MultiSelect } from '@/components/ui/multi-select';
import { CreateExerciseModal } from '@/components/workout/create-exercise-modal';
import type { Exercise } from '@/types/workout';

interface AutoMatchedExercise {
  name: string;
  sets: any[];
  matchedExercise: Exercise | null;
  confidence: number;
  equipment: string[];
  muscle_groups: string[];
}

interface AutoMatchedWorkout {
  id: string;
  workout_date: string;
  notes?: string;
  exercises: AutoMatchedExercise[];
}

interface BulkMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function BulkMigrationModal({ isOpen, onClose, onComplete }: BulkMigrationModalProps) {
  const [workouts, setWorkouts] = useState<AutoMatchedWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSuggestion, setCreateModalSuggestion] = useState('');
  const [pendingExerciseKey, setPendingExerciseKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAutoMatchedWorkouts();
    }
  }, [isOpen]);

  const fetchAutoMatchedWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts/auto-match', {
        credentials: 'include',
      });
      const data = await response.json();
      setWorkouts(data.workouts || []);

      // Expand all workouts by default
      if (data.workouts) {
        setExpandedWorkouts(new Set(data.workouts.map((w: AutoMatchedWorkout) => w.id)));
      }
    } catch (error) {
      console.error('Failed to fetch auto-matched workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSelect = (workoutId: string, exerciseIndex: number, exercise: Exercise) => {
    setWorkouts(workouts.map(workout => {
      if (workout.id !== workoutId) return workout;

      return {
        ...workout,
        exercises: workout.exercises.map((ex, idx) => {
          if (idx !== exerciseIndex) return ex;

          // Clear search query when exercise is selected
          const key = `${workoutId}-${idx}`;
          setSearchQueries(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
          });

          return {
            ...ex,
            matchedExercise: exercise,
            confidence: 1.0,
            equipment: exercise.equipment || [],
            // Backward compatibility: use primary_muscles if available, fallback to muscle_groups
            muscle_groups: exercise.primary_muscles || exercise.muscle_groups || [],
          };
        }),
      };
    }));
  };

  const updateExercise = (
    workoutId: string,
    exerciseIndex: number,
    field: 'equipment' | 'muscle_groups',
    value: string[]
  ) => {
    setWorkouts(workouts.map(workout => {
      if (workout.id !== workoutId) return workout;

      return {
        ...workout,
        exercises: workout.exercises.map((ex, idx) => {
          if (idx !== exerciseIndex) return ex;
          return { ...ex, [field]: value };
        }),
      };
    }));
  };

  const handleCreateExercise = (workoutId: string, exerciseIndex: number, exerciseName: string) => {
    setPendingExerciseKey(`${workoutId}-${exerciseIndex}`);
    setCreateModalSuggestion(exerciseName);
    setShowCreateModal(true);
  };

  const handleExerciseCreated = (newExercise: Exercise) => {
    if (!pendingExerciseKey) return;

    const [workoutId, exerciseIdx] = pendingExerciseKey.split('-');
    handleExerciseSelect(workoutId, parseInt(exerciseIdx), newExercise);

    setPendingExerciseKey(null);
    setCreateModalSuggestion('');
  };

  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  const handleConfirmAll = async () => {
    setSaving(true);
    try {
      // Process each workout
      for (const workout of workouts) {
        const exerciseData = workout.exercises.map(ex => ({
          name: ex.name,
          exercise_id: ex.matchedExercise?.id || '',
          equipment: ex.equipment,
          muscle_groups: ex.muscle_groups,
          sets: ex.sets,
        }));

        const response = await fetch('/api/workouts/backfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workout_id: workout.id,
            exercises: exerciseData,
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to backfill workout ${workout.id}`);
        }
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to save backfills:', error);
      alert('Failed to save some workouts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allExercisesMatched = workouts.every(workout =>
    workout.exercises.every(ex => ex.matchedExercise && ex.equipment.length > 0)
  );

  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const matchedCount = workouts.reduce(
    (sum, w) => sum + w.exercises.filter(ex => ex.matchedExercise).length,
    0
  );

  if (!isOpen) return null;

  const equipmentOptions = [
    'Barbell',
    'Hax Barbell',
    'Dumbbell',
    'Cable',
    'Machine',
    'Bodyweight',
    'Kettlebell',
    'Resistance Band',
    'Medicine Ball',
  ];

  const muscleGroupOptions = [
    'Chest',
    'Back',
    'Legs',
    'Shoulders',
    'Arms',
    'Core',
    'Glutes',
    'Hamstrings',
    'Quadriceps',
    'Calves',
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='bg-white border-b px-6 py-4 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>Bulk Migrate Workouts</h2>
              <p className='text-sm text-gray-600 mt-1'>
                Review and confirm auto-detected exercise matches for {workouts.length} workouts
              </p>
              {totalExercises > 0 && (
                <div className='mt-2 flex items-center gap-4 text-sm'>
                  <span className='text-gray-600'>
                    Matched: <strong className='text-green-600'>{matchedCount}</strong> / {totalExercises}
                  </span>
                  {matchedCount < totalExercises && (
                    <span className='text-amber-600 font-medium'>
                      ⚠ {totalExercises - matchedCount} exercises need attention
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {loading ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <div className='text-gray-600'>Analyzing workouts...</div>
            </div>
          ) : workouts.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-lg font-medium text-gray-900 mb-2'>All caught up!</div>
              <div className='text-gray-600'>No workouts need migration.</div>
            </div>
          ) : (
            <div className='space-y-4'>
              {workouts.map(workout => {
                const isExpanded = expandedWorkouts.has(workout.id);
                const workoutMatchedCount = workout.exercises.filter(ex => ex.matchedExercise).length;
                const workoutTotalCount = workout.exercises.length;

                return (
                  <div key={workout.id} className='border-2 border-gray-200 rounded-lg overflow-hidden'>
                    {/* Workout Header */}
                    <div
                      onClick={() => toggleWorkoutExpansion(workout.id)}
                      className='bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <span className='text-lg'>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <div>
                            <h3 className='font-semibold text-gray-900'>
                              {new Date(workout.workout_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </h3>
                            <p className='text-sm text-gray-600'>
                              {workoutTotalCount} exercise{workoutTotalCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          {workoutMatchedCount === workoutTotalCount ? (
                            <span className='text-sm text-green-600 font-medium'>✓ All matched</span>
                          ) : (
                            <span className='text-sm text-amber-600 font-medium'>
                              {workoutMatchedCount}/{workoutTotalCount} matched
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Workout Exercises */}
                    {isExpanded && (
                      <div className='p-4 space-y-4 bg-white'>
                        {workout.exercises.map((exercise, exerciseIdx) => (
                          <div
                            key={exerciseIdx}
                            className={`border rounded-lg p-4 space-y-4 ${
                              exercise.matchedExercise
                                ? exercise.confidence >= 0.9
                                  ? 'border-green-200 bg-green-50/30'
                                  : 'border-amber-200 bg-amber-50/30'
                                : 'border-red-200 bg-red-50/30'
                            }`}
                          >
                            <div className='flex items-start justify-between'>
                              <div>
                                <h4 className='font-semibold text-gray-900'>{exercise.name}</h4>
                                <p className='text-sm text-gray-500'>{exercise.sets.length} sets</p>
                              </div>
                              {exercise.matchedExercise ? (
                                <span
                                  className={`text-xs px-2 py-1 rounded font-medium ${
                                    exercise.confidence >= 0.9
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {exercise.confidence >= 0.9
                                    ? '✓ High confidence'
                                    : '⚠ Review match'}
                                </span>
                              ) : (
                                <span className='text-xs px-2 py-1 rounded font-medium bg-red-100 text-red-800'>
                                  No match found
                                </span>
                              )}
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                  Link to Exercise
                                </label>
                                <Autocomplete
                                  value={
                                    `${workout.id}-${exerciseIdx}` in searchQueries
                                      ? searchQueries[`${workout.id}-${exerciseIdx}`]
                                      : exercise.matchedExercise?.name ?? exercise.name
                                  }
                                  onChange={(value) => {
                                    const key = `${workout.id}-${exerciseIdx}`;
                                    setSearchQueries(prev => ({ ...prev, [key]: value }));
                                  }}
                                  onExerciseSelect={(ex) =>
                                    handleExerciseSelect(workout.id, exerciseIdx, ex)
                                  }
                                  onCreateNew={(name) =>
                                    handleCreateExercise(workout.id, exerciseIdx, name)
                                  }
                                  placeholder='Search for exercise...'
                                />
                                {exercise.matchedExercise && (
                                  <p className='text-xs text-green-600 mt-1'>
                                    ✓ Linked to: {exercise.matchedExercise.name}
                                  </p>
                                )}
                              </div>

                              <MultiSelect
                                label='Equipment Used'
                                options={equipmentOptions}
                                selected={exercise.equipment}
                                onChange={(value) =>
                                  updateExercise(workout.id, exerciseIdx, 'equipment', value)
                                }
                                placeholder='Select equipment...'
                              />
                            </div>

                            <MultiSelect
                              label='Muscle Groups'
                              options={muscleGroupOptions}
                              selected={exercise.muscle_groups}
                              onChange={(value) =>
                                updateExercise(workout.id, exerciseIdx, 'muscle_groups', value)
                              }
                              placeholder='Select muscle groups...'
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {workouts.length > 0 && (
          <div className='bg-gray-50 border-t px-6 py-4 flex items-center justify-between flex-shrink-0'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-gray-700 hover:text-gray-900 font-medium'
            >
              Cancel
            </button>

            <div className='flex items-center gap-4'>
              {!allExercisesMatched && (
                <span className='text-sm text-amber-600'>
                  ⚠ Some exercises need equipment selection
                </span>
              )}
              <button
                onClick={handleConfirmAll}
                disabled={saving || !allExercisesMatched}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Saving...' : `Confirm All (${workouts.length} workouts)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Exercise Modal */}
      <CreateExerciseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPendingExerciseKey(null);
          setCreateModalSuggestion('');
        }}
        onExerciseCreated={handleExerciseCreated}
        suggestedName={createModalSuggestion}
      />
    </div>
  );
}
