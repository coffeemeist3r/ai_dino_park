import { defineConfig } from 'vite';

export default defineConfig({
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
