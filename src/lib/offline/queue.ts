import { Workout } from '@/types/workout';

export interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
}

const QUEUE_KEY = 'offline_mutation_queue';

export class OfflineQueue {
  static getQueue(): QueuedMutation[] {
    if (typeof window === 'undefined') return [];
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  static addToQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): void {
    const queue = this.getQueue();
    const newMutation: QueuedMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    queue.push(newMutation);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('queue-updated', { detail: queue.length }));
  }

  static async processQueue(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const results: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        const response = await fetch(mutation.endpoint, {
          method: mutation.type === 'create' ? 'POST' : mutation.type === 'update' ? 'PUT' : 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: mutation.data ? JSON.stringify(mutation.data) : undefined,
        });

        if (!response.ok) {
          // Keep failed mutations in queue
          results.push(mutation);
        }
      } catch (error) {
        // Keep failed mutations in queue
        results.push(mutation);
      }
    }

    // Update queue with only failed mutations
    localStorage.setItem(QUEUE_KEY, JSON.stringify(results));
    window.dispatchEvent(new CustomEvent('queue-updated', { detail: results.length }));
  }

  static clearQueue(): void {
    localStorage.removeItem(QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('queue-updated', { detail: 0 }));
  }

  static getQueueLength(): number {
    return this.getQueue().length;
  }
}

// Auto-process queue when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    OfflineQueue.processQueue();
  });
}
