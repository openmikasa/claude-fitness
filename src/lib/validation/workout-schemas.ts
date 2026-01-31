import { z } from 'zod';
import type {
  WeightliftingData,
  CreateWorkoutInput,
  UpdateWorkoutInput,
} from '@/types/workout';

// Weightlifting Workout Schemas
export const weightliftingSetSchema = z.object({
  weight: z
    .number({
      required_error: 'Weight is required',
      invalid_type_error: 'Weight must be a number',
    })
    .nonnegative('Weight must be 0 or greater (0 for bodyweight exercises)'),
  reps: z
    .number({
      required_error: 'Reps is required',
      invalid_type_error: 'Reps must be a number',
    })
    .int('Reps must be a whole number')
    .positive('Reps must be a positive number'),
  notes: z
    .string({
      invalid_type_error: 'Notes must be a string',
    })
    .optional(),
});

export const weightliftingExerciseSchema = z.object({
  name: z
    .string({
      required_error: 'Exercise name is required',
      invalid_type_error: 'Exercise name must be a string',
    })
    .min(1, 'Exercise name cannot be empty'),
  sets: z
    .array(weightliftingSetSchema, {
      required_error: 'Sets are required',
      invalid_type_error: 'Sets must be an array',
    })
    .min(1, 'At least one set is required'),
});

export const weightliftingDataSchema = z.object({
  exercises: z
    .array(weightliftingExerciseSchema, {
      required_error: 'Exercises are required',
      invalid_type_error: 'Exercises must be an array',
    })
    .min(1, 'At least one exercise is required'),
}) satisfies z.ZodType<WeightliftingData>;

// Create Workout Input Schema (weightlifting only)
export const createWorkoutInputSchema = z.object({
  workout_date: z
    .string({
      required_error: 'Workout date is required',
      invalid_type_error: 'Workout date must be a string',
    })
    .datetime('Workout date must be a valid ISO date string'),
  data: weightliftingDataSchema, // Direct schema, no discrimination
  notes: z
    .string({
      invalid_type_error: 'Notes must be a string',
    })
    .optional(),
}) satisfies z.ZodType<CreateWorkoutInput>;

// Update Workout Input Schema
export const updateWorkoutInputSchema = z.object({
  id: z
    .string({
      required_error: 'Workout ID is required',
      invalid_type_error: 'Workout ID must be a string',
    })
    .min(1, 'Workout ID cannot be empty'),
  workout_date: z
    .string({
      invalid_type_error: 'Workout date must be a string',
    })
    .datetime('Workout date must be a valid ISO date string')
    .optional(),
  data: weightliftingDataSchema.optional(),
  notes: z
    .string({
      invalid_type_error: 'Notes must be a string',
    })
    .optional(),
}) satisfies z.ZodType<UpdateWorkoutInput>;

// Export inferred types
export type WeightliftingSetInput = z.infer<typeof weightliftingSetSchema>;
export type WeightliftingExerciseInput = z.infer<typeof weightliftingExerciseSchema>;
export type WeightliftingDataInput = z.infer<typeof weightliftingDataSchema>;
export type CreateWorkoutInputValidated = z.infer<typeof createWorkoutInputSchema>;
export type UpdateWorkoutInputValidated = z.infer<typeof updateWorkoutInputSchema>;
