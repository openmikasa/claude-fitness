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
  exercise_id?: string; // Optional: linked exercise ID
  equipment?: string[]; // Optional: equipment used
  muscle_groups?: string[]; // Optional: muscles worked
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
  program_id?: string; // Link to AI program
  program_day_index?: number; // Zero-based index into program.plan_data
  created_at: string;
  updated_at: string;
  workout_exercises?: WorkoutExercise[];  // Optional for backward compat
}

// Form types for creating/editing workouts
export interface CreateWorkoutInput {
  workout_date: string;
  data: WeightliftingData; // Direct type, not unknown
  notes?: string;
  program_id?: string; // Optional link to program
  program_day_index?: number; // Optional day index (0-based)
  // workout_type removed - always 'weightlifting'
}

export interface UpdateWorkoutInput extends Partial<CreateWorkoutInput> {
  id: string;
}

// Mesocycle info for multi-week periodized programs
export type PeriodizationModel = 'linear' | 'undulating' | 'block';

export interface MesocycleInfo {
  total_weeks: number;
  workouts_per_week: number; // NEW: 1-7 workouts per week
  deload_weeks: number[]; // Week numbers that are deloads (e.g., [4, 8])
  periodization_model: PeriodizationModel;
  phase?: string; // e.g., "hypertrophy", "strength", "power"
}

// Program types
export type ProgramType = 'next_session' | 'weekly_plan';
export type ProgramStatus = 'pending' | 'active' | 'completed';

export interface ProgramDay {
  week: number; // Required: 1-12 (which week)
  workout_index: number; // Required: 1-N (workout number within the week)
  is_deload?: boolean; // Optional: flag for deload days
  data: WeightliftingData; // Always weightlifting data
  coaching_notes: string;
  day?: number; // DEPRECATED: kept for backward compatibility (1-84)
}

export interface Program {
  id: string;
  user_id: string;
  program_type: ProgramType;
  mesocycle_info?: MesocycleInfo; // Optional for multi-week programs
  plan_data: ProgramDay[];
  status: ProgramStatus;
  rationale: string;
  created_at: string;
}

export interface CreateProgramInput {
  program_type: ProgramType;
  mesocycle_info?: MesocycleInfo;
  plan_data: ProgramDay[];
  status: ProgramStatus;
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

// Program refresh types
export interface RefreshProgramRequest {
  program_id: string;
  from_today?: boolean; // Default true, regenerate from current day forward
}

export interface RefreshProgramResponse {
  updated_program: Program;
  changes_summary: {
    days_analyzed: number; // How many completed workouts
    days_regenerated: number; // How many future days updated
    key_adjustments: string[]; // ["Bench Press: 100kg → 110kg", ...]
  };
  rationale: string; // AI explanation of changes
}

export interface ProgramWithProgress extends Program {
  completed_days: number[]; // Indices of days with logged workouts
  completion_rate: number; // Percentage (0-100)
}
