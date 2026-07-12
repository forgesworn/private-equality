import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/group.ts', 'src/zkp.ts', 'src/smp.ts'],
      // Branch floors re-baselined for vitest 4's AST-aware V8 remapping, which
      // counts branch directions the v2 ruler did not (e.g. the ~2^-252
      // zero-scalar retry, per-tag proof-failure throws). Same code, same suite:
      // lines remain 100% on all three files.
      thresholds: {
        'src/group.ts': { lines: 90, branches: 70, functions: 100, statements: 90 },
        'src/zkp.ts': { lines: 95, branches: 90, functions: 100, statements: 95 },
        'src/smp.ts': { lines: 90, branches: 70, functions: 100, statements: 90 }
      }
    }
  }
})
