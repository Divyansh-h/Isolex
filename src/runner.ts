import { promises as fs } from 'fs';
import { Container } from 'dockerode';
import { prepareCodeDir } from './utils/fs';
import { createSandboxContainer, SandboxOptions } from './docker/container';
import { runContainer, ExecutionResult } from './docker/execute';
import { getLanguageConfig } from './languages/registry';

export interface ExecuteRequest {
  code: string;
  language: string;
  stdin?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

interface SandboxPhaseOptions {
  stdin?: string;
  timeoutMs?: number;
  containerOpts?: SandboxOptions;
}

/**
 * Runs a single phase (compile or run) inside a sandbox container.
 * Guarantees container cleanup.
 */
export async function runSandboxPhase(
  codeDir: string,
  image: string,
  cmd: string[],
  options: SandboxPhaseOptions = {}
): Promise<ExecutionResult> {
  let container: Container | undefined;
  try {
    container = await createSandboxContainer(image, cmd, codeDir, options.containerOpts);
    return await runContainer(container, options.stdin || '', options.timeoutMs);
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (err) {
        // Ignore if already removed or missing
      }
    }
  }
}

/**
 * End-to-end execution entry point.
 * Specific to supported languages.
 */
export async function execute(req: ExecuteRequest): Promise<ExecutionResult> {
  const config = getLanguageConfig(req.language);
  let codeDir: string | undefined;

  try {
    codeDir = await prepareCodeDir(req.code, config.sourceFilename);
    
    let compileOutput = '';
    
    // Compile phase
    if (config.compileCmd) {
      const compileResult = await runSandboxPhase(codeDir, config.image, config.compileCmd, {
        timeoutMs: config.compileTimeoutMs,
        containerOpts: {
          readOnlyCodeDir: false
        }
      });
      
      compileOutput = compileResult.stderr;
      
      if (compileResult.exitCode !== 0) {
        return {
          verdict: 'CE',
          compileOutput: compileResult.stderr,
          stdout: compileResult.stdout,
          stderr: compileResult.stderr,
          exitCode: compileResult.exitCode,
          timedOut: compileResult.timedOut,
          memoryExceeded: compileResult.memoryExceeded,
          containerExitCode: compileResult.containerExitCode
        };
      }
    }

    // Run phase
    const runResult = await runSandboxPhase(codeDir, config.image, config.runCmd, {
      stdin: req.stdin,
      timeoutMs: req.timeLimitMs || config.runTimeoutMs,
      containerOpts: {
        memoryMB: req.memoryLimitMb,
        readOnlyCodeDir: false
      }
    });
    
    if (compileOutput) {
      runResult.compileOutput = compileOutput;
    }
    
    return runResult;
  } finally {
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
