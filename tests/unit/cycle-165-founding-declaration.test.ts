import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import BASELINE_JSON from './founding-declaration.baseline.json';

/**
 * BACKLOG-533 — the fixture nobody is required to name, shipped as a **ratchet**.
 *
 * BACKLOG-495 gave the suite `foundingState(page, name)` and moved thirty-nine specs onto it without
 * editing one of them. What it deliberately did not ship is a *rule*: a spec that says nothing still
 * means `'as-shipped'` by silence rather than by declaration. That was the right scope at the time — a
 * rule that everything use a seam is noise until the seam has been used — and the seam has now been used
 * by every spec that needed it. The item's entry condition came due on a **date** rather than on
 * evidence, precisely so it could not be deferred a fourth time by an evidence clause that nobody had
 * committed to generating.
 *
 * **Why a ratchet and not the literal lint.** Counted the night it was taken: 251 of 280 spec files do
 * not call `foundingState`. A lint that reds on 251 files is not a rule, it is a 251-file mechanical edit
 * wearing a rule's clothes, and CHARTER v6 caps an item at roughly fifteen files. So the rule is absolute
 * for anything written from tonight, and the 251 are grandfathered **by name** in a list that may only
 * ever shrink.
 *
 * Four assertions, and the second and third are what make it a ratchet rather than a wish:
 *
 * 1. Every spec not in the baseline declares a founding state.
 * 2. The baseline is exactly `BASELINE_COUNT` long, and `BASELINE_COUNT` is a literal in this file.
 *    Without it, a file leaving the list and a new undeclared file joining it cancel out and the ratchet
 *    silently stops ratcheting.
 * 3. Every file *in* the baseline still exists and still does not declare. A grandfathered entry that has
 *    since been fixed must be deleted from the list, or the list becomes a set of names nobody has to
 *    maintain — the same failure as the silence this item exists to end, one layer up.
 * 4. The predicate is what the lint claims it is, checked on synthetic sources.
 *
 * The evidence the item originally asked for is now a side effect: `BASELINE_COUNT` **is** the count,
 * published and falling, so the next founding-constant move can be weighed against cycle 136's sixteen
 * and cycle 151's three without anyone having to remember to measure it.
 */

const E2E_DIR = join(__dirname, '..', 'e2e');

/** The four names `foundingState` accepts, quoted in the failure message so the message says what to do. */
const FIXTURE_NAMES = "'as-shipped' | 'all-bowl' | 'empty-grounds' | 'bare'";

/**
 * The rule itself, exported so it can be tested against synthetic sources rather than by committing a
 * deliberately broken spec file to the very suite it is policing.
 */
export function declaresFounding(source: string): boolean {
  return /\bfoundingState\(/.test(source);
}

export function specFiles(): string[] {
  return readdirSync(E2E_DIR)
    .filter((f) => f.endsWith('.spec.ts'))
    .sort();
}

/**
 * Spec files that predate the rule and do not declare a founding state. **This list may only shrink.**
 * To remove an entry: add a `foundingState(page, ...)` call to that spec, then delete its line from
 * `founding-declaration.baseline.json` and lower `BASELINE_COUNT` by one. Nothing may ever be added.
 *
 * Held in JSON rather than inline so that a shrink shows up in a diff as one deleted line rather than as
 * a reflow of a 251-entry literal — a ratchet whose diffs are unreadable is a ratchet nobody turns.
 */
export const BASELINE: readonly string[] = BASELINE_JSON;

/** Asserted as a literal **here**, so the list cannot be edited without the edit being noticed. */
export const BASELINE_COUNT = 251;

const sourceOf = (f: string): string => readFileSync(join(E2E_DIR, f), 'utf8');

describe('BACKLOG-533 — every e2e spec declares its founding state (ratchet)', () => {
  it('the baseline is exactly BASELINE_COUNT long — it may shrink, never grow', () => {
    expect(BASELINE).toHaveLength(BASELINE_COUNT);
    expect(new Set(BASELINE).size).toBe(BASELINE.length); // no duplicate grandfathering
  });

  it('every spec outside the baseline declares a founding state', () => {
    const offenders = specFiles().filter((f) => !BASELINE.includes(f) && !declaresFounding(sourceOf(f)));
    expect(
      offenders,
      `These specs do not declare their founding state. Add \`await foundingState(page, <name>)\` after ` +
        `boot(), where <name> is one of ${FIXTURE_NAMES}:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });

  it('every baseline entry still exists — a renamed or deleted spec must leave the list', () => {
    const present = new Set(specFiles());
    const gone = BASELINE.filter((f) => !present.has(f));
    expect(gone, `Baseline names files that no longer exist; delete them:\n  ${gone.join('\n  ')}`).toEqual([]);
  });

  it('every baseline entry still does not declare — a fixed one must be deleted from the list', () => {
    const fixed = BASELINE.filter((f) => declaresFounding(sourceOf(f)));
    expect(
      fixed,
      `These specs now declare a founding state. Delete them from the baseline and lower ` +
        `BASELINE_COUNT to ${BASELINE_COUNT - fixed.length}:\n  ${fixed.join('\n  ')}`,
    ).toEqual([]);
  });

  it('the predicate is what the lint claims it is', () => {
    expect(declaresFounding("await foundingState(page, 'as-shipped');")).toBe(true);
    expect(declaresFounding('await boot(page);')).toBe(false);
    // An import alone is not a declaration — the call is. A spec can import the helper and never use it.
    expect(declaresFounding("import { boot, foundingState } from './helpers';")).toBe(false);
  });
});
