'use client';

import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Help & Documentation</h1>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Quick Start */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Start Guide</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. Log Your First Workout</h3>
                <p className="text-sm">
                  Navigate to the Log Workout page and choose your workout type (Strength, Cardio, Sauna, or Mobility).
                  Fill in the details and save.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. View Your History</h3>
                <p className="text-sm">
                  Check the Workouts page to see all your logged sessions. Use filters to find specific workouts.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Get AI Recommendations</h3>
                <p className="text-sm">
                  Visit the Programs page to generate personalized workout recommendations based on your history.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Workout Logging</h3>
                <p className="text-sm text-gray-700">
                  Track four types of workouts: Strength (exercises, sets, reps, weight), Cardio (time, distance, pace),
                  Sauna (duration, temperature), and Mobility (exercises, duration).
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">CSV Import</h3>
                <p className="text-sm text-gray-700">
                  Import up to 5,000 historical workouts from a CSV file. The system auto-detects common column names
                  and validates data before import.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">AI Programming</h3>
                <p className="text-sm text-gray-700">
                  Get personalized next session recommendations or complete 7-day training plans powered by Claude AI.
                  Rate limited to 10 requests per day to prevent abuse.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Data Export</h3>
                <p className="text-sm text-gray-700">
                  Export your workout data in CSV or JSON format for backup or analysis in external tools.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">How do I edit a workout?</h3>
                <p className="text-sm text-gray-700">
                  Click on any workout in your history to view details, then click the Edit button.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">What&apos;s the AI rate limit?</h3>
                <p className="text-sm text-gray-700">
                  You can generate up to 10 AI recommendations per day. The counter resets at midnight UTC.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">How do I import workouts?</h3>
                <p className="text-sm text-gray-700">
                  Go to Import Workouts, upload your CSV file (max 5,000 rows, 10MB), map the columns to workout fields,
                  and review before importing.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Can I use this offline?</h3>
                <p className="text-sm text-gray-700">
                  This is a web app that requires an internet connection for full functionality.
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-sm text-gray-700 mb-4">
              If you encounter any issues or have feature requests, please reach out through GitHub.
            </p>
            <a
              href="https://github.com/anthropics/claude-fitness/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
