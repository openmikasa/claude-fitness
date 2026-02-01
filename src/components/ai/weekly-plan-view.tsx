'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGenerateWeeklyPlan } from '@/lib/hooks/useAI';
import {
  usePromptHistory,
  useSavePrompt,
  useDeletePrompt,
  formatHistoryTimestamp,
  getHistoryLabel,
} from '@/lib/hooks/usePromptHistory';

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

// Progress stages for AI generation
function GenerationProgress({ programWeeks }: { programWeeks: number }) {
  const [stage, setStage] = useState(0);

  // Define stages based on program length
  const stages = useMemo(() => {
    const baseStages = [
      { message: 'Analyzing your workout history...', emoji: '📊' },
      { message: 'Identifying patterns and progress...', emoji: '🔍' },
    ];

    // Add week generation stages
    const weekStages = [];
    for (let i = 1; i <= programWeeks; i++) {
      weekStages.push({
        message: `Planning week ${i} of ${programWeeks}...`,
        emoji: '💡'
      });
    }

    baseStages.push(...weekStages);
    baseStages.push(
      { message: 'Optimizing periodization...', emoji: '⚙️' },
      { message: 'Finalizing your program...', emoji: '✨' }
    );

    return baseStages;
  }, [programWeeks]);

  // Progress through stages based on time
  useEffect(() => {
    // Estimate total time: 2-3 seconds per week + 4 seconds base
    const totalTime = (programWeeks * 2500) + 4000;
    const timePerStage = totalTime / stages.length;

    const interval = setInterval(() => {
      setStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, timePerStage);

    return () => clearInterval(interval);
  }, [stages.length, programWeeks]);

  const currentStage = stages[stage];
  const progress = ((stage + 1) / stages.length) * 100;

  return (
    <div className='py-8'>
      <div className='max-w-md mx-auto'>
        <div className='flex items-center justify-center gap-3 mb-6'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600'></div>
          <span className='text-4xl animate-pulse'>{currentStage.emoji}</span>
        </div>

        <div className='text-center mb-4'>
          <p className='text-lg font-medium text-gray-900 mb-1'>{currentStage.message}</p>
          <p className='text-sm text-gray-500'>
            Step {stage + 1} of {stages.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className='w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden'>
          <div
            className='bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out'
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className='text-xs text-center text-gray-500'>{Math.round(progress)}% complete</p>
      </div>
    </div>
  );
}

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

export function WeeklyPlanView() {
  const [showForm, setShowForm] = useState(false);
  const [programRequest, setProgramRequest] = useState(DEFAULT_PROGRAM_REQUEST);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [generatingWeeks, setGeneratingWeeks] = useState(1);

  const generateMutation = useGenerateWeeklyPlan();
  const { data: promptHistory = [], isLoading: historyLoading } = usePromptHistory();
  const savePromptMutation = useSavePrompt();
  const deletePromptMutation = useDeletePrompt();

  const handleGenerate = () => {
    const programWeeks = extractProgramWeeks(programRequest);
    setGeneratingWeeks(programWeeks);

    savePromptMutation.mutate({
      prompt: programRequest,
      programWeeks,
    });

    generateMutation.mutate({ customPrompt: programRequest, programWeeks });
    setShowForm(false);
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6 border-2 border-purple-100'>
      <div className='flex items-center gap-2 mb-4'>
        <span className='text-2xl'>✨</span>
        <h2 className='text-xl font-bold text-gray-900'>Generate New Program</h2>
      </div>

      {generateMutation.isPending ? (
        <GenerationProgress programWeeks={generatingWeeks} />
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
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-600 mb-4'>
            Create a personalized training program tailored to your goals, equipment, and preferences.
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

      {generateMutation.isSuccess && (
        <div className='mt-4 bg-green-50 border-l-4 border-green-400 p-4'>
          <p className='text-sm text-green-700'>Program generated successfully! Check &ldquo;My Programs&rdquo; below.</p>
        </div>
      )}
    </div>
  );
}