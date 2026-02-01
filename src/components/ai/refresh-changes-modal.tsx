'use client';

import { useState } from 'react';

interface RefreshChangesModalProps {
  changes: {
    days_analyzed: number;
    days_regenerated: number;
    key_adjustments: string[];
  };
  rationale: string;
  onClose: () => void;
}

export default function RefreshChangesModal({
  changes,
  rationale,
  onClose,
}: RefreshChangesModalProps) {
  const [showRationale, setShowRationale] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Program Refreshed ✓
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="flex gap-4 text-center">
            <div className="flex-1 bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">
                {changes.days_analyzed}
              </div>
              <div className="text-sm text-gray-600">Workouts Analyzed</div>
            </div>
            <div className="flex-1 bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">
                {changes.days_regenerated}
              </div>
              <div className="text-sm text-gray-600">Days Updated</div>
            </div>
          </div>

          {/* Key Adjustments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Key Adjustments
            </h3>
            {changes.key_adjustments.length > 0 ? (
              <ul className="space-y-2">
                {changes.key_adjustments.map((adjustment, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <span className="text-green-600 font-bold">•</span>
                    <span>{adjustment}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No major adjustments needed.</p>
            )}
          </div>

          {/* Rationale (Expandable) */}
          <div>
            <button
              onClick={() => setShowRationale(!showRationale)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <span>{showRationale ? '▼' : '▶'}</span>
              <span>AI Rationale</span>
            </button>
            {showRationale && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                {rationale}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
