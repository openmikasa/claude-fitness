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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pb-48">
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
        className="w-full px-4 py-4 text-sm font-bold uppercase text-black bg-white border-3 border-black rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
      >
        + Add Exercise
      </button>

      {/* Workout Notes */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">
          Workout Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="How was the session? e.g. Felt strong on bench..."
          className="w-full px-4 py-3 bg-white text-black border-3 border-black rounded-sm focus:outline-none focus:border-[#22FF00] transition-colors resize-none text-sm"
        />
      </div>

      {/* Form Error */}
      {errors.exercises?.root && (
        <p className="text-sm text-red-600">{errors.exercises.root.message}</p>
      )}

      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F5F5F5] border-t-3 border-black">
        <div className="max-w-2xl mx-auto">
          <button
            type="submit"
            className="w-full px-4 py-4 text-base font-bold uppercase text-white bg-[#8B5CF6] border-3 border-black rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
    setValue(`exercises.${exerciseIndex}.name`, exercise.name);
    setValue(`exercises.${exerciseIndex}.exercise_id`, exercise.id);
    setValue(`exercises.${exerciseIndex}.equipment`, exercise.equipment || []);
    setValue(`exercises.${exerciseIndex}.muscle_groups`,
      [...(exercise.primary_muscles || []), ...(exercise.secondary_muscles || [])]
    );
  };

  return (
    <div className="bg-white border-3 border-black rounded-sm p-5 space-y-4">
      {/* Exercise Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
            Exercise Name
          </label>
          {exerciseName ? (
            <h3 className="text-xl font-black uppercase text-black">{exerciseName}</h3>
          ) : (
            <Autocomplete
              value={exerciseName || ''}
              onChange={(value) => setValue(`exercises.${exerciseIndex}.name`, value)}
              onExerciseSelect={handleExerciseSelect}
              onCreateNew={handleCreateNew}
              placeholder="Search exercise..."
            />
          )}
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
            className="text-gray-400 hover:text-black transition-colors"
            aria-label="Remove exercise"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Equipment Tags */}
      {exerciseName && (
        <div className="flex flex-wrap gap-2">
          {watch(`exercises.${exerciseIndex}.equipment`)?.map((eq: string) => (
            <span
              key={eq}
              className="inline-flex items-center px-2 py-1 text-xs font-mono font-bold text-black bg-white border-2 border-[#22FF00]"
            >
              {eq}
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
          <div className="grid grid-cols-[50px_1fr_1fr_40px] gap-2 px-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
              SET
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
              {weightUnit}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
              REPS
            </div>
            <div></div>
          </div>

          {/* Set Rows */}
          {sets.map((set, setIndex) => {
            const weight = watch(`exercises.${exerciseIndex}.sets.${setIndex}.weight`);
            const reps = watch(`exercises.${exerciseIndex}.sets.${setIndex}.reps`);
            const isComplete = weight > 0 && reps > 0;

            return (
              <div key={set.id} className="grid grid-cols-[50px_1fr_1fr_40px] gap-2 items-center">
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 border-2 border-black text-black text-sm font-bold">
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
                  className="w-full px-3 py-3 bg-white text-black text-center border-2 border-black focus:outline-none focus:border-[#22FF00] font-bold"
                />
                <input
                  {...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="1"
                  placeholder="-"
                  className="w-full px-3 py-3 bg-white text-black text-center border-2 border-black focus:outline-none focus:border-[#22FF00] font-bold"
                />
                <div className="flex items-center justify-center">
                  {isComplete ? (
                    <svg className="w-7 h-7 text-[#22C55E]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}

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
            className="w-full px-4 py-3 text-sm font-bold uppercase text-[#22FF00] bg-transparent border-2 border-dashed border-gray-300 hover:border-[#22FF00] transition-colors"
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
