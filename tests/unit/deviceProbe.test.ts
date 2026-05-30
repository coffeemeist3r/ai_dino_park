import { describe, it, expect } from 'vitest';
import { pickTier, pickModel, MODELS } from '../../game/src/ai/deviceProbe';

const GB = 1;
const ONE_GB = 1_000_000_000;

describe('pickTier', () => {
  it('picks medium for a strong device (high RAM + big GPU buffer)', () => {
    expect(pickTier({ deviceMemory: 8 * GB, maxBufferBytes: 2 * ONE_GB })).toBe('medium');
  });

  it('picks small for high RAM without GPU buffer info, or mid RAM + GPU', () => {
    expect(pickTier({ deviceMemory: 8 })).toBe('small');
    expect(pickTier({ deviceMemory: 4, maxBufferBytes: 2 * ONE_GB })).toBe('small');
  });

  it('picks tiny for weak / unknown devices', () => {
    expect(pickTier({ deviceMemory: 4 })).toBe('tiny');
    expect(pickTier({ deviceMemory: 2, maxBufferBytes: 2 * ONE_GB })).toBe('tiny');
    expect(pickTier({})).toBe('tiny');
  });
});

describe('pickModel', () => {
  it('maps each tier to a distinct Qwen model id', () => {
    expect(pickModel({ deviceMemory: 8, maxBufferBytes: 2 * ONE_GB }).id).toBe(MODELS.medium.id);
    expect(pickModel({}).id).toBe(MODELS.tiny.id);
    const ids = new Set([MODELS.tiny.id, MODELS.small.id, MODELS.medium.id]);
    expect(ids.size).toBe(3);
  });
});
