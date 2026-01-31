'use client';

import { useState, useEffect } from 'react';
import { autoDetectMapping } from '@/lib/parsers/csv-parser';
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

  // Auto-detect mappings on mount
  useEffect(() => {
    const detected = autoDetectMapping(preview.headers);
    const initialMappings: Record<string, string> = {};

    preview.headers.forEach((header) => {
      if (detected.dateColumn === header) initialMappings[header] = 'date';
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

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Map your CSV columns to workout fields. The <strong>Date</strong> column is required. Other fields are optional.
        </p>
      </div>

      {/* Column Mapping Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CSV Column
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maps To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sample Data
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.headers.map((header) => (
              <tr key={header}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {header}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={mappings[header] || ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  >
                    {FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {preview.sampleRows[0]?.[header] || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Mapped Data */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Preview First 5 Rows
        </h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                {Object.entries(mappings)
                  .filter(([_, value]) => value)
                  .map(([header, value]) => (
                    <th key={header} className="px-3 py-2 text-left font-medium text-gray-700">
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
                      <td key={header} className="px-3 py-2 text-gray-600">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
}
