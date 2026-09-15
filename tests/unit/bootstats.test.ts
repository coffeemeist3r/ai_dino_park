import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs test infra, deliberately outside the game's TS build (BACKLOG-538)
import { DEFAULTS, formatSummary, parseArgs, parseLog, percentile, summarize } from '../../scripts/bootstats.mjs';
import { recordBootLine } from '../e2e/helpers';

/**
 * BACKLOG-538 — the arithmetic behind the boot-flake instrument.
 *
 * A summary that quietly computes the wrong p95 is worse than no summary: it would have this studio
 * arguing about a number nobody checked, which is how four previous diagnoses of this flake were made.
 */
describe('percentile', () => {
  it('has no answer for no samples', () => {
    expect(percentile([], 95)).toBeNull();
  });

  it('answers a single sample with that sample, at any percentile', () => {
    expect(percentile([7], 50)).toBe(7);
    expect(percentile([7], 95)).toBe(7);
  });

  it('is nearest-rank, so it only ever reports a boot time that actually happened', () => {
    const ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(ten, 50)).toBe(5);
    expect(percentile(ten, 95)).toBe(10);
    expect(percentile(ten, 100)).toBe(10);
  });
});

describe('summarize', () => {
  it('has no answer for no samples', () => {
    expect(summarize([])).toBeNull();
  });

  it('names the worst by the max, never by the last sample — naming the wrong victim is the bug', () => {
    const s = summarize([
      { ms: 900, label: 'early' },
      { ms: 4200, label: 'the slow one' },
      { ms: 1100, label: 'last' },
    ])!;
    expect(s.max).toBe(4200);
    expect(s.worst).toBe('the slow one');
    expect(s.min).toBe(900);
    expect(s.count).toBe(3);
  });

  it('ignores a boot that never came up rather than counting it as zero', () => {
    expect(summarize([{ ms: null, label: 'timed out' }, { ms: 5, label: 'ok' }])!.count).toBe(1);
  });
});

describe('formatSummary', () => {
  it('reports headroom as ceiling minus the worst boot observed', () => {
    const out = formatSummary(summarize([{ ms: 8000, label: 'x' }]), 30_000);
    expect(out).toContain('30000ms');
    expect(out).toContain('8000ms');
    expect(out).toContain('22000ms');
  });

  it('says so plainly when there is nothing to summarize', () => {
    expect(formatSummary(null, 30_000)).toBe('no boots recorded');
  });
});

describe('parseArgs', () => {
  it('defaults to a run that finishes in a few minutes', () => {
    expect(parseArgs([])).toEqual(DEFAULTS);
  });

  it('takes the overrides the harness documents', () => {
    const o = parseArgs(['--rounds', '1', '--parallel', '8', '--ceiling', '15000']);
    expect(o).toEqual({ rounds: 1, parallel: 8, ceiling: 15_000, report: false });
  });

  it('flips to report mode', () => {
    expect(parseArgs(['--report']).report).toBe(true);
  });
});

describe('parseLog', () => {
  it('drops the partial last line a killed run leaves behind, and keeps the rest', () => {
    expect(parseLog('{"readyMs":1}\n{"readyMs":2}\n{"readyM')).toEqual([{ readyMs: 1 }, { readyMs: 2 }]);
  });
});

/**
 * The fail-open proof (BACKLOG-538). The design requires this be *proven*, not claimed: a boot clock
 * that can fail a spec is a worse instrument than no boot clock, and this item exists because a flaky
 * harness trains readers to discount a red board.
 */
describe('the boot clock fails open', () => {
  it('returns rather than throws when the log path cannot be written', () => {
    // A path *through* an existing file can never be a directory entry, on any platform.
    const impossible = `${__filename}/nope.jsonl`;
    expect(() => recordBootLine(impossible, { readyMs: 1 })).not.toThrow();
  });
});
