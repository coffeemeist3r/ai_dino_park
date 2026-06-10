import { describe, it, expect } from 'vitest';
import {
  SEASONS,
  SEASON_LENGTH_DAYS,
  SEASON_TINT,
  seasonFor,
  seasonTurned,
  turnLine,
  turnMemory,
} from '../../game/src/world/seasons';

describe('seasons (BACKLOG-159)', () => {
  it('maps 1-indexed days to a week per season', () => {
    expect(seasonFor(1)).toBe('spring');
    expect(seasonFor(7)).toBe('spring');
    expect(seasonFor(8)).toBe('summer');
    expect(seasonFor(15)).toBe('fall');
    expect(seasonFor(22)).toBe('winter');
    expect(seasonFor(28)).toBe('winter');
  });

  it('wraps into year two and beyond', () => {
    expect(seasonFor(29)).toBe('spring');
    expect(seasonFor(36)).toBe('summer');
    expect(seasonFor(29 + 28)).toBe('spring');
  });

  it('reports a turn only on a forward boundary crossing', () => {
    expect(seasonTurned(7, 8)).toBe('summer');
    expect(seasonTurned(3, 4)).toBeNull(); // same season
    expect(seasonTurned(8, 8)).toBeNull(); // not advancing
    expect(seasonTurned(8, 7)).toBeNull(); // backwards never turns
    expect(seasonTurned(7, 15)).toBe('fall'); // a multi-day jump reports the current season
  });

  it('keeps the wash subtle and the four colors distinct', () => {
    const colors = SEASONS.map((s) => SEASON_TINT[s].color);
    expect(new Set(colors).size).toBe(4);
    for (const s of SEASONS) expect(SEASON_TINT[s].alpha).toBeLessThanOrEqual(0.12);
  });

  it('turn lines are distinct and name their season; the memory names it too', () => {
    const lines = SEASONS.map((s) => turnLine(s));
    expect(new Set(lines).size).toBe(4);
    for (const s of SEASONS) {
      expect(turnLine(s)).toContain(s);
      expect(turnMemory(s)).toBe(`the season turned to ${s}`);
    }
  });

  it('is deterministic', () => {
    expect(seasonFor(13)).toBe(seasonFor(13));
    expect(turnLine('winter')).toBe(turnLine('winter'));
  });

  it('pins the year shape: four seasons, spring-first, a week each', () => {
    expect(SEASONS).toEqual(['spring', 'summer', 'fall', 'winter']);
    expect(SEASON_LENGTH_DAYS).toBe(7);
  });
});
