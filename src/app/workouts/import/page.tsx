'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useImportWorkouts } from '@/lib/hooks/useImport';
import CsvUpload from '@/components/import/csv-upload';
import ColumnMapper from '@/components/import/column-mapper';
import type { ImportPreview, CsvMapping, CsvRow } from '@/types/import';
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
  const [allRows, setAllRows] = useState<CsvRow[]>([]);

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
        setAllRows(results.data as CsvRow[]);
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
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-lg font-bold uppercase text-text-light dark:text-text-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <header className="bg-card-light dark:bg-card-dark border-b-3 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold uppercase tracking-wide text-text-light dark:text-text-dark">
                Import Workouts
              </h1>
            </Link>
            <Link
              href="/workouts"
              className="text-sm text-primary hover:underline font-bold uppercase"
            >
              ← Back to Workouts
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className={`text-sm font-bold uppercase ${step === 'upload' ? 'text-text-light dark:text-text-dark bg-accent px-2 py-1' : 'text-subtext-light dark:text-subtext-dark'}`}>
              1. Upload
            </span>
            <span className={`text-sm font-bold uppercase ${step === 'map' ? 'text-text-light dark:text-text-dark bg-accent px-2 py-1' : 'text-subtext-light dark:text-subtext-dark'}`}>
              2. Map Columns
            </span>
            <span className={`text-sm font-bold uppercase ${step === 'review' ? 'text-text-light dark:text-text-dark bg-accent px-2 py-1' : 'text-subtext-light dark:text-subtext-dark'}`}>
              3. Review
            </span>
            <span className={`text-sm font-bold uppercase ${step === 'importing' || step === 'complete' ? 'text-text-light dark:text-text-dark bg-accent px-2 py-1' : 'text-subtext-light dark:text-subtext-dark'}`}>
              4. Import
            </span>
          </div>
          <div className="w-full bg-background-light dark:bg-background-dark h-3 border-2 border-black dark:border-white rounded-sm overflow-hidden">
            <div
              className="bg-black dark:bg-white h-full transition-all duration-300"
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
        <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
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
              <div className="bg-accent-light dark:bg-accent-dark border-3 border-black dark:border-white rounded-sm p-4">
                <p className="text-sm text-text-light dark:text-text-dark">
                  Review your import settings before proceeding. This will import{' '}
                  <strong>{preview.totalRows} rows</strong> from <strong>{file?.name}</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-2">Column Mapping</h3>
                <div className="bg-background-light dark:bg-background-dark border-3 border-black dark:border-white rounded-sm p-4">
                  <dl className="grid grid-cols-2 gap-4">
                    {mapping.dateColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Date:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.dateColumn}</dd>
                      </>
                    )}
                    {mapping.workoutTypeColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Workout Type:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.workoutTypeColumn}</dd>
                      </>
                    )}
                    {mapping.exerciseColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Exercise:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.exerciseColumn}</dd>
                      </>
                    )}
                    {mapping.weightColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Weight:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.weightColumn}</dd>
                      </>
                    )}
                    {mapping.repsColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Reps:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.repsColumn}</dd>
                      </>
                    )}
                    {mapping.setsColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Sets:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.setsColumn}</dd>
                      </>
                    )}
                    {mapping.notesColumn && (
                      <>
                        <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Notes:</dt>
                        <dd className="text-sm text-subtext-light dark:text-subtext-dark">{mapping.notesColumn}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackToMap}
                  className="flex-1 px-4 py-3 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-3 text-sm font-bold uppercase text-white bg-primary border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Start Import
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 border-4 border-black dark:border-white border-t-primary animate-spin"></div>
              <p className="text-lg font-bold uppercase text-text-light dark:text-text-dark">Importing workouts...</p>
              <p className="text-sm text-subtext-light dark:text-subtext-dark">This may take a moment</p>
            </div>
          )}

          {step === 'complete' && importMutation.data && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-sm bg-success border-3 border-black mb-4">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold uppercase text-text-light dark:text-text-dark mb-2">Import Complete!</h2>
                <p className="text-subtext-light dark:text-subtext-dark">Your workouts have been imported successfully.</p>
              </div>

              <div className="bg-background-light dark:bg-background-dark border-3 border-black dark:border-white rounded-sm p-6">
                <h3 className="text-lg font-bold uppercase text-text-light dark:text-text-dark mb-4">Import Summary</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Total Rows:</dt>
                    <dd className="text-sm text-text-light dark:text-text-dark">{importMutation.data.total}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Successfully Imported:</dt>
                    <dd className="text-sm text-success font-bold">
                      {importMutation.data.successful}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-bold uppercase text-text-light dark:text-text-dark">Failed:</dt>
                    <dd className="text-sm text-danger font-bold">
                      {importMutation.data.failed}
                    </dd>
                  </div>
                </dl>
              </div>

              {importMutation.data.errors.length > 0 && (
                <div className="bg-danger/10 border-3 border-danger rounded-sm p-4">
                  <h4 className="text-sm font-bold uppercase text-danger mb-2">Errors:</h4>
                  <ul className="text-sm text-danger space-y-1 max-h-48 overflow-y-auto">
                    {importMutation.data.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message} ({error.field})
                      </li>
                    ))}
                    {importMutation.data.errors.length > 10 && (
                      <li className="font-bold">
                        ... and {importMutation.data.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleBackToUpload}
                  className="flex-1 px-4 py-3 text-sm font-bold uppercase text-text-light dark:text-text-dark bg-card-light dark:bg-card-dark border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Import Another File
                </button>
                <Link
                  href="/workouts"
                  className="flex-1 px-4 py-3 text-sm font-bold uppercase text-white bg-primary border-3 border-black dark:border-white rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center"
                >
                  View Workouts
                </Link>
              </div>
            </div>
          )}

          {importMutation.isError && (
            <div className="bg-danger/10 border-3 border-danger rounded-sm p-4">
              <p className="text-sm text-danger font-bold">
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
