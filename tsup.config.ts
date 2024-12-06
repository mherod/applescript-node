import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  external: ['vitest'],
  tsconfig: './tsconfig.build.json',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
});
