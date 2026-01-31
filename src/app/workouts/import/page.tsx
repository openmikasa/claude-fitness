'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useImportWorkouts } from '@/lib/hooks/useImport';
import CsvUpload from '@/components/import/csv-upload';
import ColumnMapper from '@/components/import/column-mapper';
import type { ImportPreview, CsvMapping } from '@/types/import';
import Papa from 'papaparse';

type Step = 'upload' | 'map' | 'review' | 'importing' | 'complete';

export default function ImportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const importMutation = useImportWorkouts();

  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<CsvMapping>({ dateColumn: '' });
  const [allRows, setAllRows] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleParsed = (parsedPreview: ImportPreview, parsedFile: File) => {
    setPreview(parsedPreview);
    setFile(parsedFile);
    setStep('map');

    // Parse full CSV for import
    Papa.parse(parsedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setAllRows(results.data);
      },
    });
  };

  const handleMappingChange = (newMapping: CsvMapping) => {
    setMapping(newMapping);
  };

  const handleNextToReview = () => {
    setStep('review');
  };

  const handleBackToMap = () => {
    setStep('map');
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setPreview(null);
    setFile(null);
    setMapping({ dateColumn: '' });
    setAllRows([]);
  };

  const handleImport = async () => {
    if (!file || allRows.length === 0) return;

    setStep('importing');

    try {
      await importMutation.mutateAsync({
        rows: allRows,
        mapping,
        filename: file.name,
      });
      setStep('complete');
    } catch (error) {
      console.error('Import failed:', error);
      // Stay on importing step to show error
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Import Workouts
            </h1>
            <Link
              href="/workouts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Workouts
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${step === 'upload' ? 'text-blue-600' : 'text-gray-500'}`}>
              1. Upload
            </span>
            <span className={`text-sm font-medium ${step === 'map' ? 'text-blue-600' : 'text-gray-500'}`}>
              2. Map Columns
            </span>
            <span className={`text-sm font-medium ${step === 'review' ? 'text-blue-600' : 'text-gray-500'}`}>
              3. Review
            </span>
            <span className={`text-sm font-medium ${step === 'importing' || step === 'complete' ? 'text-blue-600' : 'text-gray-500'}`}>
              4. Import
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width:
                  step === 'upload'
                    ? '25%'
                    : step === 'map'
                    ? '50%'
                    : step === 'review'
                    ? '75%'
                    : '100%',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {step === 'upload' && <CsvUpload onParsed={handleParsed} />}

          {step === 'map' && preview && (
            <ColumnMapper
              preview={preview}
              onMappingChange={handleMappingChange}
              onNext={handleNextToReview}
              onBack={handleBackToUpload}
            />
          )}

          {step === 'review' && preview && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Review your import settings before proceeding. This will import{' '}
                  <strong>{preview.totalRows} rows</strong> from <strong>{file?.name}</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Column Mapping</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <dl className="grid grid-cols-2 gap-4">
                    {mapping.dateColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Date:</dt>
                        <dd className="text-sm text-gray-600">{mapping.dateColumn}</dd>
                      </>
                    )}
                    {mapping.workoutTypeColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Workout Type:</dt>
                        <dd className="text-sm text-gray-600">{mapping.workoutTypeColumn}</dd>
                      </>
                    )}
                    {mapping.exerciseColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Exercise:</dt>
                        <dd className="text-sm text-gray-600">{mapping.exerciseColumn}</dd>
                      </>
                    )}
                    {mapping.weightColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Weight:</dt>
                        <dd className="text-sm text-gray-600">{mapping.weightColumn}</dd>
                      </>
                    )}
                    {mapping.repsColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Reps:</dt>
                        <dd className="text-sm text-gray-600">{mapping.repsColumn}</dd>
                      </>
                    )}
                    {mapping.setsColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Sets:</dt>
                        <dd className="text-sm text-gray-600">{mapping.setsColumn}</dd>
                      </>
                    )}
                    {mapping.notesColumn && (
                      <>
                        <dt className="text-sm font-medium text-gray-700">Notes:</dt>
                        <dd className="text-sm text-gray-600">{mapping.notesColumn}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackToMap}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Start Import
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-700">Importing workouts...</p>
              <p className="text-sm text-gray-500">This may take a moment</p>
            </div>
          )}

          {step === 'complete' && importMutation.data && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
                <p className="text-gray-600">Your workouts have been imported successfully.</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Summary</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-700">Total Rows:</dt>
                    <dd className="text-sm text-gray-900">{importMutation.data.total}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-700">Successfully Imported:</dt>
                    <dd className="text-sm text-green-600 font-semibold">
                      {importMutation.data.successful}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-700">Failed:</dt>
                    <dd className="text-sm text-red-600 font-semibold">
                      {importMutation.data.failed}
                    </dd>
                  </div>
                </dl>
              </div>

              {importMutation.data.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
                    {importMutation.data.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message} ({error.field})
                      </li>
                    ))}
                    {importMutation.data.errors.length > 10 && (
                      <li className="font-medium">
                        ... and {importMutation.data.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleBackToUpload}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Import Another File
                </button>
                <Link
                  href="/workouts"
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center"
                >
                  View Workouts
                </Link>
              </div>
            </div>
          )}

          {importMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">
                {importMutation.error instanceof Error
                  ? importMutation.error.message
                  : 'Import failed. Please try again.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
