import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/index.node.ts', 'src/index.bun.ts'],
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
