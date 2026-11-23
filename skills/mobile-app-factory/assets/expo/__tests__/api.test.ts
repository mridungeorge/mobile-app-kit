import { ApiError, toState } from '../src/api';

const habits = [{ id: 'a', title: 'Walk', streak: 1 }];

describe('toState', () => {
  it('renders content when the API answers', () => {
    expect(toState(habits, [])).toEqual({ status: 'content', habits });
  });

  it('falls back to the cache when the network is gone', () => {
    expect(toState([], habits, new ApiError('offline', 'no network'))).toEqual({ status: 'offline', habits });
  });

  it('shows an error when there is no cache either', () => {
    expect(toState([], [], new ApiError('server', 'The server returned 500.'))).toEqual({
      status: 'error',
      message: 'The server returned 500.',
    });
  });

  it('shows empty only when nothing is cached and nothing failed', () => {
    expect(toState([], [])).toEqual({ status: 'empty' });
  });
});
