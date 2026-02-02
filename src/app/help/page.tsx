'use client';

import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <header className="bg-card-light dark:bg-card-dark border-b-3 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold uppercase tracking-wide text-text-light dark:text-text-dark">Help & Docs</h1>
            </Link>
            <Link href="/" className="text-sm text-primary hover:underline font-bold uppercase">
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Quick Start */}
          <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6 relative">
            <div className="absolute -top-1 -left-1 bg-accent-bright px-3 py-1 border-2 border-black font-bold text-sm">
              ✨
            </div>
            <h2 className="text-xl font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2 pt-4">
              <span>🚀</span> Quick Start Guide
            </h2>
            <div className="space-y-4 text-text-light dark:text-text-dark">
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">1. Log Your First Workout</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Navigate to the Log Workout page and choose your workout type (Strength, Cardio, Sauna, or Mobility).
                  Fill in the details and save.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">2. View Your History</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Check the Workouts page to see all your logged sessions. Use filters to find specific workouts.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">3. Get AI Recommendations</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Visit the Programs page to generate personalized workout recommendations based on your history.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
            <h2 className="text-xl font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
              <span>💪</span> Core Features
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">Workout Logging</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Track four types of workouts: Strength (exercises, sets, reps, weight), Cardio (time, distance, pace),
                  Sauna (duration, temperature), and Mobility (exercises, duration).
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">CSV Import</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Import up to 5,000 historical workouts from a CSV file. The system auto-detects common column names
                  and validates data before import.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">AI Programming</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Get personalized next session recommendations or complete 7-day training plans powered by Claude AI.
                  Rate limited to 10 requests per day to prevent abuse.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-2">Data Export</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Export your workout data in CSV or JSON format for backup or analysis in external tools.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
            <h2 className="text-xl font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
              <span>❓</span> Frequently Asked
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-1">How do I edit a workout?</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Click on any workout in your history to view details, then click the Edit button.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-1">What&apos;s the AI rate limit?</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  You can generate up to 10 AI recommendations per day. The counter resets at midnight UTC.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-1">How do I import workouts?</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  Go to Import Workouts, upload your CSV file (max 5,000 rows, 10MB), map the columns to workout fields,
                  and review before importing.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-text-light dark:text-text-dark mb-1">Can I use this offline?</h3>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">
                  This is a web app that requires an internet connection for full functionality.
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-card-light dark:bg-card-dark rounded-sm shadow-brutal border-3 border-black dark:border-white p-6">
            <h2 className="text-xl font-bold uppercase text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
              <span>📧</span> Need More Help?
            </h2>
            <p className="text-sm text-subtext-light dark:text-subtext-dark mb-4">
              If you encounter any issues or have feature requests, please reach out through GitHub.
            </p>
            <a
              href="https://github.com/anthropics/claude-fitness/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-white px-6 py-3 rounded-sm font-bold uppercase border-3 border-black dark:border-white shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
