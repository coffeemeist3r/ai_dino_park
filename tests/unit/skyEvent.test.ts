import { describe, it, expect } from 'vitest';
import {
  SKY_EVENTS,
  SKY_GATHER_TILE,
  SKY_CHANCE,
  pickSkyEvent,
  rollSkyEvent,
  atGather,
  skyExpired,
} from '../../game/src/world/skyEvent';

describe('skyEvent (BACKLOG-144)', () => {
  it('never fires during the day, whatever the rolls', () => {
    expect(
      rollSkyEvent({ isClearNight: false, active: false, chanceRoll: 0, pickRoll: 0 }),
    ).toBeNull();
  });

  it('never fires while an event is already active', () => {
    expect(
      rollSkyEvent({ isClearNight: true, active: true, chanceRoll: 0, pickRoll: 0 }),
    ).toBeNull();
  });

  it('fires only when the chance-roll is under the chance', () => {
    const base = { isClearNight: true, active: false, pickRoll: 0, chance: 0.2 };
    expect(rollSkyEvent({ ...base, chanceRoll: 0.1 })).not.toBeNull();
    expect(rollSkyEvent({ ...base, chanceRoll: 0.2 })).toBeNull(); // boundary: >= chance misses
    expect(rollSkyEvent({ ...base, chanceRoll: 0.9 })).toBeNull();
  });

  it('pickSkyEvent maps a 0..1 roll across every event (all reachable)', () => {
    const lo = pickSkyEvent(0);
    const hi = pickSkyEvent(0.999);
    expect(lo.id).toBe(SKY_EVENTS[0].id);
    expect(hi.id).toBe(SKY_EVENTS[SKY_EVENTS.length - 1].id);
    expect(lo.id).not.toBe(hi.id);
    // any roll in range yields a valid event, never out of bounds
    for (const r of [0, 0.25, 0.5, 0.75, 0.999, 1]) {
      expect(SKY_EVENTS).toContain(pickSkyEvent(r));
    }
  });

  it('atGather is true on/near the gather tile and false beyond the radius', () => {
    expect(atGather(SKY_GATHER_TILE)).toBe(true);
    expect(atGather({ tileX: SKY_GATHER_TILE.tileX + 1, tileY: SKY_GATHER_TILE.tileY })).toBe(true);
    expect(atGather({ tileX: SKY_GATHER_TILE.tileX + 2, tileY: SKY_GATHER_TILE.tileY })).toBe(false);
    expect(atGather({ tileX: 0, tileY: 0 })).toBe(false);
  });

  it('skyExpired flips at the duration boundary', () => {
    const ev = SKY_EVENTS[0];
    expect(skyExpired(ev.durationMin - 1, ev)).toBe(false);
    expect(skyExpired(ev.durationMin, ev)).toBe(true);
    expect(skyExpired(ev.durationMin + 30, ev)).toBe(true);
  });

  it('every event carries a ✨ bubble and a shared memory; chance is a probability', () => {
    expect(SKY_EVENTS.length).toBeGreaterThanOrEqual(2);
    for (const ev of SKY_EVENTS) {
      expect(ev.bubble).toContain('✨');
      expect(ev.memory.length).toBeGreaterThan(0);
      expect(ev.durationMin).toBeGreaterThan(0);
    }
    expect(SKY_CHANCE).toBeGreaterThan(0);
    expect(SKY_CHANCE).toBeLessThan(1);
  });
});
