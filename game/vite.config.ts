import { defineConfig } from 'vite';

// Stamped when vite (dev or build) starts — changes every restart so you can
// confirm the running build is current (see console + the on-screen label).
const BUILD_TIME = new Date().toISOString();

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  server: {
    // host:true binds 0.0.0.0 so Playwright's 127.0.0.1 baseURL resolves.
    // Without it vite binds IPv6 [::1] only and e2e times out (BUG-001).
    host: true,
    port: 5173,
    strictPort: false,
    // Pre-transform the entry graph on server start so the first parallel cold
    // boots hit warm modules instead of racing on-demand transforms (the e2e
    // cold-start boot flake — cycle-002/003 et al).
    warmup: { clientFiles: ['./src/main.ts'] },
  },
  // Pre-bundle Phaser when the dev server starts. Otherwise Vite discovers it as a
  // new dep on the first page load and re-optimizes mid-flight, stalling every other
  // browser booting at the same time — the parallel-load boot flake under Playwright.
  optimizeDeps: { include: ['phaser'] },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
