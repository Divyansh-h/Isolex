import { promises as fs } from 'fs';
import { Container } from 'dockerode';
import { prepareCodeDir } from './utils/fs';
import { createSandboxContainer, SandboxOptions } from './docker/container';
import { runContainer, ExecutionResult } from './docker/execute';

export interface ExecuteParams {
  code: string;
  filename: string;
  image: string;
  cmd: string[];
  stdin?: string;
  timeoutMs?: number;
  options?: SandboxOptions;
}

/**
 * Orchestrates the full lifecycle of a sandbox execution securely.
 * Guarantees cleanup of containers and temporary directories via try/finally.
 */
export async function executeCode(params: ExecuteParams): Promise<ExecutionResult> {
  let codeDir: string | undefined;
  let container: Container | undefined;

  try {
    codeDir = await prepareCodeDir(params.code, params.filename);
    container = await createSandboxContainer(params.image, params.cmd, codeDir, params.options);
    
    // Start, wait, and capture output
    const result = await runContainer(container, params.stdin || '', params.timeoutMs);
    return result;
  } finally {
    // Guarantee cleanup of the container regardless of failure
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (err) {
        // Ignore if already removed or missing
      }
    }
    
    // Guarantee cleanup of the temporary code directory
    if (codeDir) {
      try {
        await fs.rm(codeDir, { recursive: true, force: true });
      } catch (err) {
        // Ignore file removal errors
      }
    }
  }
}
