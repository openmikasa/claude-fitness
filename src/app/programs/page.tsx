'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { WeeklyPlanView } from '@/components/ai/weekly-plan-view';
import { ProgramManager } from '@/components/ai/program-manager';

export default function ProgramsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-subtext-light dark:text-subtext-dark">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-subtext-light dark:text-subtext-dark">Please log in to view programs</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block mb-8">
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">AI Programs</h1>
        </Link>

        <div className="space-y-6">
          {/* Program Generation Section */}
          <WeeklyPlanView />

          {/* Program Management Section */}
          <ProgramManager />
        </div>
      </div>
    </div>
  );
}
