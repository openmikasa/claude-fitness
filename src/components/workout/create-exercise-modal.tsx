'use client';

import { useState } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: any) => void;
  suggestedName?: string;
}

export function CreateExerciseModal({
  isOpen,
  onClose,
  onExerciseCreated,
  suggestedName = '',
}: CreateExerciseModalProps) {
  const [name, setName] = useState(suggestedName);
  const [category, setCategory] = useState<'strength' | 'cardio'>('strength');
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string>(''); // Single value, not array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const muscleGroupOptions = [
    'chest',
    'back',
    'legs',
    'shoulders',
    'arms',
    'core',
    'glutes',
    'hamstrings',
    'quadriceps',
    'calves',
    'biceps',
    'triceps',
    'forearms',
    'trapezius',
    'rhomboids',
    'rear_deltoids',
    'erector_spinae',
    'upper_chest',
    'lower_chest',
    'hip_flexors',
    'cardio',
  ];

  const equipmentOptions = [
    'barbell',
    'hax barbell',
    'dumbbell',
    'cable',
    'machine',
    'bodyweight',
    'kettlebell',
    'band',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (primaryMuscles.length === 0) {
      setError('Please select at least one primary muscle group');
      return;
    }

    if (!equipment) {
      setError('Please select an equipment type');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          primary_muscles: primaryMuscles,
          secondary_muscles: secondaryMuscles,
          equipment: [equipment], // Convert to array for API
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(data.error || 'Exercise already exists');
        } else {
          setError(data.error || 'Failed to create exercise');
        }
        setLoading(false);
        return;
      }

      // Success!
      onExerciseCreated(data.exercise);

      // Reset form
      setName('');
      setCategory('strength');
      setPrimaryMuscles([]);
      setSecondaryMuscles([]);
      setEquipment('');
      onClose();
    } catch (err) {
      setError('Failed to create exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-card-light dark:bg-card-dark rounded-sm border-3 border-black dark:border-white shadow-brutal max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b-3 border-black dark:border-white'>
          <h2 className='text-xl font-bold uppercase text-text-light dark:text-text-dark'>Add Custom Exercise</h2>
          <button
            onClick={onClose}
            className='text-text-light dark:text-text-dark hover:text-primary font-bold text-xl'
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {error && (
            <div className='bg-danger/10 border-3 border-danger text-danger px-4 py-3 rounded-sm text-sm font-bold'>
              {error}
            </div>
          )}

          <div className='bg-accent-light dark:bg-accent-dark border-3 border-black dark:border-white text-text-light dark:text-text-dark px-4 py-3 rounded-sm text-sm'>
            <p className='font-bold uppercase'>Custom Exercise</p>
            <p className='text-xs mt-1'>
              This exercise will only be visible to you. Global exercises are managed by the app.
            </p>
          </div>

          {/* Exercise Name */}
          <div>
            <label className='block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2'>
              Exercise Name *
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g., Barbell Row'
              className='w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all'
              disabled={loading}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2'>
              Category *
            </label>
            <div className='flex gap-4'>
              <label className='flex items-center font-bold text-text-light dark:text-text-dark'>
                <input
                  type='radio'
                  value='strength'
                  checked={category === 'strength'}
                  onChange={(e) => setCategory(e.target.value as 'strength')}
                  className='mr-2 w-4 h-4'
                  disabled={loading}
                />
                Strength
              </label>
              <label className='flex items-center font-bold text-text-light dark:text-text-dark'>
                <input
                  type='radio'
                  value='cardio'
                  checked={category === 'cardio'}
                  onChange={(e) => setCategory(e.target.value as 'cardio')}
                  className='mr-2 w-4 h-4'
                  disabled={loading}
                />
                Cardio
              </label>
            </div>
          </div>

          {/* Primary Muscle Groups */}
          <div>
            <MultiSelect
              label='Primary Muscle Groups *'
              options={muscleGroupOptions}
              selected={primaryMuscles}
              onChange={setPrimaryMuscles}
              placeholder='Select primary movers (1-5)...'
            />
            <p className='text-xs text-subtext-light dark:text-subtext-dark mt-1'>
              Main muscles worked by this exercise (e.g., chest for bench press)
            </p>
          </div>

          {/* Secondary Muscle Groups */}
          <div>
            <MultiSelect
              label='Secondary Muscle Groups'
              options={muscleGroupOptions}
              selected={secondaryMuscles}
              onChange={setSecondaryMuscles}
              placeholder='Select stabilizers (optional)...'
            />
            <p className='text-xs text-subtext-light dark:text-subtext-dark mt-1'>
              Supporting muscles and stabilizers (e.g., triceps, shoulders for bench press)
            </p>
          </div>

          {/* Equipment */}
          <div>
            <label className='block text-sm font-bold uppercase text-text-light dark:text-text-dark mb-2'>
              Equipment *
            </label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className='w-full px-3 py-3 border-3 border-black dark:border-white rounded-sm focus:outline-none focus:border-accent focus:shadow-brutal-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark transition-all'
              disabled={loading}
              required
            >
              <option value=''>Select equipment...</option>
              {equipmentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-3 font-bold uppercase text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='flex-1 px-4 py-3 font-bold uppercase text-white bg-primary border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all'
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
