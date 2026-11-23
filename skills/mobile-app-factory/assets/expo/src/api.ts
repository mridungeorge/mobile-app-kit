export type Habit = { id: string; title: string; streak: number };

export type LoadState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'offline'; habits: Habit[] }
  | { status: 'error'; message: string }
  | { status: 'content'; habits: Habit[] };

export class ApiError extends Error {
  constructor(public kind: 'offline' | 'server' | 'decoding', message: string) {
    super(message);
  }
}

/** One network boundary. Swap MockApi for LiveApi when the backend exists. */
export interface Api {
  habits(): Promise<Habit[]>;
  deleteAccount(token: string): Promise<void>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MockApi: Api = {
  async habits() {
    await wait(150);
    return [
      { id: 'walk', title: 'Morning walk', streak: 12 },
      { id: 'read', title: 'Read 20 pages', streak: 4 },
      { id: 'quiet', title: 'No phone after 22:00', streak: 31 },
    ];
  },
  async deleteAccount() {
    await wait(150);
  },
};

/** Pure state machine, so the four store-review states are testable without a device. */
export function toState(habits: Habit[], cached: Habit[], error?: ApiError): LoadState {
  if (habits.length) return { status: 'content', habits };
  if (cached.length) return { status: 'offline', habits: cached };
  if (error?.kind === 'offline') return { status: 'offline', habits: [] };
  if (error) return { status: 'error', message: error.message };
  return { status: 'empty' };
}
