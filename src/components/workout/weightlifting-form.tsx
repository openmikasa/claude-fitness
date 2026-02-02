'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WeightliftingData } from '@/types/workout';
import { Autocomplete } from '@/components/ui/autocomplete';
import { CreateExerciseModal } from './create-exercise-modal';
import { useState, useMemo, useEffect } from 'react';
import type { Exercise } from '@/types/workout';
import { useSettings } from '@/lib/hooks/useSettings';
import { getWeightUnitLabel, inputToKg, kgToInput } from '@/lib/utils/unit-conversion';

// Zod validation schema
const weightliftingSetSchema = z.object({
  weight: z.number().min(0, 'Weight must be 0 or greater'),
  reps: z.number().int().min(1, 'Reps must be at least 1'),
});

const weightliftingExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.array(weightliftingSetSchema).min(1, 'At least one set is required'),
  exercise_id: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  muscle_groups: z.array(z.string()).optional(),
});

const weightliftingFormSchema = z.object({
  exercises: z.array(weightliftingExerciseSchema).min(1, 'At least one exercise is required'),
});

type WeightliftingFormData = z.infer<typeof weightliftingFormSchema>;

interface WeightliftingFormProps {
  onSubmit: (data: WeightliftingData) => void;
  initialData?: WeightliftingData;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function WeightliftingForm({ onSubmit, initialData, notes, onNotesChange }: WeightliftingFormProps) {
  const { data: settings } = useSettings();

  // Convert initial data from kg to user's preferred unit
  const convertedInitialData = useMemo(() => {
    if (!initialData) {
      return {
        exercises: [
          {
            name: '',
            sets: [{ weight: 0, reps: 0 }],
          },
        ],
      };
    }

    return {
      exercises: initialData.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => ({
          weight: kgToInput(set.weight, settings?.units || 'metric'),
          reps: set.reps,
        })),
      })),
    };
  }, [initialData, settings?.units]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WeightliftingFormData>({
    resolver: zodResolver(weightliftingFormSchema),
    defaultValues: convertedInitialData,
  });

  // Reset form when initialData changes (for program prefilling)
  useEffect(() => {
    if (initialData) {
      reset(convertedInitialData);
    }
  }, [initialData, convertedInitialData, reset]);

  const { fields: exercises, append: appendExercise, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercises',
  });

  const handleFormSubmit = (data: WeightliftingFormData) => {
    // Convert weights to kg for storage if user prefers imperial
    const dataToSubmit = {
      ...data,
      exercises: data.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => ({
          ...set,
          weight: inputToKg(set.weight, settings?.units || 'metric'),
        })),
      })),
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pb-48">
      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((exercise, exerciseIndex) => (
          <ExerciseField
            key={exercise.id}
            exerciseIndex={exerciseIndex}
            register={register}
            control={control}
            errors={errors}
            removeExercise={removeExercise}
            canRemoveExercise={exercises.length > 1}
            setValue={setValue}
            watch={watch}
            weightUnit={getWeightUnitLabel(settings?.units || 'metric')}
          />
        ))}
      </div>

      {/* Add Exercise Button */}
      <button
        type="button"
        onClick={() =>
          appendExercise({
            name: '',
            sets: [{ weight: 0, reps: 0 }],
          })
        }
        className="w-full px-4 py-4 text-sm font-medium text-subtext-light dark:text-subtext-dark bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-primary hover:text-primary transition-colors"
      >
        + Add Exercise
      </button>

      {/* Workout Notes */}
      <div>
        <label className="block text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wide mb-2">
          Workout Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="How was the session? e.g. Felt strong on bench..."
          className="w-full px-4 py-3 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors resize-none text-sm"
        />
      </div>

      {/* Form Error */}
      {errors.exercises?.root && (
        <p className="text-sm text-red-600">{errors.exercises.root.message}</p>
      )}

      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto">
          <button
            type="submit"
            className="w-full px-4 py-4 text-base font-semibold text-white bg-primary rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Finish Workout
          </button>
        </div>
      </div>
    </form>
  );
}

interface ExerciseFieldProps {
  exerciseIndex: number;
  register: any;
  control: any;
  errors: any;
  removeExercise: (index: number) => void;
  canRemoveExercise: boolean;
  setValue: any;
  watch: any;
  weightUnit: string;
}

