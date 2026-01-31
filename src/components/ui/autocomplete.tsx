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
    if (value.length < 2) {
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
        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
      />

      {isOpen && value.length >= 2 && (
        <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
          {loading ? (
            <div className='px-3 py-2 text-gray-500 text-sm'>Searching...</div>
          ) : exercises.length === 0 ? (
            <div>
              <div className='px-3 py-2 text-gray-500 text-sm'>No exercises found</div>
              {onCreateNew && (
                <button
                  onClick={() => {
                    onCreateNew(value);
                    setIsOpen(false);
                  }}
                  className='w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 border-t border-gray-200 text-sm font-medium'
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
                className='px-3 py-2 cursor-pointer hover:bg-gray-100'
              >
                <div className='font-medium'>{exercise.name}</div>
                {exercise.muscle_groups.length > 0 && (
                  <div className='text-xs text-gray-500 mt-1'>
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
