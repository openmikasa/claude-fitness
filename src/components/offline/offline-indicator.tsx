'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    // Initial queue length
    if (typeof window !== 'undefined') {
      const { OfflineQueue } = require('@/lib/offline/queue');
      setQueueLength(OfflineQueue.getQueueLength());
    }

    // Listen for queue updates
    const handleQueueUpdate = (event: CustomEvent) => {
      setQueueLength(event.detail);
    };

    window.addEventListener('queue-updated', handleQueueUpdate as EventListener);

    return () => {
      window.removeEventListener('queue-updated', handleQueueUpdate as EventListener);
    };
  }, []);

  if (isOnline && queueLength === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-lg shadow-lg p-4 ${
        isOnline ? 'bg-blue-600' : 'bg-yellow-600'
      } text-white`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isOnline ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          {isOnline ? (
            <div>
              <p className="font-medium">Back online</p>
              {queueLength > 0 && (
                <p className="text-sm text-white/90">
                  Syncing {queueLength} pending {queueLength === 1 ? 'change' : 'changes'}...
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="font-medium">You&apos;re offline</p>
              <p className="text-sm text-white/90">
                Changes will be saved when you reconnect
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
