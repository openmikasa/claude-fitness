'use client';

import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '@/types/workout';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onExerciseSelect?: (exercise: Exercise) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
}

export function Autocomplete({
  value,
  onChange,
  onExerciseSelect,
  onCreateNew,
  placeholder = 'Search exercises...',
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length < 1) {
      setExercises([]);
      return;
    }

    const searchExercises = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/exercises?search=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setExercises(data.exercises || []);
        }
      } catch (error) {
        console.error('Failed to search exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchExercises, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  const handleSelect = (exercise: Exercise) => {
    onChange(exercise.name);
    if (onExerciseSelect) {
      onExerciseSelect(exercise);
    }
    setIsOpen(false);
  };

  return (
    <div className='relative' ref={containerRef}>
      <input
        type='text'
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark font-medium transition-colors'
      />

      {isOpen && value.length >= 1 && (
        <div className='absolute z-10 w-full mt-1 bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md max-h-60 overflow-y-auto'>
          {loading ? (
            <div className='px-3 py-2 text-subtext-light dark:text-subtext-dark text-sm'>Searching...</div>
          ) : exercises.length === 0 ? (
            <div>
              <div className='px-3 py-2 text-subtext-light dark:text-subtext-dark text-sm'>No exercises found</div>
              {onCreateNew && (
                <button
                  onClick={() => {
                    onCreateNew(value);
                    setIsOpen(false);
                  }}
                  className='w-full px-3 py-2 text-left text-primary hover:bg-accent-light dark:hover:bg-accent-dark border-t border-gray-200 dark:border-gray-700 text-sm font-medium transition-colors'
                >
                  + Create &quot;{value}&quot; as custom exercise
                </button>
              )}
            </div>
          ) : (
            exercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                className='px-3 py-2 cursor-pointer hover:bg-accent-light dark:hover:bg-accent-dark transition-colors'
              >
                <div className='font-semibold text-text-light dark:text-text-dark'>{exercise.name}</div>
                {exercise.muscle_groups.length > 0 && (
                  <div className='text-xs text-subtext-light dark:text-subtext-dark mt-1'>
                    {exercise.muscle_groups.join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
