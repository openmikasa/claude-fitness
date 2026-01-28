'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateNextSession } from '@/lib/hooks/useAI';
import type {
  StrengthData,
  CardioData,
  SaunaData,
  MobilityData,
  WorkoutData,
} from '@/types/workout';

interface NextSessionCardProps {
  onUseWorkout?: (data: {
    workout_type: string;
    data: WorkoutData;
  }) => void;
}

export function NextSessionCard({ onUseWorkout }: NextSessionCardProps) {
  const router = useRouter();
  const [showRationale, setShowRationale] = useState(false);
  const generateMutation = useGenerateNextSession();

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleUseWorkout = () => {
    if (generateMutation.data) {
      const workout = generateMutation.data.plan_data[0];
      if (onUseWorkout) {
        onUseWorkout({
          workout_type: workout.workout_type,
          data: workout.data,
        });
      } else {
        const presetData = JSON.stringify({
          workout_type: workout.workout_type,
          data: workout.data,
        });
        router.push('/workouts/log?preset=' + encodeURIComponent(presetData));
      }
    }
  };

  const formatWorkoutSummary = (
    type: string,
    data: StrengthData | CardioData | SaunaData | MobilityData
  ) => {
    switch (type) {
      case 'strength': {
        const strengthData = data as StrengthData;
        return strengthData.exercises.map((ex) => (
          <div key={ex.name} className='text-sm'>
            <span className='font-medium'>{ex.name}:</span> {ex.sets.length} sets × {ex.sets[0].reps} reps @ {ex.sets[0].weight}kg
          </div>
        ));
      }
      case 'cardio': {
        const cardioData = data as CardioData;
        const distanceText = cardioData.distance_km ? ' • ' + cardioData.distance_km + ' km' : '';
        return (
          <div className='text-sm'>
            <span className='font-medium capitalize'>{cardioData.type}:</span> {cardioData.time_minutes} min{distanceText}
          </div>
        );
      }
      case 'sauna': {
        const saunaData = data as SaunaData;
        const tempText = saunaData.temperature_celsius ? ' • ' + saunaData.temperature_celsius + '°C' : '';
        return (
          <div className='text-sm'>
            <span className='font-medium'>Duration:</span> {saunaData.duration_minutes} min{tempText}
          </div>
        );
      }
      case 'mobility': {
        const mobilityData = data as MobilityData;
        return mobilityData.exercises.map((ex) => (
          <div key={ex.name} className='text-sm'>
            <span className='font-medium'>{ex.name}:</span> {ex.duration_minutes} min
          </div>
        ));
      }
      default:
        return null;
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6 border-2 border-blue-100'>
      <div className='flex items-center gap-2 mb-4'>
        <span className='text-2xl'>🤖</span>
        <h2 className='text-xl font-bold text-gray-900'>
          Recommended Next Session
        </h2>
      </div>

      {generateMutation.isPending ? (
        <div className='py-8 text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Analyzing your workout history...</p>
        </div>
      ) : generateMutation.data ? (
        <div className='space-y-4'>
          <div className='bg-blue-50 rounded-lg p-4'>
            <h3 className='font-semibold text-gray-900 mb-2 capitalize'>
              {generateMutation.data.plan_data[0].workout_type} Workout
            </h3>
            <div className='space-y-2'>
              {formatWorkoutSummary(
                generateMutation.data.plan_data[0].workout_type,
                generateMutation.data.plan_data[0].data
              )}
            </div>
          </div>

          <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4'>
            <div className='flex items-start'>
              <span className='text-xl mr-2'>💡</span>
              <div className='flex-1'>
                <h4 className='font-semibold text-gray-900 mb-1'>
                  Coaching Notes
                </h4>
                <p className='text-sm text-gray-700'>
                  {generateMutation.data.plan_data[0].coaching_notes}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRationale(!showRationale)}
            className='text-sm text-blue-600 hover:text-blue-700 font-medium'
          >
            {showRationale ? '▼ Hide' : '▶ Show'} Rationale
          </button>

          {showRationale && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <p className='text-sm text-gray-700'>
                {generateMutation.data.rationale}
              </p>
            </div>
          )}

          <div className='flex gap-3 pt-2'>
            <button
              onClick={handleUseWorkout}
              className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              Use This Workout
            </button>
            <button
              onClick={handleGenerate}
              className='flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors'
            >
              Generate New
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-600 mb-4'>
            Get a personalized workout recommendation based on your history.
          </p>
          <button
            onClick={handleGenerate}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
          >
            Generate Next Session
          </button>
        </div>
      )}

      {generateMutation.isError && (
        <div className='mt-4 bg-red-50 border-l-4 border-red-400 p-4'>
          <p className='text-sm text-red-700'>
            {generateMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
}