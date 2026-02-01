'use client';

import { useState, useMemo } from 'react';
import { format, addDays, parseISO, differenceInDays, startOfDay } from 'date-fns';
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

export function ProgramManager() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [refreshNotes, setRefreshNotes] = useState('');
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshResult, setRefreshResult] = useState<RefreshProgramResponse | null>(null);

  const { data: programs = [], isLoading } = usePrograms();
  const updateStatusMutation = useUpdateProgramStatus();
  const refreshMutation = useRefreshProgram();
  const deleteMutation = useDeleteProgram();
  const { data: settings } = useSettings();

  // Get selected program
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);

  // Fetch workouts for selected program
  const { data: programWorkouts } = useProgramWorkouts(selectedProgramId || undefined);

  // Calculate weeks from plan data
  const weeks = useMemo(() => {
    if (!selectedProgram || !selectedProgram.plan_data) return [];

    const totalDays = selectedProgram.plan_data.length;
    const weeksArray: ProgramDay[][] = [];

    for (let i = 0; i < totalDays; i += 7) {
      weeksArray.push(selectedProgram.plan_data.slice(i, i + 7));
    }

    return weeksArray;
  }, [selectedProgram]);

  // Check if current week is a deload week
  const isDeloadWeek = (weekIndex: number): boolean => {
    if (!selectedProgram?.mesocycle_info?.deload_weeks) return false;
    return selectedProgram.mesocycle_info.deload_weeks.includes(weekIndex + 1);
  };

  // Calculate which day we're on (if plan is active)
  const todayIndex = useMemo(() => {
    if (!selectedProgram) return -1;

    const today = startOfDay(new Date());
    const planStart = startOfDay(parseISO(selectedProgram.valid_from));
    const daysDiff = differenceInDays(today, planStart);

    if (daysDiff < 0 || daysDiff >= selectedProgram.plan_data.length) return -1;

    return daysDiff;
  }, [selectedProgram]);

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

  const isCompletedDay = (dayIndex: number): boolean => {
    if (!programWorkouts) return false;
    return programWorkouts.some((w) => w.program_day_index === dayIndex);
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
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <div className='flex items-center gap-2 mb-6'>
        <span className='text-2xl'>📋</span>
        <h2 className='text-xl font-bold text-gray-900'>My Programs</h2>
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
                  className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : isActive
                      ? 'border-green-500 bg-green-50 hover:border-green-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProgramId(isSelected ? null : program.id)}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold text-gray-900 capitalize'>
                          {program.program_type.replace('_', ' ')}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            program.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : program.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {program.status}
                        </span>
                      </div>

                      <div className='text-sm text-gray-600 space-y-1'>
                        <p>Created {format(parseISO(program.created_at), 'MMM d, yyyy')}</p>
                        {program.valid_from && (
                          <p>
                            {format(parseISO(program.valid_from), 'MMM d')} - {format(parseISO(program.valid_until), 'MMM d, yyyy')}
                          </p>
                        )}
                        {program.mesocycle_info && (
                          <p className='text-purple-600'>
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
                          className='text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors disabled:opacity-50'
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
                          className='text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors disabled:opacity-50'
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
                        className='text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors disabled:opacity-50'
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {!isSelected && program.plan_data && (
                    <p className='text-xs text-gray-500 mt-2'>
                      {program.plan_data.length} day{program.plan_data.length !== 1 ? 's' : ''} • Click to view details
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
                <div className='flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-3'>
                  <button
                    onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                    disabled={currentWeek === 0}
                    className='px-3 py-1.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-gray-200'
                  >
                    ← Previous Week
                  </button>
                  <div className='text-center'>
                    <div className='flex items-center justify-center gap-2'>
                      <span className='text-sm font-semibold text-gray-900'>
                        Week {currentWeek + 1} of {weeks.length}
                      </span>
                      {isDeloadWeek(currentWeek) && (
                        <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-medium'>
                          DELOAD
                        </span>
                      )}
                    </div>
                    <div className='text-xs text-gray-600'>
                      {format(addDays(parseISO(selectedProgram.valid_from), currentWeek * 7), 'MMM d')} -{' '}
                      {format(addDays(parseISO(selectedProgram.valid_from), Math.min(currentWeek * 7 + 6, selectedProgram.plan_data.length - 1)), 'MMM d')}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentWeek(Math.min(weeks.length - 1, currentWeek + 1))}
                    disabled={currentWeek === weeks.length - 1}
                    className='px-3 py-1.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-gray-200'
                  >
                    Next Week →
                  </button>
                </div>
              )}

              {/* Current Week Days Grid */}
              <div className='grid grid-cols-7 gap-2 mb-4'>
                {weeks[currentWeek]?.map((day, weekDayIndex) => {
                  const absoluteDayIndex = currentWeek * 7 + weekDayIndex;
                  const dayDate = addDays(parseISO(selectedProgram.valid_from), absoluteDayIndex);
                  const isSelected = selectedDay === day.day;
                  const isToday = todayIndex === absoluteDayIndex;
                  const isCompleted = isCompletedDay(absoluteDayIndex);

                  let btnClass = 'border-gray-200 hover:border-purple-300';
                  if (isSelected) {
                    btnClass = 'border-purple-600 bg-purple-50';
                  } else if (isToday) {
                    btnClass = 'border-green-500 bg-green-50';
                  } else if (isCompleted) {
                    btnClass = 'border-gray-200 bg-green-50';
                  }

                  return (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDay(isSelected ? null : day.day)}
                      className={'p-3 rounded-lg border-2 transition-all relative ' + btnClass}
                    >
                      {isToday && (
                        <div className='absolute top-1 right-1 bg-green-600 text-white text-[8px] font-bold px-1 py-0.5 rounded'>
                          TODAY
                        </div>
                      )}
                      {isCompleted && !isToday && (
                        <div className='absolute top-1 right-1 text-green-600 text-sm font-bold'>✓</div>
                      )}
                      <div className='text-xs font-medium text-gray-600 mb-1'>{format(dayDate, 'EEE')}</div>
                      <div className='text-2xl mb-1'>💪</div>
                      <div className='text-xs text-gray-700 truncate'>Strength</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Details */}
              {selectedDay !== null && (
                <div className='bg-purple-50 rounded-lg p-4 border-2 border-purple-200'>
                  <h3 className='font-semibold text-gray-900 mb-2'>
                    Day {selectedDay} - {format(addDays(parseISO(selectedProgram.valid_from), selectedDay - 1), 'EEEE, MMM d')}
                  </h3>
                  <div className='space-y-2 mb-3'>
                    {formatDayDetails(selectedProgram.plan_data.find((d) => d.day === selectedDay)!)}
                  </div>
                  <div className='bg-white rounded p-3 border border-purple-200'>
                    <p className='text-xs font-medium text-gray-600 mb-1'>Coaching Notes:</p>
                    <p className='text-sm text-gray-700'>
                      {selectedProgram.plan_data.find((d) => d.day === selectedDay)?.coaching_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Plan Overview */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>Plan Overview</h4>
                <p className='text-sm text-gray-700'>{selectedProgram.rationale}</p>
              </div>

              {/* Refresh Program Section (only for active programs) */}
              {selectedProgram.status === 'active' && (
                <div className='bg-blue-50 rounded-lg p-4 border-2 border-blue-200'>
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
                    className='w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white'
                  />

                  <button
                    onClick={handleRefreshProgram}
                    disabled={refreshMutation.isPending}
                    className='mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50'
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
