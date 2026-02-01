'use client';

import { useState, useMemo } from 'react';
import { format, addDays, parseISO, differenceInDays, startOfDay } from 'date-fns';
import {
  useGenerateWeeklyPlan,
  useUpdateProgramStatus,
  useRefreshProgram,
  useProgramWorkouts,
} from '@/lib/hooks/useAI';
import { displayWeight } from '@/lib/utils/unit-conversion';
import { useSettings } from '@/lib/hooks/useSettings';
import RefreshChangesModal from './refresh-changes-modal';
import {
  usePromptHistory,
  useSavePrompt,
  useDeletePrompt,
  formatHistoryTimestamp,
  getHistoryLabel,
} from '@/lib/hooks/usePromptHistory';
import type {
  Program,
  ProgramDay,
  RefreshProgramResponse,
} from '@/types/workout';

interface WeeklyPlanViewProps {
  existingPlan?: Program;
}

// Extract program weeks from user's template input
const extractProgramWeeks = (prompt: string): number => {
  // Match patterns like "Program length: 4 Weeks" or "4 weeks"
  const match = prompt.match(/program\s*length[:\s]*(\d+)\s*weeks?/i)
    || prompt.match(/(\d+)\s*weeks?/i);
  if (match) {
    const weeks = parseInt(match[1], 10);
    return Math.min(Math.max(weeks, 1), 12); // Clamp 1-12
  }
  return 1; // Default to 1 week
};

const DEFAULT_PROGRAM_REQUEST = `User Profile
Age: [Your age in years]
Sex: [Male / Female / Other]
Body Weight: [Your weight in kg or lb]
Height: [Your height in cm or ft/in]

Schedule
Program length: [1 / 4 / 8 / 12] Weeks
Frequency: [X] Days/Week | Duration: [X] Mins/Session

Periodization (for 4+ week programs)
Structure: [Linear / Undulating / Block]
Phase Focus: [Hypertrophy / Strength / Power / General Fitness]
Include Deload Weeks: [Yes / No]

Constraints
Split: [Full Body / Upper-Lower / Push Pull Legs / Other]
Equipment: [Barbell, Dumbbell, Cable, Machine, Bench, Pull-up bar, Resistance Band, Kettlebell]
Injuries/Limitations/Exercises to avoid: [e.g., Left shoulder impingement, no heavy overhead]

Performance & Volume
Goal: [Strength / Hypertrophy / Fat Loss / Athletic Performance]
Specific Target: [e.g., 200kg Deadlift / 10% Body Fat / Bigger Delts]
Preferred Style: [Powerbuilding / Pure Hypertrophy / Functional]`;

