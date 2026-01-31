'use client';

import { useState, useEffect } from 'react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { MultiSelect } from '@/components/ui/multi-select';
import { CreateExerciseModal } from '@/components/workout/create-exercise-modal';
import type { Workout, WeightliftingData, Exercise } from '@/types/workout';

interface WorkoutBackfillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function WorkoutBackfillModal({ isOpen, onClose, onComplete }: WorkoutBackfillModalProps) {
  const [unmigratedWorkouts, setUnmigratedWorkouts] = useState<string[]>([]);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exerciseForms, setExerciseForms] = useState<{
    name: string;
    exercise_id: string;
    equipment: string[];
    muscle_groups: string[];
    sets: any[];
  }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalSuggestion, setCreateModalSuggestion] = useState('');
  const [pendingExerciseIndex, setPendingExerciseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUnmigratedWorkouts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (unmigratedWorkouts.length > 0 && currentWorkoutIndex < unmigratedWorkouts.length) {
      fetchWorkoutDetails(unmigratedWorkouts[currentWorkoutIndex]);
    }
  }, [currentWorkoutIndex, unmigratedWorkouts]);

  const fetchUnmigratedWorkouts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workouts/unmigrated-count', {
        credentials: 'include',
      });
      const data = await response.json();
      setUnmigratedWorkouts(data.workouts || []);
    } catch (error) {
      console.error('Failed to fetch unmigrated workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutDetails = async (workoutId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        credentials: 'include',
      });
      const workout = await response.json();
      setCurrentWorkout(workout);

      // Initialize exercise forms from workout data
      if (workout.workout_type === 'weightlifting') {
        const weightliftingData = workout.data as WeightliftingData;
        setExerciseForms(
          weightliftingData.exercises.map((ex) => ({
            name: ex.name,
            exercise_id: '',
            equipment: [],
            muscle_groups: [],
            sets: ex.sets,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch workout details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSelect = (index: number, exercise: Exercise) => {
    setExerciseForms((forms) =>
      forms.map((form, i) =>
        i === index
          ? {
              ...form,
              exercise_id: exercise.id,
              equipment: exercise.equipment || [],
              // Backward compatibility: use primary_muscles if available, fallback to muscle_groups
              muscle_groups: exercise.primary_muscles || exercise.muscle_groups || [],
            }
          : form
      )
    );
  };

  const updateExerciseForm = (index: number, field: string, value: any) => {
    setExerciseForms((forms) =>
      forms.map((form, i) => (i === index ? { ...form, [field]: value } : form))
    );
  };

  const handleCreateExercise = (index: number, exerciseName: string) => {
    setPendingExerciseIndex(index);
    setCreateModalSuggestion(exerciseName);
    setShowCreateModal(true);
  };

  const handleExerciseCreated = (newExercise: Exercise) => {
    if (pendingExerciseIndex === null) return;
    handleExerciseSelect(pendingExerciseIndex, newExercise);
    setPendingExerciseIndex(null);
    setCreateModalSuggestion('');
  };

  const handleSaveAndNext = async () => {
    if (!currentWorkout) return;

    setSaving(true);
    try {
      const response = await fetch('/api/workouts/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: currentWorkout.id,
          exercises: exerciseForms,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to backfill workout');
      }

      // Move to next workout
      if (currentWorkoutIndex < unmigratedWorkouts.length - 1) {
        setCurrentWorkoutIndex(currentWorkoutIndex + 1);
      } else {
        // All done!
        onComplete();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save backfill:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (currentWorkoutIndex < unmigratedWorkouts.length - 1) {
      setCurrentWorkoutIndex(currentWorkoutIndex + 1);
    } else {
      onClose();
    }
  };

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
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>Migrate Workout Data</h2>
              <p className='text-sm text-gray-600 mt-1'>
                {unmigratedWorkouts.length > 0
                  ? `Workout ${currentWorkoutIndex + 1} of ${unmigratedWorkouts.length}`
                  : 'Loading...'}
              </p>
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
        <div className='p-6 space-y-6'>
          {loading ? (
            <div className='text-center py-12'>
              <div className='text-gray-600'>Loading workout...</div>
            </div>
          ) : currentWorkout ? (
            <>
              {/* Workout Info */}
              <div className='bg-blue-50 rounded-lg p-4'>
                <h3 className='font-semibold text-gray-900'>
                  {new Date(currentWorkout.workout_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                {currentWorkout.notes && (
                  <p className='text-sm text-gray-600 mt-1'>{currentWorkout.notes}</p>
                )}
              </div>

              {/* Exercise Forms */}
              <div className='space-y-6'>
                <p className='text-sm text-gray-700'>
                  Link each exercise to our database and specify the equipment used:
                </p>

                {exerciseForms.map((form, index) => (
                  <div key={index} className='border border-gray-200 rounded-lg p-4 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h4 className='font-semibold text-gray-900'>
                        Exercise {index + 1}: {form.name}
                      </h4>
                      <span className='text-sm text-gray-500'>{form.sets.length} sets</span>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Link to Exercise
                        </label>
                        <Autocomplete
                          value={form.name}
                          onChange={(value) => updateExerciseForm(index, 'name', value)}
                          onExerciseSelect={(exercise) => handleExerciseSelect(index, exercise)}
                          onCreateNew={(name) => handleCreateExercise(index, name)}
                          placeholder='Search for exercise...'
                        />
                        {form.exercise_id && (
                          <p className='text-xs text-green-600 mt-1'>✓ Linked</p>
                        )}
                      </div>

                      <MultiSelect
                        label='Equipment Used'
                        options={equipmentOptions}
                        selected={form.equipment}
                        onChange={(value) => updateExerciseForm(index, 'equipment', value)}
                        placeholder='Select equipment...'
                      />
                    </div>

                    <MultiSelect
                      label='Muscle Groups'
                      options={muscleGroupOptions}
                      selected={form.muscle_groups}
                      onChange={(value) => updateExerciseForm(index, 'muscle_groups', value)}
                      placeholder='Select muscle groups...'
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='text-center py-12'>
              <div className='text-gray-600'>No workouts to migrate</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between'>
          <button
            onClick={handleSkip}
            className='px-4 py-2 text-gray-700 hover:text-gray-900 font-medium'
          >
            Skip This Workout
          </button>

          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium'
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndNext}
              disabled={
                saving ||
                !exerciseForms.every((form) => form.exercise_id && form.equipment.length > 0)
              }
              className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {saving
                ? 'Saving...'
                : currentWorkoutIndex < unmigratedWorkouts.length - 1
                ? 'Save & Next'
                : 'Save & Finish'}
            </button>
          </div>
        </div>
      </div>

      <CreateExerciseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPendingExerciseIndex(null);
          setCreateModalSuggestion('');
        }}
        onExerciseCreated={handleExerciseCreated}
        suggestedName={createModalSuggestion}
      />
    </div>
  );
}
