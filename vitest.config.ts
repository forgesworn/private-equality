import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/group.ts', 'src/zkp.ts', 'src/smp.ts'],
      thresholds: {
        'src/group.ts': { lines: 90, branches: 85, functions: 100, statements: 90 },
        'src/zkp.ts': { lines: 95, branches: 90, functions: 100, statements: 95 },
        'src/smp.ts': { lines: 90, branches: 85, functions: 100, statements: 90 }
      }
    }
  }
})
