import { describe, it, expect, vi } from 'vitest';
import { executeCode } from '../src/runner';
import * as containerModule from '../src/docker/container';
import * as executeModule from '../src/docker/execute';
import { promises as fs } from 'fs';

describe('Execution Lifecycle Cleanup', () => {
  it('should guarantee cleanup of container and temp dir even if an error is thrown', async () => {
    // 1. Spy on fs.rm to verify it gets called (we don't mock the implementation completely so we can see the real args)
    const rmSpy = vi.spyOn(fs, 'rm').mockResolvedValue(undefined);
    
    // 2. Mock container creation to return a dummy container object with a mocked remove method
    const mockRemove = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(containerModule, 'createSandboxContainer').mockResolvedValue({
      remove: mockRemove
    } as any);

    // 3. Mock runContainer to throw an intentional error mid-execution
    vi.spyOn(executeModule, 'runContainer').mockRejectedValue(new Error('Intentional crash mid-execution'));

    // Execute and expect it to reject with our specific error
    await expect(
      executeCode({
        code: 'print("Hello World")',
        filename: 'main.py',
        image: 'python:3.11-alpine',
        cmd: ['python', 'main.py']
      })
    ).rejects.toThrow('Intentional crash mid-execution');

    // 4. Verify cleanup happened despite the throw
    expect(mockRemove).toHaveBeenCalledWith({ force: true });
    
    // Ensure fs.rm was called on the generated temp codeDir
    expect(rmSpy).toHaveBeenCalled();
    const removedPath = rmSpy.mock.calls[0][0] as string;
    expect(removedPath).toContain('isolex-sandbox-');
    expect(rmSpy.mock.calls[0][1]).toEqual({ recursive: true, force: true });

    // Clean up our spies
    vi.restoreAllMocks();
  });
});
