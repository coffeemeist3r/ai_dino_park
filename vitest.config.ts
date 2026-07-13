import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Both roots: the pipeline's unit tests live in tests/unit, but cycle-99+ also colocate pure-module
    // tests beside the source (game/src/**). Without the second glob those colocated tests silently never
    // run — vitest reports green while skipping them. Enforce the whole committed suite.
    include: ['tests/unit/**/*.test.ts', 'game/src/**/*.test.ts'],
    environment: 'node',
  },
});
