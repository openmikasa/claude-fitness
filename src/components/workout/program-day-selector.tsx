'use client';

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
}

export default function ProgramDaySelector({ onSelect, activeOnly = true }: ProgramDaySelectorProps) {
  const { data: programs, isLoading } = usePrograms(
    activeOnly ? { status: 'active' } : {}
  );

  if (isLoading) {
    return (
      <select className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" disabled>
        <option>Loading programs...</option>
      </select>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <select className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg" disabled>
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

    // Calculate scheduled date based on valid_from and day index
    const validFrom = new Date(program.valid_from);
    const scheduledDate = new Date(validFrom);
    scheduledDate.setDate(validFrom.getDate() + dayIndex);

    onSelect({
      programId,
      dayIndex,
      scheduledDate: scheduledDate.toISOString(),
      exercises: day.data,
    });
  };

  return (
    <select
      onChange={handleChange}
      className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      defaultValue=""
    >
      <option value="">Select a program day (optional)</option>
      {programs.map((program) => {
        const totalWeeks = program.mesocycle_info?.total_weeks || 1;
        const programLabel = `${totalWeeks}-week ${program.mesocycle_info?.periodization_model || 'Program'}`;

        return (
          <optgroup key={program.id} label={programLabel}>
            {program.plan_data.map((day, index) => {
              const weekNum = Math.floor(index / 7) + 1;
              const dayNum = (index % 7) + 1;

              // Get first 2-3 exercise names for preview
              const exerciseNames = day.data.exercises
                .slice(0, 3)
                .map((ex) => ex.name)
                .join(', ');

              const exercisePreview =
                day.data.exercises.length > 3
                  ? `${exerciseNames}, ...`
                  : exerciseNames;

              // Calculate scheduled date
              const validFrom = new Date(program.valid_from);
              const scheduledDate = new Date(validFrom);
              scheduledDate.setDate(validFrom.getDate() + index);
              const dateStr = scheduledDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <option key={index} value={`${program.id}|${index}`}>
                  Week {weekNum}, Day {dayNum} ({dateStr}) - {exercisePreview}
                </option>
              );
            })}
          </optgroup>
        );
      })}
    </select>
  );
}
