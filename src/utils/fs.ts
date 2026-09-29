import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Creates a temporary directory and writes the user's code to a specified filename.
 * 
 * @param code The source code to write
 * @param filename The name of the file to create (e.g., 'main.py')
 * @returns The absolute path to the newly created temporary directory
 */
export async function prepareCodeDir(code: string, filename: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const prefix = path.join(tmpDir, 'isolex-sandbox-');
  const codeDir = await fs.mkdtemp(prefix);
  
  const filePath = path.join(codeDir, filename);
  await fs.writeFile(filePath, code);
  
  return codeDir;
}
