'use client';

import { useEffect } from 'react';
import { usePrograms } from '@/lib/hooks/useAI';
import type { Program, WeightliftingData } from '@/types/workout';

interface ProgramDaySelectorProps {
  onSelect: (selection: {
    programId: string;
    dayIndex: number;
    scheduledDate: string;
    exercises: WeightliftingData;
  }) => void;
  activeOnly?: boolean;
  initialSelection?: {
    programId: string;
    dayIndex: number;
  };
}

export default function ProgramDaySelector({ onSelect, activeOnly = true, initialSelection }: ProgramDaySelectorProps) {
  const { data: programs, isLoading } = usePrograms(
    activeOnly ? { status: 'active' } : {}
  );

  // Auto-select if initial selection is provided
  useEffect(() => {
    if (initialSelection && programs && programs.length > 0) {
      const value = `${initialSelection.programId}|${initialSelection.dayIndex}`;
      // Find the program and workout
      const program = programs.find((p) => p.id === initialSelection.programId);
      if (program && program.plan_data[initialSelection.dayIndex]) {
        const day = program.plan_data[initialSelection.dayIndex];

        // Validate data structure before calling onSelect
        if (!day.data || !day.data.exercises || day.data.exercises.length === 0) {
          console.warn('Program workout has invalid data structure:', day);
          return; // Don't call onSelect if data is malformed
        }

        const scheduledDate = new Date().toISOString(); // Use today's date

        onSelect({
          programId: initialSelection.programId,
          dayIndex: initialSelection.dayIndex,
          scheduledDate,
          exercises: day.data,
        });
      }
    }
  }, [initialSelection, programs, onSelect]);

  if (isLoading) {
    return (
      <select className="w-full px-4 py-3 bg-white text-black border-3 border-black rounded-sm font-bold" disabled>
        <option>Loading programs...</option>
      </select>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <select className="w-full px-4 py-3 bg-white text-black border-3 border-black rounded-sm font-bold" disabled>
        <option>No active programs</option>
      </select>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;

    const [programId, dayIndexStr] = value.split('|');
    const dayIndex = parseInt(dayIndexStr, 10);

    const program = programs.find((p) => p.id === programId);
    if (!program || !program.plan_data[dayIndex]) return;

    const day = program.plan_data[dayIndex];

    // Validate data structure before calling onSelect
    if (!day.data || !day.data.exercises || day.data.exercises.length === 0) {
      console.warn('Program workout has invalid data structure:', day);
      return; // Don't call onSelect if data is malformed
    }

    // Use today's date as the scheduled date
    const scheduledDate = new Date().toISOString();

    onSelect({
      programId,
      dayIndex,
      scheduledDate,
      exercises: day.data,
    });
  };

  return (
    <select
      onChange={handleChange}
      className="w-full px-4 py-3 bg-white text-black border-3 border-black rounded-sm font-bold focus:outline-none focus:border-[#22FF00] cursor-pointer appearance-none"
      defaultValue={initialSelection ? `${initialSelection.programId}|${initialSelection.dayIndex}` : ""}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px', paddingRight: '48px' }}
    >
      <option value="">Select a program workout (optional)</option>
      {programs.map((program) => {
        const totalWeeks = program.mesocycle_info?.total_weeks || 1;
        const programLabel = `${totalWeeks}-week ${program.mesocycle_info?.periodization_model || 'Program'}`;

        return (
          <optgroup key={program.id} label={programLabel}>
            {program.plan_data.map((workout, index) => {
              // Use week and workout_index if available, otherwise compute from index (backward compat)
              const weekNum = workout.week || Math.floor(index / 7) + 1;
              const workoutNum = workout.workout_index || (index % 7) + 1;

              // Get first 2-3 exercise names for preview
              const exerciseNames = workout.data.exercises
                .slice(0, 3)
                .map((ex) => ex.name)
                .join(', ');

              const exercisePreview =
                workout.data.exercises.length > 3
                  ? `${exerciseNames}, ...`
                  : exerciseNames;

              return (
                <option key={index} value={`${program.id}|${index}`}>
                  Week {weekNum}, Workout {workoutNum} - {exercisePreview}
                </option>
              );
            })}
          </optgroup>
        );
      })}
    </select>
  );
}
