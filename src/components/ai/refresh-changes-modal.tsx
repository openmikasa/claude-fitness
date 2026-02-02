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
      <div className="bg-white border-3 border-black rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b-3 border-black bg-[#8B5CF6]">
          <h2 className="text-2xl font-bold uppercase text-white flex items-center gap-2">
            <span>✓</span>
            Program Refreshed
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="flex gap-4 text-center">
            <div className="flex-1 bg-gray-100 border-3 border-black rounded-sm p-4">
              <div className="text-3xl font-bold text-black">
                {changes.days_analyzed}
              </div>
              <div className="text-sm text-gray-600 font-mono uppercase">Workouts Analyzed</div>
            </div>
            <div className="flex-1 bg-[#22FF00]/20 border-3 border-[#22FF00] rounded-sm p-4">
              <div className="text-3xl font-bold text-black">
                {changes.days_regenerated}
              </div>
              <div className="text-sm text-gray-600 font-mono uppercase">Days Updated</div>
            </div>
          </div>

          {/* Key Adjustments */}
          <div>
            <h3 className="text-lg font-bold uppercase text-black mb-3">
              Key Adjustments
            </h3>
            {changes.key_adjustments.length > 0 ? (
              <ul className="space-y-2">
                {changes.key_adjustments.map((adjustment, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <span className="text-[#22FF00] font-bold text-xl">•</span>
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
              className="flex items-center gap-2 text-[#8B5CF6] hover:text-black font-bold uppercase transition-colors"
            >
              <span>{showRationale ? '▼' : '▶'}</span>
              <span>AI Rationale</span>
            </button>
            {showRationale && (
              <div className="mt-3 p-4 bg-gray-100 border-3 border-black rounded-sm text-gray-700 whitespace-pre-wrap">
                {rationale}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-3 border-black">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-[#8B5CF6] text-white border-3 border-black rounded-sm shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold uppercase transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
