import { z } from 'zod';
import type {
  WorkoutType,
  CardioType,
  StrengthData,
  CardioData,
  SaunaData,
  MobilityData,
  CreateWorkoutInput,
  UpdateWorkoutInput,
} from '@/types/workout';

// Strength Workout Schemas
export const strengthSetSchema = z.object({
  weight: z
    .number({
      required_error: 'Weight is required',
      invalid_type_error: 'Weight must be a number',
    })
    .positive('Weight must be a positive number'),
  reps: z
    .number({
      required_error: 'Reps is required',
      invalid_type_error: 'Reps must be a number',
    })
    .int('Reps must be a whole number')
    .positive('Reps must be a positive number'),
});

export const strengthExerciseSchema = z.object({
  name: z
    .string({
      required_error: 'Exercise name is required',
      invalid_type_error: 'Exercise name must be a string',
    })
    .min(1, 'Exercise name cannot be empty'),
  sets: z
    .array(strengthSetSchema, {
      required_error: 'Sets are required',
      invalid_type_error: 'Sets must be an array',
    })
    .min(1, 'At least one set is required'),
});

export const strengthDataSchema = z.object({
  exercises: z
    .array(strengthExerciseSchema, {
      required_error: 'Exercises are required',
      invalid_type_error: 'Exercises must be an array',
    })
    .min(1, 'At least one exercise is required'),
}) satisfies z.ZodType<StrengthData>;

// Cardio Workout Schemas
export const cardioTypeSchema = z.enum(['running', 'cycling', 'swimming', 'rowing'], {
  required_error: 'Cardio type is required',
  invalid_type_error: 'Invalid cardio type',
}) satisfies z.ZodType<CardioType>;

export const cardioDataSchema = z.object({
  type: cardioTypeSchema,
  time_minutes: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .positive('Duration must be a positive number'),
  distance_km: z
    .number({
      invalid_type_error: 'Distance must be a number',
    })
    .positive('Distance must be a positive number')
    .optional(),
  pace: z
    .string({
      invalid_type_error: 'Pace must be a string',
    })
    .optional(),
}) satisfies z.ZodType<CardioData>;

// Sauna Workout Schema
export const saunaDataSchema = z.object({
  duration_minutes: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .positive('Duration must be a positive number'),
  temperature_celsius: z
    .number({
      invalid_type_error: 'Temperature must be a number',
    })
    .positive('Temperature must be a positive number')
    .optional(),
}) satisfies z.ZodType<SaunaData>;

// Mobility Workout Schemas
export const mobilityExerciseSchema = z.object({
  name: z
    .string({
      required_error: 'Exercise name is required',
      invalid_type_error: 'Exercise name must be a string',
    })
    .min(1, 'Exercise name cannot be empty'),
  duration_minutes: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .positive('Duration must be a positive number'),
});

export const mobilityDataSchema = z.object({
  exercises: z
    .array(mobilityExerciseSchema, {
      required_error: 'Exercises are required',
      invalid_type_error: 'Exercises must be an array',
    })
    .min(1, 'At least one exercise is required'),
}) satisfies z.ZodType<MobilityData>;

// Workout Type Schema
export const workoutTypeSchema = z.enum(['strength', 'cardio', 'sauna', 'mobility'], {
  required_error: 'Workout type is required',
  invalid_type_error: 'Invalid workout type',
}) satisfies z.ZodType<WorkoutType>;

// Create Workout Input Schema with discriminated union
export const createWorkoutInputSchema = z
  .object({
    workout_type: workoutTypeSchema,
    workout_date: z
      .string({
        required_error: 'Workout date is required',
        invalid_type_error: 'Workout date must be a string',
      })
      .datetime('Workout date must be a valid ISO date string'),
    data: z.unknown(),
    notes: z
      .string({
        invalid_type_error: 'Notes must be a string',
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    // Validate data based on workout_type using discriminated union
    switch (val.workout_type) {
      case 'strength': {
        const result = strengthDataSchema.safeParse(val.data);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ['data', ...issue.path],
            });
          });
        }
        break;
      }
      case 'cardio': {
        const result = cardioDataSchema.safeParse(val.data);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ['data', ...issue.path],
            });
          });
        }
        break;
      }
      case 'sauna': {
        const result = saunaDataSchema.safeParse(val.data);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ['data', ...issue.path],
            });
          });
        }
        break;
      }
      case 'mobility': {
        const result = mobilityDataSchema.safeParse(val.data);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ['data', ...issue.path],
            });
          });
        }
        break;
      }
    }
  });

// Update Workout Input Schema
export const updateWorkoutInputSchema = z
  .object({
    id: z
      .string({
        required_error: 'Workout ID is required',
        invalid_type_error: 'Workout ID must be a string',
      })
      .min(1, 'Workout ID cannot be empty'),
    workout_type: workoutTypeSchema.optional(),
    workout_date: z
      .string({
        invalid_type_error: 'Workout date must be a string',
      })
      .datetime('Workout date must be a valid ISO date string')
      .optional(),
    data: z.unknown().optional(),
    notes: z
      .string({
        invalid_type_error: 'Notes must be a string',
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    // Only validate data if both workout_type and data are provided
    if (val.workout_type && val.data !== undefined) {
      switch (val.workout_type) {
        case 'strength': {
          const result = strengthDataSchema.safeParse(val.data);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                ...issue,
                path: ['data', ...issue.path],
              });
            });
          }
          break;
        }
        case 'cardio': {
          const result = cardioDataSchema.safeParse(val.data);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                ...issue,
                path: ['data', ...issue.path],
              });
            });
          }
          break;
        }
        case 'sauna': {
          const result = saunaDataSchema.safeParse(val.data);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                ...issue,
                path: ['data', ...issue.path],
              });
            });
          }
          break;
        }
        case 'mobility': {
          const result = mobilityDataSchema.safeParse(val.data);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                ...issue,
                path: ['data', ...issue.path],
              });
            });
          }
          break;
        }
      }
    }
  });

// Export inferred types
export type StrengthSetInput = z.infer<typeof strengthSetSchema>;
export type StrengthExerciseInput = z.infer<typeof strengthExerciseSchema>;
export type StrengthDataInput = z.infer<typeof strengthDataSchema>;
export type CardioDataInput = z.infer<typeof cardioDataSchema>;
export type SaunaDataInput = z.infer<typeof saunaDataSchema>;
export type MobilityExerciseInput = z.infer<typeof mobilityExerciseSchema>;
export type MobilityDataInput = z.infer<typeof mobilityDataSchema>;
export type CreateWorkoutInputValidated = z.infer<typeof createWorkoutInputSchema>;
export type UpdateWorkoutInputValidated = z.infer<typeof updateWorkoutInputSchema>;
