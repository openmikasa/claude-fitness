'use client';

import { useState, useEffect } from 'react';
import { autoDetectMapping, analyzeWeightColumnUnits } from '@/lib/parsers/csv-parser';
import type { CsvMapping, ImportPreview } from '@/types/import';

interface ColumnMapperProps {
  preview: ImportPreview;
  onMappingChange: (mapping: CsvMapping) => void;
  onNext: () => void;
  onBack: () => void;
}

const FIELD_OPTIONS = [
  { value: '', label: 'Skip this column' },
  { value: 'date', label: 'Date (required)' },
  { value: 'workout', label: 'Workout/Session (optional - for multiple workouts per day)' },
  { value: 'exercise', label: 'Exercise Name' },
  { value: 'weight', label: 'Weight (kg)' },
  { value: 'reps', label: 'Reps' },
  { value: 'sets', label: 'Sets' },
  { value: 'notes', label: 'Notes' },
];

export default function ColumnMapper({
  preview,
  onMappingChange,
  onNext,
  onBack,
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [userPreferredUnit] = useState<'metric' | 'imperial'>('metric'); // TODO: Get from user settings

  // Auto-detect mappings on mount
  useEffect(() => {
    const detected = autoDetectMapping(preview.headers);
    const initialMappings: Record<string, string> = {};

    preview.headers.forEach((header) => {
      if (detected.dateColumn === header) initialMappings[header] = 'date';
      else if (detected.sessionColumn === header) initialMappings[header] = 'workout';
      else if (detected.exerciseColumn === header) initialMappings[header] = 'exercise';
      else if (detected.weightColumn === header) initialMappings[header] = 'weight';
      else if (detected.repsColumn === header) initialMappings[header] = 'reps';
      else if (detected.setsColumn === header) initialMappings[header] = 'sets';
      else if (detected.notesColumn === header) initialMappings[header] = 'notes';
      else initialMappings[header] = '';
    });

    setMappings(initialMappings);
  }, [preview.headers]);

  // Update parent when mappings change
  useEffect(() => {
    const csvMapping: CsvMapping = {
      dateColumn: Object.keys(mappings).find((k) => mappings[k] === 'date') || '',
      sessionColumn: Object.keys(mappings).find((k) => mappings[k] === 'workout'),
      exerciseColumn: Object.keys(mappings).find((k) => mappings[k] === 'exercise'),
      weightColumn: Object.keys(mappings).find((k) => mappings[k] === 'weight'),
      repsColumn: Object.keys(mappings).find((k) => mappings[k] === 'reps'),
      setsColumn: Object.keys(mappings).find((k) => mappings[k] === 'sets'),
      notesColumn: Object.keys(mappings).find((k) => mappings[k] === 'notes'),
    };
    onMappingChange(csvMapping);
  }, [mappings, onMappingChange]);

  const handleMappingChange = (header: string, value: string) => {
    setMappings((prev) => ({ ...prev, [header]: value }));
    setError(null);
  };

  const handleNext = () => {
    // Validate date column is mapped
    const hasDateColumn = Object.values(mappings).includes('date');
    if (!hasDateColumn) {
      setError('Date column is required. Please map at least one column to "Date".');
      return;
    }

    onNext();
  };

  // Helper to get detected unit for a weight column
  const getDetectedUnit = (header: string): string => {
    if (mappings[header] !== 'weight') return '-';

    // Get sample values for this column
    const sampleValues = preview.sampleRows.map((row) => row[header] || '').filter(Boolean);

    const detectedUnit = analyzeWeightColumnUnits(header, sampleValues, userPreferredUnit);

    if (detectedUnit === 'mixed') return 'mixed';
    return detectedUnit;
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-[#22FF00]/10 border-3 border-[#22FF00] rounded-sm p-4">
        <p className="text-sm text-gray-700">
          Map your CSV columns to workout fields. The <strong>Date</strong> column is required. Other fields are optional.
        </p>
      </div>

      {/* Column Mapping Table */}
      <div className="border-3 border-black rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                CSV Column
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                Maps To
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                Sample Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                Detected Unit
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.headers.map((header) => {
              const detectedUnit = getDetectedUnit(header);
              return (
                <tr key={header}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {header}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={mappings[header] || ''}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="w-full px-3 py-2 border-3 border-black rounded-sm focus:outline-none focus:border-[#22FF00] text-sm bg-white"
                    >
                      {FIELD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 font-mono">
                    {preview.sampleRows[0]?.[header] || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {detectedUnit === '-' ? (
                      <span className="text-gray-400 text-xs">-</span>
                    ) : detectedUnit === 'mixed' ? (
                      <span className="px-2 py-1 rounded-sm text-xs font-bold uppercase border-2 border-yellow-500 text-yellow-700 bg-yellow-50">
                        mixed
                      </span>
                    ) : detectedUnit === 'kg' ? (
                      <span className="px-2 py-1 rounded-sm text-xs font-bold uppercase border-2 border-[#22FF00] text-green-700 bg-green-50">
                        kg
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-sm text-xs font-bold uppercase border-2 border-blue-500 text-blue-700 bg-blue-50">
                        lb
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Preview Mapped Data */}
      <div>
        <h3 className="text-sm font-bold uppercase text-black mb-2">
          Preview First 5 Rows
        </h3>
        <div className="bg-gray-50 border-3 border-black rounded-sm p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                {Object.entries(mappings)
                  .filter(([_, value]) => value)
                  .map(([header, value]) => (
                    <th key={header} className="px-3 py-2 text-left font-bold text-black">
                      {FIELD_OPTIONS.find((opt) => opt.value === value)?.label || value}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {preview.sampleRows.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  {Object.entries(mappings)
                    .filter(([_, value]) => value)
                    .map(([header]) => (
                      <td key={header} className="px-3 py-2 text-gray-600 font-mono">
                        {row[header] || '-'}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border-3 border-red-500 rounded-sm">
          <p className="text-sm text-red-600 font-bold">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 font-bold uppercase text-black bg-white border-3 border-black rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-4 py-3 font-bold uppercase text-white bg-[#8B5CF6] border-3 border-black rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
}
