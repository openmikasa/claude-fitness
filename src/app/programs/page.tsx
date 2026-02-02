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
          <div className="w-12 h-12 border-3 border-black dark:border-white border-t-primary mx-auto animate-spin mb-4"></div>
          <p className="text-subtext-light dark:text-subtext-dark font-bold uppercase">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <p className="text-subtext-light dark:text-subtext-dark font-bold uppercase">Please log in to view programs</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block mb-8">
          <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
            <span className="heading-underline">AI Programs</span>
          </h1>
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
