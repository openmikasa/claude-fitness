// Core workout types
export type WorkoutType = 'strength' | 'cardio' | 'sauna' | 'mobility';

// Strength workout structures
export interface StrengthSet {
  weight: number;
  reps: number;
}

export interface StrengthExercise {
  name: string;
  sets: StrengthSet[];
}

export interface StrengthData {
  exercises: StrengthExercise[];
}

// Cardio workout structures
export type CardioType = 'running' | 'cycling' | 'swimming' | 'rowing';

export interface CardioData {
  type: CardioType;
  time_minutes: number;
  distance_km?: number;
  pace?: string; // e.g., "5:46/km"
}

// Sauna workout structure
export interface SaunaData {
  duration_minutes: number;
  temperature_celsius?: number;
}

// Mobility workout structure
export interface MobilityExercise {
  name: string;
  duration_minutes: number;
}

export interface MobilityData {
  exercises: MobilityExercise[];
}

// Union type for all workout data
export type WorkoutData = StrengthData | CardioData | SaunaData | MobilityData;

// Main workout interface
export interface Workout {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  workout_date: string; // ISO date string
  data: WorkoutData;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Form types for creating/editing workouts
export interface CreateWorkoutInput {
  workout_type: WorkoutType;
  workout_date: string;
  data: WorkoutData;
  notes?: string;
}

export interface UpdateWorkoutInput extends Partial<CreateWorkoutInput> {
  id: string;
}

// Program types
export type ProgramType = 'next_session' | 'weekly_plan';
export type ProgramStatus = 'pending' | 'active' | 'completed';

export interface ProgramDay {
  day: number;
  workout_type: WorkoutType;
  data: WorkoutData;
  coaching_notes: string;
}

export interface Program {
  id: string;
  user_id: string;
  program_type: ProgramType;
  plan_data: ProgramDay[];
  status: ProgramStatus;
  valid_from: string;
  valid_until: string;
  rationale: string;
  created_at: string;
}

export interface CreateProgramInput {
  program_type: ProgramType;
  plan_data: ProgramDay[];
  status: ProgramStatus;
  valid_from: string;
  valid_until: string;
  rationale: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface WorkoutListResponse {
  workouts: Workout[];
  total: number;
  page: number;
  pageSize: number;
}
