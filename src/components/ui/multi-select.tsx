'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select...',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <div className='relative' ref={containerRef}>
      <label className='block text-sm font-medium text-text-light dark:text-text-dark mb-2'>{label}</label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className='w-full min-h-[42px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer bg-card-light dark:bg-card-dark hover:border-primary transition-colors'
      >
        {selected.length === 0 ? (
          <span className='text-subtext-light dark:text-subtext-dark'>{placeholder}</span>
        ) : (
          <div className='flex flex-wrap gap-1'>
            {selected.map((item) => (
              <span
                key={item}
                className='inline-flex items-center gap-1 px-2 py-1 bg-accent-light dark:bg-accent-dark text-primary text-sm rounded-full font-medium'
              >
                {item}
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(item);
                  }}
                  className='hover:text-primary/80 transition-colors'
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className='absolute z-10 w-full mt-1 bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md max-h-60 overflow-y-auto'>
          {options.map((option) => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              className={`px-3 py-2 cursor-pointer hover:bg-accent-light dark:hover:bg-accent-dark flex items-center justify-between transition-colors ${
                selected.includes(option) ? 'bg-accent-light dark:bg-accent-dark' : ''
              }`}
            >
              <span className='text-text-light dark:text-text-dark font-medium'>{option}</span>
              {selected.includes(option) && (
                <span className='text-primary font-bold'>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
