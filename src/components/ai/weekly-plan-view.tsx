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
          <div className='w-12 h-12 border-4 border-black dark:border-white border-t-primary animate-spin'></div>
          <span className='text-4xl animate-pulse'>{currentStage.emoji}</span>
        </div>

        <div className='text-center mb-4'>
          <p className='text-lg font-bold uppercase text-text-light dark:text-text-dark mb-1'>{currentStage.message}</p>
          <p className='text-sm text-subtext-light dark:text-subtext-dark font-bold'>
            Step {stage + 1} of {stages.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className='w-full bg-background-light dark:bg-background-dark h-3 border-2 border-black dark:border-white rounded-sm mb-2 overflow-hidden'>
          <div
            className='bg-primary h-full transition-all duration-500 ease-out'
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className='text-xs text-center font-bold uppercase text-subtext-light dark:text-subtext-dark'>{Math.round(progress)}% complete</p>
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
Frequency: [3 / 4 / 5 / 6] Days/Week
Duration: [X] Mins/Session

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
    <div className='bg-white border-3 border-black rounded-sm p-6'>
      <div className='flex items-center gap-2 mb-4'>
        <span className='text-2xl'>✨</span>
        <h2 className='text-xl font-bold text-black'>Generate New Program</h2>
      </div>

      {generateMutation.isPending ? (
        <GenerationProgress programWeeks={generatingWeeks} />
      ) : showForm ? (
        <div className='space-y-4'>
          {/* Prompt History Dropdown */}
          {!historyLoading && promptHistory.length > 0 && (
            <div>
              <label className='block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2'>
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
                className='w-full px-4 py-3 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm transition-all'
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
                className='mt-2 text-sm text-danger hover:underline font-bold uppercase transition-colors disabled:opacity-50'
              >
                {deletePromptMutation.isPending ? 'Clearing...' : `Clear History (${promptHistory.length} saved)`}
              </button>
            </div>
          )}

          <div className='bg-accent-light dark:bg-accent-dark border-3 border-black dark:border-white rounded-sm p-4 mb-4'>
            <p className='text-sm text-text-light dark:text-text-dark font-bold uppercase mb-2'>💡 Customize Your Program</p>
            <p className='text-xs text-subtext-light dark:text-subtext-dark'>
              Fill out the template below with your preferences. Update the schedule, constraints,
              and performance goals to create a personalized training plan.
            </p>
          </div>

          <textarea
            value={programRequest}
            onChange={(e) => setProgramRequest(e.target.value)}
            rows={12}
            className='w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm font-mono text-sm text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark transition-all'
            placeholder='Describe your training program requirements...'
          />

          <div className='flex gap-3'>
            <button
              onClick={() => setShowForm(false)}
              className='flex-1 px-4 py-3 font-bold uppercase text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className='flex-1 px-4 py-3 font-bold uppercase text-white bg-primary border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
            >
              Generate Plan
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500 mb-4'>
            Create a personalized training program tailored to your goals, equipment, and preferences.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className='bg-[#FDE047] text-black px-6 py-4 rounded-sm font-bold uppercase border-3 border-black shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
          >
            Create Training Program
          </button>
        </div>
      )}

      {generateMutation.isError && (
        <div className='mt-4 bg-danger/10 border-3 border-l-6 border-danger rounded-sm p-4'>
          <p className='text-sm text-danger font-bold'>{generateMutation.error.message}</p>
        </div>
      )}

      {generateMutation.isSuccess && (
        <div className='mt-4 bg-success/10 border-3 border-l-6 border-success rounded-sm p-4'>
          <p className='text-sm text-success font-bold'>Program generated successfully! Check &ldquo;My Programs&rdquo; below.</p>
        </div>
      )}
    </div>
  );
}