function ExerciseField({
  exerciseIndex,
  register,
  control,
  errors,
  removeExercise,
  canRemoveExercise,
  setValue,
  watch,
  weightUnit,
}: ExerciseFieldProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [suggestedExerciseName, setSuggestedExerciseName] = useState('');

  const { fields: sets, append: appendSet, remove: removeSet } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  const exerciseName = watch(`exercises.${exerciseIndex}.name`);

  const handleExerciseSelect = (exercise: Exercise) => {
    setValue(`exercises.${exerciseIndex}.exercise_id`, exercise.id);
    setValue(`exercises.${exerciseIndex}.equipment`, exercise.equipment || []);
    setValue(`exercises.${exerciseIndex}.muscle_groups`, exercise.muscle_groups || []);
  };

  const handleCreateNew = (name: string) => {
    setSuggestedExerciseName(name);
    setIsCreateModalOpen(true);
  };

  const handleExerciseCreated = (exercise: any) => {
    // Auto-populate the form with the new exercise
    setValue(`exercises.${exerciseIndex}.name`, exercise.name);
    setValue(`exercises.${exerciseIndex}.exercise_id`, exercise.id);
    setValue(`exercises.${exerciseIndex}.equipment`, exercise.equipment || []);
    setValue(`exercises.${exerciseIndex}.muscle_groups`,
      [...(exercise.primary_muscles || []), ...(exercise.secondary_muscles || [])]
    );
  };

  return (
    <div className="bg-card-light dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Exercise Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-subtext-light dark:text-subtext-dark mb-2">
            Exercise Name
          </label>
          <Autocomplete
            value={exerciseName || ''}
            onChange={(value) => setValue(`exercises.${exerciseIndex}.name`, value)}
            onExerciseSelect={handleExerciseSelect}
            onCreateNew={handleCreateNew}
            placeholder="Search exercise..."
          />
          {errors.exercises?.[exerciseIndex]?.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.exercises[exerciseIndex].name.message}
            </p>
          )}
        </div>
        {canRemoveExercise && (
          <button
            type="button"
            onClick={() => removeExercise(exerciseIndex)}
            className="p-2 text-subtext-light dark:text-subtext-dark hover:text-red-600 transition-colors"
            aria-label="Remove exercise"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Equipment and Muscle Groups Display */}
      {exerciseName && (
        <div className="flex flex-wrap gap-2">
          {watch(`exercises.${exerciseIndex}.equipment`)?.map((eq: string) => (
            <span
              key={eq}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 border border-orange-200 dark:border-orange-800"
            >
              {eq}
            </span>
          ))}
          {watch(`exercises.${exerciseIndex}.muscle_groups`)?.map((mg: string) => (
            <span
              key={mg}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-light dark:bg-accent-dark text-primary border border-primary/20"
            >
              {mg}
            </span>
          ))}
        </div>
      )}

      {/* Create Exercise Modal */}
      <CreateExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onExerciseCreated={handleExerciseCreated}
        suggestedName={suggestedExerciseName}
      />

      {/* Sets Table */}
      {exerciseName && (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_1fr_40px] gap-3 px-2">
            <div className="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wide">
              SET
            </div>
            <div className="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wide">
              {weightUnit}
            </div>
            <div className="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wide">
              REPS
            </div>
            <div></div>
          </div>

          {/* Set Rows */}
          {sets.map((set, setIndex) => (
            <div key={set.id} className="grid grid-cols-[60px_1fr_1fr_40px] gap-3 items-center">
              <div className="text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-light dark:bg-accent-dark text-text-light dark:text-text-dark text-sm font-medium">
                  {setIndex + 1}
                </span>
              </div>
              <input
                {...register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`, {
                  valueAsNumber: true,
                })}
                type="number"
                step="0.1"
                min="0"
                placeholder="-"
                className="w-full px-3 py-3 bg-accent-light dark:bg-accent-dark text-text-light dark:text-text-dark text-center border-none rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
              />
              <input
                {...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`, {
                  valueAsNumber: true,
                })}
                type="number"
                min="1"
                placeholder="-"
                className="w-full px-3 py-3 bg-accent-light dark:bg-accent-dark text-text-light dark:text-text-dark text-center border-none rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium"
              />
              <div className="flex items-center justify-center">
                {watch(`exercises.${exerciseIndex}.sets.${setIndex}.weight`) > 0 &&
                 watch(`exercises.${exerciseIndex}.sets.${setIndex}.reps`) > 0 ? (
                  <svg className="w-6 h-6 text-subtext-light dark:text-subtext-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </div>
            </div>
          ))}

          {/* Error messages */}
          {errors.exercises?.[exerciseIndex]?.sets?.map((setError: any, setIndex: number) => (
            <div key={setIndex}>
              {setError?.weight && (
                <p className="text-xs text-red-600 px-2">
                  Set {setIndex + 1}: {setError.weight.message}
                </p>
              )}
              {setError?.reps && (
                <p className="text-xs text-red-600 px-2">
                  Set {setIndex + 1}: {setError.reps.message}
                </p>
              )}
            </div>
          ))}

          {/* Add Set Button */}
          <button
            type="button"
            onClick={() => appendSet({ weight: 0, reps: 0 })}
            className="w-full px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent-light dark:hover:bg-accent-dark rounded-xl transition-colors"
          >
            + Add Set
          </button>
        </div>
      )}

      {/* Exercise-level errors */}
      {errors.exercises?.[exerciseIndex]?.sets?.root && (
        <p className="text-sm text-red-600">
          {errors.exercises[exerciseIndex].sets.root.message}
        </p>
      )}
    </div>
  );
}
