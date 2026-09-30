export interface LanguageConfig {
  id: string;
  displayName: string;
  image: string;
  sourceFilename: string;
  compileCmd?: string[];
  runCmd: string[];
  compileTimeoutMs?: number;
  runTimeoutMs: number;
}
