'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  usePrograms,
  useUpdateProgramStatus,
  useRefreshProgram,
  useDeleteProgram,
  useProgramWorkouts,
} from '@/lib/hooks/useAI';
import { displayWeight } from '@/lib/utils/unit-conversion';
import { useSettings } from '@/lib/hooks/useSettings';
import RefreshChangesModal from './refresh-changes-modal';
import type { Program, ProgramDay, RefreshProgramResponse } from '@/types/workout';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function ProgramManager() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<ProgramDay | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [refreshNotes, setRefreshNotes] = useState('');
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshResult, setRefreshResult] = useState<RefreshProgramResponse | null>(null);
  const [fixedPrograms, setFixedPrograms] = useState<Set<string>>(new Set());

  const { data: programs = [], isLoading } = usePrograms();
  const updateStatusMutation = useUpdateProgramStatus();
  const refreshMutation = useRefreshProgram();
  const deleteMutation = useDeleteProgram();
  const { data: settings } = useSettings();

  // Cleanup exercise names mutation
  const cleanupProgramsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/cleanup-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cleanup programs');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('[Cleanup Success]', data);
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      await queryClient.refetchQueries({ queryKey: ['programs'] });
      alert(`✅ Cleanup Complete!\n\n${data.message}\n\nUpdated: ${data.updated}/${data.total} programs\n\nExercise names are now normalized with equipment separated.`);
      window.location.reload();
    },
    onError: (error) => {
      console.error('Failed to cleanup programs:', error);
      alert(`❌ Cleanup Failed\n\n${error.message}`);
    },
  });

  // Fix program week numbers mutation
  const fixWeeksMutation = useMutation({
    mutationFn: async ({ programId, silent }: { programId: string; silent?: boolean }) => {
      const response = await fetch('/api/ai/fix-program-weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fix program weeks');
      }
      const data = await response.json();
      return { ...data, silent, programId };
    },
    onSuccess: async (data) => {
      console.log('[Fix Success]', data);
      // Mark this program as fixed
      setFixedPrograms(prev => new Set(prev).add(data.programId));
      // Invalidate and refetch programs
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      await queryClient.refetchQueries({ queryKey: ['programs'] });

      if (!data.silent) {
        alert(`Success! Fixed ${data.totalWorkouts} workouts:\n- ${data.totalWeeks} weeks\n- ${data.workoutsPerWeek} workouts per week\n\nRefreshing page...`);
        window.location.reload();
      }
    },
    onError: (error) => {
      console.error('Failed to fix program weeks:', error);
      alert(`Error: ${error.message}\n\nCheck the console for details.`);
    },
  });

  // Get selected program
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // Fetch workouts for selected program
  const { data: programWorkouts } = useProgramWorkouts(selectedProgramId || undefined);

  // Auto-fix week numbers if they're incorrect
  useEffect(() => {
    if (!selectedProgram || !selectedProgram.plan_data) return;
    if (fixedPrograms.has(selectedProgram.id)) return; // Skip if already fixed
    if (fixWeeksMutation.isPending) return; // Skip if already fixing

    const planData = selectedProgram.plan_data;
    const totalWeeks = selectedProgram.mesocycle_info?.total_weeks || 4;
    const expectedWorkoutsPerWeek = Math.ceil(planData.length / totalWeeks);

    // Check if week numbers are sequential and correct
    let needsFix = false;
    planData.forEach((workout, index) => {
      const expectedWeek = Math.floor(index / expectedWorkoutsPerWeek) + 1;
      const expectedWorkoutIndex = (index % expectedWorkoutsPerWeek) + 1;

      if (workout.week !== expectedWeek || workout.workout_index !== expectedWorkoutIndex) {
        needsFix = true;
      }
    });

    if (needsFix) {
      console.log('[Auto-Fix] Detected incorrect week numbers, auto-fixing...');
      fixWeeksMutation.mutate({ programId: selectedProgram.id, silent: true });
    }
  }, [selectedProgram?.id, selectedProgram?.plan_data, fixedPrograms]);

  // Calculate weeks from plan data - group by week field instead of slicing by 7
  const weeks = useMemo(() => {
    if (!selectedProgram || !selectedProgram.plan_data) return [];

    const weekMap = new Map<number, ProgramDay[]>();

    selectedProgram.plan_data.forEach((workout) => {
      // Use week field if available, otherwise fallback to computing from day (backward compat)
      const weekNum = workout.week || (workout.day ? Math.floor((workout.day - 1) / 7) + 1 : 1);
      if (!weekMap.has(weekNum)) {
        weekMap.set(weekNum, []);
      }
      weekMap.get(weekNum)!.push(workout);
    });

    // Sort workouts within each week by workout_index (or day for backward compat)
    weekMap.forEach((workouts) => {
      workouts.sort((a, b) => {
        const aIndex = a.workout_index || (a.day ? ((a.day - 1) % 7) + 1 : 0);
        const bIndex = b.workout_index || (b.day ? ((b.day - 1) % 7) + 1 : 0);
        return aIndex - bIndex;
      });
    });

    // Convert to array of weeks
    return Array.from(weekMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, workouts]) => workouts);
  }, [selectedProgram]);

  // Check if current week is a deload week
  const isDeloadWeek = (weekIndex: number): boolean => {
    if (!selectedProgram?.mesocycle_info?.deload_weeks) return false;
    return selectedProgram.mesocycle_info.deload_weeks.includes(weekIndex + 1);
  };

  // Calculate which workout index we're on (based on completed workouts)
  const currentWorkoutIndex = useMemo(() => {
    if (!selectedProgram || !programWorkouts) return -1;

    const completedIndices = programWorkouts.map(w => w.program_day_index || 0);
    if (completedIndices.length === 0) return 0;

    const lastCompletedIndex = Math.max(...completedIndices);
    return lastCompletedIndex + 1; // Next uncompleted workout
  }, [selectedProgram, programWorkouts]);

  const handleActivateProgram = (programId: string) => {
    updateStatusMutation.mutate({ id: programId, status: 'active' });
  };

  const handleDeactivateProgram = (programId: string) => {
    updateStatusMutation.mutate({ id: programId, status: 'pending' });
  };

  const handleRefreshProgram = async () => {
    if (!selectedProgram) return;
    try {
      const result = await refreshMutation.mutateAsync({
        program_id: selectedProgram.id,
        from_today: true,
      });
      setRefreshResult(result);
      setShowRefreshModal(true);
      setRefreshNotes(''); // Clear notes after refresh
    } catch (error) {
      console.error('Failed to refresh program:', error);
    }
  };

  const handleDeleteProgram = (programId: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      deleteMutation.mutate(programId);
      if (selectedProgramId === programId) {
        setSelectedProgramId(null);
      }
    }
  };

  const isCompletedWorkout = (week: number, workoutIndex: number): boolean => {
    if (!programWorkouts || !selectedProgram) return false;

    // Find the array index for this week/workout combination
    const workoutArrayIndex = selectedProgram.plan_data.findIndex(
      (w) => w.week === week && w.workout_index === workoutIndex
    );

    if (workoutArrayIndex === -1) return false;
    return programWorkouts.some((w) => w.program_day_index === workoutArrayIndex);
  };

  const formatDayDetails = (day: ProgramDay) => {
    const weightliftingData = day.data;
    return weightliftingData.exercises.map((ex) => {
      const { value, unit } = displayWeight(ex.sets[0].weight, settings?.units || 'metric');
      return (
        <div key={ex.name} className='text-sm'>
          <span className='font-medium'>{ex.name}:</span> {ex.sets.length} sets × {ex.sets[0].reps} reps @ {value}{unit}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className='bg-white rounded-2xl shadow-md p-6'>
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white border-3 border-black rounded-sm p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <span className='text-xl'>📁</span>
          <h2 className='text-xl font-bold text-black'>My Programs</h2>
        </div>
        {programs.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clean up all programs?\n\nThis will normalize exercise names (e.g., "Hax Deadlift" → "Deadlift" with equipment "Hax Barbell").\n\nThis is safe and reversible.')) {
                cleanupProgramsMutation.mutate();
              }
            }}
            disabled={cleanupProgramsMutation.isPending}
            className='flex items-center gap-1 px-3 py-1.5 text-[#22FF00] border-2 border-[#22FF00] rounded-sm text-sm font-bold hover:bg-[#22FF00] hover:text-black transition-colors disabled:opacity-50'
          >
            <span>✏️</span> {cleanupProgramsMutation.isPending ? 'Cleaning...' : 'Clean Names'}
          </button>
        )}
      </div>

      {programs.length === 0 ? (
        <div className='text-center py-8 text-gray-600'>
          <p>No programs yet</p>
          <p className='text-sm mt-2'>Generate your first training program above!</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Program List */}
          <div className='space-y-3'>
            {programs.map((program) => {
              const isSelected = selectedProgramId === program.id;
              const isActive = program.status === 'active';

              return (
                <div
                  key={program.id}
                  className={`bg-white border-3 border-black ${
                    isActive ? 'border-l-[6px] border-l-[#FDE047]' : ''
                  } rounded-sm p-5 transition-all cursor-pointer ${
                    isSelected ? 'shadow-brutal-lg' : 'hover:shadow-brutal'
                  }`}
                  onClick={() => setSelectedProgramId(isSelected ? null : program.id)}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        <h3 className='font-bold text-black capitalize'>
                          {program.program_type.replace('_', ' ')}
                        </h3>
                        {isActive && (
                          <span className='px-2 py-0.5 bg-[#FDE047] text-black text-xs font-bold uppercase border-2 border-black'>
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className='text-sm space-y-1'>
                        <p className='text-gray-500 font-mono'>Created {format(parseISO(program.created_at), 'MMM d, yyyy')}</p>
                        {program.mesocycle_info && (
                          <p className='text-[#8B5CF6] font-medium'>
                            {program.mesocycle_info.total_weeks}-week {program.mesocycle_info.periodization_model} • {program.mesocycle_info.phase} phase
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='flex flex-col gap-2 ml-4'>
                      {program.status === 'active' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivateProgram(program.id);
                          }}
                          disabled={updateStatusMutation.isPending}
                          className='px-3 py-1.5 text-sm font-bold border-2 border-black rounded-sm hover:bg-gray-100 transition-colors disabled:opacity-50'
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateProgram(program.id);
                          }}
                          disabled={updateStatusMutation.isPending}
                          className='px-3 py-1.5 text-sm font-bold border-2 border-black rounded-sm hover:bg-gray-100 transition-colors disabled:opacity-50'
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProgram(program.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className='px-3 py-1.5 text-sm font-bold border-2 border-black rounded-sm hover:bg-gray-100 transition-colors disabled:opacity-50'
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {!isSelected && program.plan_data && (
                    <p className='text-xs text-gray-500 mt-2'>
                      {program.plan_data.length} workout{program.plan_data.length !== 1 ? 's' : ''} • Click to view details
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Program Details */}
          {selectedProgram && (
            <div className='border-t-2 border-gray-200 pt-6 space-y-4'>
              {/* Week Navigation */}
              {weeks.length > 1 && (
                <div className='flex items-center justify-between py-4 border-b-3 border-black mb-4'>
                  <button
                    onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                    disabled={currentWeek === 0}
                    className='text-sm font-bold text-black hover:text-[#22FF00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    ← Prev
                  </button>
                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-black uppercase'>
                      WEEK {currentWeek + 1} OF {weeks.length}
                    </span>
                    {isDeloadWeek(currentWeek) && (
                      <span className='bg-[#FDE047] text-black text-xs px-2 py-0.5 font-bold uppercase border-2 border-black'>
                        DELOAD
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentWeek(Math.min(weeks.length - 1, currentWeek + 1))}
                    disabled={currentWeek === weeks.length - 1}
                    className='text-sm font-bold text-black hover:text-[#22FF00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Current Week Workouts Grid */}
              {weeks[currentWeek] && (
                <div
                  className='grid gap-2 mb-4'
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(weeks[currentWeek].length, 7)}, minmax(0, 1fr))`
                  }}
                >
                  {weeks[currentWeek].map((workout) => {
                    const weekNum = workout.week || currentWeek + 1;
                    const workoutIndex = workout.workout_index || 1;
                    const isSelected = selectedWorkout?.week === weekNum && selectedWorkout?.workout_index === workoutIndex;
                    const isCurrent = currentWorkoutIndex === selectedProgram.plan_data.findIndex(
                      (w) => w.week === weekNum && w.workout_index === workoutIndex
                    );
                    const isCompleted = isCompletedWorkout(weekNum, workoutIndex);

                    let btnClass = 'bg-white border-2 border-black hover:border-[#8B5CF6] transition-colors';
                    let borderLeft = '';

                    if (isSelected) {
                      btnClass = 'bg-white border-2 border-[#8B5CF6]';
                      borderLeft = 'border-l-4 border-l-[#8B5CF6]';
                    } else if (isCompleted) {
                      btnClass = 'bg-white border-2 border-black';
                      borderLeft = 'border-l-4 border-l-[#8B5CF6]';
                    } else {
                      borderLeft = 'border-l-4 border-l-[#8B5CF6]';
                    }

                    return (
                      <button
                        key={`${weekNum}-${workoutIndex}`}
                        onClick={() => setSelectedWorkout(isSelected ? null : workout)}
                        className={`relative p-4 text-left ${btnClass} ${borderLeft}`}
                      >
                        {isCurrent && (
                          <span className='absolute -top-2 -right-2 bg-[#22FF00] text-black text-[10px] font-bold px-2 py-0.5 border-2 border-black'>
                            NEXT
                          </span>
                        )}
                        {isCompleted && !isCurrent && (
                          <div className='absolute top-1 right-1 text-green-600 text-sm font-bold'>✓</div>
                        )}
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-wider font-mono mb-1'>
                          WORKOUT {workoutIndex}
                        </p>
                        <p className='text-base font-bold'>💪 Strength</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Workout Details */}
              {selectedWorkout !== null && (() => {
                try {
                  // Compute backward-compatible values for display
                  const displayWeek = selectedWorkout.week ||
                    (selectedWorkout.day ? Math.floor((selectedWorkout.day - 1) / 7) + 1 : currentWeek + 1);
                  const displayWorkout = selectedWorkout.workout_index ||
                    (selectedWorkout.day ? ((selectedWorkout.day - 1) % 7) + 1 : 1);

                  // Find array index using either new fields or old day field
                  const arrayIndex = selectedProgram.plan_data.findIndex((w) => {
                    if (w.week && w.workout_index) {
                      // New format: match by week + workout_index
                      return w.week === selectedWorkout.week &&
                             w.workout_index === selectedWorkout.workout_index;
                    } else {
                      // Old format: match by day
                      return w.day === selectedWorkout.day;
                    }
                  });

                  return (
                    <div className='border-3 border-black rounded-sm overflow-hidden'>
                      {/* Purple Header */}
                      <div className='bg-[#8B5CF6] px-4 py-3'>
                        <h3 className='text-white font-bold uppercase'>WEEK {displayWeek}, WORKOUT {displayWorkout}</h3>
                      </div>

                      {/* Exercise List */}
                      <div className='bg-white p-4 space-y-2 font-mono text-sm'>
                        {selectedWorkout.data.exercises.map((ex) => {
                          const { value, unit } = displayWeight(ex.sets[0].weight, settings?.units || 'metric');
                          return (
                            <p key={ex.name}>
                              <span className='font-bold'>{ex.name}:</span> {ex.sets.length} sets × {ex.sets[0].reps} reps @ {value}{unit}
                            </p>
                          );
                        })}
                      </div>

                      {/* Coaching Notes */}
                      <div className='mx-4 mb-4 p-3 bg-[#FDE047] border-2 border-dashed border-black'>
                        <p className='text-xs font-bold uppercase tracking-wider text-black mb-1 border-2 border-black bg-white inline-block px-2'>
                          COACHING NOTES
                        </p>
                        <p className='text-sm text-black mt-2'>
                          {selectedWorkout.coaching_notes}
                        </p>
                      </div>

                      {/* Log Button */}
                      <div className='p-4 pt-0'>
                        <button
                          onClick={() => {
                            router.push(`/workouts/log?programId=${selectedProgram.id}&dayIndex=${arrayIndex}`);
                          }}
                          className='w-full bg-[#8B5CF6] text-white px-4 py-4 border-3 border-black rounded-sm font-bold uppercase flex items-center justify-center gap-2 shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
                        >
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={2.5}>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' />
                          </svg>
                          LOG THIS WORKOUT
                        </button>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering workout details:', error, selectedWorkout);
                  return (
                    <div className='bg-red-50 rounded-2xl p-4 border-2 border-red-200'>
                      <p className='text-sm text-red-700'>
                        Unable to display workout details. This program may be using an old format.
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Plan Overview */}
              <div className='bg-gray-50 rounded-2xl p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>Plan Overview</h4>
                <p className='text-sm text-gray-700'>{selectedProgram.rationale}</p>
              </div>

              {/* Refresh Program Section (only for active programs) */}
              {selectedProgram.status === 'active' && (
                <div className='bg-blue-50 rounded-2xl p-4 border-2 border-blue-200'>
                  <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <span>🔄</span>
                    Refresh Program Based on Progress
                  </h4>
                  <p className='text-sm text-gray-700 mb-3'>
                    AI will analyze your completed workouts and adjust remaining days based on your performance.
                  </p>

                  <textarea
                    value={refreshNotes}
                    onChange={(e) => setRefreshNotes(e.target.value)}
                    placeholder='Optional: Add any specific adjustments or concerns (e.g., "Lower back feeling tight", "Want to focus more on upper body")'
                    rows={3}
                    className='w-full px-3 py-2 border border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white'
                  />

                  <button
                    onClick={handleRefreshProgram}
                    disabled={refreshMutation.isPending}
                    className='mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-2xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {refreshMutation.isPending ? 'Analyzing & Refreshing...' : 'Refresh Program'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showRefreshModal && refreshResult && (
        <RefreshChangesModal
          changes={refreshResult.changes_summary}
          rationale={refreshResult.rationale}
          onClose={() => setShowRefreshModal(false)}
        />
      )}
    </div>
  );
}