export function WeeklyPlanView({ existingPlan }: WeeklyPlanViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [programRequest, setProgramRequest] = useState(DEFAULT_PROGRAM_REQUEST);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshResult, setRefreshResult] = useState<RefreshProgramResponse | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const generateMutation = useGenerateWeeklyPlan();
  const updateStatusMutation = useUpdateProgramStatus();
  const refreshMutation = useRefreshProgram();
  const { data: settings } = useSettings();
  const { data: promptHistory = [], isLoading: historyLoading } = usePromptHistory();
  const savePromptMutation = useSavePrompt();
  const deletePromptMutation = useDeletePrompt();

  const plan = generateMutation.data || existingPlan;

  // Fetch workouts for the current program
  const { data: programWorkouts } = useProgramWorkouts(plan?.id);

  // Check if current week is a deload week
  const isDeloadWeek = (weekIndex: number): boolean => {
    if (!plan?.mesocycle_info?.deload_weeks) return false;
    return plan.mesocycle_info.deload_weeks.includes(weekIndex + 1);
  };

  // Calculate weeks from plan data
  const weeks = useMemo(() => {
    if (!plan || !plan.plan_data) return [];

    const totalDays = plan.plan_data.length;
    const weeksArray: ProgramDay[][] = [];

    for (let i = 0; i < totalDays; i += 7) {
      weeksArray.push(plan.plan_data.slice(i, i + 7));
    }

    return weeksArray;
  }, [plan]);

  // Calculate which day we're on (if plan is active)
  const todayIndex = useMemo(() => {
    if (!plan) return -1;

    const today = startOfDay(new Date());
    const planStart = startOfDay(parseISO(plan.valid_from));
    const daysDiff = differenceInDays(today, planStart);

    // Return -1 if before plan starts or after plan ends
    if (daysDiff < 0 || daysDiff >= plan.plan_data.length) return -1;

    return daysDiff;
  }, [plan]);

  // Set current week to today's week when plan loads
  useMemo(() => {
    if (todayIndex >= 0) {
      const weekIndex = Math.floor(todayIndex / 7);
      setCurrentWeek(weekIndex);
    }
  }, [todayIndex]);

  const handleGenerate = () => {
    const programWeeks = extractProgramWeeks(programRequest);

    // Save to history before generating
    savePromptMutation.mutate({
      prompt: programRequest,
      programWeeks,
    });

    generateMutation.mutate({ customPrompt: programRequest, programWeeks });
    setShowForm(false);
  };

  const handleStartPlan = () => {
    if (plan) {
      updateStatusMutation.mutate({ id: plan.id, status: 'active' });
    }
  };

  const handleRefreshProgram = async () => {
    if (!plan) return;
    try {
      const result = await refreshMutation.mutateAsync({
        program_id: plan.id,
        from_today: true,
      });
      setRefreshResult(result);
      setShowRefreshModal(true);
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to refresh program:', error);
    }
  };

  const isCompletedDay = (dayIndex: number): boolean => {
    if (!programWorkouts) return false;
    return programWorkouts.some((w) => w.program_day_index === dayIndex);
  };

  const getWorkoutEmoji = () => '💪'; // Always weightlifting

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

  return (
    <div className='bg-white rounded-lg shadow-md p-6 border-2 border-purple-100'>
      <div className='flex items-center gap-2 mb-4'>
        <span className='text-2xl'>📅</span>
        <h2 className='text-xl font-bold text-gray-900'>Training Program</h2>
      </div>

      {generateMutation.isPending ? (
        <div className='py-8 text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Creating your personalized plan...</p>
        </div>
      ) : showForm ? (
        <div className='space-y-4'>
          {/* Prompt History Dropdown */}
          {!historyLoading && promptHistory.length > 0 && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Load Previous Prompt (Optional)
              </label>
              <select
                value={selectedHistoryId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) {
                    // "Start Fresh" selected
                    setProgramRequest(DEFAULT_PROGRAM_REQUEST);
                    setSelectedHistoryId(null);
                  } else {
                    const entry = promptHistory.find((e) => e.id === id);
                    if (entry) {
                      setProgramRequest(entry.prompt);
                      setSelectedHistoryId(id);
                    }
                  }
                }}
                className='w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none'
              >
                <option value="">Start Fresh (Use Template)</option>
                {promptHistory.map((entry) => {
                  const date = formatHistoryTimestamp(entry.created_at);
                  const label = getHistoryLabel(entry);
                  return (
                    <option key={entry.id} value={entry.id}>
                      {date} - {label}
                    </option>
                  );
                })}
              </select>

              {/* Clear History Button */}
              <button
                onClick={() => {
                  if (confirm('Clear all saved prompts? This cannot be undone.')) {
                    deletePromptMutation.mutate(undefined);
                    setSelectedHistoryId(null);
                    setProgramRequest(DEFAULT_PROGRAM_REQUEST);
                  }
                }}
                disabled={deletePromptMutation.isPending}
                className='mt-2 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50'
              >
                {deletePromptMutation.isPending ? 'Clearing...' : `Clear History (${promptHistory.length} saved)`}
              </button>
            </div>
          )}

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
            <p className='text-sm text-blue-900 font-medium mb-2'>💡 Customize Your Program</p>
            <p className='text-xs text-blue-700'>
              Fill out the template below with your preferences. Update the schedule, constraints,
              and performance goals to create a personalized training plan.
            </p>
          </div>

          <textarea
            value={programRequest}
            onChange={(e) => setProgramRequest(e.target.value)}
            rows={12}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm text-gray-900'
            placeholder='Describe your training program requirements...'
          />

          <div className='flex gap-3'>
            <button
              onClick={() => setShowForm(false)}
              className='flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className='flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors'
            >
              Generate Plan
            </button>
          </div>
        </div>
      ) : plan ? (
        <div className='space-y-4'>
          <div className='text-sm text-gray-600 mb-4'>
            {format(parseISO(plan.valid_from), 'MMM d')} - {format(parseISO(plan.valid_until), 'MMM d, yyyy')}
            {plan.mesocycle_info && (
              <span className='ml-2 text-purple-600'>
                • {plan.mesocycle_info.total_weeks}-week {plan.mesocycle_info.periodization_model} program
                {plan.mesocycle_info.phase && ` • ${plan.mesocycle_info.phase} phase`}
              </span>
            )}
          </div>

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
                  {format(addDays(parseISO(plan.valid_from), currentWeek * 7), 'MMM d')} - {format(addDays(parseISO(plan.valid_from), Math.min(currentWeek * 7 + 6, plan.plan_data.length - 1)), 'MMM d')}
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
              const dayDate = addDays(parseISO(plan.valid_from), absoluteDayIndex);
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
                    <div className='absolute top-1 right-1 text-green-600 text-sm font-bold'>
                      ✓
                    </div>
                  )}
                  <div className='text-xs font-medium text-gray-600 mb-1'>{format(dayDate, 'EEE')}</div>
                  <div className='text-2xl mb-1'>{getWorkoutEmoji()}</div>
                  <div className='text-xs text-gray-700 truncate'>Strength</div>
                </button>
              );
            })}
          </div>

          {selectedDay !== null && (
            <div className='bg-purple-50 rounded-lg p-4 border-2 border-purple-200'>
              <h3 className='font-semibold text-gray-900 mb-2'>
                Day {selectedDay} - {format(addDays(parseISO(plan.valid_from), selectedDay - 1), 'EEEE, MMM d')}
              </h3>
              <div className='space-y-2 mb-3'>
                {formatDayDetails(plan.plan_data.find((d) => d.day === selectedDay)!)}
              </div>
              <div className='bg-white rounded p-3 border border-purple-200'>
                <p className='text-xs font-medium text-gray-600 mb-1'>Coaching Notes:</p>
                <p className='text-sm text-gray-700'>
                  {plan.plan_data.find((d) => d.day === selectedDay)?.coaching_notes}
                </p>
              </div>
            </div>
          )}

          <div className='bg-gray-50 rounded-lg p-4'>
            <h4 className='font-semibold text-gray-900 mb-2'>Plan Overview</h4>
            <p className='text-sm text-gray-700'>{plan.rationale}</p>
          </div>

          <div className='flex gap-3 pt-2'>
            {plan.status === 'pending' && (
              <button
                onClick={handleStartPlan}
                disabled={updateStatusMutation.isPending}
                className='flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50'
              >
                {updateStatusMutation.isPending ? 'Activating...' : 'Start This Plan'}
              </button>
            )}
            {plan.status === 'active' && (
              <>
                <div className='flex-1 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium text-center'>
                  ✓ Active Plan
                </div>
                <button
                  onClick={handleRefreshProgram}
                  disabled={refreshMutation.isPending}
                  className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50'
                >
                  {refreshMutation.isPending ? 'Refreshing...' : '🔄 Refresh Program'}
                </button>
              </>
            )}
            <button
              onClick={() => setShowForm(true)}
              className='flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors'
            >
              Generate New Plan
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-600 mb-4'>
            Get a personalized training program tailored to your goals, equipment, and preferences.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className='bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors'
          >
            Create Training Program
          </button>
        </div>
      )}

      {generateMutation.isError && (
        <div className='mt-4 bg-red-50 border-l-4 border-red-400 p-4'>
          <p className='text-sm text-red-700'>{generateMutation.error.message}</p>
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