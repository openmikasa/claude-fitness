'use client';

import { useState, useRef } from 'react';
import { validateFile, parseCSV } from '@/lib/parsers/csv-parser';
import type { ImportPreview } from '@/types/import';

interface CsvUploadProps {
  onParsed: (preview: ImportPreview, file: File) => void;
}

export default function CsvUpload({ onParsed }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0); // Track drag depth for nested elements

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setIsProcessing(false);
      return;
    }

    // Parse CSV
    const result = await parseCSV(file);
    setIsProcessing(false);

    if (!result.success) {
      setError(result.error || 'Failed to parse CSV');
      return;
    }

    if (result.data) {
      onParsed(result.data, file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* CSV Format Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-blue-900">CSV Format Requirements</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Required column:</strong> Date</p>
          <p><strong>Optional columns:</strong> Exercise, Weight, Reps, Sets, Notes</p>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="font-semibold mb-2">How workouts are grouped:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>One workout per day:</strong> All rows with the same date become one workout</li>
              <li><strong>Multiple workouts per day:</strong> Add a &quot;workout&quot; or &quot;session&quot; column (e.g., &quot;morning&quot;, &quot;evening&quot;) to create separate workouts on the same date</li>
            </ul>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="font-semibold mb-2">Example CSV (one workout per day):</p>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
date,exercise,weight,reps,sets,notes
2026-01-10,Bench press,80kg,10,3,
2026-01-10,Squat,100kg,8,3,
2026-01-11,Deadlift,120kg,5,5,</pre>
            <p className="text-xs mt-1">→ Creates 2 workouts: Jan 10 (Bench + Squat), Jan 11 (Deadlift)</p>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="font-semibold mb-2">Example CSV (multiple workouts per day):</p>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
date,workout,exercise,weight,reps,sets,notes
2026-01-10,morning,Bench press,80kg,10,3,
2026-01-10,morning,Squat,100kg,8,3,
2026-01-10,evening,Deadlift,120kg,5,5,</pre>
            <p className="text-xs mt-1">→ Creates 2 workouts on Jan 10: morning (Bench + Squat), evening (Deadlift)</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Processing CSV file...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Accepted: .csv, .txt (max 10MB, 5,000 rows)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
