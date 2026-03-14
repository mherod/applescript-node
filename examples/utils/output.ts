import { mkdir } from 'node:fs/promises';

export async function ensureExamplesOutputDir(): Promise<void> {
  await mkdir('examples/output', { recursive: true });
}
