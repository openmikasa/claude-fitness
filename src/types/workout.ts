// Exercise and junction table types
export interface Exercise {
  id: string;
  name: string;
  category?: string;
  muscle_groups: string[]; // DEPRECATED - kept for backward compatibility
  primary_muscles?: string[]; // NEW - primary movers
  secondary_muscles?: string[]; // NEW - stabilizers/synergists
  equipment?: string[];
  user_id?: string | null; // NULL for global exercises, user UUID for custom
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  equipment: string[];
  sets_data: WeightliftingSet[];
  created_at: string;
  updated_at: string;
  exercises?: Exercise;  // Joined data
}

// Weightlifting workout structures
export interface WeightliftingSet {
  weight: number;
  reps: number;
  unit?: 'kg' | 'lb';  // Optional for backward compatibility - assume kg if not present
  notes?: string;  // Per-set notes
}

export interface WeightliftingExercise {
  name: string;
  sets: WeightliftingSet[];
}

export interface WeightliftingData {
  exercises: WeightliftingExercise[];
}

// Main workout interface (weightlifting only)
export interface Workout {
  id: string;
  user_id: string;
  workout_type: 'weightlifting'; // Literal type - always weightlifting
  workout_date: string; // ISO date string
  data: WeightliftingData; // No longer a union
  notes?: string;
  created_at: string;
  updated_at: string;
  workout_exercises?: WorkoutExercise[];  // Optional for backward compat
}

// Form types for creating/editing workouts
export interface CreateWorkoutInput {
  workout_date: string;
  data: WeightliftingData; // Direct type, not unknown
  notes?: string;
  // workout_type removed - always 'weightlifting'
}

export interface UpdateWorkoutInput extends Partial<CreateWorkoutInput> {
  id: string;
}

// Program types
export type ProgramType = 'next_session' | 'weekly_plan';
export type ProgramStatus = 'pending' | 'active' | 'completed';

export interface ProgramDay {
  day: number;
  data: WeightliftingData; // Always weightlifting data
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

// Workout filtering
export interface WorkoutFilters {
  // workout_type removed - always weightlifting
  date_from?: string;
  date_to?: string;
  search?: string;
  exercise_search?: string;
  equipment?: string[];
  muscle_groups?: string[];
  page?: number;
  pageSize?: number;
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
