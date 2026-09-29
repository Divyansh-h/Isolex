import { Container } from 'dockerode';
import { Writable } from 'stream';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Runs a created Docker container, injecting stdin and capturing stdout/stderr.
 * Wait for container completion and returns the exit code alongside the captured output.
 * 
 * @param container The dockerode Container instance to run
 * @param stdin The input string to write to standard input
 * @returns Promise resolving to an ExecutionResult object
 */
export async function runContainer(
  container: Container,
  stdin: string
): Promise<ExecutionResult> {
  // Attach to the container to gain access to streams
  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
  });

  const stdoutBuffers: Buffer[] = [];
  const stderrBuffers: Buffer[] = [];

  // Create writable streams to capture the output
  const stdoutStream = new Writable({
    write(chunk, encoding, callback) {
      stdoutBuffers.push(Buffer.from(chunk));
      callback();
    },
  });

  const stderrStream = new Writable({
    write(chunk, encoding, callback) {
      stderrBuffers.push(Buffer.from(chunk));
      callback();
    },
  });

  // Demultiplex the raw Docker stream into separated stdout and stderr
  container.modem.demuxStream(stream, stdoutStream, stderrStream);

  // Write stdin to the container and close the stream
  if (stdin) {
    stream.write(stdin);
  }
  stream.end();

  // Start the container
  await container.start();

  // Wait for the container to complete its execution
  const waitResult = await container.wait();

  // Combine the buffers and return the results
  return {
    stdout: Buffer.concat(stdoutBuffers).toString('utf-8'),
    stderr: Buffer.concat(stderrBuffers).toString('utf-8'),
    exitCode: waitResult.StatusCode,
  };
}
