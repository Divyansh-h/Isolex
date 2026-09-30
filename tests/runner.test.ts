import { describe, it, expect, beforeAll } from 'vitest';
import { execute } from '../src/runner';
import { dockerClient } from '../src/docker/client';

describe('End-to-End Execution: Python', () => {
  // Ensure docker is reachable before running tests
  beforeAll(async () => {
    await dockerClient.pingDocker();
  });

  it('should successfully execute a simple hello world program', async () => {
    const result = await execute({
      code: 'print("Hello World!")',
      language: 'python'
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('Hello World!');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
    expect(result.memoryExceeded).toBeFalsy();
  });

  it('should process stdin and echo it back correctly', async () => {
    const result = await execute({
      code: 'import sys\nfor line in sys.stdin:\n    print(f"Echo: {line.strip()}")',
      language: 'python',
      stdin: 'Line 1\nLine 2\n'
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Echo: Line 1');
    expect(result.stdout).toContain('Echo: Line 2');
    expect(result.stderr).toBe('');
  });

  it('should hit the timeout limit for an infinite loop', async () => {
    const result = await execute({
      code: 'while True:\n    pass',
      language: 'python',
      timeLimitMs: 1000 // 1 second timeout for fast test evaluation
    });

    expect(result.exitCode).toBe(124);
    expect(result.timedOut).toBe(true);
  }, 10000); // 10 seconds vitest timeout

  it('should hit OOM for a memory-bomb script', async () => {
    const result = await execute({
      code: 'a = []\nwhile True:\n    a.append(" " * 10**6)',
      language: 'python',
      memoryLimitMb: 15, // Extremely low memory limit
      timeLimitMs: 5000
    });

    expect(result.memoryExceeded).toBe(true);
    expect(result.exitCode).not.toBe(0);
  }, 10000);

  it('should produce a non-zero exit with stderr populated for a syntax error', async () => {
    const result = await execute({
      code: 'print("Missing parenthesis"',
      language: 'python'
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('SyntaxError');
    expect(result.timedOut).toBe(false);
    expect(result.memoryExceeded).toBeFalsy();
  });
});
