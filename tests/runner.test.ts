import { describe, it, expect } from 'vitest';
import { Runner } from '../src/runner';

describe('Runner', () => {
  it('should initialize', () => {
    const runner = new Runner();
    expect(runner).toBeDefined();
  });
});
