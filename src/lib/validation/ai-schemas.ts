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
  day: z.number().int().min(1).max(84), // Up to 12 weeks (84 days)
  week: z.number().int().min(1).max(12).optional(), // Which week (1-12)
  is_deload: z.boolean().optional(), // Flag for deload days
  data: weightliftingDataSchema, // Always weightlifting data
  coaching_notes: z.string().min(5, 'Coaching notes required'),
});

export type ProgramDay = z.infer<typeof programDaySchema>;

// Mesocycle Info Schema for multi-week programs
export const mesocycleInfoSchema = z.object({
  total_weeks: z.number().int().min(1).max(12),
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
    .min(7, 'Program must have at least 7 days')
    .max(84, 'Program cannot exceed 84 days (12 weeks)'),
  rationale: z.string().min(10, 'Rationale must be at least 10 characters'),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export type WeeklyPlanResponse = z.infer<typeof weeklyPlanResponseSchema>;
