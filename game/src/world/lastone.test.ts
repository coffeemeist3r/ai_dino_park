import { describe, it, expect } from 'vitest';
import { lastoneLine, lastoneEvent, lastoneMemory } from './lastone';

describe('lastone strings (BACKLOG-464)', () => {
  it('the wistful line carries the 🍂 mood', () => {
    expect(lastoneLine()).toContain('🍂');
  });

  it('the memory names the zone with no double article', () => {
    const m = lastoneMemory('The Grove');
    expect(m).toContain('The Grove');
    expect(m).not.toContain('the The Grove');
    expect(m).not.toContain('The The Grove');
  });

  it('the event names both the dino and the zone', () => {
    const e = lastoneEvent('Rex', 'The Grove');
    expect(e).toContain('Rex');
    expect(e).toContain('The Grove');
    expect(e).toContain('🍂');
  });
});
