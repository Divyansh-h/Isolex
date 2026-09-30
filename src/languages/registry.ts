import { LanguageConfig } from './types';

export const languageRegistry: Record<string, LanguageConfig> = {
  python: {
    id: 'python',
    displayName: 'Python 3.11',
    image: 'python:3.11-alpine',
    sourceFilename: 'main.py',
    runCmd: ['python', 'main.py'],
    runTimeoutMs: 5000,
  },
};

export function getLanguageConfig(id: string): LanguageConfig {
  const config = languageRegistry[id];
  if (!config) {
    throw new Error(`Language '${id}' is not supported.`);
  }
  return config;
}
