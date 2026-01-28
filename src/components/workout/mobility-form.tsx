'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MobilityData } from '@/types/workout';

const mobilityExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Name cannot exceed 100 characters'),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').max(120, 'Duration cannot exceed 120 minutes'),
});

const mobilitySchema = z.object({
  exercises: z.array(mobilityExerciseSchema).min(1, 'At least one exercise is required'),
});

type MobilityFormData = z.infer<typeof mobilitySchema>;

interface MobilityFormProps {
  onSubmit: (data: MobilityData) => void;
  initialData?: MobilityData;
}

export function MobilityForm({ onSubmit, initialData }: MobilityFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MobilityFormData>({
    resolver: zodResolver(mobilitySchema),
    defaultValues: initialData || {
      exercises: [{ name: '', duration_minutes: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  });

  const handleFormSubmit = (data: MobilityFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Exercises</h3>
          <button
            type="button"
            onClick={() => append({ name: '', duration_minutes: 0 })}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            + Add Exercise
          </button>
        </div>

        {errors.exercises?.root && (
          <p className="text-sm text-red-600">{errors.exercises.root.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-gray-200 rounded-lg space-y-4 bg-white"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Exercise {index + 1}
                </h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`exercises.${index}.name`}
                  className="block text-sm font-medium text-foreground"
                >
                  Name *
                </label>
                <input
                  id={`exercises.${index}.name`}
                  type="text"
                  {...register(`exercises.${index}.name`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="e.g., Hip Circles"
                />
                {errors.exercises?.[index]?.name && (
                  <p className="text-sm text-red-600">
                    {errors.exercises[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`exercises.${index}.duration_minutes`}
                  className="block text-sm font-medium text-foreground"
                >
                  Duration (minutes) *
                </label>
                <input
                  id={`exercises.${index}.duration_minutes`}
                  type="number"
                  {...register(`exercises.${index}.duration_minutes`, {
                    valueAsNumber: true,
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="e.g., 5"
                />
                {errors.exercises?.[index]?.duration_minutes && (
                  <p className="text-sm text-red-600">
                    {errors.exercises[index]?.duration_minutes?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Save Mobility Session
      </button>
    </form>
  );
}
