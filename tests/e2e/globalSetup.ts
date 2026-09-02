/**
 * Warm the dev server before any worker opens a browser (BACKLOG-515, second cause).
 *
 * `webServer.url` waits for the socket to answer, not for Vite to have transformed anything. So the first
 * spec through the door pays the entire cold transform — Phaser is a large graph — inside `boot()`'s 30s
 * ceiling, while a second worker piles onto the same server and doubles the wait. That is the
 * *passes serial, fails under load* half of 515: the `controls-help` class, and the `cycle-139-quorum` and
 * `cycle-102-book-foodweb` boot timeouts seen while the input race was being fixed. It is a **budget**
 * problem, not a hang, and the honest fix is to stop putting the bill on a spec's clock rather than to
 * raise the ceiling until it fits.
 *
 * One HTTP request for the entry module does it: Vite transforms on request, so by the time the workers
 * start the graph is built and every boot is a warm boot. Cheap, and it fails open — a warm-up that cannot
 * reach the server is not a reason to fail a run that has not started yet.
 */
async function warm(url: string): Promise<void> {
  try {
    await fetch(url);
  } catch {
    // Fails open on purpose: `webServer` owns whether the server is up, not this file.
  }
}

export default async function globalSetup(): Promise<void> {
  const base = 'http://127.0.0.1:5173';
  await warm(`${base}/`);
  await warm(`${base}/src/main.ts`);
}
