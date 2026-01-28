'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import WorkoutForm from './workout-form';
import { getWorkoutExercises, isWorkoutMigrated } from '@/lib/utils/workout-helpers';
import type {
  Workout,
  StrengthData,
  CardioData,
  SaunaData,
  MobilityData
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Workout
          </h2>
          <button
            onClick={() => setIsEditMode(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
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

  const renderStrengthData = (data: StrengthData) => {
    const exercises = getWorkoutExercises(workout);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exercises</h3>
        {exercises.map((exercise, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{exercise.name}</h4>

            {/* Equipment and Muscle Groups */}
            {(exercise.equipment.length > 0 || exercise.muscle_groups.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {exercise.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {eq}
                  </span>
                ))}
                {exercise.muscle_groups.map((mg) => (
                  <span
                    key={mg}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    {mg}
                  </span>
                ))}
              </div>
            )}

            {/* Sets */}
            <div className="space-y-2">
              {exercise.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
                >
                  <span>Set {setIdx + 1}</span>
                  <span>{set.weight}kg × {set.reps} reps</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCardioData = (data: CardioData) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {data.type}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.time_minutes} min
          </div>
        </div>
        {data.distance_km && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Distance</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.distance_km} km
            </div>
          </div>
        )}
        {data.pace && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pace</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.pace}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSaunaData = (data: SaunaData) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.duration_minutes} min
          </div>
        </div>
        {data.temperature_celsius && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Temperature</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.temperature_celsius}°C
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMobilityData = (data: MobilityData) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exercises</h3>
      {data.exercises.map((exercise, idx) => (
        <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">{exercise.name}</h4>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {exercise.duration_minutes} min
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderWorkoutData = () => {
    switch (workout.workout_type) {
      case 'strength':
        return renderStrengthData(workout.data as StrengthData);
      case 'cardio':
        return renderCardioData(workout.data as CardioData);
      case 'sauna':
        return renderSaunaData(workout.data as SaunaData);
      case 'mobility':
        return renderMobilityData(workout.data as MobilityData);
      default:
        return <div className="text-gray-500">Unknown workout type</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize mb-2">
              {workout.workout_type} Workout
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(new Date(workout.workout_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Workout Data */}
      <div className="p-6">
        {renderWorkoutData()}

        {/* Notes */}
        {workout.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {workout.notes}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Created: </span>
              <span className="text-gray-900 dark:text-white">
                {format(new Date(workout.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Updated: </span>
              <span className="text-gray-900 dark:text-white">
                {format(new Date(workout.updated_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>

          {/* Edit button placeholder - could implement edit functionality later */}
          <button
            onClick={() => setIsEditMode(true)}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Edit
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {deleteError && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">
            {deleteError}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Workout?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. Are you sure you want to delete this workout?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
