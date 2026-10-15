import { describe, expect, it } from 'vitest';
import { YOUTH_MIN, growthLine, moltDue, stageOf, youngVoice } from './growth';
import { FOUNDING_MOLT_AT, foundingGrowth } from './founding';
import { ACTIVE_SCALE, FOUNDING_DAY, FOUNDING_HOUR, timeToAbs } from './clock';
import { FESTIVAL_HOUR, FESTIVAL_HOURS } from './festival';
import { chirpParams } from '../audio/chirp';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';
import { SAVE_VERSION, deserialize } from './saveGame';

describe('life stages (BACKLOG-602)', () => {
  it('no record is adult; young until the youth runs out; molted is adult', () => {
    expect(stageOf(undefined, 0)).toBe('adult');
    expect(stageOf({ hatchedAtMin: 0 }, YOUTH_MIN - 1)).toBe('young');
    expect(stageOf({ hatchedAtMin: 0 }, YOUTH_MIN)).toBe('adult');
    expect(stageOf({ hatchedAtMin: 0, moltedAtMin: 5 }, 10)).toBe('adult');
  });

  it('moltDue names only the unmolted whose youth has run out', () => {
    const g = { A: { hatchedAtMin: 0 }, B: { hatchedAtMin: 100 }, C: { hatchedAtMin: 0, moltedAtMin: YOUTH_MIN } };
    expect(moltDue(g, YOUTH_MIN)).toEqual(['A']);
  });

  it('a youngster pipes higher and shorter', () => {
    const p = chirpParams(seededPersonality('Pip'));
    const y = youngVoice(p);
    expect(y.pitchHz).toBeGreaterThan(p.pitchHz);
    expect(y.lengthMs).toBeLessThan(p.lengthMs);
  });

  it('the book line counts down, then records the molt', () => {
    expect(growthLine(undefined, 0)).toBeUndefined();
    expect(growthLine({ hatchedAtMin: 0 }, YOUTH_MIN - 360)).toBe('🥚 young — grows up in ~6 h');
    expect(growthLine({ hatchedAtMin: 0, moltedAtMin: 1, moltedDay: 1, came: 'softer' }, 2)).toBe('🐚 grew up on day 1 — came out softer');
  });

  it('the founding park ships exactly one youngster, a roster dino, grown inside a sitting and after the festival', () => {
    const g = foundingGrowth();
    expect(Object.keys(g)).toEqual(['Pip']);
    expect(ROSTER.some((r) => r.name === 'Pip')).toBe(true);
    const start = timeToAbs({ day: FOUNDING_DAY, hour: FOUNDING_HOUR, minute: 0 });
    const due = g.Pip.hatchedAtMin + YOUTH_MIN;
    expect(stageOf(g.Pip, start)).toBe('young');
    expect(due).toBe(timeToAbs(FOUNDING_MOLT_AT));
    const realMinutes = (due - start) / ACTIVE_SCALE;
    expect(realMinutes).toBeGreaterThan(0);
    expect(realMinutes).toBeLessThanOrEqual(10);
    expect(FOUNDING_MOLT_AT.hour).toBeGreaterThanOrEqual(FESTIVAL_HOUR + FESTIVAL_HOURS);
  });
});

describe('growth in the save (BACKLOG-602)', () => {
  const base = { version: SAVE_VERSION, time: { day: 1, hour: 8, minute: 0 }, player: { x: 10, y: 10 }, friendship: {}, memory: {} };
  it('round-trips a molted record and opens a pre-187 save with none', () => {
    const traits = { ...seededPersonality('Pip') };
    const growth = { Pip: { hatchedAtMin: -10, moltedAtMin: 5, moltedDay: 1, came: 'softer', traits } };
    expect(deserialize(JSON.stringify({ ...base, growth }))?.growth).toEqual(growth);
    expect(deserialize(JSON.stringify(base))?.growth).toBeUndefined();
  });
  it('rejects a corrupt record', () => {
    expect(deserialize(JSON.stringify({ ...base, growth: { Pip: { hatchedAtMin: 'x' } } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, growth: { Pip: { hatchedAtMin: 0, came: 'weird' } } }))).toBeNull();
  });
});
