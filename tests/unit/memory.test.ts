import { describe, it, expect } from 'vitest';
import { remember, recall, reflect, forget } from '../../game/src/ai/memory';
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

  it('forget removes exactly the named entry, leaves siblings + other dinos, and does not mutate', () => {
    let m = remember({}, 'Rex', 'a');
    m = remember(m, 'Rex', 'b');
    m = remember(m, 'Rex', 'a'); // a duplicate, to prove every occurrence goes
    m = remember(m, 'Sunny', 'a');
    const after = forget(m, 'Rex', 'a');
    expect(recall(after, 'Rex')).toEqual(['b']); // both 'a' gone, 'b' kept
    expect(recall(after, 'Sunny')).toEqual(['a']); // other dino untouched
    expect(recall(m, 'Rex')).toEqual(['a', 'b', 'a']); // input not mutated
  });

  it('forget is a no-op for an unknown dino or a missing entry', () => {
    const m = remember({}, 'Rex', 'a');
    expect(forget(m, 'Nobody', 'a')).toBe(m); // unknown name → same store
    expect(recall(forget(m, 'Rex', 'z'), 'Rex')).toEqual(['a']); // entry absent → unchanged list
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
