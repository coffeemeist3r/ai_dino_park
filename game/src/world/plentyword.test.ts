import { describe, it, expect } from 'vitest';
import { plentyMemory, plentyWordLine, spreadPlentyWord, plentyTarget, PLENTY_TOKEN } from './plentyword';
import { remember, recall, type MemoryStore } from '../ai/memory';
import { RUMOR_MARK, isShareable } from '../social/gossip';
import { FERNREACH_ID, GROVE_ID, zoneById } from './zones';

const fern = zoneById(FERNREACH_ID).name;

describe('plenty-word lines (BACKLOG-458)', () => {
  it('the first-hand seed is shareable, the rumor is not', () => {
    const seed = plentyMemory(fern);
    expect(isShareable(seed)).toBe(true);
    expect(seed).toContain(`${fern} ${PLENTY_TOKEN}`);
    const rumor = plentyWordLine('Sunny', fern);
    expect(rumor).toContain(RUMOR_MARK);
    expect(rumor).toContain(`${fern} ${PLENTY_TOKEN}`);
    expect(isShareable(rumor)).toBe(false);
  });
});

describe('spreadPlentyWord (1 hop)', () => {
  it('plants word on the listener when the speaker carries first-hand plenty', () => {
    let store: MemoryStore = remember({}, 'Sunny', plentyMemory(fern));
    const { store: next, rumor } = spreadPlentyWord(store, 'Sunny', 'Mossback');
    expect(rumor).toBe(plentyWordLine('Sunny', fern));
    expect(recall(next, 'Mossback')).toContain(rumor);
  });

  it('does not re-spread a merely-heard rumor (1 hop)', () => {
    // Mossback only *heard* it — no first-hand plenty memory — so it can't pass it on.
    const store: MemoryStore = remember({}, 'Mossback', plentyWordLine('Sunny', fern));
    expect(spreadPlentyWord(store, 'Mossback', 'Twitch').rumor).toBeNull();
  });

  it('is a no-op for self, or a speaker with no plenty news', () => {
    const store: MemoryStore = remember({}, 'Sunny', plentyMemory(fern));
    expect(spreadPlentyWord(store, 'Sunny', 'Sunny').rumor).toBeNull();
    expect(spreadPlentyWord(remember({}, 'Rex', 'you ate a berry'), 'Rex', 'Sunny').rumor).toBeNull();
  });
});

describe('plentyTarget', () => {
  it('returns the named zone id when it is not the current one', () => {
    const events = [plentyWordLine('Sunny', fern)];
    expect(plentyTarget(events, GROVE_ID)).toBe(FERNREACH_ID);
  });

  it('is null when the only plenty word names the current zone', () => {
    const events = [plentyMemory(fern)];
    expect(plentyTarget(events, FERNREACH_ID)).toBeNull();
  });

  it('is null with no plenty word, and prefers the newest naming a different zone', () => {
    expect(plentyTarget(['you ate a berry'], GROVE_ID)).toBeNull();
    const events = [plentyWordLine('A', zoneById(GROVE_ID).name), plentyWordLine('B', fern)];
    expect(plentyTarget(events, 'bowl')).toBe(FERNREACH_ID); // newest wins
  });
});
