import { Container } from 'dockerode';
import { docker } from './client';

export interface SandboxOptions {
  /** Memory limit in megabytes (defaults to 256) */
  memoryMB?: number;
  /** Number of CPUs (defaults to 1) */
  cpus?: number;
  /** Process ID limit (defaults to 64) */
  pidsLimit?: number;
}

/**
 * Creates a highly restricted Docker container for sandbox execution.
 * Applies strict lockdown flags.
 * Returns the container object without starting it.
 *
 * @param image The Docker image to use
 * @param cmd The command to execute in the container
 * @param options Resource limit options
 * @returns Promise resolving to a Dockerode Container instance
 */
export async function createSandboxContainer(
  image: string,
  cmd: string[],
  codeDir: string,
  options: SandboxOptions = {}
): Promise<Container> {
  const memoryMB = options.memoryMB || 256;
  const memoryBytes = memoryMB * 1024 * 1024;
  const cpus = options.cpus || 1;
  const nanoCpus = Math.floor(cpus * 10 ** 9);
  const pidsLimit = options.pidsLimit || 64;

  const container = await docker.createContainer({
    Image: image,
    Cmd: cmd,
    User: 'sandbox',
    HostConfig: {
      NetworkMode: 'none',
      Memory: memoryBytes,
      MemorySwap: memoryBytes,
      NanoCpus: nanoCpus,
      PidsLimit: pidsLimit,
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      AutoRemove: false, // We'll remove manually to inspect the exit state
      Binds: [`${codeDir}:/sandbox:ro`],
      Tmpfs: {
        '/tmp': 'size=64m',
      },
    },
  });

  return container;
}
