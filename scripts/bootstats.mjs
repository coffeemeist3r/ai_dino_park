/**
 * The arithmetic behind the boot-flake instrument (BACKLOG-538).
 *
 * Kept apart from `boot-flake.mjs` and unit-tested, because a summary that quietly computes the wrong
 * p95 is worse than no summary at all: it would have this studio arguing about a number nobody checked,
 * which is how four previous diagnoses of this flake were made.
 *
 * Pure: no I/O, no process, no playwright. Node-testable from `tests/unit/bootstats.test.ts`.
 */

/**
 * Nearest-rank percentile over an **already-sorted ascending** array of numbers.
 *
 * Nearest-rank rather than an interpolating definition on purpose: with the handful of samples a
 * three-round harness produces, an interpolated p95 invents a boot time that never happened, and the
 * one thing this instrument exists to report is boot times that did.
 */
export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

/**
 * Fold `{ ms, label }` samples into the numbers a reader actually wants.
 *
 * `worst` is the label of the **max**, never of the last sample — naming the wrong victim is the
 * specific failure this whole item is about.
 */
export function summarize(samples) {
  const clean = samples.filter((s) => Number.isFinite(s?.ms));
  if (!clean.length) return null;
  const sorted = [...clean].map((s) => s.ms).sort((a, b) => a - b);
  let worstSample = clean[0];
  for (const s of clean) if (s.ms > worstSample.ms) worstSample = s;
  return {
    count: clean.length,
    min: sorted[0],
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: worstSample.ms,
    worst: worstSample.label ?? '(unlabelled)',
  };
}

/** The printable block. `headroom` is what is left of the ceiling after the worst boot observed. */
export function formatSummary(summary, ceilingMs) {
  if (!summary) return 'no boots recorded';
  const headroom = ceilingMs - summary.max;
  const pct = ((headroom / ceilingMs) * 100).toFixed(1);
  return [
    `boots       ${summary.count}`,
    `min         ${summary.min}ms`,
    `median      ${summary.median}ms`,
    `p95         ${summary.p95}ms`,
    `max         ${summary.max}ms  (${summary.worst})`,
    `ceiling     ${ceilingMs}ms`,
    `headroom    ${headroom}ms  (${pct}% of the ceiling still unused)`,
  ].join('\n');
}

/** Defaults live here, with the flag parsing, so both are testable without spawning a browser. */
export const DEFAULTS = { rounds: 3, parallel: 6, ceiling: 30_000, report: false };

export function parseArgs(argv) {
  const out = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--report') out.report = true;
    else if (a === '--rounds') out.rounds = Number(argv[++i]);
    else if (a === '--parallel') out.parallel = Number(argv[++i]);
    else if (a === '--ceiling') out.ceiling = Number(argv[++i]);
  }
  return out;
}

/** Read a JSONL log, dropping unparseable lines — a run killed mid-write leaves a partial last line. */
export function parseLog(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // A partially-written line is expected from a killed run, not an error.
    }
  }
  return out;
}
