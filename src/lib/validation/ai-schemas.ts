import { z } from 'zod';
import {
  weightliftingDataSchema,
} from './workout-schemas';

// Next Session Response Schema (weightlifting only)
export const nextSessionResponseSchema = z.object({
  data: weightliftingDataSchema, // Always weightlifting data
  rationale: z.string().min(10, 'Rationale must be at least 10 characters'),
  coaching_notes: z
    .string()
    .min(10, 'Coaching notes must be at least 10 characters'),
});

export type NextSessionResponse = z.infer<typeof nextSessionResponseSchema>;

// Program Day Schema (weightlifting only)
export const programDaySchema = z.object({
  week: z.number().int().min(1).max(12), // Required: which week (1-12)
  workout_index: z.number().int().min(1).max(7), // Required: workout number within the week (1-7)
  is_deload: z.boolean().optional(), // Flag for deload days
  data: weightliftingDataSchema, // Always weightlifting data
  coaching_notes: z.string().min(5, 'Coaching notes required'),
  day: z.number().int().min(1).max(84).optional(), // DEPRECATED: kept for backward compatibility
});

export type ProgramDay = z.infer<typeof programDaySchema>;

// Mesocycle Info Schema for multi-week programs
export const mesocycleInfoSchema = z.object({
  total_weeks: z.number().int().min(1).max(12),
  workouts_per_week: z.number().int().min(1).max(7), // NEW: 1-7 workouts per week
  deload_weeks: z.array(z.number().int()), // Which weeks are deloads (e.g., [4, 8])
  periodization_model: z.enum(['linear', 'undulating', 'block']),
  phase: z.string().optional(), // e.g., "hypertrophy", "strength"
});

export type MesocycleInfo = z.infer<typeof mesocycleInfoSchema>;

// Weekly Plan Response Schema (supports 1-12 weeks)
export const weeklyPlanResponseSchema = z.object({
  program_type: z.literal('weekly_plan'),
  mesocycle_info: mesocycleInfoSchema.optional(), // Optional for multi-week programs
  plan_data: z
    .array(programDaySchema)
    .min(1, 'Program must have at least 1 workout')
    .max(84, 'Program cannot exceed 84 workouts (12 weeks × 7 workouts)'),
  rationale: z.string().min(10, 'Rationale must be at least 10 characters'),
});

export type WeeklyPlanResponse = z.infer<typeof weeklyPlanResponseSchema>;
