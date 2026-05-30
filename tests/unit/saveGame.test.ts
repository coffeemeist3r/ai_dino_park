import { describe, it, expect } from 'vitest';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

const sample: SaveData = {
  version: SAVE_VERSION,
  time: { day: 3, hour: 21, minute: 14 },
  player: { x: 123.5, y: 456 },
  friendship: { Rex: 30 },
  memory: { Rex: ['said hello'] },
  bonds: { 'Mossback|Rex': 12 },
};

describe('saveGame', () => {
  it('round-trips serialize → deserialize exactly', () => {
    expect(deserialize(serialize(sample))).toEqual(sample);
  });

  it('returns null for malformed JSON (no throw)', () => {
    expect(deserialize('not json {')).toBeNull();
  });

  it('returns null for a non-object payload', () => {
    expect(deserialize('123')).toBeNull();
    expect(deserialize('null')).toBeNull();
  });

  it('returns null on version mismatch', () => {
    const bad = JSON.stringify({ ...sample, version: 0 });
    expect(deserialize(bad)).toBeNull();
  });

  it('returns null when player is missing', () => {
    const bad = JSON.stringify({ version: SAVE_VERSION, time: sample.time });
    expect(deserialize(bad)).toBeNull();
  });

  it('returns null when time has a non-numeric field', () => {
    const bad = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: '8', minute: 0 },
      player: { x: 0, y: 0 },
    });
    expect(deserialize(bad)).toBeNull();
  });
});
