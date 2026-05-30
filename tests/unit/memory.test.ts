import { describe, it, expect } from 'vitest';
import { remember, recall, reflect } from '../../game/src/ai/memory';
import { serialize, deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

describe('memory', () => {
  it('remembers events, caps to maxN, and does not mutate the input', () => {
    let m = {};
    for (let i = 0; i < 8; i++) m = remember(m, 'Rex', `event ${i}`, 6);
    expect(recall(m, 'Rex')).toHaveLength(6);
    expect(recall(m, 'Rex')[0]).toBe('event 2'); // oldest two dropped
    const before = remember({}, 'Rex', 'a');
    remember(before, 'Rex', 'b'); // should not mutate `before`
    expect(recall(before, 'Rex')).toEqual(['a']);
  });

  it('recall returns [] for an unknown dino', () => {
    expect(recall({}, 'Nobody')).toEqual([]);
  });

  it('reflect summarizes a day (empty vs not)', () => {
    expect(reflect([])).toMatch(/quiet/i);
    expect(reflect(['the human gave you a rock'])).toMatch(/rock/);
  });
});

describe('memory in the save', () => {
  it('round-trips the memory store', () => {
    const data = {
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
      friendship: {},
      memory: { Rex: ['said hi', 'gave a shell'] },
    };
    expect(deserialize(serialize(data))?.memory).toEqual({ Rex: ['said hi', 'gave a shell'] });
  });

  it('defaults a v1 save with no memory field to an empty store', () => {
    const legacy = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
    });
    expect(deserialize(legacy)?.memory).toEqual({});
  });
});
