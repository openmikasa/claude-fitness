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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Programs</h1>
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
