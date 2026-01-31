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
  day: z.number().int().min(1).max(7),
  data: weightliftingDataSchema, // Always weightlifting data
  coaching_notes: z.string().min(5, 'Coaching notes required'),
});

export type ProgramDay = z.infer<typeof programDaySchema>;

// Weekly Plan Response Schema
export const weeklyPlanResponseSchema = z.object({
  program_type: z.literal('weekly_plan'),
  plan_data: z
    .array(programDaySchema)
    .length(7, 'Weekly plan must have exactly 7 days'),
  rationale: z.string().min(10, 'Rationale must be at least 10 characters'),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export type WeeklyPlanResponse = z.infer<typeof weeklyPlanResponseSchema>;
