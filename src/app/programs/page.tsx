'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePrograms, useDeleteProgram } from '@/lib/hooks/useAI';
import { NextSessionCard } from '@/components/ai/next-session-card';
import { WeeklyPlanView } from '@/components/ai/weekly-plan-view';

export default function ProgramsPage() {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>(
    'all'
  );

  const { data: programs, isLoading } = usePrograms(
    filter === 'all' ? {} : { status: filter }
  );
  const deleteMutation = useDeleteProgram();

  const handleDelete = (programId: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      deleteMutation.mutate(programId);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view programs</p>
      </div>
    );
  }

  const latestWeeklyPlan = programs
    ?.filter((p) => p.program_type === 'weekly_plan')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Programs</h1>

        <div className="space-y-6 mb-8">
          <NextSessionCard />
          <WeeklyPlanView existingPlan={latestWeeklyPlan} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Program History</h2>

            <div className="flex gap-2">
              {(['all', 'active', 'pending', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {program.program_type.replace('_', ' ')}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            program.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : program.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {program.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Created {format(parseISO(program.created_at), 'MMM d, yyyy')}
                      </p>
                      {program.valid_from && (
                        <p className="text-sm text-gray-600">
                          Valid: {format(parseISO(program.valid_from), 'MMM d')} -{' '}
                          {format(parseISO(program.valid_until), 'MMM d')}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(program.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-sm text-gray-700 mt-2">{program.rationale}</p>

                  <div className="mt-3 text-xs text-gray-500">
                    {program.plan_data.length} day
                    {program.plan_data.length !== 1 ? 's' : ''} planned
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No programs found</p>
              <p className="text-sm mt-2">
                Generate your first AI recommendation above!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
