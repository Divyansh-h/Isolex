export interface JudgeResult {
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  time: number;
  memory: number;
  output?: string;
  error?: string;
}

export interface LanguageConfig {
  name: string;
  image: string;
  compileCmd?: string;
  runCmd: string;
}
