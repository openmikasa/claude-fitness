'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StrengthData } from '@/types/workout';

// Zod validation schema
const strengthSetSchema = z.object({
  weight: z.number().min(0, 'Weight must be 0 or greater'),
  reps: z.number().int().min(1, 'Reps must be at least 1'),
});

const strengthExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.array(strengthSetSchema).min(1, 'At least one set is required'),
});

const strengthFormSchema = z.object({
  exercises: z.array(strengthExerciseSchema).min(1, 'At least one exercise is required'),
});

type StrengthFormData = z.infer<typeof strengthFormSchema>;

interface StrengthFormProps {
  onSubmit: (data: StrengthData) => void;
  initialData?: StrengthData;
}

export default function StrengthForm({ onSubmit, initialData }: StrengthFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StrengthFormData>({
    resolver: zodResolver(strengthFormSchema),
    defaultValues: initialData || {
      exercises: [
        {
          name: '',
          sets: [{ weight: 0, reps: 0 }],
        },
      ],
    },
  });

  const { fields: exercises, append: appendExercise, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercises',
  });

  const handleFormSubmit = (data: StrengthFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
        className="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        + Add Exercise
      </button>

      {/* Form Error */}
      {errors.exercises?.root && (
        <p className="text-sm text-red-600">{errors.exercises.root.message}</p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Save Workout
      </button>
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
}

function ExerciseField({
  exerciseIndex,
  register,
  control,
  errors,
  removeExercise,
  canRemoveExercise,
}: ExerciseFieldProps) {
  const { fields: sets, append: appendSet, remove: removeSet } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-4">
      {/* Exercise Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label
            htmlFor={`exercises.${exerciseIndex}.name`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Exercise Name
          </label>
          <input
            {...register(`exercises.${exerciseIndex}.name`)}
            type="text"
            placeholder="e.g., Bench Press"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Remove Exercise
          </button>
        )}
      </div>

      {/* Sets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Sets</h4>
        {sets.map((set, setIndex) => (
          <div key={set.id} className="flex items-start gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[3rem]">
              Set {setIndex + 1}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Weight (lbs)
                </label>
                <input
                  {...register(`exercises.${exerciseIndex}.sets.${setIndex}.weight`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.exercises?.[exerciseIndex]?.sets?.[setIndex]?.weight && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.exercises[exerciseIndex].sets[setIndex].weight.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Reps
                </label>
                <input
                  {...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="1"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.exercises?.[exerciseIndex]?.sets?.[setIndex]?.reps && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.exercises[exerciseIndex].sets[setIndex].reps.message}
                  </p>
                )}
              </div>
            </div>
            {sets.length > 1 && (
              <button
                type="button"
                onClick={() => removeSet(setIndex)}
                className="px-2 py-2 text-sm text-red-600 hover:text-red-700 focus:outline-none"
                aria-label="Remove set"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      <button
        type="button"
        onClick={() => appendSet({ weight: 0, reps: 0 })}
        className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        + Add Set
      </button>

      {/* Exercise-level errors */}
      {errors.exercises?.[exerciseIndex]?.sets?.root && (
        <p className="text-sm text-red-600">
          {errors.exercises[exerciseIndex].sets.root.message}
        </p>
      )}
    </div>
  );
}
