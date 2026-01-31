'use client';

import { useState } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { useGenerateWeeklyPlan, useUpdateProgramStatus } from '@/lib/hooks/useAI';
import { displayWeight } from '@/lib/utils/unit-conversion';
import { useSettings } from '@/lib/hooks/useSettings';
import type {
  Program,
  ProgramDay,
  WeightliftingData,
} from '@/types/workout';

interface WeeklyPlanViewProps {
  existingPlan?: Program;
}

const DEFAULT_PROGRAM_REQUEST = `Schedule
Program length: [X] Weeks
Frequency: [X] Days/Week | Duration: [X] Mins/Session

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
  const [showForm, setShowForm] = useState(false);
  const [programRequest, setProgramRequest] = useState(DEFAULT_PROGRAM_REQUEST);
  const generateMutation = useGenerateWeeklyPlan();
  const updateStatusMutation = useUpdateProgramStatus();
  const { data: settings } = useSettings();

  const plan = generateMutation.data || existingPlan;

  const handleGenerate = () => {
    generateMutation.mutate({ customPrompt: programRequest });
    setShowForm(false);
  };

  const handleStartPlan = () => {
    if (plan) {
      updateStatusMutation.mutate({ id: plan.id, status: 'active' });
    }
  };

  const getWorkoutEmoji = () => '💪'; // Always weightlifting

  const formatDayWorkout = (day: ProgramDay) => {
    const weightliftingData = day.data;
    return 'Weightlifting (' + weightliftingData.exercises.length + ' exercises)';
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

  return (
    <div className='bg-white rounded-lg shadow-md p-6 border-2 border-purple-100'>
      <div className='flex items-center gap-2 mb-4'>
        <span className='text-2xl'>📅</span>
        <h2 className='text-xl font-bold text-gray-900'>Your 7-Day Training Plan</h2>
      </div>

      {generateMutation.isPending ? (
        <div className='py-8 text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Creating your personalized plan...</p>
        </div>
      ) : showForm ? (
        <div className='space-y-4'>
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
          </div>

          <div className='grid grid-cols-7 gap-2 mb-4'>
            {plan.plan_data.map((day, index) => {
              const dayDate = addDays(parseISO(plan.valid_from), index);
              const isSelected = selectedDay === day.day;
              const btnClass = isSelected ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300';

              return (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(isSelected ? null : day.day)}
                  className={'p-3 rounded-lg border-2 transition-all ' + btnClass}
                >
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
              <div className='flex-1 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium text-center'>
                ✓ Active Plan
              </div>
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
            Get a complete 7-day training plan tailored to your goals, equipment, and preferences.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className='bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors'
          >
            Create Training Plan
          </button>
        </div>
      )}

      {generateMutation.isError && (
        <div className='mt-4 bg-red-50 border-l-4 border-red-400 p-4'>
          <p className='text-sm text-red-700'>{generateMutation.error.message}</p>
        </div>
      )}
    </div>
  );
}