import { describe, it, expect } from 'vitest';
import { fastForward, coolFor } from '../../game/src/world/away';
import { RIVAL_BAR } from '../../game/src/social/grudges';

const time = { day: 1, hour: 8, minute: 0 };
const MIN = 60_000;
const run = (grudges: Record<string, number> | undefined, minutes: number) =>
  fastForward({ time, savedAt: 0, scale: 1, bonds: {}, memory: {} as never, grudges }, minutes * MIN);

describe('grudges cool while you are away (BACKLOG-578)', () => {
  it('has the away floor and a cap', () => {
    expect(coolFor(4)).toBe(0);
    expect(coolFor(5)).toBeGreaterThanOrEqual(1);
    expect(coolFor(7 * 24 * 60)).toBe(coolFor(70 * 24 * 60));
  });
  it('a short absence cools a feud and says so', () => {
    const r = run({ 'Mossback|Twitch': 40 }, 5);
    expect(r.grudges['Mossback|Twitch']).toBeLessThan(40);
    expect(r.grudges['Mossback|Twitch']).toBeGreaterThanOrEqual(RIVAL_BAR);
    expect(r.digest).toContain('Mossback and Twitch cooled off a little.');
  });
  it('a long absence lets it go, and never below zero', () => {
    const r = run({ 'Mossback|Twitch': 40, 'Pip|Rex': 3 }, 7 * 24 * 60);
    expect(r.grudges['Mossback|Twitch']).toBeLessThan(RIVAL_BAR);
    expect(r.grudges['Pip|Rex']).toBe(0);
    expect(r.digest).toContain('Mossback and Twitch seem to have let it go.');
    expect(r.digest.some((l) => l.includes('Pip and Rex'))).toBe(false); // not a feud, not a line
  });
  it('without a grudge graph, nothing changes', () => {
    const r = run(undefined, 60);
    expect(r.grudges).toEqual({});
    expect(r.digest.some((l) => l.includes('cooled') || l.includes('let it go'))).toBe(false);
  });
});
