import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkgPath = resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  exports?: Record<string, Record<string, string>>;
  types?: string;
  main?: string;
  module?: string;
};

describe('package.json manifest', () => {
  describe('exports map', () => {
    it('has a "." entry in exports', () => {
      expect(pkg.exports).toBeDefined();
      expect(pkg.exports?.['.']).toBeDefined();
    });

    it('has "types" as the first condition in exports["."]', () => {
      const entry = pkg.exports?.['.'];
      expect(entry).toBeDefined();
      const firstKey = Object.keys(entry ?? {})[0];
      expect(firstKey).toBe('types');
    });

    it('exports["."].types points to the declaration file', () => {
      expect(pkg.exports?.['.']?.types).toBe('./dist/index.d.ts');
    });

    it('exports["."].import points to the ESM bundle', () => {
      expect(pkg.exports?.['.']?.import).toBe('./dist/index.mjs');
    });

    it('exports["."].require points to the CJS bundle', () => {
      expect(pkg.exports?.['.']?.require).toBe('./dist/index.js');
    });

    it('exports["."] contains exactly types, import, require conditions', () => {
      const keys = Object.keys(pkg.exports?.['.'] ?? {});
      expect(keys).toEqual(['types', 'import', 'require']);
    });
  });

  describe('top-level type fields', () => {
    it('has a top-level "types" field for legacy TypeScript resolution', () => {
      expect(pkg.types).toBe('./dist/index.d.ts');
    });

    it('has a top-level "main" field for legacy CJS consumers', () => {
      expect(pkg.main).toBe('./dist/index.js');
    });

    it('has a top-level "module" field for legacy bundler ESM resolution', () => {
      expect(pkg.module).toBe('./dist/index.mjs');
    });
  });
});
