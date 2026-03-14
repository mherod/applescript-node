import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function ensureExamplesOutputDir(): Promise<void> {
  await mkdir(path.resolve(import.meta.dirname, '../output'), { recursive: true });
}
