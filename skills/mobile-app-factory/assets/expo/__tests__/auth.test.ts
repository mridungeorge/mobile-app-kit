import { validateCredentials } from '../src/auth';

describe('validateCredentials', () => {
  it('accepts a valid pair', () => {
    expect(validateCredentials('user@example.com', 'correct horse')).toBeNull();
  });

  it('trims and lowercases nothing it does not need to', () => {
    expect(validateCredentials('  user@example.com ', 'correct horse')).toBeNull();
  });

  it('rejects a malformed address', () => {
    expect(validateCredentials('nope', 'correct horse')).toMatch(/valid email/);
  });

  it('rejects a short password', () => {
    expect(validateCredentials('user@example.com', 'short')).toMatch(/8 characters/);
  });
});
