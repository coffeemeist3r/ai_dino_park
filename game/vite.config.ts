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
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
