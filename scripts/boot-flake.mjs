/**
 * The boot-flake reproduction harness (BACKLOG-538).
 *
 *   npm run flake:boot                       # 3 rounds x 6 cold parallel boots
 *   npm run flake:boot -- --parallel 8       # push the load
 *   npm run flake:boot -- --report           # summarize what an ordinary suite run left behind
 *
 * Why this exists. The suite has lost exactly one spec per full run, four cycles running, always inside
 * `helpers.boot()`, never on an assertion, always green when re-run isolated. Five routines have
 * diagnosed that from the outside with no instrument. The one time this class of bug actually died in
 * this repo (cycle 148 / BACKLOG-515) it died because somebody could reproduce it on demand.
 *
 * What it does that the suite cannot. `tests/e2e/globalSetup.ts` deliberately **warms** the dev server
 * before any worker opens a browser, precisely so a cold transform is never charged to a spec's clock.
 * That is the right call for the suite and it is exactly the condition under test here, so this harness
 * must **never** warm the server. If you are reading this because the numbers look boring and you are
 * about to add a warm-up: don't. That deletes the experiment.
 *
 * It is deliberately *not* wired into CI tonight. It exits non-zero on a breach so it can be, once
 * there are numbers to set a threshold from.
 *
 * Heads up: this frees port 5173 before and after every round. A dev server you had running will die.
 */

import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { DEFAULTS, formatSummary, parseArgs, parseLog, summarize } from './bootstats.mjs';

const BASE = 'http://127.0.0.1:5173';
const LOG = process.env.E2E_BOOT_LOG ?? '.e2e-boot-times.jsonl';
/** Kept in step with `tests/e2e/helpers.ts`'s BOOT_TIMEOUT by `--ceiling`'s default. */
const SERVER_START_TIMEOUT = 60_000;

function killPort() {
  spawnSync('npx', ['--yes', 'kill-port', '5173'], { stdio: 'ignore', shell: true });
}

/** Wait for the socket to answer — the same thing `webServer.url` waits for, and no more than that. */
async function waitForServer(deadline) {
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function startColdServer() {
  killPort();
  const child = spawn('npm', ['--prefix', 'game', 'run', 'dev'], { stdio: 'ignore', shell: true });
  const up = await waitForServer(Date.now() + SERVER_START_TIMEOUT);
  if (!up) {
    child.kill();
    killPort();
    throw new Error(`the dev server did not answer within ${SERVER_START_TIMEOUT}ms`);
  }
  return child;
}

function record(entry) {
  try {
    appendFileSync(LOG, `${JSON.stringify(entry)}\n`);
  } catch {
    // Fail open, same discipline as the boot clock in helpers.ts: an instrument that can fail the thing
    // it measures is worse than no instrument.
  }
}

/** One cold boot, timed in the two phases `helpers.boot()` waits on. */
async function timeBoot(browser, ceiling, label) {
  const page = await browser.newPage();
  const t0 = Date.now();
  let canvasMs = null;
  let readyMs = null;
  let error = null;
  try {
    await page.goto(`${BASE}/`);
    await page.locator('canvas').waitFor({ state: 'visible', timeout: ceiling });
    canvasMs = Date.now() - t0;
    await page.waitForFunction(() => window.__ready === true, undefined, { timeout: ceiling });
    readyMs = Date.now() - t0;
  } catch (e) {
    error = String(e).split('\n')[0];
  } finally {
    await page.close().catch(() => {});
  }
  const entry = { at: new Date().toISOString(), source: 'harness', label, canvasMs, readyMs, error };
  record(entry);
  return entry;
}

async function runRound(round, opts) {
  const server = await startColdServer();
  const browser = await chromium.launch();
  try {
    // Simultaneously, not in sequence: the seam is N fresh browsers hitting one cold server at once.
    return await Promise.all(
      Array.from({ length: opts.parallel }, (_, i) =>
        timeBoot(browser, opts.ceiling, `round ${round} / boot ${i + 1}`),
      ),
    );
  } finally {
    await browser.close().catch(() => {});
    server.kill();
    killPort(); // on Windows `child.kill()` leaves the vite grandchild holding the port
  }
}

function printTable(rows, ceiling) {
  console.log('\n  round/boot            canvas      ready    verdict');
  console.log('  ' + '-'.repeat(52));
  for (const r of rows) {
    const canvas = r.canvasMs === null ? '     —' : `${String(r.canvasMs).padStart(6)}ms`;
    const ready = r.readyMs === null ? '     —' : `${String(r.readyMs).padStart(6)}ms`;
    const verdict = r.error ? 'FAILED' : r.readyMs > ceiling ? 'BREACH' : 'ok';
    console.log(`  ${r.label.padEnd(20)} ${canvas}  ${ready}    ${verdict}`);
    if (r.error) console.log(`      ${r.error}`);
  }
}

async function harness(opts) {
  console.log(
    `boot-flake: ${opts.rounds} round(s) x ${opts.parallel} simultaneous cold boots, ceiling ${opts.ceiling}ms`,
  );
  const rows = [];
  try {
    for (let round = 1; round <= opts.rounds; round++) {
      process.stdout.write(`  round ${round}: cold server…`);
      const got = await runRound(round, opts);
      rows.push(...got);
      console.log(` ${got.length} boots`);
    }
  } finally {
    killPort();
  }
  printTable(rows, opts.ceiling);
  const samples = rows.filter((r) => r.readyMs !== null).map((r) => ({ ms: r.readyMs, label: r.label }));
  console.log(`\n${formatSummary(summarize(samples), opts.ceiling)}`);
  const breached = rows.filter((r) => r.error || r.readyMs > opts.ceiling);
  if (breached.length) {
    console.log(`\nBREACH: ${breached.length} of ${rows.length} boots did not come up inside the ceiling.`);
    return 1;
  }
  console.log(`\nNo breach at this load. The worst boot is the bound; it is not a proof of absence.`);
  return 0;
}

function report(opts) {
  let text = '';
  try {
    text = readFileSync(LOG, 'utf8');
  } catch {
    console.log(`no boot log at ${LOG} — run the suite or the harness first`);
    return 1;
  }
  // BACKLOG-553: the failed boots are no longer filtered out here. `summarize` keeps them out of every
  // number and reports them as their own block — the whole point being that a hang used to leave the
  // report entirely, which is why four cycles of this flake produced re-runs instead of a victim.
  const entries = parseLog(text);
  const samples = entries.map((e) => ({
    ms: e.readyMs,
    label: e.label ?? e.spec ?? '(unnamed)',
    failedAt: e.failedAt,
    pageErrors: e.pageErrors,
    bootError: e.bootError,
  }));
  const bySource = new Set(entries.map((e) => e.source));
  console.log(`${LOG} — sources: ${[...bySource].join(', ') || 'none'}\n`);
  console.log(formatSummary(summarize(samples), opts.ceiling));
  return 0;
}

const opts = parseArgs(process.argv.slice(2));
if (!Number.isFinite(opts.rounds) || !Number.isFinite(opts.parallel) || !Number.isFinite(opts.ceiling)) {
  console.error(`bad arguments; defaults are ${JSON.stringify(DEFAULTS)}`);
  process.exit(2);
}
process.on('SIGINT', () => {
  killPort();
  process.exit(130);
});
process.exit(opts.report ? report(opts) : await harness(opts));
