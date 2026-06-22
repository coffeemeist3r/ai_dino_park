import { describe, it, expect } from 'vitest';
import { occupiedZones, BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

describe('occupiedZones — resident-zone set for the spawn roll (BACKLOG-314)', () => {
  it('all-default dinos occupy only the fallback zone', () => {
    expect(occupiedZones({}, BOWL_ID, ['Rex', 'Sunny', 'Twitch'])).toEqual([BOWL_ID]);
  });

  it('a migrated dino adds its zone', () => {
    const zones = occupiedZones({ Sunny: GROVE_ID }, BOWL_ID, ['Rex', 'Sunny', 'Twitch']).sort();
    expect(zones).toEqual([BOWL_ID, GROVE_ID].sort());
  });

  it('dedupes when several share a zone', () => {
    const zones = occupiedZones({ Sunny: GROVE_ID, Twitch: GROVE_ID }, BOWL_ID, ['Rex', 'Sunny', 'Twitch']);
    expect(zones.filter((z) => z === GROVE_ID)).toHaveLength(1);
  });

  it('empty roster → no zones', () => {
    expect(occupiedZones({}, BOWL_ID, [])).toEqual([]);
  });
});
