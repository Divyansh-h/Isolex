import Docker from 'dockerode';

export class DockerClient {
  private static instance: DockerClient;
  public readonly client: Docker;

  private constructor() {
    // Connecting to the local Docker daemon socket by default
    this.client = new Docker();
  }

  /**
   * Retrieves the singleton instance of the DockerClient.
   */
  public static getInstance(): DockerClient {
    if (!DockerClient.instance) {
      DockerClient.instance = new DockerClient();
    }
    return DockerClient.instance;
  }

  /**
   * Verifies that the Docker daemon is reachable.
   * Throws a clear error if the daemon cannot be contacted.
   */
  public async pingDocker(): Promise<void> {
    try {
      await this.client.ping();
    } catch (error) {
      throw new Error('Docker daemon not found — is Docker running?');
    }
  }
}

// Export the singleton instance for direct use across the app
export const dockerClient = DockerClient.getInstance();
export const docker = dockerClient.client;
