'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import WorkoutForm from './workout-form';
import { getWorkoutExercises, isWorkoutMigrated } from '@/lib/utils/workout-helpers';
import { displayWeight } from '@/lib/utils/unit-conversion';
import { useSettings } from '@/lib/hooks/useSettings';
import type {
  Workout,
  WeightliftingData
} from '@/types/workout';

interface WorkoutDetailProps {
  workout: Workout;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (workout: Workout) => void;
}

export default function WorkoutDetail({
  workout,
  onClose,
  onDelete,
  onUpdate
}: WorkoutDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: settings } = useSettings();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const response = await fetch(`/api/workouts/${workout.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      onDelete(workout.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    // Fetch updated workout data
    fetch(`/api/workouts/${workout.id}`)
      .then(res => res.json())
      .then(updatedWorkout => {
        onUpdate(updatedWorkout);
      })
      .catch(err => {
        console.error('Error fetching updated workout:', err);
      });
  };

  // If in edit mode, show the form
  if (isEditMode) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold uppercase text-text-light dark:text-text-dark">
            Edit Workout
          </h2>
          <button
            onClick={() => setIsEditMode(false)}
            className="text-text-light dark:text-text-dark hover:text-primary text-2xl leading-none font-bold"
          >
            ×
          </button>
        </div>
        <WorkoutForm
          initialData={workout}
          workoutId={workout.id}
          onSuccess={handleEditSuccess}
        />
      </div>
    );
  }

  const renderWeightliftingData = (data: WeightliftingData) => {
    const exercises = getWorkoutExercises(workout);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark">Exercises</h3>
        {exercises.map((exercise, idx) => (
          <div key={idx} className="bg-background-light dark:bg-background-dark border-3 border-black dark:border-white rounded-sm p-4">
            <h4 className="font-bold text-text-light dark:text-text-dark mb-2">{exercise.name}</h4>

            {/* Equipment and Muscle Groups */}
            {(exercise.equipment.length > 0 || exercise.muscle_groups.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {exercise.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="inline-flex items-center px-2 py-1 text-xs font-bold uppercase bg-accent-bright text-text-light border-2 border-black rounded-sm"
                  >
                    {eq}
                  </span>
                ))}
                {exercise.muscle_groups.map((mg) => (
                  <span
                    key={mg}
                    className="inline-flex items-center px-2 py-1 text-xs font-bold uppercase bg-primary/20 text-primary border-2 border-primary rounded-sm"
                  >
                    {mg}
                  </span>
                ))}
              </div>
            )}

            {/* Sets */}
            <div className="space-y-2">
              {exercise.sets.map((set, setIdx) => {
                const { value, unit } = displayWeight(set.weight, settings?.units || 'metric');
                return (
                  <div
                    key={setIdx}
                    className="flex items-center justify-between text-sm text-text-light dark:text-text-dark"
                  >
                    <span className="font-bold">Set {setIdx + 1}</span>
                    <span>
                      {value}{unit} × {set.reps} reps
                      {set.notes && (
                        <span className="text-xs text-subtext-light dark:text-subtext-dark italic ml-2">
                          ({set.notes})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white">
      {/* Header */}
      <div className="border-b-3 border-black dark:border-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase text-text-light dark:text-text-dark mb-2">
              Workout
            </h2>
            <p className="text-sm text-subtext-light dark:text-subtext-dark font-bold">
              {format(new Date(workout.workout_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-light dark:text-text-dark hover:text-primary text-2xl leading-none font-bold"
          >
            ×
          </button>
        </div>
      </div>

      {/* Workout Data */}
      <div className="p-6">
        {renderWeightliftingData(workout.data)}

        {/* Notes */}
        {workout.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-2">Notes</h3>
            <div className="bg-background-light dark:bg-background-dark border-3 border-black dark:border-white rounded-sm p-4">
              <p className="text-text-light dark:text-text-dark whitespace-pre-wrap">
                {workout.notes}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 pt-6 border-t-3 border-black dark:border-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-subtext-light dark:text-subtext-dark font-bold uppercase">Created: </span>
              <span className="text-text-light dark:text-text-dark">
                {format(new Date(workout.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div>
              <span className="text-subtext-light dark:text-subtext-dark font-bold uppercase">Updated: </span>
              <span className="text-text-light dark:text-text-dark">
                {format(new Date(workout.updated_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t-3 border-black dark:border-white p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Close
          </button>

          <button
            onClick={() => setIsEditMode(true)}
            className="flex-1 px-4 py-3 text-sm font-bold uppercase text-primary bg-accent-light dark:bg-accent-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Edit
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 text-sm font-bold uppercase text-danger bg-danger/10 border-3 border-danger rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {deleteError && (
          <div className="mt-3 text-sm text-danger font-bold">
            {deleteError}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white max-w-md w-full p-6">
            <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-2">
              Delete Workout?
            </h3>
            <p className="text-subtext-light dark:text-subtext-dark mb-6">
              This action cannot be undone. Are you sure you want to delete this workout?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-sm font-bold uppercase text-white bg-danger border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
