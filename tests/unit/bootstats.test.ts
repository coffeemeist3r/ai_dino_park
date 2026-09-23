import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs test infra, deliberately outside the game's TS build (BACKLOG-538)
import { DEFAULTS, formatSummary, parseArgs, parseLog, percentile, summarize } from '../../scripts/bootstats.mjs';
import { recordBootLine, recordBootFailure } from '../e2e/helpers';

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

/**
 * BACKLOG-553 — the failures the clock used to throw away.
 *
 * 538 measured only the boots that worked, which is why four cycles of this flake produced four re-runs
 * and zero victims. A hang is still kept out of every *number* (counting it as a zero would flatter the
 * median) but it is no longer invisible.
 */
describe('failed boots', () => {
  const failed = (extra: Record<string, unknown> = {}) => ({ ms: null, label: 'a spec', ...extra });

  it('counts and names a boot that never came up, without letting it into the numbers', () => {
    const s = summarize([{ ms: 700, label: 'ok' }, failed({ label: 'the hang', failedAt: 'ready' })])!;
    expect(s.count).toBe(1);
    expect(s.max).toBe(700);
    expect(s.failed).toBe(1);
    expect(s.failures).toEqual([{ label: 'the hang', failedAt: 'ready', hadException: false }]);
  });

  it('reports the failures even when every single boot hung — the run worth studying most', () => {
    const s = summarize([failed({ failedAt: 'canvas' })])!;
    expect(s).not.toBeNull();
    expect(s.count).toBe(0);
    expect(s.failed).toBe(1);
  });

  it('still has no answer for no samples at all', () => {
    expect(summarize([])).toBeNull();
  });

  it('tells a hang with an exception behind it from a hang without one — they are different bugs', () => {
    const withErr = summarize([failed({ pageErrors: ['boom'] })])!;
    const withBootErr = summarize([failed({ bootError: { message: 'boom' } })])!;
    const bare = summarize([failed({ pageErrors: [] })])!;
    expect(withErr.failures[0].hadException).toBe(true);
    expect(withBootErr.failures[0].hadException).toBe(true);
    expect(bare.failures[0].hadException).toBe(false);
  });

  it('says which wait died, or says it does not know, rather than guessing', () => {
    expect(summarize([failed({ failedAt: 'canvas' })])!.failures[0].failedAt).toBe('canvas');
    expect(summarize([failed()])!.failures[0].failedAt).toBe('unknown');
  });
});

describe('formatSummary with failures', () => {
  it('prints nothing new when there are none — every existing assertion keeps holding', () => {
    expect(formatSummary(summarize([{ ms: 8000, label: 'x' }]), 30_000)).not.toContain('failed');
  });

  it('names each failure and whether an exception was behind it', () => {
    const out = formatSummary(
      summarize([{ ms: 700, label: 'ok' }, { ms: null, label: 'the hang', failedAt: 'ready', pageErrors: ['boom'] }]),
      30_000,
    );
    expect(out).toContain('failed      1');
    expect(out).toContain('the hang');
    expect(out).toContain('ready');
    expect(out).toContain('exception behind it');
  });
});

/**
 * The fail-open proof, extended to the failure path (BACKLOG-553) — where it matters more than on the
 * success path, because this code runs while a spec is *already* failing and a second failure on top of
 * it hides the first.
 */
describe('the failure record fails open too', () => {
  // Every case writes to a path that can never be a directory entry on any platform. That is the same
  // trick the fail-open proof above uses, and here it is doing double duty: the first run of this
  // instrument had these tests pointed at the real log and they forged ten hangs into it, which the very
  // next `--report` dutifully named. A test must not be able to write the log it is testing.
  const unwritable = `${__filename}/nope.jsonl`;

  it('does not throw when the log path cannot be written', async () => {
    await expect(
      recordBootFailure({ evaluate: async () => null } as never, {
        canvasMs: null,
        pageErrors: [],
        err: new Error('timeout'),
        path: unwritable,
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when handed something that is not a page at all', async () => {
    await expect(
      recordBootFailure({} as never, {
        canvasMs: null,
        pageErrors: [],
        err: 'not even an Error',
        path: unwritable,
      }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when the page it is questioning has gone away', async () => {
    await expect(
      recordBootFailure({ evaluate: async () => { throw new Error('page closed'); } } as never, {
        canvasMs: 700,
        pageErrors: ['boom'],
        err: new Error('timeout'),
        path: unwritable,
      }),
    ).resolves.toBeUndefined();
  });
});
