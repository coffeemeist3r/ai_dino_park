import { describe, it, expect } from 'vitest';
import { FUNK_WINDOW, enterFunk, clearFunk, funkOf, inFunk, expiredFunks, type Funks } from './expiry';
import { SULK_FADES_AFTER_STEPS } from './sulk';
import { STING_FADES_AFTER_STEPS } from './tic';

describe('BACKLOG-544 — entering and leaving a funk', () => {
  it('records the kind and the step it began at', () => {
    const f = enterFunk({}, 'Thornback', 'shoulder', 10);
    expect(funkOf(f, 'Thornback')).toEqual({ kind: 'shoulder', since: 10 });
    expect(inFunk(f, 'Thornback')).toBe(true);
  });

  it('has no funk for a dino that never entered one', () => {
    expect(funkOf({}, 'Thornback')).toBeUndefined();
    expect(inFunk({}, 'Thornback')).toBe(false);
  });

  it('clears exactly one name and leaves the rest', () => {
    let f: Funks = enterFunk({}, 'Thornback', 'sulk', 1);
    f = enterFunk(f, 'Twitch', 'shoulder', 2);
    f = clearFunk(f, 'Thornback');
    expect(inFunk(f, 'Thornback')).toBe(false);
    expect(funkOf(f, 'Twitch')).toEqual({ kind: 'shoulder', since: 2 });
  });

  it('clearing a dino that is not in a funk is a no-op', () => {
    const f = enterFunk({}, 'Twitch', 'sulk', 3);
    expect(clearFunk(f, 'Thornback')).toBe(f);
  });

  it('a fresh funk re-anchors the clock rather than inheriting the old one', () => {
    let f = enterFunk({}, 'Thornback', 'shoulder', 5);
    f = enterFunk(f, 'Thornback', 'sulk', 40);
    expect(funkOf(f, 'Thornback')).toEqual({ kind: 'sulk', since: 40 });
  });

  it('does not mutate its input', () => {
    const before: Funks = enterFunk({}, 'Thornback', 'sulk', 1);
    const snapshot = JSON.parse(JSON.stringify(before));
    enterFunk(before, 'Twitch', 'shoulder', 2);
    clearFunk(before, 'Thornback');
    expect(before).toEqual(snapshot);
  });
});

describe('BACKLOG-544 — the window table', () => {
  it("takes the sulk's length from the module that reasoned about it (BACKLOG-123)", () => {
    // Imported, never restated. A seam free to re-type the constant is a seam free to drift from it.
    expect(FUNK_WINDOW.sulk).toBe(SULK_FADES_AFTER_STEPS);
    expect(FUNK_WINDOW.sulk).toBe(40);
  });

  it('a scrap at the hatch is a lighter thing than a slight at homecoming', () => {
    expect(FUNK_WINDOW.shoulder).toBe(20);
    expect(FUNK_WINDOW.shoulder).toBeLessThan(FUNK_WINDOW.sulk);
  });

  it('outlasts the private sting, because this is the half the player can see', () => {
    // 412's sting only changes how soon a solitary ritual starts — nothing on screen says it happened.
    // A visible mood has to last long enough to be caught, so it is the longer of the two.
    expect(FUNK_WINDOW.shoulder).toBeLessThan(FUNK_WINDOW.sulk);
    expect(STING_FADES_AFTER_STEPS).toBeGreaterThan(0);
  });

  it('every kind resolves inside the ten minutes CHARTER v7 measures a fresh save over', () => {
    for (const steps of Object.values(FUNK_WINDOW)) expect(steps * 3).toBeLessThan(10 * 60);
  });
});

describe('BACKLOG-544 — what has ended', () => {
  it('an empty record has nothing due', () => {
    expect(expiredFunks({}, 999)).toEqual([]);
  });

  it('ends at exactly the window and not one step before', () => {
    const f = enterFunk({}, 'Thornback', 'shoulder', 0);
    expect(expiredFunks(f, FUNK_WINDOW.shoulder - 1)).toEqual([]);
    expect(expiredFunks(f, FUNK_WINDOW.shoulder)).toEqual([{ name: 'Thornback', kind: 'shoulder' }]);
    expect(expiredFunks(f, FUNK_WINDOW.shoulder + 5)).toEqual([{ name: 'Thornback', kind: 'shoulder' }]);
  });

  it('each kind ages against its own window, not a shared one', () => {
    let f: Funks = enterFunk({}, 'Slow', 'sulk', 0);
    f = enterFunk(f, 'Quick', 'shoulder', 0);
    // At the shoulder window only the shoulder is done; the sulk still has twenty steps to run.
    expect(expiredFunks(f, FUNK_WINDOW.shoulder)).toEqual([{ name: 'Quick', kind: 'shoulder' }]);
    expect(expiredFunks(f, FUNK_WINDOW.sulk)).toEqual([
      { name: 'Quick', kind: 'shoulder' },
      { name: 'Slow', kind: 'sulk' },
    ]);
  });

  it('returns both when two funks come due in the same step, in a fixed order', () => {
    let f: Funks = enterFunk({}, 'Zephyr', 'shoulder', 0);
    f = enterFunk(f, 'Ash', 'shoulder', 0);
    // Sorted by name: a nondeterministic ticker line is a flake waiting for a cycle to blame.
    expect(expiredFunks(f, FUNK_WINDOW.shoulder).map((e) => e.name)).toEqual(['Ash', 'Zephyr']);
  });
});
